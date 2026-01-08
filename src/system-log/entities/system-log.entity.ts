import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import {
  ObjectType,
  Field,
  Int,
  registerEnumType,
  GraphQLISODateTime,
} from '@nestjs/graphql';

export enum ActivityAction {
  LOGIN = 'login',
  LOGOUT = 'logout',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  CHANGE_PASSWORD = 'change_password',
  RESET_PASSWORD = 'reset_password',
  REFRESH_TOKEN = 'refresh_token',
}

registerEnumType(ActivityAction, { name: 'ActivityAction' });

export enum SystemLogType {
  ACTIVITY = 'activity',
  AUDIT = 'audit',
}

registerEnumType(SystemLogType, { name: 'SystemLogType' });

@Entity('system_logs')
@Index(['userId'])
@ObjectType()
export class SystemLog {
  @PrimaryGeneratedColumn()
  @Field(() => Int)
  id: number;

  @Column()
  @Field(() => String)
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Field(() => User)
  user: User;

  @Column({
    type: 'enum',
    enum: ActivityAction,
  })
  @Field(() => ActivityAction)
  action: ActivityAction;

  @Column({ type: 'text' })
  @Field(() => String)
  description: string;

  @Column({
    type: 'enum',
    enum: SystemLogType,
    default: SystemLogType.ACTIVITY,
  })
  @Field(() => SystemLogType)
  logType: SystemLogType;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  resourceType: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  resourceId: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  ipAddress: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  userAgent: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  device: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  browser: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  os: string;

  @Column({ nullable: true })
  @Field(() => String, { nullable: true })
  location: string;

  @Column({ type: 'json', nullable: true })
  @Field(() => String, { nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  @Field(() => GraphQLISODateTime)
  createdAt: Date;
}
