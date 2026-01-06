import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { GetUsersArgs } from './dto/get-users.args';
import { PaginatedUsers } from './response/paginated-user';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Mutation(() => User)
  async createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return await this.userService.create(createUserInput);
  }

  @Query(() => PaginatedUsers, { name: 'getUsers' })
  async findAll(@Args() getUsersArgs: GetUsersArgs) {
    return await this.userService.findAll(getUsersArgs);
  }

  @Query(() => User, { name: 'getUserById' })
  async findOne(@Args('id', { type: () => Int }) id: number) {
    return await this.userService.findOne(id);
  }

  @Mutation(() => User)
  async updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return await this.userService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  async removeUser(@Args('id', { type: () => Int }) id: number) {
    return await this.userService.remove(id);
  }
}
