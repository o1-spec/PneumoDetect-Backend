import { Module } from '@nestjs/common';
import { ResponseBuilder } from './builders/response.builder';
import { DateHelper } from './helpers/date.helper';
import { StringHelper } from './helpers/string.helper';
import { DataValidator } from './validators/data.validator';
import { ScanMapper } from './mappers/scan.mapper';
import { UserMapper } from './mappers/user.mapper';

@Module({
  providers: [
    ResponseBuilder,
    DateHelper,
    StringHelper,
    DataValidator,
    ScanMapper,
    UserMapper,
  ],
  exports: [
    ResponseBuilder,
    DateHelper,
    StringHelper,
    DataValidator,
    ScanMapper,
    UserMapper,
  ],
})
export class CommonModule {}
