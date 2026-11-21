import { EngineerId } from '../../Domain/ValueObjects/EngineerId';
import { QualificationRecord } from './QualificationRecord';

export interface IQualificationRepository {
  findByEngineerId(engineerId: EngineerId): Promise<QualificationRecord | null>;
  save(record: QualificationRecord): Promise<void>;
}
