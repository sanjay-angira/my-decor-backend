import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { successResponse } from 'src/commonServices/response.service';
import { Product, PublishStatus } from 'src/entities/product/product.entity';
import { Category } from 'src/entities/productCategory/category.entity';
import { BlogPost } from 'src/entities/blog/blog-posts.entity';
import { Banner } from 'src/entities/CMS/banner.entity';

@Injectable()
export class CustomerHomepageService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(BlogPost)
    private readonly blogRepository: Repository<BlogPost>,
    @InjectRepository(Banner)
    private readonly bannerRepository: Repository<Banner>,
  ) {}

  async getHomepageBanners() {
    const banners = await this.bannerRepository.find({
      where: { status: true },
      order: { position: 'ASC', id: 'ASC' },
    });
    return successResponse(banners, 'Homepage banners retrieved successfully');
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
