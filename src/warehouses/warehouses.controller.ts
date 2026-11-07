import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsBoolean } from 'class-validator';
import { CreateWarehouseDto, UpdateWarehouseDto } from 'src/dto/warehouse.dto';
import { WarehousesService } from './warehouses.service';
import { AdminApi } from 'src/commonServices/admin-api.decorator';

class WarehouseStatusDto {
  @IsBoolean()
  isActive!: boolean;
}

@Controller('admin')
@AdminApi()
export class WarehousesController {
  constructor(private readonly warehousesService: WarehousesService) {}

  @Post('warehouses')
  create(@Body() dto: CreateWarehouseDto) {
    return this.warehousesService.create(dto);
  }

  @Get('warehouses')
  findAll(
    @Query('registeredOnly') registeredOnly?: string,
    @Query('pageNumber') pageNumber?: string,
    @Query('pageSize') pageSize?: string,
    @Query('search') search?: string,
    @Query('column') column?: string,
    @Query('order') order?: string,
  ) {
    return this.warehousesService.findAll({
      registeredOnly: registeredOnly === 'true',
      pageNumber,
      pageSize,
      search,
      column,
      order,
    });
  }

  @Get('warehouses/:id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.findOne(id);
  }

  @Patch('warehouses/:id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehousesService.update(id, dto);
  }

  @Patch('warehouses/:id/default')
  setDefault(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.setDefault(id);
  }

  @Patch('warehouses/:id/status')
  setStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: WarehouseStatusDto,
  ) {
    return this.warehousesService.setStatus(id, dto.isActive === true);
  }

  @Post('warehouses/:id/sync-delhivery')
  retryRegistration(@Param('id', ParseIntPipe) id: number) {
    return this.warehousesService.retryRegistration(id);
  }
}
