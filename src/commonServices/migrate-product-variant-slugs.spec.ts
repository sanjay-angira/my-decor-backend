import { DataSource } from 'typeorm';
import { migrateProductVariantSlugs } from './migrate-product-variant-slugs';

describe('migrateProductVariantSlugs', () => {
  it('creates unique backend slugs from variant names before entity sync', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ tableName: 'product_variants' }])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([
        { id: 1, name: 'Large Size' },
        { id: 2, name: 'Large Size' },
        { id: 3, name: '!!!' },
      ])
      .mockResolvedValue(undefined);

    await migrateProductVariantSlugs({ query } as unknown as DataSource);

    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('SET slug = $1'),
      ['large-size', 1],
    );
    expect(query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('SET slug = $1'),
      ['large-size-2', 2],
    );
    expect(query).toHaveBeenNthCalledWith(
      6,
      expect.stringContaining('SET slug = $1'),
      ['variant', 3],
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS slug'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER COLUMN slug SET NOT NULL'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS'),
    );
  });

  it('skips the migration if the variants table does not exist', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ tableName: null }]);

    await migrateProductVariantSlugs({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
