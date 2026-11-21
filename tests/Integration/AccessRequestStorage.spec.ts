import { describe, expect, it } from 'vitest';
import { IClock } from '../../src/Application/Ports/IClock';
import { AccessRequestApplicationService } from '../../src/Application/Services/AccessRequestApplicationService';
import { AccessRequest } from '../../src/Domain/Entities/AccessRequest';
import { AccessDuration } from '../../src/Domain/ValueObjects/AccessDuration';
import { AccessRequestId } from '../../src/Domain/ValueObjects/AccessRequestId';
import { AccessRequestStatus } from '../../src/Domain/ValueObjects/AccessRequestStatus';
import { EngineerId } from '../../src/Domain/ValueObjects/EngineerId';
import { ResourceId } from '../../src/Domain/ValueObjects/ResourceId';
import { TrainingCertificationFact } from '../../src/Domain/ValueObjects/TrainingCertificationFact';
import { InMemoryAccessRequestSession } from '../../src/Infrastructure/Persistence/InMemoryAccessRequestSession';

class FixedClock implements IClock {
  constructor(private readonly current: Date) {}
  public now(): Date {
    return new Date(this.current.getTime());
  }
}

describe('InMemoryAccessRequestSession (Інтеграційна перевірка збереження та відновлення)', () => {
  const baseTime = new Date('2026-11-20T10:00:00Z');
  const applicant = new EngineerId('eng-arsenii');
  const lead = new EngineerId('lead-bohdan');
  const resource = new ResourceId('prod-db-main');

  function createLeadApprovedRequest(id: string): AccessRequest {
    const req = AccessRequest.submit(
      new AccessRequestId(id),
      applicant,
      resource,
      'Міграція схеми бази даних',
      AccessDuration.createStandard(2),
      baseTime
    );
    req.validateTraining(TrainingCertificationFact.create(true, new Date('2027-06-01T00:00:00Z')), baseTime);
    req.approveByLead(lead, new Date('2026-11-20T10:05:00Z'));
    return req;
  }

  it('1. Успішне виконання, збереження нової ревізії та відновлення іншого екземпляра без дублювання подій', async () => {
    const session = new InMemoryAccessRequestSession();
    const original = createLeadApprovedRequest('REQ-500');
    session.seed(original, 1);

    const activationTime = new Date('2026-11-20T10:20:00Z');
    const service = new AccessRequestApplicationService(session, session, new FixedClock(activationTime));

    await service.approveAndActivateBySecurity('REQ-500', 'sec-olena');

    const loaded = await session.findById(new AccessRequestId('REQ-500'));
    expect(loaded).not.toBeNull();
    expect(loaded!.revision).toBe(2);
    expect(loaded!.aggregate).not.toBe(original);
    expect(loaded!.aggregate.status).toBe(AccessRequestStatus.Active);
    expect(loaded!.aggregate.expiresAt?.toISOString()).toBe('2026-11-20T12:20:00.000Z');
    expect(loaded!.aggregate.domainEvents.length).toBe(0);

    loaded!.aggregate.revokeIfExpired(new Date('2026-11-20T12:20:01Z'));
    expect(loaded!.aggregate.status).toBe(AccessRequestStatus.Revoked);
    expect(loaded!.aggregate.domainEvents.map((e) => e.eventName)).toEqual(['TemporaryAccessRevoked']);
  });

  it('2. Технічний збій до фіксації залишає попередній підтверджений стан у сховищі', async () => {
    const session = new InMemoryAccessRequestSession();
    const original = createLeadApprovedRequest('REQ-501');
    session.seed(original, 1);
    session.simulateTechnicalFailureOnNextSave();

    const service = new AccessRequestApplicationService(
      session,
      session,
      new FixedClock(new Date('2026-11-20T10:25:00Z'))
    );

    await expect(service.approveAndActivateBySecurity('REQ-501', 'sec-olena')).rejects.toThrowError(
      'Технічний збій сховища'
    );

    const loaded = await session.findById(new AccessRequestId('REQ-501'));
    expect(loaded!.revision).toBe(1);
    expect(loaded!.aggregate.status).toBe(AccessRequestStatus.ApprovedByLead);
  });

  it('3. Оптимістичне блокування відхиляє запис при конфлікті ревізій', async () => {
    const session = new InMemoryAccessRequestSession();
    const original = createLeadApprovedRequest('REQ-502');
    session.seed(original, 1);

    const firstSessionLoad = await session.findById(new AccessRequestId('REQ-502'));
    const secondSessionLoad = await session.findById(new AccessRequestId('REQ-502'));

    firstSessionLoad!.aggregate.approveAndActivateBySecurity(
      new EngineerId('sec-olena'),
      new Date('2026-11-20T10:30:00Z')
    );
    session.stage(firstSessionLoad!.aggregate, firstSessionLoad!.revision);
    await session.saveChanges();

    secondSessionLoad!.aggregate.approveAndActivateBySecurity(
      new EngineerId('sec-taras'),
      new Date('2026-11-20T10:31:00Z')
    );
    session.stage(secondSessionLoad!.aggregate, secondSessionLoad!.revision);

    await expect(session.saveChanges()).rejects.toThrowError('Конфлікт версій');
  });
});
