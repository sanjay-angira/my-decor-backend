import { DataSource } from 'typeorm';
import { migrateModuleMaterialIcons } from './migrate-module-material-icons';

describe('migrateModuleMaterialIcons', () => {
  it('normalizes module and category icons to mat-prefixed Material ligatures', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ modules: 'modules' }])
      .mockResolvedValue(undefined);

    await migrateModuleMaterialIcons({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[1][0]).toContain(
      "WHEN LOWER(BTRIM(\"icon\")) = 'pi pi-sitemap' THEN 'mat:category'",
    );
    expect(query.mock.calls[1][0]).toContain("THEN 'mat:' || BTRIM(\"icon\")");
    expect(query.mock.calls[1][0]).toContain("ELSE 'mat:folder'");
    expect(query.mock.calls[1][0]).toContain('category_icon = CASE');
  });

  it('does nothing when the modules table does not exist', async () => {
    const query = jest.fn().mockResolvedValueOnce([{ modules: null }]);

    await migrateModuleMaterialIcons({ query } as unknown as DataSource);

    expect(query).toHaveBeenCalledTimes(1);
  });
});