import { DomainEvent } from '../../Domain/Events/DomainEvent';

export class AuditEntry {
  private constructor(
    public readonly entryId: string,
    public readonly requestId: string,
    public readonly eventName: string,
    public readonly occurredAt: Date,
    public readonly recordedAt: Date
  ) {
    Object.freeze(this);
  }

  public static fromDomainEvent(
    entryId: string,
    event: DomainEvent,
    recordedAt: Date
  ): AuditEntry {
    return new AuditEntry(
      entryId,
      event.requestId,
      event.eventName,
      new Date(event.occurredAt.getTime()),
      new Date(recordedAt.getTime())
    );
  }
}
