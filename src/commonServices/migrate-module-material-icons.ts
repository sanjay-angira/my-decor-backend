import { DataSource } from 'typeorm';

const PRIME_TO_MATERIAL: Record<string, string> = {
  'pi pi-chart-bar': 'dashboard',
  'pi pi-home': 'home',
  'pi pi-sitemap': 'category',
  'pi pi-box': 'inventory_2',
  'pi pi-shopping-cart': 'shopping_cart',
  'pi pi-users': 'people',
  'pi pi-user': 'person',
  'pi pi-cog': 'settings',
  'pi pi-image': 'image',
  'pi pi-file': 'assignment',
  'pi pi-megaphone': 'campaign',
  'pi pi-tag': 'local_offer',
  'pi pi-star': 'rate_review',
  'pi pi-chart-line': 'analytics',
  'pi pi-globe': 'language',
  'pi pi-question-circle': 'contact_support',
  'pi pi-chevron-down': 'expand_more',
  'pi pi-folder': 'folder',
  'pi pi-folder-open': 'folder_off',
};

function materialIconCase(column: 'icon' | 'category_icon'): string {
  const legacyCases = Object.entries(PRIME_TO_MATERIAL)
    .map(([prime, material]) =>
      `WHEN LOWER(BTRIM("${column}")) = '${prime}' THEN 'mat:${material}'`,
    )
    .join('\n');

  return `CASE
    WHEN "${column}" IS NULL OR BTRIM("${column}") = '' THEN 'mat:folder'
    WHEN BTRIM("${column}") ~* '^mat:[a-z0-9_]+$'
      THEN 'mat:' || LOWER(SUBSTRING(BTRIM("${column}") FROM 5))
    ${legacyCases}
    WHEN BTRIM("${column}") ~ '^[a-z0-9_]+$'
      THEN 'mat:' || BTRIM("${column}")
    ELSE 'mat:folder'
  END`;
}

export async function migrateModuleMaterialIcons(
  dataSource: DataSource,
): Promise<void> {
  const tables: Array<{ modules: string | null }> = await dataSource.query(`
    SELECT to_regclass('public.modules') AS modules
  `);
  if (!tables[0]?.modules) return;

  const iconCase = materialIconCase('icon');
  const categoryIconCase = materialIconCase('category_icon');
  await dataSource.query(`
    UPDATE public.modules
    SET
      icon = ${iconCase},
      category_icon = ${categoryIconCase}
    WHERE icon IS DISTINCT FROM ${iconCase}
      OR category_icon IS DISTINCT FROM ${categoryIconCase}
  `);
}