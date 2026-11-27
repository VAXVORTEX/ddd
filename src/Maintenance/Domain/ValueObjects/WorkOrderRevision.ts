export class WorkOrderRevision {
  private constructor(public readonly value: number) {
    Object.freeze(this);
  }

  public static create(value: number): WorkOrderRevision {
    if (!Number.isSafeInteger(value) || value <= 0) {
      throw new Error('Ревізія наряду має бути додатним цілим числом.');
    }
    return new WorkOrderRevision(value);
  }

  public isNextAfter(previous: WorkOrderRevision): boolean {
    return this.value === previous.value + 1;
  }

  public equals(other: WorkOrderRevision): boolean {
    return this.value === other.value;
  }
}
