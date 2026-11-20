export class ResourceId {
  constructor(public readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Ідентифікатор ресурсу не може бути порожнім.');
    }
  }

  public equals(other: ResourceId): boolean {
    return this.value === other.value;
  }
}
