import { describe, expect, it } from 'vitest';
import { WorkReportedV1Contract } from '../../src/Maintenance/ACL/WorkReportedV1Contract';
import { WorkReportedTranslator } from '../../src/Maintenance/ACL/WorkReportedTranslator';
import { RegisterWorkReportedService } from '../../src/Maintenance/Application/Services/RegisterWorkReportedService';
import { InMemoryWorkReportRepository } from '../../src/Maintenance/Infrastructure/Persistence/InMemoryWorkReportRepository';
import { FixedClock } from '../Support/FixedClock';
import { createWorkReportedMessage } from '../Support/WorkReportedV1Samples';

describe('RegisterWorkReportedService (ACL та локальний WorkReport)', () => {
  const checkTime = new Date('2026-10-01T10:00:00Z');

  function createService() {
    const repository = new InMemoryWorkReportRepository();
    const service = new RegisterWorkReportedService(
      new WorkReportedV1Contract(),
      new WorkReportedTranslator(),
      repository,
      new FixedClock(checkTime)
    );
    return { service, repository };
  }

  it('1. ACL утворює локальний звіт із збереженням часу факту', async () => {
    const { service, repository } = createService();
    const report = await service.handle(createWorkReportedMessage());

    expect(report.times.occurredAt.toISOString()).toBe('2026-10-01T09:30:00.000Z');
    expect(report.times.reportedAt.toISOString()).toBe('2026-10-01T09:30:00.000Z');
    expect(report.registeredAt.toISOString()).toBe('2026-10-01T10:00:00.000Z');
    expect(report.summary.value).toBe('Замінено підшипник');
    expect(repository.size).toBe(1);
  });

  it('2. Повтор із тим самим MessageId не створює другий звіт', async () => {
    const { service, repository } = createService();
    const first = await service.handle(createWorkReportedMessage());
    const second = await service.handle(createWorkReportedMessage());

    expect(second).toBe(first);
    expect(repository.size).toBe(1);
  });

  it('3. Повтор зі зміненим незмінним полем відхиляється', async () => {
    const { service } = createService();
    await service.handle(createWorkReportedMessage());

    await expect(
      service.handle(
        createWorkReportedMessage({ ReportId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' })
      )
    ).rejects.toThrowError('Повтор повідомлення змінив незмінні поля');
  });

  it('4. Затриманий звіт зберігає початковий час факту', async () => {
    const { service } = createService();
    const report = await service.handle(
      createWorkReportedMessage({
        OccurredAtUtc: '2026-10-01T08:15:00Z',
        ReportedAtUtc: '2026-10-01T08:00:00Z',
      })
    );

    expect(report.times.occurredAt.toISOString()).toBe('2026-10-01T08:15:00.000Z');
    expect(report.times.reportedAt.toISOString()).toBe('2026-10-01T08:00:00.000Z');
    expect(report.registeredAt.toISOString()).toBe('2026-10-01T10:00:00.000Z');
  });

  it('5. Послідовне застосування вимагає наступної ревізії наряду', async () => {
    const { service } = createService();
    await service.handle(createWorkReportedMessage());

    await expect(
      service.handle(
        createWorkReportedMessage({
          MessageId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          Revision: 3,
        })
      )
    ).rejects.toThrowError(/Очікується наступна ревізія наряду/);
  });
});
