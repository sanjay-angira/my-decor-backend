import { DataSource } from 'typeorm';
import { migrateBrandRemoval } from './migrate-brand-removal';

describe('migrateBrandRemoval', () => {
  it('detaches brand data, replaces its admin module with warehouses, and normalizes defaults', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await migrateBrandRemoval({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(6);
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ALTER TABLE public.product DROP COLUMN "brandId"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('DROP TABLE public.brands CASCADE'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("'Warehouses'"),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('"canRead"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_warehouses_default"'),
    );
  });
});
