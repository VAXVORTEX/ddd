export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly requestId: string;
}
