import { IClock } from '../../src/Maintenance/Application/Ports/IClock';

export class FixedClock implements IClock {
  constructor(private readonly current: Date) {}

  public now(): Date {
    return new Date(this.current.getTime());
  }
}
