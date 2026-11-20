export interface IUnitOfWork {
  saveChanges(): Promise<void>;
}
