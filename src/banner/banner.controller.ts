import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';

import { BannerService } from './banner.service';
import { ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { AdminApi } from '../commonServices/admin-api.decorator';

@AdminApi()
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  @ApiOperation({ summary: 'List offer and category banner sources' })
  findAll() {
    return this.bannerService.findAll();
  }

  @Patch(':source/:id')
  @ApiOperation({ summary: 'Toggle a category or offer as a banner' })
  @ApiParam({
    name: 'source',
    required: true,
    enum: ['offer', 'category'],
  })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    schema: { properties: { useAsBanner: { type: 'boolean' } } },
  })
  setUseAsBanner(
    @Param('source') source: string,
    @Param('id', ParseIntPipe) id: number,
    @Body('useAsBanner') useAsBanner: boolean,
  ) {
    return this.bannerService.setUseAsBanner(source, id, useAsBanner);
  }
}
