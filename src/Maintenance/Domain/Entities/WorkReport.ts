import { ValidatedWorkReportedV1 } from '../../ACL/ValidatedWorkReportedV1';
import { CorrelationId } from '../ValueObjects/CorrelationId';
import { FactTimes } from '../ValueObjects/FactTimes';
import { MessageId } from '../ValueObjects/MessageId';
import { RepairRequestId } from '../ValueObjects/RepairRequestId';
import { ReportId } from '../ValueObjects/ReportId';
import { Summary } from '../ValueObjects/Summary';
import { TechnicianId } from '../ValueObjects/TechnicianId';
import { WorkOrderId } from '../ValueObjects/WorkOrderId';
import { WorkOrderRevision } from '../ValueObjects/WorkOrderRevision';

export class WorkReport {
  private constructor(
    public readonly messageId: MessageId,
    public readonly correlationId: CorrelationId,
    public readonly repairRequestId: RepairRequestId,
    public readonly workOrderId: WorkOrderId,
    public readonly reportId: ReportId,
    public readonly technicianId: TechnicianId,
    public readonly revision: WorkOrderRevision,
    public readonly times: FactTimes,
    public readonly summary: Summary,
    public readonly registeredAt: Date
  ) {
    Object.freeze(this);
  }

  public static register(validated: ValidatedWorkReportedV1, registeredAt: Date): WorkReport {
    return new WorkReport(
      validated.messageId,
      validated.correlationId,
      validated.repairRequestId,
      validated.workOrderId,
      validated.reportId,
      validated.technicianId,
      validated.revision,
      validated.times,
      validated.summary,
      new Date(registeredAt.getTime())
    );
  }

  public matchesRetry(validated: ValidatedWorkReportedV1): boolean {
    return (
      this.revision.equals(validated.revision) &&
      this.reportId.equals(validated.reportId) &&
      this.times.occurredAt.getTime() === validated.times.occurredAt.getTime()
    );
  }
}
