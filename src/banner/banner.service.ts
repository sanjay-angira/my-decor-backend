import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/productCategory/category.entity';
import { Offer } from '../entities/product/offer.entity';
import { successResponse } from 'src/commonServices/response.service';

export type BannerSource = 'offer' | 'category';

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async findAll() {
    const [offers, categories] = await Promise.all([
      this.offerRepository.find({ order: { id: 'ASC' } }),
      this.categoryRepository.find({ order: { id: 'ASC' } }),
    ]);
    const rows = [
      ...offers.map((offer) => ({
        key: `offer-${offer.id}`,
        source: 'offer' as const,
        sourceId: offer.id,
        name: offer.offerName || offer.offerSlug || `Offer ${offer.id}`,
        desktopImage: offer.desktopImage || null,
        tabletImage: offer.tabletImage || null,
        mobileImage: offer.mobileImage || null,
        useAsBanner: offer.useAsHeroBanner,
      })),
      ...categories.map((category) => ({
        key: `category-${category.id}`,
        source: 'category' as const,
        sourceId: category.id,
        name: category.categoryName || `Category ${category.id}`,
        desktopImage: category.desktopBanner || category.image || null,
        tabletImage: category.tabletBanner || null,
        mobileImage: category.mobileBanner || null,
        useAsBanner: category.useAsHeroBanner,
      })),
    ].sort((a, b) => a.name.localeCompare(b.name));

    return successResponse(rows, 'Banner sources retrieved successfully');
  }

  async setUseAsBanner(source: string, id: number, useAsBanner: boolean) {
    if (typeof useAsBanner !== 'boolean') {
      throw new BadRequestException('useAsBanner must be a boolean');
    }

    if (source === 'offer') {
      const offer = await this.offerRepository.findOne({ where: { id } });
      if (!offer) throw new NotFoundException('Offer not found');
      offer.useAsHeroBanner = useAsBanner;
      await this.offerRepository.save(offer);
    } else if (source === 'category') {
      const category = await this.categoryRepository.findOne({ where: { id } });
      if (!category) throw new NotFoundException('Category not found');
      category.useAsHeroBanner = useAsBanner;
      await this.categoryRepository.save(category);
    } else {
      throw new BadRequestException('Source must be offer or category');
    }

    return successResponse(
      { source, id, useAsBanner },
      'Banner selection updated successfully',
    );
  }
}
