export class TrainingCertificationFact {
  private constructor(
    public readonly isValid: boolean,
    public readonly expiresAt: Date
  ) {
    Object.freeze(this);
  }

  public static create(isValid: boolean, expiresAt: Date): TrainingCertificationFact {
    return new TrainingCertificationFact(isValid, new Date(expiresAt.getTime()));
  }

  public coversPeriodUntil(endTime: Date): boolean {
    return this.isValid && this.expiresAt.getTime() >= endTime.getTime();
  }

  public equals(other: TrainingCertificationFact): boolean {
    return (
      this.isValid === other.isValid &&
      this.expiresAt.getTime() === other.expiresAt.getTime()
    );
  }
}
