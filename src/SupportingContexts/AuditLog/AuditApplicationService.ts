import { IClock } from '../../Application/Ports/IClock';
import { DomainEvent } from '../../Domain/Events/DomainEvent';
import { AuditEntry } from './AuditEntry';
import { IAuditRepository } from './IAuditRepository';

export class AuditApplicationService {
  private counter = 1;

  constructor(
    private readonly repository: IAuditRepository,
    private readonly clock: IClock
  ) {}

  public async recordEvents(events: ReadonlyArray<DomainEvent>): Promise<void> {
    for (const event of events) {
      const entry = AuditEntry.fromDomainEvent(
        `AUD-${this.counter++}`,
        event,
        this.clock.now()
      );
      await this.repository.append(entry);
    }
  }

  public async getRequestHistory(requestId: string): Promise<ReadonlyArray<AuditEntry>> {
    return this.repository.findByRequestId(requestId);
  }
}
