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
  constructor() {
    // The SDK auto-configures from the CLOUDINARY_URL env var when present.
    // Otherwise fall back to the individual credential env vars.
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({ secure: true });
    } else {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
      });
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
            return reject(error ?? new Error('Cloudinary upload returned no response'));
          }
          resolve(response);
        },
      );
      uploadStream.end(file.buffer);
    });

    return result.secure_url;
  }

  async listFiles(type: MediaType): Promise<CloudinaryFile[]> {
    const resourceType = this.resourceType(type);
    const prefix = this.folder(type);
    const resources: CloudinaryResource[] = [];
    let nextCursor: string | undefined;

    do {
      const response: ResourceApiResponse = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        resource_type: resourceType,
        max_results: 500,
        next_cursor: nextCursor,
      });
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
      const response: ResourceApiResponse = await cloudinary.api.resources({
        type: 'upload',
        prefix,
        resource_type: resourceType,
        max_results: 500,
        next_cursor: nextCursor,
      });
      resources.push(...response.resources);
      nextCursor = response.next_cursor;
    } while (nextCursor);

    return resources;
  }
}
