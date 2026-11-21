import { AuditEntry } from './AuditEntry';

export interface IAuditRepository {
  append(entry: AuditEntry): Promise<void>;
  findByRequestId(requestId: string): Promise<ReadonlyArray<AuditEntry>>;
}
