import { GuidValue } from './GuidValue';

export class MessageId extends GuidValue {
  constructor(value: string) {
    super(value, 'повідомлення');
  }
}
