import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GetUsersArgs } from './dto/get-users.args';
import { PaginatedUsers } from './response/paginated-user';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { Permissions } from 'src/auth/permissions.decorator';
import {
  PermissionModule,
  PermissionType,
} from 'src/role/entities/permission.entity';
import { PermissionsGuard } from 'src/auth/permissions.guard';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.USER,
    permission: PermissionType.CREATE,
  })
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return await this.userService.create(createUserInput);
  }

  @Query(() => PaginatedUsers, { name: 'getUsers' })
  async findAll(@Args() getUsersArgs: GetUsersArgs) {
    return await this.userService.findAll(getUsersArgs);
  }

  @Query(() => User, { name: 'getUserById' })
  async findOne(@Args('id', { type: () => String }) id: string) {
    return await this.userService.findOne(id);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.USER,
    permission: PermissionType.UPDATE,
  })
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.USER,
    permission: PermissionType.DELETE,
  })
  async removeUser(@Args('id', { type: () => String }) id: string) {
    return await this.userService.remove(id);
  }
}
