import { Field, Int, ArgsType, registerEnumType } from '@nestjs/graphql';

export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC',
}

registerEnumType(SortDirection, { name: 'SortDirection' });

@ArgsType()
export class DefaultFilterDto {
  @Field(() => String, { nullable: true })
  search?: string;

  @Field(() => Int, { nullable: true, defaultValue: 20 })
  limit?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  offset?: number;

  @Field(() => SortDirection, { nullable: true })
  orderDirection?: SortDirection;
}
