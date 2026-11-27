export interface WorkReportedV1Message {
  readonly MessageId: string;
  readonly Version: number;
  readonly CorrelationId: string;
  readonly RepairRequestId: string;
  readonly WorkOrderId: string;
  readonly ReportId: string;
  readonly TechnicianId: string;
  readonly Revision: number;
  readonly OccurredAtUtc: string;
  readonly ReportedAtUtc: string;
  readonly StateCode: string;
  readonly Summary: string;
}
