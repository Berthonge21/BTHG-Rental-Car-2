import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import WebSocket from 'ws';

export const STORAGE_BUCKET = 'images';
export type StorageFolder = 'cars' | 'avatars';

interface SupabaseConfig {
  url: string;
  serviceRoleKey: string;
}

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: SupabaseClient | null = null;

  constructor(private readonly configService: ConfigService) {}

  /**
   * Ensures the shared public bucket exists on boot. Best-effort: Storage
   * being unconfigured or transiently unreachable must not stop the rest
   * of the API from starting — it only means uploads fail (with a clear
   * error) until it's fixed.
   */
  async onModuleInit(): Promise<void> {
    const config = this.configService.get<SupabaseConfig>('supabase');
    if (!config?.url || !config.serviceRoleKey) {
      this.logger.warn(
        'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set — image uploads are disabled until configured.',
      );
      return;
    }

    try {
      const client = this.getClient();
      const { data: buckets, error: listError } = await client.storage.listBuckets();
      if (listError) throw listError;

      const exists = buckets?.some((bucket) => bucket.name === STORAGE_BUCKET);
      if (!exists) {
        // Public bucket: uploaded images (car photos, avatars) are served
        // straight from Storage's public CDN URL — the same trust level
        // as the base64 strings they replace, which were already returned
        // verbatim in public API responses.
        const { error: createError } = await client.storage.createBucket(STORAGE_BUCKET, {
          public: true,
          fileSizeLimit: '5MB',
        });
        if (createError) throw createError;
        this.logger.log(`Created Supabase Storage bucket "${STORAGE_BUCKET}".`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to verify/create the "${STORAGE_BUCKET}" Storage bucket at boot: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async uploadImage(folder: StorageFolder, file: Express.Multer.File): Promise<string> {
    const client = this.getClient();
    const path = `${folder}/${randomUUID()}${this.extensionFor(file.mimetype)}`;

    const { error } = await client.storage.from(STORAGE_BUCKET).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

    if (error) {
      throw new InternalServerErrorException(`Image upload failed: ${error.message}`);
    }

    const {
      data: { publicUrl },
    } = client.storage.from(STORAGE_BUCKET).getPublicUrl(path);

    return publicUrl;
  }

  private getClient(): SupabaseClient {
    if (this.client) return this.client;

    const config = this.configService.get<SupabaseConfig>('supabase');
    if (!config?.url || !config.serviceRoleKey) {
      throw new InternalServerErrorException(
        'Image uploads are not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.',
      );
    }

    // Service-role key deliberately bypasses Row Level Security — the app
    // already talks to Postgres as a single privileged role (audit §10.2),
    // and this key is only ever used server-side, never sent to a client.
    this.client = createClient(config.url, config.serviceRoleKey, {
      auth: { persistSession: false },
      // Only Storage is used here — no realtime subscriptions — but the
      // client still builds a RealtimeClient eagerly, which otherwise logs
      // a "no native WebSocket" error on Node < 22 the moment this client
      // is constructed. Supplying the `ws` package's implementation avoids
      // that noise; it's never actually connected.
      realtime: { transport: WebSocket as unknown as typeof globalThis.WebSocket },
    });

    return this.client;
  }

  private extensionFor(mimetype: string): string {
    switch (mimetype) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/jpeg':
      default:
        return '.jpg';
    }
  }
}
