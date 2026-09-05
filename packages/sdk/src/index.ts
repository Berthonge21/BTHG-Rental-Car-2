// Client
export {
  BthgClient,
  createBthgClient,
  LocalStorageTokenStorage,
  MemoryTokenStorage,
} from './client';
export type { BthgClientConfig, TokenStorage } from './client';

// Modules
export { AuthModule } from './modules/auth';
export { CarsModule } from './modules/cars';
export { RentalsModule } from './modules/rentals';
export { AgenciesModule } from './modules/agencies';
export { UsersModule } from './modules/users';
export { AdminModule } from './modules/admin';
export { SuperAdminModule } from './modules/super-admin';
export { StorageModule } from './modules/storage';
export type { StorageFolder, UploadImageResponse } from './modules/storage';

// Errors
export { ApiError, NetworkError } from './errors';
export type { ApiErrorData } from './errors';

// Types
export * from './types';
