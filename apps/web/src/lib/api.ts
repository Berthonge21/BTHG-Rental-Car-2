import { createBthgClient, LocalStorageTokenStorage } from '@bthgrentalcar/sdk';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const api = createBthgClient({
  baseUrl: API_BASE_URL,
  tokenStorage: new LocalStorageTokenStorage(),
  debug: process.env.NODE_ENV === 'development',
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  },
});
