import { WorkReportedV1Message } from '../../Contracts/WorkReportedV1Message';
import { ContractViolationError } from './ContractViolationError';
import { UnsupportedStateCodeError } from './UnsupportedStateCodeError';
import { ValidatedWorkReportedV1 } from './ValidatedWorkReportedV1';
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

export class WorkReportedV1Contract {
  public validate(message: WorkReportedV1Message, checkTime: Date): ValidatedWorkReportedV1 {
    if (!message) {
      throw new ContractViolationError('Повідомлення WorkReportedV1 відсутнє.');
    }

    const messageId = new MessageId(message.MessageId);
    const version = ContractVersion.create(message.Version);
    if (!version.isSupported()) {
      throw new ContractViolationError(
        `Версія контракту ${version.value} не підтримується: потрібна нова погоджена версія.`
      );
    }

    const correlationId = new CorrelationId(message.CorrelationId);
    const repairRequestId = new RepairRequestId(message.RepairRequestId);
    if (!correlationId.equals(repairRequestId)) {
      throw new ContractViolationError('Ідентифікатор кореляції та ідентифікатор заявки мають збігатися.');
    }

    const workOrderId = new WorkOrderId(message.WorkOrderId);
    const reportId = new ReportId(message.ReportId);
    const technicianId = new TechnicianId(message.TechnicianId);
    const revision = WorkOrderRevision.create(message.Revision);
    const times = FactTimes.create(new Date(message.OccurredAtUtc), new Date(message.ReportedAtUtc));

    if (!times.occursNotAfter(checkTime)) {
      throw new ContractViolationError('Час події не може належати майбутньому відносно часу перевірки.');
    }
    if (message.StateCode !== WorkStateCode.Reported) {
      throw new UnsupportedStateCodeError(message.StateCode);
    }

    const summary = Summary.create(message.Summary);

    return ValidatedWorkReportedV1.create(
      messageId,
      version,
      correlationId,
      repairRequestId,
      workOrderId,
      reportId,
      technicianId,
      revision,
      times,
      WorkStateCode.Reported,
      summary
    );
  }
}
