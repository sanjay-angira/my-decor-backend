import { DataSource } from 'typeorm';

type VariantSlugRow = {
  id: number;
  name: string | null;
};

function createSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function migrateProductVariantSlugs(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ tableName: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.product_variants') AS "tableName"
  `);
  if (!tables[0]?.tableName) return;

  await dataSource.query(`
    ALTER TABLE public.product_variants
      ADD COLUMN IF NOT EXISTS slug character varying
  `);

  const rows: VariantSlugRow[] = await dataSource.query(`
    SELECT id, name
    FROM public.product_variants
    ORDER BY id ASC
  `);
  const used = new Set<string>();

  for (const row of rows) {
    const baseSlug = createSlug(row.name || '') || 'variant';
    let slug = baseSlug;
    let suffix = 2;
    while (used.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
    used.add(slug);
    await dataSource.query(
      `UPDATE public.product_variants SET slug = $1 WHERE id = $2 AND slug IS DISTINCT FROM $1`,
      [slug, row.id],
    );
  }

  await dataSource.query(`
    ALTER TABLE public.product_variants
      ALTER COLUMN slug SET NOT NULL
  `);
  await dataSource.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_product_variants_slug"
      ON public.product_variants ("slug")
  `);
}
