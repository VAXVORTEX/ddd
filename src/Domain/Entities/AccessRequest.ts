import { DomainEvent } from '../Events/DomainEvent';
import { AccessDuration } from '../ValueObjects/AccessDuration';
import { AccessRequestId } from '../ValueObjects/AccessRequestId';
import { AccessRequestStatus } from '../ValueObjects/AccessRequestStatus';
import { ApprovalDecision } from '../ValueObjects/ApprovalDecision';
import { EngineerId } from '../ValueObjects/EngineerId';
import { ResourceId } from '../ValueObjects/ResourceId';
import { TrainingCertificationFact } from '../ValueObjects/TrainingCertificationFact';
import { AccessRequestSnapshot } from './AccessRequestSnapshot';

export class AccessRequest {
  private _status: AccessRequestStatus;
  private _leadApproval: ApprovalDecision | null;
  private _securityApproval: ApprovalDecision | null;
  private _activatedAt: Date | null;
  private _expiresAt: Date | null;
  private _rejectionReason: string | null;
  private _events: DomainEvent[] = [];

  private constructor(
    public readonly id: AccessRequestId,
    public readonly applicantId: EngineerId,
    public readonly resourceId: ResourceId,
    public readonly justification: string,
    public readonly duration: AccessDuration,
    initialStatus: AccessRequestStatus,
    leadApproval: ApprovalDecision | null = null,
    securityApproval: ApprovalDecision | null = null,
    activatedAt: Date | null = null,
    expiresAt: Date | null = null,
    rejectionReason: string | null = null
  ) {
    this._status = initialStatus;
    this._leadApproval = leadApproval;
    this._securityApproval = securityApproval;
    this._activatedAt = activatedAt;
    this._expiresAt = expiresAt;
    this._rejectionReason = rejectionReason;
  }

  public static submit(
    id: AccessRequestId,
    applicantId: EngineerId,
    resourceId: ResourceId,
    justification: string,
    duration: AccessDuration,
    now: Date
  ): AccessRequest {
    if (!justification || justification.trim().length < 5) {
      throw new Error('Необхідно вказати змістовне обґрунтування робочого завдання.');
    }
    const request = new AccessRequest(
      id,
      applicantId,
      resourceId,
      justification,
      duration,
      AccessRequestStatus.Draft
    );
    request.registerEvent('AccessRequestCreated', now);
    return request;
  }

  public static triggerBreakGlass(
    id: AccessRequestId,
    applicantId: EngineerId,
    resourceId: ResourceId,
    incidentTicket: string,
    emergencyDuration: AccessDuration,
    now: Date
  ): AccessRequest {
    if (!incidentTicket || !incidentTicket.startsWith('INC-')) {
      throw new Error('Для протоколу Break-glass обов’язковий зареєстрований код критичного інциденту (формат INC-XXX).');
    }
    if (emergencyDuration.hours > AccessDuration.EMERGENCY_MAX_HOURS) {
      throw new Error('Аварійний доступ не може перевищувати 4 години.');
    }

    const request = new AccessRequest(
      id,
      applicantId,
      resourceId,
      `Аварійне усунення збою: ${incidentTicket}`,
      emergencyDuration,
      AccessRequestStatus.EmergencyActive,
      null,
      null,
      new Date(now.getTime()),
      new Date(now.getTime() + emergencyDuration.hours * 3600 * 1000)
    );
    request.registerEvent('AccessRequestCreated', now);
    request.registerEvent('EmergencyBreakGlassActivated', now);

    return request;
  }

  public static restore(snapshot: AccessRequestSnapshot): AccessRequest {
    const id = new AccessRequestId(snapshot.id);
    const applicantId = new EngineerId(snapshot.applicantId);
    const resourceId = new ResourceId(snapshot.resourceId);
    const duration =
      snapshot.status === AccessRequestStatus.EmergencyActive
        ? AccessDuration.createEmergency(snapshot.durationHours)
        : AccessDuration.createStandard(snapshot.durationHours);

    const leadApproval = snapshot.leadApproval
      ? ApprovalDecision.create(
          new EngineerId(snapshot.leadApproval.approverId),
          new Date(snapshot.leadApproval.approvedAt)
        )
      : null;

    const securityApproval = snapshot.securityApproval
      ? ApprovalDecision.create(
          new EngineerId(snapshot.securityApproval.approverId),
          new Date(snapshot.securityApproval.approvedAt)
        )
      : null;

    if (snapshot.status === AccessRequestStatus.ApprovedByLead && !leadApproval) {
      throw new Error('Порушення узгодженості при відновленні: відсутнє рішення керівника.');
    }
    if (snapshot.status === AccessRequestStatus.Active && (!leadApproval || !securityApproval || !snapshot.expiresAt)) {
      throw new Error('Порушення узгодженості при відновленні: активний доступ потребує обох схвалень та часу завершення.');
    }
    if (snapshot.status === AccessRequestStatus.Rejected && !snapshot.rejectionReason) {
      throw new Error('Порушення узгодженості при відновленні: відхилений запит повинен містити причину.');
    }

    return new AccessRequest(
      id,
      applicantId,
      resourceId,
      snapshot.justification,
      duration,
      snapshot.status,
      leadApproval,
      securityApproval,
      snapshot.activatedAt ? new Date(snapshot.activatedAt) : null,
      snapshot.expiresAt ? new Date(snapshot.expiresAt) : null,
      snapshot.rejectionReason
    );
  }

  public validateTraining(certification: TrainingCertificationFact, now: Date): void {
    if (this._status !== AccessRequestStatus.Draft) {
      throw new Error('Валідація інструктажу можлива лише для нового запиту у статусі Draft.');
    }

    const expectedEnd = new Date(now.getTime() + this.duration.hours * 3600 * 1000);

    if (!certification.coversPeriodUntil(expectedEnd)) {
      this._status = AccessRequestStatus.Rejected;
      this._rejectionReason = 'Інструктаж з безпеки недійсний або закінчується раніше завершення запитаного доступу.';
      this.registerEvent('AccessRequestRejectedByTraining', now);
      return;
    }

    this._status = AccessRequestStatus.Validated;
    this.registerEvent('TrainingCertificationValidated', now);
  }

  public approveByLead(leadId: EngineerId, now: Date): void {
    if (this._status !== AccessRequestStatus.Validated) {
      throw new Error('Схвалення керівником дозволено лише після підтвердження інструктажу.');
    }
    if (this.applicantId.equals(leadId)) {
      throw new Error('Порушення Separation of Duties: заявник не може схвалити власну заявку як керівник.');
    }

    this._leadApproval = ApprovalDecision.create(leadId, now);
    this._status = AccessRequestStatus.ApprovedByLead;
    this.registerEvent('BusinessNeedApprovedByLead', now);
  }

  public approveAndActivateBySecurity(officerId: EngineerId, now: Date): void {
    if (this._status !== AccessRequestStatus.ApprovedByLead || !this._leadApproval) {
      throw new Error('Затвердження безпекою можливе лише після схвалення керівником команди.');
    }
    if (this.applicantId.equals(officerId) || this._leadApproval.approverId.equals(officerId)) {
      throw new Error('Порушення Separation of Duties: офіцер безпеки має бути незалежною третьою особою.');
    }

    this._securityApproval = ApprovalDecision.create(officerId, now);
    this._status = AccessRequestStatus.Active;
    this._activatedAt = new Date(now.getTime());
    this._expiresAt = new Date(now.getTime() + this.duration.hours * 3600 * 1000);
    this.registerEvent('TemporaryAccessActivated', now);
  }

  public reject(reason: string, now: Date): void {
    if (
      this._status === AccessRequestStatus.Active ||
      this._status === AccessRequestStatus.EmergencyActive ||
      this._status === AccessRequestStatus.Revoked ||
      this._status === AccessRequestStatus.Rejected
    ) {
      throw new Error('Неможливо відхилити вже активований або завершений запит.');
    }
    if (!reason || reason.trim().length === 0) {
      throw new Error('Причина відмови є обов’язковою.');
    }

    this._status = AccessRequestStatus.Rejected;
    this._rejectionReason = reason;
    this.registerEvent('AccessRequestRejected', now);
  }

  public revokeIfExpired(now: Date): void {
    if (
      this._status !== AccessRequestStatus.Active &&
      this._status !== AccessRequestStatus.EmergencyActive
    ) {
      throw new Error('Відкликання можливе лише для активного доступу.');
    }
    if (!this._expiresAt || now.getTime() < this._expiresAt.getTime()) {
      throw new Error('Строк дії дозволу (TTL) ще не вичерпано.');
    }

    this._status = AccessRequestStatus.Revoked;
    this.registerEvent('TemporaryAccessRevoked', now);
  }

  public toSnapshot(): AccessRequestSnapshot {
    return {
      id: this.id.value,
      applicantId: this.applicantId.value,
      resourceId: this.resourceId.value,
      justification: this.justification,
      durationHours: this.duration.hours,
      status: this._status,
      leadApproval: this._leadApproval
        ? {
            approverId: this._leadApproval.approverId.value,
            approvedAt: this._leadApproval.approvedAt.toISOString(),
          }
        : null,
      securityApproval: this._securityApproval
        ? {
            approverId: this._securityApproval.approverId.value,
            approvedAt: this._securityApproval.approvedAt.toISOString(),
          }
        : null,
      activatedAt: this._activatedAt ? this._activatedAt.toISOString() : null,
      expiresAt: this._expiresAt ? this._expiresAt.toISOString() : null,
      rejectionReason: this._rejectionReason,
    };
  }

  public get status(): AccessRequestStatus {
    return this._status;
  }

  public get expiresAt(): Date | null {
    return this._expiresAt ? new Date(this._expiresAt.getTime()) : null;
  }

  public get rejectionReason(): string | null {
    return this._rejectionReason;
  }

  public get domainEvents(): ReadonlyArray<DomainEvent> {
    return [...this._events];
  }

  private registerEvent(eventName: string, occurredAt: Date): void {
    this._events.push({
      eventName,
      occurredAt: new Date(occurredAt.getTime()),
      requestId: this.id.value,
    });
  }
}
