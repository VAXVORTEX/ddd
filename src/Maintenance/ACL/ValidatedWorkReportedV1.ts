import { CorrelationId } from '../Domain/ValueObjects/CorrelationId';
import { ContractVersion } from '../Domain/ValueObjects/ContractVersion';
import { FactTimes } from '../Domain/ValueObjects/FactTimes';
import { MessageId } from '../Domain/ValueObjects/MessageId';
import { RepairRequestId } from '../Domain/ValueObjects/RepairRequestId';
import { ReportId } from '../Domain/ValueObjects/ReportId';
import { Summary } from '../Domain/ValueObjects/Summary';
import { TechnicianId } from '../Domain/ValueObjects/TechnicianId';
import { WorkOrderId } from '../Domain/ValueObjects/WorkOrderId';
import { WorkOrderRevision } from '../Domain/ValueObjects/WorkOrderRevision';
import { WorkStateCode } from '../Domain/ValueObjects/WorkStateCode';

export class ValidatedWorkReportedV1 {
  private constructor(
    public readonly messageId: MessageId,
    public readonly version: ContractVersion,
    public readonly correlationId: CorrelationId,
    public readonly repairRequestId: RepairRequestId,
    public readonly workOrderId: WorkOrderId,
    public readonly reportId: ReportId,
    public readonly technicianId: TechnicianId,
    public readonly revision: WorkOrderRevision,
    public readonly times: FactTimes,
    public readonly stateCode: WorkStateCode,
    public readonly summary: Summary
  ) {
    Object.freeze(this);
  }

  public static create(
    messageId: MessageId,
    version: ContractVersion,
    correlationId: CorrelationId,
    repairRequestId: RepairRequestId,
    workOrderId: WorkOrderId,
    reportId: ReportId,
    technicianId: TechnicianId,
    revision: WorkOrderRevision,
    times: FactTimes,
    stateCode: WorkStateCode,
    summary: Summary
  ): ValidatedWorkReportedV1 {
    return new ValidatedWorkReportedV1(
      messageId,
      version,
      correlationId,
      repairRequestId,
      workOrderId,
      reportId,
      technicianId,
      revision,
      times,
      stateCode,
      summary
    );
  }
}
