import { Injectable } from '@nestjs/common';
import { CreateSystemLogInput } from './dto/create-system-log.input';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemLog } from './entities/system-log.entity';
import {
  GetSystemLogsArgs,
  SystemLogOrderBy,
} from './dto/get-system-logs.args';

@Injectable()
export class SystemLogService {
  constructor(
    @InjectRepository(SystemLog)
    private readonly logsRepo: Repository<SystemLog>,
  ) {}

  async create(createSystemLogInput: CreateSystemLogInput) {
    const metaStr = createSystemLogInput.metadata;
    let metadataObj: Record<string, unknown> | undefined;
    if (metaStr && metaStr.length > 0) {
      try {
        const parsed = JSON.parse(metaStr) as unknown;
        if (typeof parsed === 'object' && parsed !== null) {
          metadataObj = parsed as Record<string, unknown>;
        }
      } catch {
        metadataObj = undefined;
      }
    }
    const entity = this.logsRepo.create({
      ...createSystemLogInput,
      metadata: metadataObj as Record<string, any> | undefined,
    });
    return await this.logsRepo.save(entity);
  }

  async findAll(args: GetSystemLogsArgs) {
    const {
      search,
      limit = 20,
      offset = 0,
      orderDirection,
      orderBy = SystemLogOrderBy.CREATED_AT,
      userId,
      action,
      logType,
      startDate,
      endDate,
    } = args;

    const qb = this.logsRepo
      .createQueryBuilder('log')
      .leftJoinAndSelect('log.user', 'user')
      .skip(offset)
      .take(limit);

    if (search) {
      qb.where(
        '(log.description LIKE :search OR log.resourceType LIKE :search OR log.resourceId LIKE :search OR user.fullName LIKE :search OR user.email LIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (userId) {
      qb.andWhere('log.userId = :userId', { userId });
    }
    if (action) {
      qb.andWhere('log.action = :action', { action });
    }
    if (logType) {
      qb.andWhere('log.logType = :logType', { logType });
    }
    if (startDate) {
      qb.andWhere('log.createdAt >= :startDate', { startDate });
    }
    if (endDate) {
      qb.andWhere('log.createdAt <= :endDate', { endDate });
    }

    if (orderBy) {
      qb.orderBy(`log.${orderBy}`, orderDirection ?? 'DESC');
    }

    const [items, total] = await qb.getManyAndCount();
    const sanitized = items.map((log) => {
      let meta: string | undefined;
      if (
        typeof (log as unknown as { metadata?: unknown }).metadata === 'string'
      ) {
        meta = (log as unknown as { metadata?: string }).metadata ?? undefined;
      } else {
        const raw = (log as unknown as { metadata?: unknown }).metadata;
        try {
          meta =
            raw !== undefined && raw !== null
              ? JSON.stringify(raw as Record<string, unknown>)
              : undefined;
        } catch {
          meta = undefined;
        }
      }
      return {
        ...log,
        metadata: meta as unknown as Record<string, any>,
      } as unknown as SystemLog;
    });
    return { items: sanitized, total, limit, offset };
  }

  async removeAll() {
    await this.logsRepo.createQueryBuilder().delete().from(SystemLog).execute();
    return true;
  }
}
