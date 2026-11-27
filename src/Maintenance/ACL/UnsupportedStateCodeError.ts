import { ContractViolationError } from './ContractViolationError';

export class UnsupportedStateCodeError extends ContractViolationError {
  public readonly code: string;

  constructor(code: string) {
    super(
      `Код стану ${code || '<порожній>'} не належить версії 1 контракту WorkReportedV1: потрібна нова погоджена версія після приймання результату та закриття заявки.`
    );
    this.name = 'UnsupportedStateCodeError';
    this.code = code;
  }
}
