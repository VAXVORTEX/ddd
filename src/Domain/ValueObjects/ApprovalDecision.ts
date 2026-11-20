import { EngineerId } from './EngineerId';

export class ApprovalDecision {
  private constructor(
    public readonly approverId: EngineerId,
    public readonly approvedAt: Date
  ) {
    Object.freeze(this);
  }

  public static create(approverId: EngineerId, approvedAt: Date): ApprovalDecision {
    return new ApprovalDecision(approverId, new Date(approvedAt.getTime()));
  }

  public equals(other: ApprovalDecision): boolean {
    return (
      this.approverId.equals(other.approverId) &&
      this.approvedAt.getTime() === other.approvedAt.getTime()
    );
  }
}
