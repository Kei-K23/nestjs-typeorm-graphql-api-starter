import { Injectable } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { GetUsersArgs, UserOrderBy } from './dto/get-users.args';
import { SortDirection } from 'src/common/dto/default-filter.dto';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserInput: CreateUserInput) {
    // Hash password
    createUserInput.password = await this.authService.passwordHash(
      createUserInput.password,
    );

    return await this.usersRepository.save(createUserInput);
  }

  async findAll(args: GetUsersArgs) {
    const {
      search,
      isActive,
      limit,
      offset,
      orderBy = UserOrderBy.CREATED_AT,
      orderDirection = SortDirection.DESC,
    } = args;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .skip(offset)
      .take(limit);

    if (search) {
      qb.where('user.fullName LIKE :search OR user.email LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (isActive !== undefined) {
      qb.where('user.isActive = :isActive', { isActive });
    }

    qb.orderBy(`user.${orderBy}`, orderDirection);

    const [users, total] = await qb.getManyAndCount();

    return {
      items: users,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: number) {
    return await this.usersRepository.findOne({ where: { id } });
  }

  async update(id: number, updateUserInput: UpdateUserInput) {
    // Hash password if it's provided
    if (updateUserInput.password) {
      updateUserInput.password = await this.authService.passwordHash(
        updateUserInput.password,
      );
    }

    return await this.usersRepository.update(id, updateUserInput);
  }

  async remove(id: number) {
    return await this.usersRepository.delete(id);
  }
}
