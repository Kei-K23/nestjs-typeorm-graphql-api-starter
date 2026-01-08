import { ObjectType } from '@nestjs/graphql';
import { PaginatedResponse } from 'src/common/response/paginated.response';
import { SystemLog } from '../entities/system-log.entity';

@ObjectType()
export class PaginatedSystemLogs extends PaginatedResponse(SystemLog) {}
