export abstract class GuidValue {
  public readonly value: string;

  protected constructor(value: string, label: string) {
    if (!value || value.trim().length === 0) {
      throw new Error(`Ідентифікатор ${label} не може бути порожнім.`);
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) {
      throw new Error(`Ідентифікатор ${label} має бути коректним GUID.`);
    }
    this.value = value;
  }

  public equals(other: GuidValue): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }
}
