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

describe('AccessRequestApplicationService (Модульна перевірка координації)', () => {
  const baseTime = new Date('2026-11-20T10:00:00Z');
  const applicant = new EngineerId('eng-arsenii');
  const lead = new EngineerId('lead-bohdan');
  const resource = new ResourceId('prod-cluster-01');

  function createLeadApprovedRequest(): AccessRequest {
    const req = AccessRequest.submit(
      new AccessRequestId('REQ-401'),
      applicant,
      resource,
      'Оновлення конфігурації кешу',
      AccessDuration.createStandard(4),
      baseTime
    );
    req.validateTraining(TrainingCertificationFact.create(true, new Date('2027-01-01T00:00:00Z')), baseTime);
    req.approveByLead(lead, new Date('2026-11-20T10:05:00Z'));
    return req;
  }

  it('1. Предметна відмова при порушенні SoD не змінює стан у сховищі', async () => {
    const session = new InMemoryAccessRequestSession();
    const initial = createLeadApprovedRequest();
    session.seed(initial, 1);

    const clock = new FixedClock(new Date('2026-11-20T10:15:00Z'));
    const service = new AccessRequestApplicationService(session, session, clock);

    await expect(service.approveAndActivateBySecurity('REQ-401', 'lead-bohdan')).rejects.toThrowError(
      'офіцер безпеки має бути незалежною третьою особою'
    );

    const reloaded = await session.findById(new AccessRequestId('REQ-401'));
    expect(reloaded?.revision).toBe(1);
    expect(reloaded?.aggregate.status).toBe(AccessRequestStatus.ApprovedByLead);
  });
});
