import { WorkReportedV1Message } from '../../../Contracts/WorkReportedV1Message';
import { RepairWorkOrder } from '../../Domain/Entities/RepairWorkOrder';
import { WorkReportedV1Builder } from '../../Integration/WorkReportedV1Builder';

export class EmitWorkReportedService {
  public emit(workOrder: RepairWorkOrder, technicianId: string, summary: string): WorkReportedV1Message {
    const reported = workOrder.markReported();
    return WorkReportedV1Builder.create({
      WorkOrderId: reported.id,
      Revision: reported.revision,
      TechnicianId: technicianId,
      Summary: summary,
      StateCode: reported.state,
    });
  }
}
