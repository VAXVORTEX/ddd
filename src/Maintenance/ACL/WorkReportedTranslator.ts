import { WorkReport } from '../Domain/Entities/WorkReport';
import { ValidatedWorkReportedV1 } from './ValidatedWorkReportedV1';

export class WorkReportedTranslator {
  public translate(validated: ValidatedWorkReportedV1, registeredAt: Date): WorkReport {
    return WorkReport.register(validated, registeredAt);
  }
}
