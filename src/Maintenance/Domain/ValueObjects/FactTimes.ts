export class FactTimes {
  private constructor(
    public readonly occurredAt: Date,
    public readonly reportedAt: Date
  ) {
    Object.freeze(this);
  }

  public static create(occurredAt: Date, reportedAt: Date): FactTimes {
    if (
      !Number.isFinite(occurredAt.getTime()) ||
      !Number.isFinite(reportedAt.getTime()) ||
      occurredAt.getUTCFullYear() <= 1 ||
      reportedAt.getUTCFullYear() <= 1
    ) {
      throw new Error('Час події та час звіту мають бути коректними значеннями DateTimeOffset.');
    }
    if (reportedAt.getTime() > occurredAt.getTime()) {
      throw new Error('Час звіту не може перевищувати час події.');
    }
    return new FactTimes(new Date(occurredAt.getTime()), new Date(reportedAt.getTime()));
  }

  public occursNotAfter(checkTime: Date): boolean {
    return this.occurredAt.getTime() <= checkTime.getTime();
  }

  public equals(other: FactTimes): boolean {
    return (
      this.occurredAt.getTime() === other.occurredAt.getTime() &&
      this.reportedAt.getTime() === other.reportedAt.getTime()
    );
  }
}
