import { WorkReport } from '../../Domain/Entities/WorkReport';
import { MessageId } from '../../Domain/ValueObjects/MessageId';
import { WorkOrderId } from '../../Domain/ValueObjects/WorkOrderId';
import { WorkOrderRevision } from '../../Domain/ValueObjects/WorkOrderRevision';

export interface IWorkReportRepository {
  findByMessageId(messageId: MessageId): Promise<WorkReport | null>;
  findLastRevision(workOrderId: WorkOrderId): Promise<WorkOrderRevision | null>;
  save(report: WorkReport): Promise<void>;
}
