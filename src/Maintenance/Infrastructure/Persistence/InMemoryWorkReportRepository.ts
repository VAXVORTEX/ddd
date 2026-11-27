import { IWorkReportRepository } from '../../Application/Ports/IWorkReportRepository';
import { WorkReport } from '../../Domain/Entities/WorkReport';
import { MessageId } from '../../Domain/ValueObjects/MessageId';
import { WorkOrderId } from '../../Domain/ValueObjects/WorkOrderId';
import { WorkOrderRevision } from '../../Domain/ValueObjects/WorkOrderRevision';

export class InMemoryWorkReportRepository implements IWorkReportRepository {
  private readonly byMessageId = new Map<string, WorkReport>();
  private readonly lastRevision = new Map<string, WorkOrderRevision>();

  public get size(): number {
    return this.byMessageId.size;
  }

  public async findByMessageId(messageId: MessageId): Promise<WorkReport | null> {
    return this.byMessageId.get(messageId.value.toLowerCase()) ?? null;
  }

  public async findLastRevision(workOrderId: WorkOrderId): Promise<WorkOrderRevision | null> {
    return this.lastRevision.get(workOrderId.value.toLowerCase()) ?? null;
  }

  public async save(report: WorkReport): Promise<void> {
    this.byMessageId.set(report.messageId.value.toLowerCase(), report);
    this.lastRevision.set(report.workOrderId.value.toLowerCase(), report.revision);
  }
}
