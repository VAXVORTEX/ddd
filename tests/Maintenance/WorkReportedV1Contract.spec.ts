import { describe, expect, it } from 'vitest';
import { ContractViolationError } from '../../src/Maintenance/ACL/ContractViolationError';
import { UnsupportedStateCodeError } from '../../src/Maintenance/ACL/UnsupportedStateCodeError';
import { WorkReportedV1Contract } from '../../src/Maintenance/ACL/WorkReportedV1Contract';
import { WorkStateCode } from '../../src/Maintenance/Domain/ValueObjects/WorkStateCode';
import { createWorkReportedMessage } from '../Support/WorkReportedV1Samples';

describe('WorkReportedV1Contract (перевірка угоди версії 1)', () => {
  const checkTime = new Date('2026-10-01T10:00:00Z');
  const contract = new WorkReportedV1Contract();

  it('1. Коректне повідомлення проходить перевірку й зберігає предметний зміст', () => {
    const validated = contract.validate(createWorkReportedMessage(), checkTime);

    expect(validated.version.value).toBe(1);
    expect(validated.stateCode).toBe(WorkStateCode.Reported);
    expect(validated.correlationId.equals(validated.repairRequestId)).toBe(true);
    expect(validated.summary.value).toBe('Замінено підшипник');
    expect(validated.times.occurredAt.toISOString()).toBe('2026-10-01T09:30:00.000Z');
  });

  it('2. Версія 2 відхиляється як така, що потребує нової погодженої версії', () => {
    expect(() => contract.validate(createWorkReportedMessage({ Version: 2 }), checkTime)).toThrowError(
      ContractViolationError
    );
    expect(() => contract.validate(createWorkReportedMessage({ Version: 2 }), checkTime)).toThrowError(
      /потрібна нова погоджена версія/
    );
  });

  it('3. Розбіжність кореляції та заявки відхиляється', () => {
    expect(() =>
      contract.validate(
        createWorkReportedMessage({ CorrelationId: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' }),
        checkTime
      )
    ).toThrowError('Ідентифікатор кореляції та ідентифікатор заявки мають збігатися.');
  });

  it('4. Порожній ідентифікатор повідомлення відхиляється', () => {
    expect(() => contract.validate(createWorkReportedMessage({ MessageId: '' }), checkTime)).toThrowError(
      'Ідентифікатор повідомлення не може бути порожнім.'
    );
  });

  it('5. Ревізія має бути додатною', () => {
    expect(() => contract.validate(createWorkReportedMessage({ Revision: 0 }), checkTime)).toThrowError(
      'Ревізія наряду має бути додатним цілим числом.'
    );
  });

  it('6. Подія в майбутньому відносно часу перевірки відхиляється', () => {
    expect(() =>
      contract.validate(
        createWorkReportedMessage({ OccurredAtUtc: '2026-10-01T10:01:00Z', ReportedAtUtc: '2026-10-01T10:01:00Z' }),
        checkTime
      )
    ).toThrowError('Час події не може належати майбутньому відносно часу перевірки.');
  });

  it('7. Час звіту не може перевищувати час події', () => {
    expect(() =>
      contract.validate(
        createWorkReportedMessage({ ReportedAtUtc: '2026-10-01T09:40:00Z' }),
        checkTime
      )
    ).toThrowError('Час звіту не може перевищувати час події.');
  });

  it('8. Пропозиція COMPLETED відхиляється як нова семантика', () => {
    expect(() =>
      contract.validate(createWorkReportedMessage({ StateCode: 'COMPLETED' }), checkTime)
    ).toThrowError(UnsupportedStateCodeError);
    expect(() =>
      contract.validate(createWorkReportedMessage({ StateCode: 'COMPLETED' }), checkTime)
    ).toThrowError(/потрібна нова погоджена версія/);
  });

  it.each([
    ['наряду', { WorkOrderId: '' }],
    ['звіту', { ReportId: '' }],
    ['виконавця', { TechnicianId: '' }],
  ])('9. Порожній ідентифікатор %s відхиляється', (_label, overrides) => {
    expect(() => contract.validate(createWorkReportedMessage(overrides), checkTime)).toThrowError(
      /не може бути порожнім/
    );
  });

  it('10. Порожній опис робіт відхиляється', () => {
    expect(() => contract.validate(createWorkReportedMessage({ Summary: '' }), checkTime)).toThrowError(
      'Опис робіт не може бути порожнім.'
    );
  });

  it('11. Початкове значення часу типу відхиляється', () => {
    expect(() =>
      contract.validate(
        createWorkReportedMessage({
          OccurredAtUtc: '0001-01-01T00:00:00Z',
          ReportedAtUtc: '0001-01-01T00:00:00Z',
        }),
        checkTime
      )
    ).toThrowError('Час події та час звіту мають бути коректними значеннями DateTimeOffset.');
  });
});
