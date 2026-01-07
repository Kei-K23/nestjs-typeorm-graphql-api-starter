import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { RoleService } from './role.service';
import { Role } from './entities/role.entity';
import { CreateRoleInput } from './dto/create-role.input';
import { UpdateRoleInput } from './dto/update-role.input';
import { Permission } from './entities/permission.entity';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';

@Resolver(() => Role)
export class RoleResolver {
  constructor(private readonly roleService: RoleService) {}

  @Mutation(() => Role)
  @UseGuards(GqlAuthGuard)
  createRole(@Args('createRoleInput') createRoleInput: CreateRoleInput) {
    return this.roleService.create(createRoleInput);
  }

  @Query(() => [Role], { name: 'getAllRoles' })
  findAll() {
    return this.roleService.findAll();
  }

  @Query(() => Role, { name: 'getRoleById' })
  findOne(@Args('id', { type: () => String }) id: string) {
    return this.roleService.findOne(id);
  }

  @Mutation(() => Role)
  @UseGuards(GqlAuthGuard)
  updateRole(@Args('updateRoleInput') updateRoleInput: UpdateRoleInput) {
    return this.roleService.update(updateRoleInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  removeRole(@Args('id', { type: () => String }) id: string) {
    return this.roleService.remove(id);
  }

  @Query(() => [Permission], { name: 'getAllPermissions' })
  listPermissions() {
    return this.roleService.listPermissions();
  }
}
