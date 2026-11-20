import { AccessRequest } from '../../Domain/Entities/AccessRequest';
import { AccessRequestId } from '../../Domain/ValueObjects/AccessRequestId';
import { LoadedAccessRequest } from './LoadedAccessRequest';

export interface IAccessRequestRepository {
  findById(id: AccessRequestId): Promise<LoadedAccessRequest | null>;
  stage(request: AccessRequest, expectedRevision: number): void;
}
