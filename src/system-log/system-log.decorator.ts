import { SetMetadata } from '@nestjs/common';
import { SYSTEM_LOG, SystemLogOptions } from './system-log.interceptor';

export const SystemLog = (options: SystemLogOptions) =>
  SetMetadata(SYSTEM_LOG, options);
