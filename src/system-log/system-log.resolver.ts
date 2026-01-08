import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SystemLogService } from './system-log.service';
import { SystemLog } from './entities/system-log.entity';
import { GetSystemLogsArgs } from './dto/get-system-logs.args';
import { PaginatedSystemLogs } from './response/paginated-system-log';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { Permissions } from 'src/auth/permissions.decorator';
import {
  PermissionModule,
  PermissionType,
} from 'src/role/entities/permission.entity';

@Resolver(() => SystemLog)
export class SystemLogResolver {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Query(() => PaginatedSystemLogs, { name: 'getSystemLogs' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.ACTIVITY_LOG,
    permission: PermissionType.READ,
  })
  findAll(@Args() args: GetSystemLogsArgs) {
    return this.systemLogService.findAll(args);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.ACTIVITY_LOG,
    permission: PermissionType.DELETE,
  })
  removeAllSystemLogs() {
    return this.systemLogService.removeAll();
  }
}
