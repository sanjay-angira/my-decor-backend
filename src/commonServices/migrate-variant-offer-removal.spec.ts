import { DataSource } from 'typeorm';
import { migrateVariantOfferRemoval } from './migrate-variant-offer-removal';

describe('migrateVariantOfferRemoval', () => {
  it('drops the variant-offer join table before entity synchronization', async () => {
    const query = jest.fn().mockResolvedValue(undefined);

    await migrateVariantOfferRemoval({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
    expect(query.mock.calls[0][0]).toContain(
      "relation_table.relname ILIKE '%variant%'",
    );
    expect(query.mock.calls[0][0]).toContain(
      "to_regclass('public.product_variants')",
    );
    expect(query.mock.calls[0][0]).toContain("to_regclass('public.offers')");
    expect(query.mock.calls[0][0]).toContain('DROP TABLE IF EXISTS %I.%I CASCADE');
  });
});
