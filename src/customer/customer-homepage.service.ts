import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/commonServices/response.service';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { Offer } from 'src/entities/product/offer.entity';
import { Room } from 'src/entities/product/room.entity';

@Injectable()
export class CustomerHomepageService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(Offer)
    private readonly offerRepository: Repository<Offer>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
  ) {}

  async getFeaturedCategories() {
    const products = await this.productRepository
      .createQueryBuilder('product')
      .innerJoinAndSelect('product.category', 'category')
      .select([
        'product.id',
        'category.id',
        'category.categoryName',
        'category.categorySlug',
        'category.shortDescription',
        'category.description',
        'category.image',
        'category.image3x2',
        'category.desktopBanner',
        'category.tabletBanner',
        'category.mobileBanner',
      ])
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.publishStatus = :publishStatus', {
        publishStatus: PublishStatus.PUBLISHED,
      })
      .andWhere('product.isFeatured = :isFeatured', { isFeatured: true })
      .andWhere('category.isActive = :categoryActive', {
        categoryActive: true,
      })
      .getMany();

    const categories = new Map<
      number,
      {
        id: number;
        title: string;
        slug: string;
        blurb: string;
        image: string | null;
        image3x2: string | null;
        mobileImage: string | null;
      }
    >();

    for (const product of products) {
      const category = product.category;
      if (!category?.id || categories.has(category.id)) continue;

      categories.set(category.id, {
        id: category.id,
        title: category.categoryName || 'Featured Collection',
        slug: category.categorySlug || '',
        blurb:
          category.shortDescription?.trim() ||
          category.description?.replace(/<[^>]*>/g, ' ').trim() ||
          '',
        image:
          category.image ||
          category.desktopBanner ||
          category.tabletBanner ||
          category.mobileBanner ||
          null,
        image3x2: category.image3x2 || null,
        mobileImage: category.mobileBanner || null,
      });
    }

    return successResponse(
      [...categories.values()].filter((category) => category.slug),
      'Featured categories retrieved successfully',
    );
  }

  async getHomepageRooms() {
    const rooms = await this.roomRepository
      .createQueryBuilder('room')
      .select([
        'room.id',
        'room.name',
        'room.slug',
        'room.image',
        'room.mobileImage',
      ])
      .where('room.isActive = :isActive', { isActive: true })
      .andWhere('room.showOnHomePage = :showOnHomePage', {
        showOnHomePage: true,
      })
      .andWhere('(room.image IS NOT NULL OR room.mobileImage IS NOT NULL)')
      .orderBy('room.sortOrder', 'ASC')
      .addOrderBy('room.id', 'ASC')
      .getMany();

    return successResponse(rooms, 'Homepage rooms retrieved successfully');
  }

  async getHomepageBanners() {
    const [offers, categories] = await Promise.all([
      this.offerRepository.find({
        where: { isActive: true, useAsHeroBanner: true },
        order: { id: 'ASC' },
      }),
      this.categoryRepository.find({
        where: { isActive: true, useAsHeroBanner: true },
        order: { id: 'ASC' },
      }),
    ]);
    const banners = [
      ...offers
        .filter((offer) => this.isOfferLive(offer))
        .map((offer) => ({
          id: offer.id,
          source: 'offer',
          title: offer.offerName,
          slug:offer.offerSlug,
          desktopImage: offer.desktopImage || null,
          tabletImage: offer.tabletImage || null,
          mobileImage: offer.mobileImage || null,
        })),
      ...categories.map((category) => ({
        id: category.id,
        source: 'category',
        title: category.categoryName,
        slug: category.categorySlug,
        desktopImage: category.desktopBanner || null,
        tabletImage: category.tabletBanner || null,
        mobileImage: category.mobileBanner || null,
      })),
    ].filter((banner) => banner.desktopImage || banner.tabletImage || banner.mobileImage);
    return successResponse(banners, 'Homepage banners retrieved successfully');
  }

  private isOfferLive(offer: Offer): boolean {
    if (!offer.isActive) return false;
    if (!offer.timeBased) return true;
    const now = Date.now();
    return (!offer.startDate || offer.startDate.getTime() <= now) &&
      (!offer.endDate || offer.endDate.getTime() >= now);
  }

  /**
   * Lightweight slug list for Next.js /sitemap.xml.
   * Avoids heavy store/blog card payloads that time out during sitemap generation.
   */
  async getSitemapEntries() {
    const [products, blogs, categories] = await Promise.all([
      this.productRepository
        .createQueryBuilder('product')
        .select([
          'product.id',
          'product.productSlug',
          'product.updatedAt',
          'product.createdAt',
        ])
        .where('product.isActive = :isActive', { isActive: true })
        .andWhere('product.publishStatus = :publishStatus', {
          publishStatus: PublishStatus.PUBLISHED,
        })
        .andWhere('product.productSlug IS NOT NULL')
        .andWhere("product.productSlug != ''")
        .orderBy('product.updatedAt', 'DESC')
        .getMany(),
      this.blogRepository
        .createQueryBuilder('blog')
        .select([
          'blog.id',
          'blog.slug',
          'blog.updatedAt',
          'blog.createdAt',
          'blog.publishedAt',
        ])
        .where('blog.isActive = :isActive', { isActive: true })
        .andWhere('blog.status = :status', { status: 'published' })
        .andWhere('blog.slug IS NOT NULL')
        .andWhere("blog.slug != ''")
        .orderBy('blog.publishedAt', 'DESC', 'NULLS LAST')
        .addOrderBy('blog.updatedAt', 'DESC')
        .getMany(),
      this.categoryRepository
        .createQueryBuilder('category')
        .select([
          'category.id',
          'category.categorySlug',
          'category.updatedAt',
          'category.createdAt',
        ])
        .where('category.isActive = :isActive', { isActive: true })
        .andWhere('"category"."publishStatus" = :publishStatus', {
          publishStatus: 'published',
        })
        .andWhere('category.categorySlug IS NOT NULL')
        .andWhere("category.categorySlug != ''")
        .orderBy('category.id', 'ASC')
        .getMany(),
    ]);

    const toIso = (value?: Date | null) =>
      value instanceof Date && !Number.isNaN(value.getTime())
        ? value.toISOString()
        : undefined;

    return successResponse(
      {
        products: products.map((product) => ({
          slug: product.productSlug,
          lastModified:
            toIso(product.updatedAt) || toIso(product.createdAt) || undefined,
        })),
        blogs: blogs.map((blog) => ({
          slug: blog.slug,
          lastModified:
            toIso(blog.updatedAt) ||
            toIso(blog.publishedAt) ||
            toIso(blog.createdAt) ||
            undefined,
        })),
        categories: categories.map((category) => ({
          slug: category.categorySlug,
          lastModified:
            toIso(category.updatedAt) || toIso(category.createdAt) || undefined,
        })),
      },
      'Sitemap entries retrieved successfully',
    );
  }
}
