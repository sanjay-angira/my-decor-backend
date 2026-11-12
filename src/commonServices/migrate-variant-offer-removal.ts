import { DataSource } from 'typeorm';

export async function migrateVariantOfferRemoval(
  dataSource: DataSource,
): Promise<void> {
  await dataSource.query(`
    DO $$
    DECLARE
      relation_row record;
    BEGIN
      FOR relation_row IN
        SELECT DISTINCT relation_namespace.nspname AS schema_name,
                        relation_table.relname AS table_name
        FROM pg_class relation_table
        JOIN pg_namespace relation_namespace
          ON relation_namespace.oid = relation_table.relnamespace
        WHERE relation_table.relkind = 'r'
          AND relation_namespace.nspname = 'public'
          AND relation_table.relname ILIKE '%variant%'
          AND EXISTS (
            SELECT 1
            FROM pg_constraint constraint_row
            WHERE constraint_row.conrelid = relation_table.oid
              AND constraint_row.contype = 'f'
              AND constraint_row.confrelid = to_regclass('public.product_variants')
          )
          AND EXISTS (
            SELECT 1
            FROM pg_constraint constraint_row
            WHERE constraint_row.conrelid = relation_table.oid
              AND constraint_row.contype = 'f'
              AND constraint_row.confrelid = to_regclass('public.offers')
          )
      LOOP
        EXECUTE format(
          'DROP TABLE IF EXISTS %I.%I CASCADE',
          relation_row.schema_name,
          relation_row.table_name
        );
      END LOOP;
    END $$
  `);
}
