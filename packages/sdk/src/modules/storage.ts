import type { AxiosInstance } from 'axios';

export type StorageFolder = 'cars' | 'avatars';

export interface UploadImageResponse {
  /** Public URL of the uploaded image in Supabase Storage. */
  url: string;
}

export class StorageModule {
  constructor(private readonly http: AxiosInstance) {}

  /**
   * Upload an image file and get back its public Storage URL, to store on
   * the relevant record (Car.image, Client.image, AgencyUser.image, ...)
   * instead of embedding the file as base64.
   */
  async upload(folder: StorageFolder, file: File | Blob): Promise<UploadImageResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.http.post<UploadImageResponse>(`/storage/upload/${folder}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }
}
