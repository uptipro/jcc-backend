import { Injectable } from '@nestjs/common';
import {
  v2 as cloudinary,
  UploadApiResponse,
  ResourceApiResponse,
} from 'cloudinary';

type MediaType = 'image' | 'audio';

type CloudinaryResource = ResourceApiResponse['resources'][number];

export interface CloudinaryFile {
  /** Slash-free identifier safe to use as a URL path param (last segment of the public_id). */
  id: string;
  /** Human friendly display name derived from the file name. */
  name: string;
  /** Public, CDN-delivered URL used by the frontends. */
  url: string;
}

@Injectable()
export class CloudinaryService {
  private readonly configured: boolean;

  constructor() {
    // The SDK auto-configures from the CLOUDINARY_URL env var when present.
    // Otherwise fall back to the individual credential env vars.
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ secure: true });
      this.configured = true;
    } else {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      cloudinary.config({
        cloud_name: cloudName,
        api_key: apiKey,
        api_secret: apiSecret,
        secure: true,
      });
      this.configured = Boolean(cloudName && apiKey && apiSecret);
    }
  }

  private ensureConfigured(): void {
    if (!this.configured) {
      throw new Error(
        'Cloudinary is not configured. Set CLOUDINARY_URL, or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.',
      );
    }
  }

  /** Cloudinary stores audio under the "video" resource type. */
  private resourceType(type: MediaType): 'image' | 'video' {
    return type === 'audio' ? 'video' : 'image';
  }

  private folder(type: MediaType): string {
    return type === 'audio' ? 'jcc/audios' : 'jcc/images';
  }

  private deriveName(publicId: string): string {
    const lastSegment = publicId.split('/').pop() ?? publicId;
    return lastSegment.replace(/[_-]+/g, ' ').trim() || 'Unknown';
  }

  async uploadFile(file: Express.Multer.File, type: MediaType): Promise<string> {
    this.ensureConfigured();
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: this.folder(type),
          resource_type: this.resourceType(type),
          use_filename: true,
          unique_filename: true,
          overwrite: false,
        },
        (error, response) => {
          if (error || !response) {
            return reject(
              new Error(this.toMessage(error) ?? 'Cloudinary upload returned no response'),
            );
          }
          resolve(response);
        },
      );
      uploadStream.end(file.buffer);
    });

    return result.secure_url;
  }

  async listFiles(type: MediaType): Promise<CloudinaryFile[]> {
    this.ensureConfigured();
    const resourceType = this.resourceType(type);
    const prefix = this.folder(type);
    const resources: CloudinaryResource[] = [];
    let nextCursor: string | undefined;

    do {
      const response: ResourceApiResponse = await this.fetchResources(
        resourceType,
        prefix,
        nextCursor,
      );
      resources.push(...response.resources);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return resources.map((resource) => ({
      id: resource.public_id.split('/').pop() ?? resource.public_id,
      name: this.deriveName(resource.public_id),
      url: resource.secure_url,
    }));
  }

  async deleteFile(identifier: string, type: MediaType): Promise<void> {
    this.ensureConfigured();
    const resourceType = this.resourceType(type);

    // Frontends may pass either the slash-free id, the URL's last segment
    // (which can include a file extension), or a full URL. Normalize to the
    // bare file name so we can match it against the Cloudinary public_id.
    const needle = decodeURIComponent(identifier)
      .split('/')
      .pop()!
      .replace(/\.[^.]+$/, '');

    const files = await this.listFilesRaw(type);
    const match = files.find((resource) => {
      const lastSegment = resource.public_id.split('/').pop();
      return (
        lastSegment === needle ||
        resource.public_id === needle ||
        resource.public_id.endsWith(needle) ||
        resource.secure_url.includes(identifier)
      );
    });

    if (!match) {
      throw new Error(`File "${identifier}" not found`);
    }

    await cloudinary.uploader.destroy(match.public_id, {
      resource_type: resourceType,
      invalidate: true,
    });
  }

  private async listFilesRaw(
    type: MediaType,
  ): Promise<CloudinaryResource[]> {
    const resourceType = this.resourceType(type);
    const prefix = this.folder(type);
    const resources: CloudinaryResource[] = [];
    let nextCursor: string | undefined;

    do {
      const response: ResourceApiResponse = await this.fetchResources(
        resourceType,
        prefix,
        nextCursor,
      );
      resources.push(...response.resources);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return resources;
  }

  private async fetchResources(
    resourceType: 'image' | 'video',
    prefix: string,
    nextCursor: string | undefined,
  ): Promise<ResourceApiResponse> {
    try {
      return await cloudinary.api.resources({
        type: 'upload',
        prefix,
        resource_type: resourceType,
        max_results: 500,
        next_cursor: nextCursor,
      });
    } catch (error) {
      throw new Error(this.toMessage(error) ?? 'Cloudinary request failed');
    }
  }

  /** Cloudinary errors are often `{ error: { message } }` rather than Error instances. */
  private toMessage(error: unknown): string | undefined {
    if (!error) return undefined;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
      const maybe = error as { message?: string; error?: { message?: string } };
      return maybe.error?.message ?? maybe.message;
    }
    return String(error);
  }
}
