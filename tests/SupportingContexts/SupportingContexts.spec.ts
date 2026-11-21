import { describe, expect, it } from 'vitest';
import { IClock } from '../../src/Application/Ports/IClock';
import { AccessRequest } from '../../src/Domain/Entities/AccessRequest';
import { AccessDuration } from '../../src/Domain/ValueObjects/AccessDuration';
import { AccessRequestId } from '../../src/Domain/ValueObjects/AccessRequestId';
import { EngineerId } from '../../src/Domain/ValueObjects/EngineerId';
import { ResourceId } from '../../src/Domain/ValueObjects/ResourceId';
import { AuditApplicationService } from '../../src/SupportingContexts/AuditLog/AuditApplicationService';
import { InMemoryAuditRepository } from '../../src/SupportingContexts/AuditLog/InMemoryAuditRepository';
import { InMemoryQualificationRepository } from '../../src/SupportingContexts/Qualification/InMemoryQualificationRepository';
import { QualificationApplicationService } from '../../src/SupportingContexts/Qualification/QualificationApplicationService';

class FixedClock implements IClock {
  constructor(private readonly current: Date) {}
  public now(): Date {
    return new Date(this.current.getTime());
  }
}

describe('SupportingContexts (Qualification & AuditLog)', () => {
  const baseTime = new Date('2026-11-20T10:00:00Z');
  const clock = new FixedClock(baseTime);

  it('1. QualificationContext формує незмінний факт сертифікації для основного контексту', async () => {
    const qualRepo = new InMemoryQualificationRepository();
    const qualService = new QualificationApplicationService(qualRepo, clock);

    await qualService.recordCompletedTraining('eng-arsenii', new Date('2027-05-01T00:00:00Z'));
    const fact = await qualService.getCertificationFact('eng-arsenii');

    expect(fact.isValid).toBe(true);
    expect(fact.coversPeriodUntil(new Date('2026-11-20T14:00:00Z'))).toBe(true);
  });

  it('2. AuditLogContext фіксує потік доменних подій без зміни агрегату', async () => {
    const auditRepo = new InMemoryAuditRepository();
    const auditService = new AuditApplicationService(auditRepo, clock);

    const req = AccessRequest.submit(
      new AccessRequestId('REQ-700'),
      new EngineerId('eng-arsenii'),
      new ResourceId('prod-api'),
      'Планове обслуговування',
      AccessDuration.createStandard(2),
      baseTime
    );

    await auditService.recordEvents(req.domainEvents);
    const history = await auditService.getRequestHistory('REQ-700');

    expect(history.length).toBe(1);
    expect(history[0].eventName).toBe('AccessRequestCreated');
  });
});
