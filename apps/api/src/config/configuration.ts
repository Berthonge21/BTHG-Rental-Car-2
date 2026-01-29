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
}

export default (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  apiPrefix: process.env.API_PREFIX || 'api/v1',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
});
