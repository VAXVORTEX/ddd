import { GuidValue } from './GuidValue';

export class RepairRequestId extends GuidValue {
  constructor(value: string) {
    super(value, 'заявки на ремонт');
  }
}
