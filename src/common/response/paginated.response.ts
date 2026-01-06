import { Type } from '@nestjs/common';
import { Field, Int, ObjectType } from '@nestjs/graphql';

export function PaginatedResponse<T>(classRef: Type<T>) {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType {
    @Field(() => [classRef])
    items: T[];

    @Field(() => Int)
    total: number;

    @Field(() => Int)
    limit: number;

    @Field(() => Int)
    offset: number;
  }

  return PaginatedType;
}
