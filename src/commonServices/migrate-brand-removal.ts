import { DataSource } from 'typeorm';

export async function migrateBrandRemoval(dataSource: DataSource): Promise<void> {
  await dataSource.query(`
    DO $$
    DECLARE
      constraint_row record;
    BEGIN
      IF to_regclass('public.product') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'product'
          AND column_name = 'brandId'
      ) THEN
        FOR constraint_row IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute attr
            ON attr.attrelid = con.conrelid
           AND attr.attnum = ANY(con.conkey)
          WHERE con.conrelid = 'public.product'::regclass
            AND con.contype = 'f'
            AND attr.attname = 'brandId'
        LOOP
          EXECUTE format(
            'ALTER TABLE public.product DROP CONSTRAINT %I',
            constraint_row.conname
          );
        END LOOP;
        ALTER TABLE public.product DROP COLUMN "brandId";
      END IF;

      IF to_regclass('public.warehouses') IS NOT NULL AND EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'warehouses'
          AND column_name = 'brandId'
      ) THEN
        FOR constraint_row IN
          SELECT con.conname
          FROM pg_constraint con
          JOIN pg_attribute attr
            ON attr.attrelid = con.conrelid
           AND attr.attnum = ANY(con.conkey)
          WHERE con.conrelid = 'public.warehouses'::regclass
            AND con.contype = 'f'
            AND attr.attname = 'brandId'
        LOOP
          EXECUTE format(
            'ALTER TABLE public.warehouses DROP CONSTRAINT %I',
            constraint_row.conname
          );
        END LOOP;
        ALTER TABLE public.warehouses DROP COLUMN "brandId";
      END IF;
    END $$
  `);

  await dataSource.query(`
    DO $$
    DECLARE
      relation_row record;
    BEGIN
      IF to_regclass('public.brands') IS NOT NULL THEN
        FOR relation_row IN
          SELECT DISTINCT con.conrelid::regclass AS relation_name
          FROM pg_constraint con
          WHERE con.confrelid = 'public.brands'::regclass
            AND con.contype = 'f'
            AND (
              to_regclass('public.product') IS NULL
              OR con.conrelid <> to_regclass('public.product')
            )
            AND (
              to_regclass('public.warehouses') IS NULL
              OR con.conrelid <> to_regclass('public.warehouses')
            )
            AND con.conrelid::regclass::text ILIKE '%brand%'
        LOOP
          EXECUTE format('DROP TABLE IF EXISTS %s CASCADE', relation_row.relation_name);
        END LOOP;
        DROP TABLE public.brands CASCADE;
      END IF;
    END $$
  `);

  await dataSource.query(`
    DO $$
    DECLARE
      brand_module_id integer;
      warehouse_module_id integer;
    BEGIN
      IF to_regclass('public.modules') IS NOT NULL THEN
        SELECT id INTO brand_module_id
        FROM public.modules
        WHERE lower(name) IN ('brand', 'brands')
           OR router_link ILIKE '%brands%'
        ORDER BY id
        LIMIT 1;

        INSERT INTO public.modules (
          name, router_link, icon, "order", categories,
          "categoryOrderNo", category_icon, "isActive"
        )
        SELECT
          'Warehouses',
          '/admin/warehouses',
          COALESCE(icon, 'warehouse'),
          COALESCE("order", 999),
          COALESCE(categories, 'Catalog'),
          COALESCE("categoryOrderNo", 999),
          category_icon,
          true
        FROM public.modules
        WHERE id = brand_module_id
          AND NOT EXISTS (
            SELECT 1 FROM public.modules
            WHERE lower(name) = 'warehouses'
               OR router_link = '/admin/warehouses'
          );

        INSERT INTO public.modules (
          name, router_link, icon, "order", categories,
          "categoryOrderNo", category_icon, "isActive"
        )
        SELECT 'Warehouses', '/admin/warehouses', 'warehouse', 999,
               'Catalog', 999, 'warehouse', true
        WHERE NOT EXISTS (
          SELECT 1 FROM public.modules
          WHERE lower(name) = 'warehouses'
             OR router_link = '/admin/warehouses'
        );

        SELECT id INTO warehouse_module_id
        FROM public.modules
        WHERE lower(name) = 'warehouses'
           OR router_link = '/admin/warehouses'
        ORDER BY id
        LIMIT 1;

        IF brand_module_id IS NOT NULL
          AND to_regclass('public.permissions') IS NOT NULL THEN
          INSERT INTO public.permissions (
            "userId", "moduleId", "canRead", "canView", "canAdd", "canEdit", "canDelete"
          )
          SELECT p."userId", warehouse_module_id, p."canRead", p."canView",
                 p."canAdd", p."canEdit", p."canDelete"
          FROM public.permissions p
          WHERE p."moduleId" = brand_module_id
            AND NOT EXISTS (
              SELECT 1 FROM public.permissions existing
              WHERE existing."userId" = p."userId"
                AND existing."moduleId" = warehouse_module_id
            );
          DELETE FROM public.permissions WHERE "moduleId" = brand_module_id;
        END IF;

        IF brand_module_id IS NOT NULL
          AND to_regclass('public.role_module_access') IS NOT NULL THEN
          INSERT INTO public.role_module_access ("roleId", "moduleId")
          SELECT access."roleId", warehouse_module_id
          FROM public.role_module_access access
          WHERE access."moduleId" = brand_module_id
            AND NOT EXISTS (
              SELECT 1 FROM public.role_module_access existing
              WHERE existing."roleId" = access."roleId"
                AND existing."moduleId" = warehouse_module_id
            );
          DELETE FROM public.role_module_access WHERE "moduleId" = brand_module_id;
        END IF;

        IF brand_module_id IS NOT NULL THEN
          DELETE FROM public.modules WHERE id = brand_module_id;
        END IF;
      END IF;
    END $$
  `);

  await dataSource.query(`
    UPDATE public.warehouses
    SET "isDefault" = false
    WHERE "isDefault" = true
      AND ("isActive" = false OR "registrationStatus" <> 'REGISTERED')
  `);
  await dataSource.query(`
    WITH ranked_defaults AS (
      SELECT id,
        ROW_NUMBER() OVER (
          ORDER BY "updatedAt" DESC NULLS LAST, id DESC
        ) AS position
      FROM public.warehouses
      WHERE "isDefault" = true
    )
    UPDATE public.warehouses warehouse
    SET "isDefault" = false
    FROM ranked_defaults ranked
    WHERE warehouse.id = ranked.id
      AND ranked.position > 1
  `);
  await dataSource.query(`
    DROP INDEX IF EXISTS public."IDX_warehouses_brand_id";
    DROP INDEX IF EXISTS public."UQ_warehouses_brand_name_pin";
    DROP INDEX IF EXISTS public."UQ_warehouses_brand_default";
    CREATE UNIQUE INDEX IF NOT EXISTS "UQ_warehouses_default"
      ON public.warehouses ("isDefault")
      WHERE "isDefault" = true
  `);
}
