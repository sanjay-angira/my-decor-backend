import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Warehouse } from 'src/entities/product/warehouse.entity';
import { WarehousesService } from './warehouses.service';

describe('WarehousesService.findAll', () => {
  const query = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  };
  const repository = {
    createQueryBuilder: jest.fn().mockReturnValue(query),
  };
  const service = new WarehousesService(
    repository as unknown as Repository<Warehouse>,
    {} as HttpService,
    {} as ConfigService,
    {} as DataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filters, searches, sorts, and paginates warehouse records', async () => {
    await service.findAll({
      registeredOnly: true,
      search: 'Delhi',
      column: 'name',
      order: 'ASC',
      pageNumber: '2',
      pageSize: '25',
    });

    expect(query.where).toHaveBeenCalledWith(
      'warehouse.registrationStatus = :registrationStatus',
      { registrationStatus: 'REGISTERED' },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      'warehouse.isActive = :isActive',
      { isActive: true },
    );
    expect(query.andWhere).toHaveBeenCalledWith(
      expect.stringContaining('warehouse.name ILIKE :search'),
      { search: '%Delhi%' },
    );
    expect(query.orderBy).toHaveBeenCalledWith('warehouse.name', 'ASC');
    expect(query.skip).toHaveBeenCalledWith(25);
    expect(query.take).toHaveBeenCalledWith(25);
    expect(query.getManyAndCount).toHaveBeenCalled();
  });

  it('uses an allowlisted default sort column for invalid sort input', async () => {
    await service.findAll({ column: 'name; DROP TABLE warehouses' });

    expect(query.orderBy).toHaveBeenCalledWith('warehouse.createdAt', 'DESC');
  });
});
