import { IAccessRequestRepository } from '../../Application/Ports/IAccessRequestRepository';
import { IUnitOfWork } from '../../Application/Ports/IUnitOfWork';
import { LoadedAccessRequest } from '../../Application/Ports/LoadedAccessRequest';
import { AccessRequest } from '../../Domain/Entities/AccessRequest';
import { AccessRequestSnapshot } from '../../Domain/Entities/AccessRequestSnapshot';
import { AccessRequestId } from '../../Domain/ValueObjects/AccessRequestId';

interface StoredRecord {
  snapshot: AccessRequestSnapshot;
  revision: number;
}

interface StagedOperation {
  request: AccessRequest;
  expectedRevision: number;
}

export class InMemoryAccessRequestSession implements IAccessRequestRepository, IUnitOfWork {
  private readonly storage = new Map<string, StoredRecord>();
  private stagedOperations: StagedOperation[] = [];
  private failNextSave = false;

  public seed(request: AccessRequest, revision = 1): void {
    this.storage.set(request.id.value, {
      snapshot: request.toSnapshot(),
      revision,
    });
  }

  public simulateTechnicalFailureOnNextSave(): void {
    this.failNextSave = true;
  }

  public async findById(id: AccessRequestId): Promise<LoadedAccessRequest | null> {
    const record = this.storage.get(id.value);
    if (!record) {
      return null;
    }
    const restoredAggregate = AccessRequest.restore(record.snapshot);
    return {
      aggregate: restoredAggregate,
      revision: record.revision,
    };
  }

  public stage(request: AccessRequest, expectedRevision: number): void {
    this.stagedOperations.push({ request, expectedRevision });
  }

  public async saveChanges(): Promise<void> {
    if (this.failNextSave) {
      this.failNextSave = false;
      this.stagedOperations = [];
      throw new Error('Технічний збій сховища під час фіксації транзакції.');
    }

    for (const op of this.stagedOperations) {
      const existing = this.storage.get(op.request.id.value);
      const currentRevision = existing ? existing.revision : 0;

      if (currentRevision !== op.expectedRevision) {
        this.stagedOperations = [];
        throw new Error(
          `Конфлікт версій для запиту ${op.request.id.value}: очікувана ревізія ${op.expectedRevision}, фактична ${currentRevision}.`
        );
      }
    }

    for (const op of this.stagedOperations) {
      const nextRevision = op.expectedRevision + 1;
      this.storage.set(op.request.id.value, {
        snapshot: op.request.toSnapshot(),
        revision: nextRevision,
      });
    }

    this.stagedOperations = [];
  }
}
