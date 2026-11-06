import { DataSource } from 'typeorm';

export async function migrateCategoryResponsiveImages(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ categories: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.categories') AS categories
  `);
  if (!tables[0]?.categories) return;

  const existingColumns: Array<{ column_name: string }> =
    await dataSource.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'categories'
    `);
  const columns = new Set(existingColumns.map(({ column_name }) => column_name));

  await dataSource.query(`
    ALTER TABLE public.categories
      ADD COLUMN IF NOT EXISTS "desktopBanner" character varying(2048),
      ADD COLUMN IF NOT EXISTS "tabletBanner" character varying(2048),
      ADD COLUMN IF NOT EXISTS "mobileBanner" character varying(2048)
  `);

  const desktopSource = columns.has('desktopImage')
    ? `COALESCE(NULLIF("desktopBanner", ''), NULLIF("desktopImage", ''), NULLIF(image, ''))`
    : `COALESCE(NULLIF("desktopBanner", ''), NULLIF(image, ''))`;
  await dataSource.query(`
    UPDATE public.categories
    SET "desktopBanner" = ${desktopSource}
    WHERE "desktopBanner" IS NULL OR "desktopBanner" = ''
  `);

  if (columns.has('tabletImage')) {
    await dataSource.query(`
      UPDATE public.categories
      SET "tabletBanner" = COALESCE(NULLIF("tabletBanner", ''), NULLIF("tabletImage", ''))
      WHERE "tabletBanner" IS NULL OR "tabletBanner" = ''
    `);
  }

  if (columns.has('mobileImage')) {
    await dataSource.query(`
      UPDATE public.categories
      SET "mobileBanner" = COALESCE(NULLIF("mobileBanner", ''), NULLIF("mobileImage", ''))
      WHERE "mobileBanner" IS NULL OR "mobileBanner" = ''
    `);
  }
}
