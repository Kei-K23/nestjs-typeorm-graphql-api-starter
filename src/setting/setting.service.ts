import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Setting } from './entities/setting.entity';
import { CreateSMTPSettingDto } from './dto/create-smtp-setting.dto';
import { SMTPResponseDto } from './dto/smtp-response.dto';

@Injectable()
export class SettingService {
  constructor(
    @InjectRepository(Setting)
    private readonly settingsRepo: Repository<Setting>,
  ) {}

  async createSMTPSettings(
    dto: CreateSMTPSettingDto,
  ): Promise<SMTPResponseDto> {
    const records = [
      { key: 'smtpHost', value: dto.smtpHost },
      { key: 'smtpPort', value: String(dto.smtpPort) },
      { key: 'smtpSecure', value: String(dto.smtpSecure) },
      { key: 'smtpUsername', value: dto.smtpUsername ?? '' },
      { key: 'smtpPassword', value: dto.smtpPassword ?? '' },
      { key: 'smtpFromEmail', value: dto.smtpFromEmail },
      { key: 'smtpFromName', value: dto.smtpFromName },
      { key: 'smtpEnabled', value: String(dto.smtpEnabled) },
    ].map(({ key, value }) => this.settingsRepo.create({ key, value }));

    await this.settingsRepo.upsert(records, ['key']);
    return await this.getSMTPSettings();
  }

  async getSMTPSettings(): Promise<SMTPResponseDto> {
    const keys = [
      'smtpHost',
      'smtpPort',
      'smtpSecure',
      'smtpUsername',
      'smtpPassword',
      'smtpFromEmail',
      'smtpFromName',
      'smtpEnabled',
    ];
    const rows = await this.settingsRepo.find({
      where: { key: In(keys) },
    });
    const map = new Map(rows.map((r) => [r.key, r.value]));

    const smtpHost = map.get('smtpHost') ?? '';
    const smtpPortStr = map.get('smtpPort');
    const smtpSecureStr = map.get('smtpSecure');
    const smtpEnabledStr = map.get('smtpEnabled');

    const resp: SMTPResponseDto = {
      smtpHost,
      smtpPort: smtpPortStr ? parseInt(smtpPortStr) : 0,
      smtpSecure: smtpSecureStr === 'true',
      smtpUsername: map.get('smtpUsername') || undefined,
      smtpPassword: undefined,
      smtpFromEmail: map.get('smtpFromEmail') ?? '',
      smtpFromName: map.get('smtpFromName') ?? '',
      smtpEnabled: smtpEnabledStr === 'true',
    };
    return resp;
  }
}
