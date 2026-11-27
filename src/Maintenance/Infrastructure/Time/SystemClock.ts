import { IClock } from '../../Application/Ports/IClock';

export class SystemClock implements IClock {
  public now(): Date {
    return new Date();
  }
}
