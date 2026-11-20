export class AccessRequestId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Ідентифікатор запиту не може бути порожнім.');
    }
  }

  public equals(other: AccessRequestId): boolean {
    return this.value === other.value;
  }
}
