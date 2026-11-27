export class Summary {
  private constructor(public readonly value: string) {
    Object.freeze(this);
  }

  public static create(value: string): Summary {
    if (!value || value.trim().length === 0) {
      throw new Error('Опис робіт не може бути порожнім.');
    }
    return new Summary(value);
  }

  public equals(other: Summary): boolean {
    return this.value === other.value;
  }
}
