import { GuidValue } from './GuidValue';

export class ReportId extends GuidValue {
  constructor(value: string) {
    super(value, 'звіту');
  }
}
