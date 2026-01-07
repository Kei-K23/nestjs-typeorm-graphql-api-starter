import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Role } from './entities/role.entity';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { RolePermission } from './entities/role-permission.entity';

@Injectable()
export class RoleService {
  private readonly logger = new Logger(RoleService.name);
  constructor(
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async findAll(): Promise<Role[]> {
    return await this.rolesRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['users', 'rolePermissions', 'rolePermissions.permission'],
    });
  }

  async findOne(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: ['users', 'rolePermissions', 'rolePermissions.permission'],
    });

    if (!role) {
      throw new NotFoundException(`Role not found with id ${id}`);
    }

    return role;
  }

  async create(createRoleInput: CreateRoleInput): Promise<Role | null> {
    const existingRole = await this.rolesRepository.findOne({
      where: { title: createRoleInput.title },
    });
    if (existingRole) {
      throw new ConflictException(
        `Role with title '${createRoleInput.title}' already exists`,
      );
    }

    await this.validatePermissionIds(createRoleInput.permissionIds);

    return await this.dataSource.transaction(async (manager) => {
      const role = manager.create(Role, {
        title: createRoleInput.title,
        description: createRoleInput.description,
      });
      const savedRole = await manager.save(role);

      if (createRoleInput.permissionIds?.length) {
        await this.assignPermissionsToRole(
          savedRole.id,
          createRoleInput.permissionIds,
          manager,
        );
      }

      this.logger.log(`Role created with ID: ${savedRole.id}`);
      return await manager.findOne(Role, {
        where: { id: savedRole.id },
        relations: ['rolePermissions', 'rolePermissions.permission', 'users'],
      });
    });
  }

  async update(updateRoleInput: UpdateRoleInput): Promise<Role | null> {
    const role = await this.findOne(updateRoleInput.id);
    if (!role) {
      return null;
    }
    if (updateRoleInput.title && updateRoleInput.title !== role.title) {
      const existingRole = await this.rolesRepository.findOne({
        where: { title: updateRoleInput.title },
      });
      if (existingRole) {
        throw new ConflictException(
          `Role with title '${updateRoleInput.title}' already exists`,
        );
      }
    }
    if (updateRoleInput.permissionIds) {
      await this.validatePermissionIds(updateRoleInput.permissionIds);
    }

    return await this.dataSource.transaction(async (manager) => {
      if (updateRoleInput.title || updateRoleInput.description) {
        await manager.update(Role, updateRoleInput.id, {
          title: updateRoleInput.title,
          description: updateRoleInput.description,
        });
      }
      if (updateRoleInput.permissionIds !== undefined) {
        await manager.delete(RolePermission, { roleId: updateRoleInput.id });
        if (updateRoleInput.permissionIds.length > 0) {
          await this.assignPermissionsToRole(
            updateRoleInput.id,
            updateRoleInput.permissionIds,
            manager,
          );
        }
      }
      this.logger.log(`Role updated with ID: ${updateRoleInput.id}`);
      return await manager.findOne(Role, {
        where: { id: updateRoleInput.id },
        relations: ['rolePermissions', 'rolePermissions.permission', 'users'],
      });
    });
  }

  async remove(id: string): Promise<boolean> {
    const role = await this.findOne(id);
    if (!role) {
      return false;
    }
    if (role.users && role.users.length > 0) {
      throw new ConflictException(
        'Cannot delete role that has users assigned to it',
      );
    }
    await this.rolesRepository.delete(id);
    this.logger.log(`Role with ID '${id}' has been successfully deleted`);
    return true;
  }

  async listPermissions(): Promise<Permission[]> {
    return await this.permissionsRepository.find();
  }

  private async validatePermissionIds(permissionIds?: string[]): Promise<void> {
    if (!permissionIds || permissionIds.length === 0) {
      return;
    }
    const existingPermissions = await this.permissionsRepository.findBy({
      id: In(permissionIds),
    });
    if (existingPermissions.length !== permissionIds.length) {
      const existingIds = existingPermissions.map((p) => p.id);
      const invalidIds = permissionIds.filter(
        (id) => !existingIds.includes(id),
      );
      throw new BadRequestException(
        `Invalid permission IDs: ${invalidIds.join(', ')}`,
      );
    }
  }

  private async assignPermissionsToRole(
    roleId: string,
    permissionIds: string[],
    manager: EntityManager,
  ): Promise<void> {
    const rolePermissions = permissionIds.map((permissionId) =>
      manager.create(RolePermission, {
        roleId,
        permissionId,
      }),
    );
    await manager.save(RolePermission, rolePermissions);
  }
}
