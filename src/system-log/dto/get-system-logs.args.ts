import { ArgsType, Field, registerEnumType } from '@nestjs/graphql';
import { DefaultFilterDto } from 'src/common/dto/default-filter.dto';
import { ActivityAction, SystemLogType } from '../entities/system-log.entity';

export enum SystemLogOrderBy {
  CREATED_AT = 'createdAt',
}

registerEnumType(SystemLogOrderBy, { name: 'SystemLogOrderBy' });

@ArgsType()
export class GetSystemLogsArgs extends DefaultFilterDto {
  @Field(() => String, { nullable: true })
  userId?: string;

  @Field(() => ActivityAction, { nullable: true })
  action?: ActivityAction;

  @Field(() => SystemLogType, { nullable: true })
  logType?: SystemLogType;

  @Field(() => String, { nullable: true })
  startDate?: string;

  @Field(() => String, { nullable: true })
  endDate?: string;

  @Field(() => SystemLogOrderBy, { nullable: true })
  orderBy?: SystemLogOrderBy;
}
