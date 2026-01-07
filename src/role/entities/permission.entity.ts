import {
  Entity,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryColumn,
  BeforeInsert,
  BeforeUpdate,
  Unique,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RolePermission } from './role-permission.entity';
import {
  Field,
  GraphQLISODateTime,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';

export enum PermissionType {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
}

registerEnumType(PermissionType, { name: 'PermissionType' });

export enum PermissionModule {
  USERS = 'Users',
  ROLES = 'Roles',
  ACTIVITY_LOGS = 'Activity Logs',
  SETTINGS = 'Settings',
}

@Entity('permissions')
@ObjectType()
@Unique(['module', 'permission'])
export class Permission {
  @PrimaryColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  module: string;

  @Field(() => PermissionType)
  @Column({ type: 'varchar' })
  permission: PermissionType;

  @Field(() => [RolePermission], { nullable: true })
  @OneToMany(
    () => RolePermission,
    (rolePermission) => rolePermission.permission,
  )
  rolePermissions: RolePermission[];

  @Field(() => GraphQLISODateTime)
  @CreateDateColumn()
  createdAt: Date;

  @Field(() => GraphQLISODateTime)
  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  generateUUID() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
