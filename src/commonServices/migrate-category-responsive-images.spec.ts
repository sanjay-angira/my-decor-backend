import { DataSource } from 'typeorm';
import { migrateCategoryResponsiveImages } from './migrate-category-responsive-images';

describe('migrateCategoryResponsiveImages', () => {
  it('adds responsive banner columns and migrates existing category images', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ categories: 'categories' }])
      .mockResolvedValueOnce([
        { column_name: 'image' },
        { column_name: 'desktopImage' },
        { column_name: 'tabletImage' },
        { column_name: 'mobileImage' },
      ])
      .mockResolvedValue(undefined);

    await migrateCategoryResponsiveImages({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "desktopBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "tabletBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "mobileBanner"'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS video character varying(2048)'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "useAsHeroBanner" boolean NOT NULL DEFAULT false'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(NULLIF("desktopBanner", \'\'), NULLIF("desktopImage", \'\'), NULLIF(image, \'\'))'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("tabletImage", \'\')'),
    );
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('NULLIF("mobileImage", \'\')'),
    );
  });

  it('does not alter the schema if the categories table is missing', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ categories: null }]);

    await migrateCategoryResponsiveImages({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});
