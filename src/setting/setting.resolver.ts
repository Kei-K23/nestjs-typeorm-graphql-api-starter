import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { SettingService } from './setting.service';
import { CreateSMTPSettingDto } from './dto/create-smtp-setting.dto';
import { SMTPResponseDto } from './dto/smtp-response.dto';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from 'src/auth/gql-auth.guard';
import { Permissions } from 'src/auth/permissions.decorator';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import {
  PermissionModule,
  PermissionType,
} from 'src/role/entities/permission.entity';

@Resolver()
export class SettingResolver {
  constructor(private readonly settingService: SettingService) {}

  @Mutation(() => SMTPResponseDto)
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.SETTING,
    permission: PermissionType.UPDATE,
  })
  async createSMTPSettings(
    @Args('createSMTPSettingInput')
    createSMTPSettingInput: CreateSMTPSettingDto,
  ): Promise<SMTPResponseDto> {
    return await this.settingService.createSMTPSettings(createSMTPSettingInput);
  }

  @Query(() => SMTPResponseDto, { name: 'getSMTPSettings' })
  @UseGuards(GqlAuthGuard, PermissionsGuard)
  @Permissions({
    module: PermissionModule.SETTING,
    permission: PermissionType.READ,
  })
  async getSMTPSettings(): Promise<SMTPResponseDto> {
    return await this.settingService.getSMTPSettings();
  }
}
