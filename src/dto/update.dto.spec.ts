import { ValidationPipe } from '@nestjs/common';
import { UpdateCategoryDto } from './category.dto';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { UpdateBlogDto } from './blog.dto';
import { UpdateCouponDto } from './coupon.dto';

describe('update DTO numeric values', () => {
  const pipe = new ValidationPipe({
    transform: true,
    transformOptions: { enableImplicitConversion: true },
  });

  describe('backend-generated product slugs', () => {
    const pipe = new ValidationPipe({
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });

    it('accepts product and variant create payloads without client-provided slugs', async () => {
      const result = await pipe.transform(
        {
          productName: 'Handmade Decor',
          variants: [
            {
              name: 'Large Size',
              price: 1200,
              stock: 5,
              packageHeightCm: 10,
              packageWidthCm: 10,
              packageLengthCm: 10,
              packageWeightGrams: 500,
              sku: 'DECOR-L',
            },
          ],
        },
        { type: 'body', metatype: CreateProductDto },
      );

      expect(result.productSlug).toBeUndefined();
      expect(result.variants[0].slug).toBeUndefined();
    });
  });

  it('converts category parent and offer IDs from form strings', async () => {
    const result = await pipe.transform(
      { parentId: '2', offerIds: ['3', '4'] },
      { type: 'body', metatype: UpdateCategoryDto },
    );

    expect(result.parentId).toBe(2);
    expect(result.offerIds).toEqual([3, 4]);
  });

  it('converts product and nested variant IDs from form strings', async () => {
    const result = await pipe.transform(
      {
        category: '5',
        productOffers: ['1'],
        productTags: ['3'],
        frequentlyBoughtTogether: ['4'],
        variants: [
          {
            id: '10',
            price: '199',
            stock: '12',
            packageHeightCm: '10',
            packageWidthCm: '15',
            packageLengthCm: '20',
            packageWeightGrams: '500',
            sku: 'SKU-100',
          },
        ],
      },
      { type: 'body', metatype: UpdateProductDto },
    );

    expect(result.category).toBe(5);
    expect(result.productOffers).toEqual([1]);
    expect(result.productTags).toEqual([3]);
    expect(result.frequentlyBoughtTogether).toEqual([4]);
    expect(result.variants[0]).toMatchObject({
      id: 10,
      price: 199,
      stock: 12,
      packageHeightCm: 10,
      packageWidthCm: 15,
      packageLengthCm: 20,
      packageWeightGrams: 500,
      sku: 'SKU-100',
    });
  });

  it('requires positive package dimensions and weight for product variants', async () => {
    await expect(
      pipe.transform(
        {
          variants: [
            {
              name: 'Single pack',
              slug: 'single-pack',
              price: '199',
              stock: '12',
            },
          ],
        },
        { type: 'body', metatype: UpdateProductDto },
      ),
    ).rejects.toThrow();
  });

  it('requires a non-empty SKU for product variants', async () => {
    await expect(
      pipe.transform(
        {
          variants: [
            {
              name: 'Single pack',
              slug: 'single-pack',
              price: '199',
              stock: '12',
              packageHeightCm: '10',
              packageWidthCm: '15',
              packageLengthCm: '20',
              packageWeightGrams: '500',
            },
          ],
        },
        { type: 'body', metatype: UpdateProductDto },
      ),
    ).rejects.toThrow();
  });

  it('rejects whitespace-only SKUs for product variants', async () => {
    await expect(
      pipe.transform(
        {
          variants: [
            {
              name: 'Single pack',
              slug: 'single-pack',
              price: '199',
              stock: '12',
              packageHeightCm: '10',
              packageWidthCm: '15',
              packageLengthCm: '20',
              packageWeightGrams: '500',
              sku: '   ',
            },
          ],
        },
        { type: 'body', metatype: UpdateProductDto },
      ),
    ).rejects.toThrow();
  });

  it('converts blog and coupon selected IDs from form strings', async () => {
    const blog = await pipe.transform(
      { tagIds: ['4'] },
      { type: 'body', metatype: UpdateBlogDto },
    );
    const coupon = await pipe.transform(
      { userIds: ['5'] },
      { type: 'body', metatype: UpdateCouponDto },
    );

    expect(blog.tagIds).toEqual([4]);
    expect(coupon.userIds).toEqual([5]);
  });
});
