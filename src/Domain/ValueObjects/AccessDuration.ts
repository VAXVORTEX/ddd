export class AccessDuration {
  public static readonly MAX_HOURS = 24;
  public static readonly EMERGENCY_MAX_HOURS = 4;

  private constructor(public readonly hours: number) {
    Object.freeze(this);
  }

  public static createStandard(hours: number): AccessDuration {
    if (hours <= 0 || hours > AccessDuration.MAX_HOURS) {
      throw new Error(`Тривалість звичайного доступу має бути від 1 до ${AccessDuration.MAX_HOURS} годин.`);
    }
    return new AccessDuration(hours);
  }

  public static createEmergency(hours: number): AccessDuration {
    if (hours <= 0 || hours > AccessDuration.EMERGENCY_MAX_HOURS) {
      throw new Error(`Тривалість аварійного доступу Break-glass не може перевищувати ${AccessDuration.EMERGENCY_MAX_HOURS} години.`);
    }
    return new AccessDuration(hours);
  }

  public equals(other: AccessDuration): boolean {
    return this.hours === other.hours;
  }
}
