import { AccessRequestId } from '../../Domain/ValueObjects/AccessRequestId';
import { EngineerId } from '../../Domain/ValueObjects/EngineerId';
import { IAccessRequestRepository } from '../Ports/IAccessRequestRepository';
import { IClock } from '../Ports/IClock';
import { IUnitOfWork } from '../Ports/IUnitOfWork';

export class AccessRequestApplicationService {
  constructor(
    private readonly repository: IAccessRequestRepository,
    private readonly unitOfWork: IUnitOfWork,
    private readonly clock: IClock
  ) {}

  public async approveAndActivateBySecurity(
    requestIdValue: string,
    securityOfficerIdValue: string
  ): Promise<void> {
    const requestId = new AccessRequestId(requestIdValue);
    const officerId = new EngineerId(securityOfficerIdValue);
    const currentTime = this.clock.now();

    const loaded = await this.repository.findById(requestId);
    if (!loaded) {
      throw new Error('Запит на доступ із вказаним ідентифікатором не знайдено.');
    }

    loaded.aggregate.approveAndActivateBySecurity(officerId, currentTime);

    this.repository.stage(loaded.aggregate, loaded.revision);
    await this.unitOfWork.saveChanges();
  }
}
