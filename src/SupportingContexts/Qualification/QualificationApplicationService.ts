import { IClock } from '../../Application/Ports/IClock';
import { EngineerId } from '../../Domain/ValueObjects/EngineerId';
import { TrainingCertificationFact } from '../../Domain/ValueObjects/TrainingCertificationFact';
import { IQualificationRepository } from './IQualificationRepository';
import { QualificationRecord } from './QualificationRecord';

export class QualificationApplicationService {
  constructor(
    private readonly repository: IQualificationRepository,
    private readonly clock: IClock
  ) {}

  public async recordCompletedTraining(
    engineerIdValue: string,
    validUntil: Date
  ): Promise<void> {
    const engineerId = new EngineerId(engineerIdValue);
    const record = QualificationRecord.registerCompletion(
      engineerId,
      this.clock.now(),
      validUntil
    );
    await this.repository.save(record);
  }

  public async getCertificationFact(engineerIdValue: string): Promise<TrainingCertificationFact> {
    const engineerId = new EngineerId(engineerIdValue);
    const now = this.clock.now();
    const record = await this.repository.findByEngineerId(engineerId);
    if (!record) {
      return TrainingCertificationFact.create(false, now);
    }
    return record.toCertificationFact(now);
  }
}
