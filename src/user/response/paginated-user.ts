import { ObjectType } from '@nestjs/graphql';
import { PaginatedResponse } from 'src/common/response/paginated.response';
import { User } from '../entities/user.entity';

@ObjectType()
export class PaginatedUsers extends PaginatedResponse(User) {}
