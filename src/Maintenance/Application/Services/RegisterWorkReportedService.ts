import { WorkReportedV1Message } from '../../../Contracts/WorkReportedV1Message';
import { ContractViolationError } from '../../ACL/ContractViolationError';
import { WorkReportedTranslator } from '../../ACL/WorkReportedTranslator';
import { WorkReportedV1Contract } from '../../ACL/WorkReportedV1Contract';
import { WorkReport } from '../../Domain/Entities/WorkReport';
import { IClock } from '../Ports/IClock';
import { IWorkReportRepository } from '../Ports/IWorkReportRepository';

export class RegisterWorkReportedService {
  constructor(
    private readonly contract: WorkReportedV1Contract,
    private readonly translator: WorkReportedTranslator,
    private readonly repository: IWorkReportRepository,
    private readonly clock: IClock
  ) {}

  public async handle(message: WorkReportedV1Message): Promise<WorkReport> {
    const checkTime = this.clock.now();
    const validated = this.contract.validate(message, checkTime);

    const existing = await this.repository.findByMessageId(validated.messageId);
    if (existing) {
      if (!existing.matchesRetry(validated)) {
        throw new ContractViolationError('Повтор повідомлення змінив незмінні поля MessageId, Revision, ReportId або OccurredAtUtc.');
      }
      return existing;
    }

    const lastRevision = await this.repository.findLastRevision(validated.workOrderId);
    if (lastRevision && !validated.revision.isNextAfter(lastRevision)) {
      throw new ContractViolationError(
        `Очікується наступна ревізія наряду ${validated.workOrderId.value}: після ${lastRevision.value} має бути ${lastRevision.value + 1}.`
      );
    }

    const report = this.translator.translate(validated, checkTime);
    await this.repository.save(report);
    return report;
  }
}
