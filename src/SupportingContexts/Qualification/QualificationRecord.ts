import { EngineerId } from '../../Domain/ValueObjects/EngineerId';
import { TrainingCertificationFact } from '../../Domain/ValueObjects/TrainingCertificationFact';

export class QualificationRecord {
  private constructor(
    public readonly engineerId: EngineerId,
    public readonly passedAt: Date,
    public readonly validUntil: Date
  ) {}

  public static registerCompletion(
    engineerId: EngineerId,
    passedAt: Date,
    validUntil: Date
  ): QualificationRecord {
    if (validUntil.getTime() <= passedAt.getTime()) {
      throw new Error('Дата завершення сертифіката має бути пізнішою за дату складання тесту.');
    }
    return new QualificationRecord(
      engineerId,
      new Date(passedAt.getTime()),
      new Date(validUntil.getTime())
    );
  }

  public toCertificationFact(checkTime: Date): TrainingCertificationFact {
    const isStillValid = this.validUntil.getTime() > checkTime.getTime();
    return TrainingCertificationFact.create(isStillValid, this.validUntil);
  }
}
