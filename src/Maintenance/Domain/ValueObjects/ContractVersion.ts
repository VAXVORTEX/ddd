export class ContractVersion {
  public static readonly V1 = 1;

  private constructor(public readonly value: number) {
    Object.freeze(this);
  }

  public static create(value: number): ContractVersion {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Версія контракту має бути додатним цілим числом.');
    }
    return new ContractVersion(value);
  }

  public isSupported(): boolean {
    return this.value === ContractVersion.V1;
  }

  public equals(other: ContractVersion): boolean {
    return this.value === other.value;
  }
}
