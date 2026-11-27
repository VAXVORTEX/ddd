import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WorkReportedV1Message } from '../../src/Contracts/WorkReportedV1Message';
import { WorkReportedV1Contract } from '../../src/Maintenance/ACL/WorkReportedV1Contract';
import { WorkReportedTranslator } from '../../src/Maintenance/ACL/WorkReportedTranslator';
import { RegisterWorkReportedService } from '../../src/Maintenance/Application/Services/RegisterWorkReportedService';
import { InMemoryWorkReportRepository } from '../../src/Maintenance/Infrastructure/Persistence/InMemoryWorkReportRepository';
import { WorkReportedV1Builder } from '../../src/Repair/Integration/WorkReportedV1Builder';
import { FixedClock } from '../Support/FixedClock';

describe('WorkReportedFlow (інтеграція постачальника та споживача)', () => {
  const checkTime = new Date('2026-10-01T10:00:00Z');

  function createService(repository: InMemoryWorkReportRepository) {
    return new RegisterWorkReportedService(
      new WorkReportedV1Contract(),
      new WorkReportedTranslator(),
      repository,
      new FixedClock(checkTime)
    );
  }

  it('1. JSON з лістингу 5.1 перетворюється ACL на локальний звіт', async () => {
    const content = readFileSync(new URL('../../examples/WorkReportedV1.json', import.meta.url), 'utf8');
    const message = JSON.parse(content) as WorkReportedV1Message;
    const repository = new InMemoryWorkReportRepository();
    const report = await createService(repository).handle(message);

    expect(report.correlationId.equals(report.repairRequestId)).toBe(true);
    expect(report.workOrderId.value).toBe('33333333-3333-3333-3333-333333333333');
    expect(report.reportId.value).toBe('66666666-6666-6666-6666-666666666666');
    expect(report.times.occurredAt.toISOString()).toBe('2026-10-01T09:30:00.000Z');
    expect(repository.size).toBe(1);
  });

  it('2. Зміна контракту від імені постачальника відхиляється споживачем', async () => {
    const repository = new InMemoryWorkReportRepository();
    const proposal = WorkReportedV1Builder.create({ StateCode: 'COMPLETED' });

    await expect(createService(repository).handle(proposal)).rejects.toThrowError(
      /потрібна нова погоджена версія/
    );
    expect(repository.size).toBe(0);
  });
});
