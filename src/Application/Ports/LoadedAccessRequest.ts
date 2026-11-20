import { AccessRequest } from '../../Domain/Entities/AccessRequest';

export interface LoadedAccessRequest {
  readonly aggregate: AccessRequest;
  readonly revision: number;
}
