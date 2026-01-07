import { SetMetadata } from '@nestjs/common';
import {
  PermissionType,
  PermissionModule,
} from 'src/role/entities/permission.entity';

export const PERMISSIONS_KEY = 'permissions';
export type PermissionRequirement = {
  module: PermissionModule;
  permission: PermissionType;
};
export const Permissions = (
  ...requirements: Array<PermissionRequirement | string>
) => SetMetadata(PERMISSIONS_KEY, requirements);
