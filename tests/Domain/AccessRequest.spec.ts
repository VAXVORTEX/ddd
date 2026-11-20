import { describe, expect, it } from 'vitest';
import { AccessRequest } from '../../src/Domain/Entities/AccessRequest';
import { AccessDuration } from '../../src/Domain/ValueObjects/AccessDuration';
import { AccessRequestId } from '../../src/Domain/ValueObjects/AccessRequestId';
import { AccessRequestStatus } from '../../src/Domain/ValueObjects/AccessRequestStatus';
import { EngineerId } from '../../src/Domain/ValueObjects/EngineerId';
import { ResourceId } from '../../src/Domain/ValueObjects/ResourceId';
import { TrainingCertificationFact } from '../../src/Domain/ValueObjects/TrainingCertificationFact';

describe('AccessRequest Domain Model (Core Aggregate)', () => {
  const baseTime = new Date('2026-11-13T10:00:00Z');
  const applicant = new EngineerId('eng-arsenii');
  const lead = new EngineerId('lead-ivan');
  const securityOfficer = new EngineerId('sec-olena');
  const prodDb = new ResourceId('db-prod-payments');

  it('1. Перевірка рівності об’єктів-значень та тотожності сутностей', () => {
    const d1 = AccessDuration.createStandard(4);
    const d2 = AccessDuration.createStandard(4);
    expect(d1.equals(d2)).toBe(true);

    const req1 = AccessRequest.submit(
      new AccessRequestId('REQ-1'),
      applicant,
      prodDb,
      'Міграція таблиці транзакцій',
      d1,
      baseTime
    );
    const req2 = AccessRequest.submit(
      new AccessRequestId('REQ-2'),
      applicant,
      prodDb,
      'Міграція таблиці транзакцій',
      d2,
      baseTime
    );
    expect(req1.id.equals(req2.id)).toBe(false);
  });

  it('2. Негативний тест створення: заборона тривалості понад 24 години', () => {
    expect(() => AccessDuration.createStandard(25)).toThrowError(
      'Тривалість звичайного доступу має бути від 1 до 24 годин.'
    );
  });

  it('3. Успішний штатний сценарій (погодження SoD, активація на 2 години та відкликання)', () => {
    const req = AccessRequest.submit(
      new AccessRequestId('REQ-100'),
      applicant,
      prodDb,
      'Оновлення індексів БД',
      AccessDuration.createStandard(2),
      baseTime
    );

    const validCert = TrainingCertificationFact.create(true, new Date('2027-05-01T00:00:00Z'));
    req.validateTraining(validCert, baseTime);
    expect(req.status).toBe(AccessRequestStatus.Validated);

    req.approveByLead(lead, new Date('2026-11-13T10:05:00Z'));
    expect(req.status).toBe(AccessRequestStatus.ApprovedByLead);

    const activationTime = new Date('2026-11-13T10:10:00Z');
    req.approveAndActivateBySecurity(securityOfficer, activationTime);
    expect(req.status).toBe(AccessRequestStatus.Active);
    expect(req.expiresAt?.toISOString()).toBe('2026-11-13T12:10:00.000Z');

    const afterTwoHours = new Date('2026-11-13T12:10:01Z');
    req.revokeIfExpired(afterTwoHours);
    expect(req.status).toBe(AccessRequestStatus.Revoked);
    expect(req.domainEvents.map((e) => e.eventName)).toEqual([
      'AccessRequestCreated',
      'TrainingCertificationValidated',
      'BusinessNeedApprovedByLead',
      'TemporaryAccessActivated',
      'TemporaryAccessRevoked',
    ]);
  });

  it('4. Граничний сценарій: інструктаж закінчується раніше запитаного періоду', () => {
    const req = AccessRequest.submit(
      new AccessRequestId('REQ-101'),
      applicant,
      prodDb,
      'Перевірка конфігурації',
      AccessDuration.createStandard(4),
      baseTime
    );

    const expiringCert = TrainingCertificationFact.create(true, new Date('2026-11-13T11:00:00Z'));
    req.validateTraining(expiringCert, baseTime);

    expect(req.status).toBe(AccessRequestStatus.Rejected);
    expect(req.rejectionReason).toContain('закінчується раніше завершення запитаного доступу');
  });

  it('5. Захист інваріанта Separation of Duties: заборона самопогодження лідом або безпекою', () => {
    const req = AccessRequest.submit(
      new AccessRequestId('REQ-102'),
      applicant,
      prodDb,
      'Налаштування реплікації',
      AccessDuration.createStandard(2),
      baseTime
    );
    const validCert = TrainingCertificationFact.create(true, new Date('2027-05-01T00:00:00Z'));
    req.validateTraining(validCert, baseTime);

    const eventsBefore = req.domainEvents.length;

    expect(() => req.approveByLead(applicant, baseTime)).toThrowError('Порушення Separation of Duties');
    expect(req.status).toBe(AccessRequestStatus.Validated);
    expect(req.domainEvents.length).toBe(eventsBefore);

    req.approveByLead(lead, baseTime);
    expect(() => req.approveAndActivateBySecurity(lead, baseTime)).toThrowError(
      'офіцер безпеки має бути незалежною третьою особою'
    );
    expect(req.status).toBe(AccessRequestStatus.ApprovedByLead);
  });

  it('6. Винятковий аварійний сценарій: протокол Break-glass при інциденті P1', () => {
    const emergencyReq = AccessRequest.triggerBreakGlass(
      new AccessRequestId('REQ-911'),
      applicant,
      prodDb,
      'INC-404',
      AccessDuration.createEmergency(2),
      baseTime
    );

    expect(emergencyReq.status).toBe(AccessRequestStatus.EmergencyActive);
    expect(emergencyReq.expiresAt?.toISOString()).toBe('2026-11-13T12:00:00.000Z');
    expect(emergencyReq.domainEvents.map((e) => e.eventName)).toEqual([
      'AccessRequestCreated',
      'EmergencyBreakGlassActivated',
    ]);
  });

  it('7. Захист від передчасного відкликання до вичерпання таймера TTL', () => {
    const req = AccessRequest.triggerBreakGlass(
      new AccessRequestId('REQ-912'),
      applicant,
      prodDb,
      'INC-500',
      AccessDuration.createEmergency(2),
      baseTime
    );

    const oneHourLater = new Date('2026-11-13T11:00:00Z');
    expect(() => req.revokeIfExpired(oneHourLater)).toThrowError('Строк дії дозволу (TTL) ще не вичерпано.');
    expect(req.status).toBe(AccessRequestStatus.EmergencyActive);
  });
});
