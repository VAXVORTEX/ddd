import { GuidValue } from './GuidValue';

export class CorrelationId extends GuidValue {
  constructor(value: string) {
    super(value, 'кореляції');
  }
}
