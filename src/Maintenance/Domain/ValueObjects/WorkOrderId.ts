import { GuidValue } from './GuidValue';

export class WorkOrderId extends GuidValue {
  constructor(value: string) {
    super(value, 'наряду');
  }
}
