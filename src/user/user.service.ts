import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { GetUsersArgs, UserOrderBy } from './dto/get-users.args';
import { SortDirection } from 'src/common/dto/default-filter.dto';
import { AuthService } from 'src/auth/auth.service';
import { Role } from 'src/role/entities/role.entity';
import { S3ClientUtils } from 'src/common/utils/s3-client.utils';

@Injectable()
export class UserService {
  constructor(
    private authService: AuthService,
    private s3ClientUtils: S3ClientUtils,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
  ) {}

  async create(createUserInput: CreateUserInput) {
    // Check if roleId exists
    const role = await this.rolesRepository.findOne({
      select: { id: true },
      where: { id: createUserInput.roleId },
    });
    if (!role) {
      throw new NotFoundException(
        `Role not found with id ${createUserInput.roleId}`,
      );
    }

    // Hash password
    createUserInput.password = await this.authService.passwordHash(
      createUserInput.password,
    );

    const user = this.usersRepository.create(createUserInput);
    return await this.usersRepository.save(user);
  }

  async findAll(args: GetUsersArgs) {
    const {
      search,
      isActive,
      limit,
      offset,
      orderBy = UserOrderBy.CREATED_AT,
      orderDirection = SortDirection.DESC,
      roleId,
    } = args;

    const qb = this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.role', 'role')
      .skip(offset)
      .take(limit);

    if (search) {
      qb.where('user.fullName LIKE :search OR user.email LIKE :search', {
        search: `%${search}%`,
      });
    }

    if (isActive !== undefined) {
      qb.andWhere('user.isActive = :isActive', { isActive });
    }

    if (roleId) {
      qb.andWhere('user.roleId = :roleId', { roleId });
    }

    qb.orderBy(`user.${orderBy}`, orderDirection);

    const [users, total] = await qb.getManyAndCount();

    await Promise.all(
      users.map(async (user) => {
        user.profilePictureUrl = user?.profilePictureUrl
          ? (await this.s3ClientUtils.generatePresignedUrl(
              user?.profilePictureUrl || '',
            )) || ''
          : '';
      }),
    );

    return {
      items: users,
      total,
      limit,
      offset,
    };
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['role'],
    });

    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }

    user.profilePictureUrl = user?.profilePictureUrl
      ? (await this.s3ClientUtils.generatePresignedUrl(
          user?.profilePictureUrl || '',
        )) || ''
      : '';

    return user;
  }

  async update(id: string, updateUserInput: UpdateUserInput) {
    // Check if user exists
    const user = await this.usersRepository.findOne({
      select: { id: true },
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }

    // Check if roleId exists
    if (updateUserInput.roleId) {
      const role = await this.rolesRepository.findOne({
        where: { id: updateUserInput.roleId },
      });

      if (!role) {
        throw new NotFoundException(
          `Role not found with id ${updateUserInput.roleId}`,
        );
      }
    }

    // Hash password if it's provided
    if (updateUserInput.password) {
      updateUserInput.password = await this.authService.passwordHash(
        updateUserInput.password,
      );
    }

    const updatedUser = await this.usersRepository.preload({
      ...updateUserInput,
    });

    if (!updatedUser) {
      throw new NotFoundException(`User not found with id ${id}`);
    }

    return updatedUser;
  }

  async remove(id: string) {
    // Check if user exists
    const user = await this.usersRepository.findOne({
      select: { id: true },
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(`User not found with id ${id}`);
    }
    return await this.usersRepository.delete(id);
  }
}
