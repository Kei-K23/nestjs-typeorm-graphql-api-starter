import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Role } from './role.entity';
import { Permission } from './permission.entity';
import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('role_permissions')
export class RolePermission {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id: string;

  @Field(() => ID)
  @PrimaryColumn('uuid')
  roleId: string;

  @Field(() => ID)
  @PrimaryColumn('uuid')
  permissionId: string;

  @Field(() => Role)
  @ManyToOne(() => Role, (role) => role.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Field(() => Permission)
  @ManyToOne(() => Permission, (permission) => permission.rolePermissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission: Permission;

  @BeforeInsert()
  @BeforeUpdate()
  generateUUID() {
    if (!this.id) {
      this.id = uuidv4();
    }
  }
}
