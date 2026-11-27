import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WorkReportedV1Message } from '../../src/Contracts/WorkReportedV1Message';
import { WorkReportedV1Builder } from '../../src/Repair/Integration/WorkReportedV1Builder';

describe('WorkReportedV1Builder (сторона постачальника)', () => {
  it('1. Будівельник відтворює повідомлення з лістингу 5.1', () => {
    const content = readFileSync(new URL('../../examples/WorkReportedV1.json', import.meta.url), 'utf8');
    const listing = JSON.parse(content) as WorkReportedV1Message;

    expect(WorkReportedV1Builder.create()).toEqual(listing);
  });

  it('2. Будівельник може сформувати пропозицію нової семантики COMPLETED', () => {
    const proposal = WorkReportedV1Builder.create({ StateCode: 'COMPLETED' });

    expect(proposal.StateCode).toBe('COMPLETED');
    expect(proposal.MessageId).toBe('11111111-1111-1111-1111-111111111111');
  });
});
