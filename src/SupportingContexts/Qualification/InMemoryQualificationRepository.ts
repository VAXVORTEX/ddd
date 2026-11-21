import { EngineerId } from '../../Domain/ValueObjects/EngineerId';
import { IQualificationRepository } from './IQualificationRepository';
import { QualificationRecord } from './QualificationRecord';

export class InMemoryQualificationRepository implements IQualificationRepository {
  private readonly records = new Map<string, QualificationRecord>();

  public async findByEngineerId(engineerId: EngineerId): Promise<QualificationRecord | null> {
    return this.records.get(engineerId.value) ?? null;
  }

  public async save(record: QualificationRecord): Promise<void> {
    this.records.set(record.engineerId.value, record);
  }
}
