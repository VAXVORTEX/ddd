import { WorkOrderState } from '../ValueObjects/WorkOrderState';

export class RepairWorkOrder {
  private constructor(
    public readonly id: string,
    public readonly revision: number,
    public readonly state: WorkOrderState
  ) {
    Object.freeze(this);
  }

  public static create(id: string, revision: number): RepairWorkOrder {
    if (!id || id.trim().length === 0) {
      throw new Error('Ідентифікатор наряду не може бути порожнім.');
    }
    if (!Number.isSafeInteger(revision) || revision <= 0) {
      throw new Error('Ревізія наряду має бути додатним цілим числом.');
    }
    return new RepairWorkOrder(id, revision, WorkOrderState.Open);
  }

  public markReported(): RepairWorkOrder {
    return new RepairWorkOrder(this.id, this.revision + 1, WorkOrderState.Reported);
  }
}
