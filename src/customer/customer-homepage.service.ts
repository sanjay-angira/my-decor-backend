import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/commonServices/response.service';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { Offer } from 'src/entities/product/offer.entity';

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
  ) {}

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
          id: `offer-${offer.id}`,
          source: 'offer',
          title: offer.offerName || offer.offerSlug || `Offer ${offer.id}`,
          subtitle: '',
          image: offer.desktopImage || null,
          desktopImage: offer.desktopImage || null,
          tabletImage: offer.tabletImage || null,
          mobileImage: offer.mobileImage || null,
          link: '/shop',
        })),
      ...categories.map((category) => ({
        id: `category-${category.id}`,
        source: 'category',
        title: category.categoryName || `Category ${category.id}`,
        subtitle: category.shortDescription || '',
        image: category.desktopBanner || category.image || null,
        desktopImage: category.desktopBanner || category.image || null,
        tabletImage: category.tabletBanner || null,
        mobileImage: category.mobileBanner || null,
        link: category.categorySlug
          ? `/category/${encodeURIComponent(category.categorySlug)}`
          : '/shop',
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
