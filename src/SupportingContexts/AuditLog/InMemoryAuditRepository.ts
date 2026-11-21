import { AuditEntry } from './AuditEntry';
import { IAuditRepository } from './IAuditRepository';

export class InMemoryAuditRepository implements IAuditRepository {
  private readonly entries: AuditEntry[] = [];

  public async append(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }

  public async findByRequestId(requestId: string): Promise<ReadonlyArray<AuditEntry>> {
    return this.entries.filter((e) => e.requestId === requestId);
  }
}
