import { BadRequestException, UseGuards } from '@nestjs/common';
import { Resolver, Mutation, Args, Context } from '@nestjs/graphql';
import { S3ClientUtils } from 'src/common/utils/s3-client.utils';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { UploadResponse } from './response/upload-response.type';
import { UploadFileInput } from 'src/upload/dto/upload-file.input';
import { randomUUID, createHmac } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Resolver()
export class UploadResolver {
  private ALLOWED_FILE_TYPE = new Set([
    'image/jpeg',
    'image/gif',
    'image/png',
    'image/webp',
    'application/pdf',
  ]);

  private PREFIXES = [
    /^data:image\/jpeg;base64,/,
    /^data:image\/gif;base64,/,
    /^data:image\/png;base64,/,
    /^data:image\/webp;base64,/,
    /^data:application\/pdf;base64,/,
  ];

  constructor(
    private readonly s3: S3ClientUtils,
    private readonly config: ConfigService,
  ) {}

  private verifySignature(req: Request) {
    const sig = req.headers['x-signature'];
    const ts = req.headers['x-timestamp'];
    if (typeof sig !== 'string' || typeof ts !== 'string') {
      throw new BadRequestException('Missing signature headers');
    }
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum)) {
      throw new BadRequestException('Invalid timestamp');
    }
    const now = Date.now();
    const driftMs = 5 * 60 * 1000;
    if (Math.abs(now - tsNum) > driftMs) {
      throw new BadRequestException('Timestamp expired');
    }
    const key = this.config.get<string>('APP_KEY') || 'dev_app_key_change_me';
    const h = createHmac('sha256', key).update(String(tsNum)).digest('hex');
    if (h !== sig) {
      throw new BadRequestException('Invalid signature');
    }
  }

  @Mutation(() => UploadResponse, { name: 'uploadFile' })
  @UseGuards(GqlAuthGuard)
  async uploadFile(
    @Args({ name: 'uploadFileInput', type: () => UploadFileInput })
    file: UploadFileInput,
    @Context('req') req: Request,
  ): Promise<UploadResponse> {
    this.verifySignature(req);
    if (!this.ALLOWED_FILE_TYPE.has(file.mimeType)) {
      throw new BadRequestException('Unsupported file type');
    }
    let clean = (file.fileBase64 || '').trim();

    for (const p of this.PREFIXES) {
      if (p.test(clean)) {
        clean = clean.replace(p, '');
        break;
      }
    }
    let buffer: Buffer;
    try {
      buffer = Buffer.from(clean, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 data');
    }
    const MAX_SIZE = 20 * 1024 * 1024;
    if (buffer.length > MAX_SIZE) {
      throw new BadRequestException('File too large');
    }
    const folderNorm = (file.folder || 'uploads').trim();
    const original = `${Date.now()}-${randomUUID()}`;
    const sanitized = original.replace(/[^a-zA-Z0-9_.-]/g, '_');
    const key = `${randomUUID()}-${sanitized}`;
    const res = await this.s3.uploadFile({
      key,
      body: buffer,
      contentType: file.mimeType,
      path: folderNorm,
      metadata: { filename: original },
    });
    if (!res.success) {
      throw new BadRequestException(res.error || 'Upload failed');
    }

    return {
      key: res.key!,
      size: buffer.length,
      mimeType: file.mimeType,
      filename: original,
    };
  }

  @Mutation(() => [UploadResponse], { name: 'uploadFiles' })
  @UseGuards(GqlAuthGuard)
  async uploadFiles(
    @Args({ name: 'inputs', type: () => [UploadFileInput] })
    inputs: UploadFileInput[],
    @Context('req') req: Request,
  ): Promise<UploadResponse[]> {
    this.verifySignature(req);
    const results: UploadResponse[] = [];
    for (const file of inputs) {
      if (!this.ALLOWED_FILE_TYPE.has(file.mimeType)) {
        throw new BadRequestException('Unsupported file type');
      }
      let clean = (file.fileBase64 || '').trim();
      for (const p of this.PREFIXES) {
        if (p.test(clean)) {
          clean = clean.replace(p, '');
          break;
        }
      }
      let buffer: Buffer;
      try {
        buffer = Buffer.from(clean, 'base64');
      } catch {
        throw new BadRequestException('Invalid base64 data');
      }
      const MAX_SIZE = 20 * 1024 * 1024;
      if (buffer.length > MAX_SIZE) {
        throw new BadRequestException('File too large');
      }
      const folderNorm = (file.folder || 'uploads').trim();
      const original = `${Date.now()}-${randomUUID()}`;
      const sanitized = original.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const key = `${randomUUID()}-${sanitized}`;
      const res = await this.s3.uploadFile({
        key,
        body: buffer,
        contentType: file.mimeType,
        path: folderNorm,
        metadata: { filename: original },
      });
      if (!res.success) {
        throw new BadRequestException(res.error || 'Upload failed');
      }
      results.push({
        key: res.key!,
        size: buffer.length,
        mimeType: file.mimeType,
        filename: original,
      });
    }
    return results;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteFile(
    @Args('key', { type: () => String }) key: string,
  ): Promise<boolean> {
    const exists = await this.s3.objectExists(key);
    if (!exists) {
      throw new BadRequestException('File not found');
    }
    const res = await this.s3.deleteObject(key);
    if (!res.success) {
      throw new BadRequestException(res.error || 'Delete failed');
    }
    return true;
  }
}
