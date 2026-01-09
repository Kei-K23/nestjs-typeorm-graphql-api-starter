import { Module } from '@nestjs/common';
import { UploadResolver } from './upload.resolver';
import { S3ClientUtils } from 'src/common/utils/s3-client.utils';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule],
  providers: [UploadResolver, S3ClientUtils],
})
export class UploadModule {}
