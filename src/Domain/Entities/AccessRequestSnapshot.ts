import { AccessRequestStatus } from '../ValueObjects/AccessRequestStatus';

export interface AccessRequestSnapshot {
  readonly id: string;
  readonly applicantId: string;
  readonly resourceId: string;
  readonly justification: string;
  readonly durationHours: number;
  readonly status: AccessRequestStatus;
  readonly leadApproval: { approverId: string; approvedAt: string } | null;
  readonly securityApproval: { approverId: string; approvedAt: string } | null;
  readonly activatedAt: string | null;
  readonly expiresAt: string | null;
  readonly rejectionReason: string | null;
}
