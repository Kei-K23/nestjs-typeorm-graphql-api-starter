import {
  ObjectType,
  Field,
  ID,
  GraphQLISODateTime,
  HideField,
} from '@nestjs/graphql';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from 'src/role/entities/role.entity';
import { v4 as uuidv4 } from 'uuid';

@ObjectType()
@Entity({ name: 'users' })
@Index(['email'], { unique: true })
@Index(['fullName'])
export class User {
  @Field(() => ID)
  @PrimaryColumn('uuid')
  id: string;

  @Field(() => String)
  @Column()
  fullName: string;

  @Field(() => String)
  @Column()
  email: string;

  @Field(() => String, { nullable: true })
  @Column({ nullable: true })
  profilePictureUrl: string;

  @HideField()
  @Column()
  password: string;

  @Field(() => Boolean)
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Field(() => Role)
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @HideField()
  @Column({ type: 'uuid' })
  roleId: string;

  @HideField()
  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash?: string | null;

  @HideField()
  @Column({ type: 'varchar', nullable: true })
  passwordResetTokenHash?: string | null;

  @HideField()
  @Column({ type: 'datetime', nullable: true })
  passwordResetExpiresAt?: Date | null;

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
