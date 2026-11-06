import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { OffersService } from './offers.service';
import {
  CreateOfferDto,
  UpdateOfferDto,
  OfferResponseDto,
} from '../dto/offer.dto';
import { PaginationDto } from '../dto/common.dto';
import { AdminApi } from '../commonServices/admin-api.decorator';

@ApiTags('Offers')
@AdminApi()
@Controller('offers')
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new offer' })
  @ApiBody({
    type: CreateOfferDto,
    examples: {
      percentage: {
        summary: 'Percentage discount example',
        value: {
          offerName: 'Summer Sale',
          desktopImage: 'https://cdn.example.com/offers/summer-sale-desktop.webp',
          tabletImage: 'https://cdn.example.com/offers/summer-sale-tablet.webp',
          mobileImage: 'https://cdn.example.com/offers/summer-sale-mobile.webp',
          discountType: 'percentage',
          discountValue: 25.5,
          startDate: '2023-06-01T00:00:00.000Z',
          endDate: '2023-08-31T23:59:59.000Z',
          isActive: true,
          timeBased: true,
        },
      },
      fixed: {
        summary: 'Fixed amount discount example',
        value: {
          offerName: 'Holiday Discount',
          desktopImage: 'https://cdn.example.com/offers/holiday-discount-desktop.webp',
          tabletImage: 'https://cdn.example.com/offers/holiday-discount-tablet.webp',
          mobileImage: 'https://cdn.example.com/offers/holiday-discount-mobile.webp',
          discountType: 'fixed',
          discountValue: 50.0,
          startDate: '2023-12-01T00:00:00.000Z',
          endDate: '2023-12-31T23:59:59.000Z',
          isActive: true,
          timeBased: true,
        },
      },
    },
  })
  async create(@Body() createOfferDto: CreateOfferDto) {
    return await this.offersService.create(createOfferDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all offers' })
  @ApiQuery({ name: 'pageNumber', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'column', required: false, type: String })
  @ApiQuery({ name: 'order', required: false, type: String })
  async findAll(@Query() paginationDto: PaginationDto) {
    return await this.offersService.findAll(paginationDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get offer by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.offersService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update offer by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  @ApiBody({
    type: UpdateOfferDto,
    examples: {
      update: {
        summary: 'Update offer example',
        value: {
          offerName: 'Updated Summer Sale',
          desktopImage: 'https://cdn.example.com/offers/updated-summer-sale-desktop.webp',
          tabletImage: 'https://cdn.example.com/offers/updated-summer-sale-tablet.webp',
          mobileImage: 'https://cdn.example.com/offers/updated-summer-sale-mobile.webp',
          discountType: 'percentage',
          discountValue: 30.0,
          startDate: '2023-06-01T00:00:00.000Z',
          endDate: '2023-09-30T23:59:59.000Z',
          isActive: true,
        },
      },
    },
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateOfferDto: UpdateOfferDto,
  ) {
    return await this.offersService.update(id, updateOfferDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete offer by ID' })
  @ApiParam({ name: 'id', required: true, type: Number })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.offersService.remove(id);
  }
}
