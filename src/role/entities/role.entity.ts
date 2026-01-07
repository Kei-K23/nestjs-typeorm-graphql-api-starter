import { ObjectType, Field, ID, GraphQLISODateTime } from '@nestjs/graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RolePermission } from './role-permission.entity';
import { User } from 'src/user/entities/user.entity';

@ObjectType()
@Entity({ name: 'roles' })
export class Role {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  title: string;

  @Field(() => String)
  @Column()
  description: string;

  @Field(() => [RolePermission], { nullable: true })
  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  rolePermissions: RolePermission[];

  @Field(() => [User], { nullable: true })
  @OneToMany(() => User, (user) => user.role)
  users: User[];

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  generateUUID() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
