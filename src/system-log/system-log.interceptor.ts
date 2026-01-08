import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  SetMetadata,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ActivityAction } from './entities/system-log.entity';
import { SystemLogService } from './system-log.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { JwtService } from '@nestjs/jwt';

export const SYSTEM_LOG = 'systemLog';

export interface SystemLogOptions {
  action: ActivityAction;
  description: string;
  resourceType?: string;
  getResourceId?: (
    result: unknown,
    args: Record<string, unknown>,
  ) => string | undefined;
}

export const SystemLogMeta = (options: SystemLogOptions) =>
  SetMetadata(SYSTEM_LOG, options);

type RequestWithUser = Request & {
  user?: { id: string; roleId?: string; role?: { id: string } };
};

function parseUserAgent(req: RequestWithUser) {
  const ua = (req.headers['user-agent'] as string) || '';
  const device = ua.includes('Mobile') ? 'Mobile' : 'Desktop';
  let browser = 'Unknown';
  if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  return { device, browser, os };
}

@Injectable()
export class SystemLogInterceptor implements NestInterceptor {
  constructor(
    private readonly systemLogService: SystemLogService,
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const logOptions = this.reflector.get<SystemLogOptions>(
      SYSTEM_LOG,
      context.getHandler(),
    );

    if (!logOptions) {
      return next.handle();
    }

    const gqlCtx = GqlExecutionContext.create(context);
    const req = gqlCtx.getContext<{ req: RequestWithUser }>().req;
    const user = req?.user;

    return next.handle().pipe(
      tap((result) => {
        try {
          const rawArgsUnknown: unknown = gqlCtx.getArgs();
          const args: Record<string, unknown> =
            typeof rawArgsUnknown === 'object' && rawArgsUnknown !== null
              ? (rawArgsUnknown as Record<string, unknown>)
              : {};
          const resourceId = logOptions.getResourceId
            ? logOptions.getResourceId(result as unknown, args)
            : (args?.id as string | undefined);

          let userId = user?.id;
          if (!userId) {
            const auth = req?.headers?.authorization || '';
            const token = auth.startsWith('Bearer ')
              ? auth.slice(7)
              : undefined;
            if (token) {
              try {
                const payload: { sub?: unknown } =
                  this.jwtService.verify(token);
                if (typeof payload.sub === 'string') {
                  userId = payload.sub;
                }
              } catch {
                void 0;
              }
            }
          }
          if (!userId) {
            const resultUserUnknown = (result as unknown as { user?: unknown })
              ?.user;
            if (
              typeof resultUserUnknown === 'object' &&
              resultUserUnknown !== null &&
              typeof (resultUserUnknown as { id?: unknown }).id === 'string'
            ) {
              userId = (resultUserUnknown as { id: string }).id;
            }
          }
          if (!userId) {
            const argsUserIdUnknown = args?.['userId'];
            if (typeof argsUserIdUnknown === 'string') {
              userId = argsUserIdUnknown;
            }
          }
          if (!userId) {
            return;
          }

          const { device, browser, os } = parseUserAgent(req);
          const handler = context.getHandler();
          const operation =
            typeof handler?.name === 'string' ? handler.name : '';

          void this.systemLogService
            .create({
              userId,
              action: logOptions.action,
              description: logOptions.description,
              resourceType: logOptions.resourceType,
              resourceId,
              ipAddress: this.getClientIp(req),
              userAgent: (req?.headers?.['user-agent'] as string) || '',
              device,
              browser,
              os,
              metadata: JSON.stringify({
                method: 'POST',
                url: '/graphql',
                operation,
                variables: Object.fromEntries(Object.entries(args)),
              }),
            })
            .catch((error) => {
              console.error('Failed to log activity:', error);
            });
        } catch (error) {
          console.error('Failed to log activity:', error);
        }
      }),
    );
  }

  private getClientIp(request: RequestWithUser): string {
    const expressRequest = request as unknown as {
      connection?: { remoteAddress?: string };
      socket?: { remoteAddress?: string };
      ip?: string;
    };
    return (
      (request.headers['x-forwarded-for'] as string) ||
      (request.headers['x-real-ip'] as string) ||
      expressRequest.connection?.remoteAddress ||
      expressRequest.socket?.remoteAddress ||
      expressRequest.ip ||
      'unknown'
    );
  }
}
