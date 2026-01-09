import {
  S3Client,
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3ClientUtils {
  private readonly logger = new Logger(S3ClientUtils.name);
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly endpoint: string;
  private readonly isDevelopment: boolean;
  private readonly bucketFolderName: string;

  constructor(private readonly configService: ConfigService) {
    const AWS_ACCESS_KEY_ID =
      this.configService.get<string>('AWS_ACCESS_KEY_ID')!;
    const AWS_SECRET_ACCESS_KEY = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    )!;
    const AWS_REGION = this.configService.get<string>('AWS_REGION')!;
    const AWS_ENDPOINT = this.configService.get<string>('AWS_ENDPOINT')!;
    const AWS_BUCKET_NAME = this.configService.get<string>('AWS_BUCKET_NAME')!;
    const AWS_BUCKET_FOLDER_NAME = this.configService.get<string>(
      'AWS_BUCKET_FOLDER_NAME',
    )!;
    const IS_DEVELOPMENT =
      this.configService.get<string>('NODE_ENV') === 'development';

    this.bucketName = AWS_BUCKET_NAME;
    this.endpoint = AWS_ENDPOINT;
    this.isDevelopment = IS_DEVELOPMENT;
    this.bucketFolderName = AWS_BUCKET_FOLDER_NAME;

    this.s3Client = new S3Client({
      region: AWS_REGION,
      endpoint: AWS_ENDPOINT,
      credentials: {
        accessKeyId: AWS_ACCESS_KEY_ID,
        secretAccessKey: AWS_SECRET_ACCESS_KEY,
      },
      forcePathStyle: IS_DEVELOPMENT ? true : false,
    });
  }

  getPublicUrl(key: string): string | null {
    try {
      if (!key || key.trim().length === 0) {
        return null;
      }
      const base = (this.endpoint || '').replace(/\/+$/, '');
      const normalizedKey = key.replace(/^\/+/, '');
      return `${base}/${this.bucketName}/${normalizedKey}`;
    } catch {
      return null;
    }
  }

  /**
   * Generate a presigned URL for a file in S3
   */
  async generatePresignedUrl(
    key: string,
    expiresIn: number = 7889238, // 3 months
  ): Promise<string | null> {
    try {
      if (!key || key.trim().length === 0) {
        return null;
      }

      const maxExpires = 7 * 24 * 60 * 60;
      const safeExpires =
        typeof expiresIn === 'number' && Number.isFinite(expiresIn)
          ? Math.min(Math.max(1, expiresIn), maxExpires)
          : 3600;
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getSignedUrl(this.s3Client, command, {
        expiresIn: safeExpires,
      });

      if (!this.isDevelopment && url) {
        const u = new URL(url);
        if (u.hostname.endsWith('.digitaloceanspaces.com')) {
          u.hostname = u.hostname.replace(
            '.digitaloceanspaces.com',
            '.cdn.digitaloceanspaces.com',
          );
          return u.toString();
        }
      }

      return url;
    } catch (error: unknown) {
      const err = error as Error;
      if (key && key.trim().length > 0) {
        this.logger.error(
          `Failed to generate download URL for ${key}: ${err.message}`,
          err.stack,
        );
      }
      return null;
    }
  }

  /**
   * Check if an object exists in S3
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      if (!key || key.trim().length === 0) {
        return false;
      }
      const command = new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      const err = error as Error;
      if (key && key.trim().length > 0) {
        this.logger.error(
          `Failed to check object existence for ${key}: ${err.message}`,
          err.stack,
        );
      }
      return false;
    }
  }

  /**
   * Upload a file to S3
   */
  async uploadFile({
    key,
    body,
    contentType,
    path,
    metadata,
  }: {
    key: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    path?: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; key?: string; error?: string }> {
    const uploadKey = this.isDevelopment
      ? `${path}/${key}`
      : `${this.bucketFolderName}/${path}/${key}`;
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uploadKey,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);

      this.logger.log(`Successfully uploaded file: ${uploadKey}`);
      return { success: true, key: uploadKey };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to upload file ${uploadKey}: ${err.message}`,
        err.stack,
      );
      return { success: false, error: err.message, key: uploadKey };
    }
  }

  /**
   * Update an existing file in S3
   * Note: This method overwrites the existing file with the new content.
   */
  async updateFile({
    oldKey,
    key,
    body,
    contentType,
    path,
    metadata,
  }: {
    key: string;
    oldKey: string;
    body: Buffer | Uint8Array | string;
    contentType?: string;
    path?: string;
    metadata?: Record<string, string>;
  }): Promise<{ success: boolean; key?: string; error?: string }> {
    const uploadKey = this.isDevelopment
      ? `${path}/${key}`
      : `${this.bucketFolderName}/${path}/${key}`;

    if (oldKey === uploadKey) {
      throw new Error('oldKey and key must be different');
    }

    if (!(await this.objectExists(oldKey))) {
      throw new Error(`oldKey ${oldKey} does not exist`);
    }

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: uploadKey,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
      });

      await this.s3Client.send(command);
      this.logger.log(`Successfully updated file: ${uploadKey}`);
      // Delete old data
      await this.deleteObject(oldKey);

      return { success: true, key: uploadKey };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to update file ${uploadKey}: ${err.message}`,
        err.stack,
      );
      // When error occur and image is uploaded, rollback and delete new image
      await this.deleteObject(uploadKey);
      this.logger.error(
        `Rollback: Successfully deleted new uploaded file: ${uploadKey}`,
      );

      return { success: false, error: err.message, key: uploadKey };
    }
  }

  /**
   * Delete a file from S3
   */
  async deleteObject(
    key: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!key || key.trim().length === 0) {
        return { success: false, error: 'Key is empty' };
      }
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);

      this.logger.log(`Successfully deleted file: ${key}`);
      return { success: true };
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.error(
        `Failed to delete file ${key}: ${err.message}`,
        err.stack,
      );
      return { success: false, error: err.message };
    }
  }
}
