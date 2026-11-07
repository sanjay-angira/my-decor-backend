import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../entities/productCategory/category.entity';
import { Offer } from '../entities/product/offer.entity';
import { BannerController } from './banner.controller';
import { BannerService } from './banner.service';

@Module({
  imports: [TypeOrmModule.forFeature([Offer, Category])],
  controllers: [BannerController],
  providers: [BannerService],
})
export class BannerModule {}
