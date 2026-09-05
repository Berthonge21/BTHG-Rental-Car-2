export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  database: {
    url: string;
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  cors: {
    origins: string[];
  };
  swagger: {
    enabled: boolean;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
}

const KNOWN_DEFAULT_SECRETS = new Set(['default-secret-change-me', 'default-secret']);

function requireJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret || KNOWN_DEFAULT_SECRETS.has(secret)) {
    throw new Error(
      'JWT_SECRET is missing or set to a known default value. Set a unique, unpredictable JWT_SECRET before starting the server.',
    );
  }

  return secret;
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: requireJwtSecret(),
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
  },
  supabase: {
    url: process.env.SUPABASE_URL || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
});
