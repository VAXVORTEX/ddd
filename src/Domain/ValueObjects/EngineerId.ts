export class EngineerId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Ідентифікатор інженера не може бути порожнім.');
    }
  }

  public equals(other: EngineerId): boolean {
    return this.value === other.value;
  }
}
