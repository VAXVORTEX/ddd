import { GuidValue } from './GuidValue';

export class TechnicianId extends GuidValue {
  constructor(value: string) {
    super(value, 'виконавця');
  }
}
