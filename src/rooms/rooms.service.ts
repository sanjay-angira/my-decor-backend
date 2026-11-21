import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UtilityService } from 'src/commonServices/utility.service';
import { successResponse } from 'src/commonServices/response.service';
import { PaginationDto } from 'src/dto/common.dto';
import { CreateRoomDto, UpdateRoomDto } from 'src/dto/room.dto';
import { Product } from 'src/entities/product/product.entity';
import { Room } from 'src/entities/product/room.entity';

const SORTABLE_ROOM_COLUMNS = new Set([
  'id',
  'name',
  'slug',
  'isActive',
  'sortOrder',
  'createdAt',
  'updatedAt',
]);

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly utilityService: UtilityService,
  ) {}

  async create(dto: CreateRoomDto) {
    const products = await this.resolveProducts(dto.productIds ?? []);
    const room = this.roomRepository.create({
      name: dto.name.trim(),
      slug: await this.createUniqueSlug(dto.slug || dto.name),
      image: dto.image?.trim() || null,
      mobileImage: dto.mobileImage?.trim() || null,
      isActive: dto.isActive ?? true,
      showOnHomePage: dto.showOnHomePage ?? false,
      sortOrder: dto.sortOrder ?? 0,
      products,
    });

    const saved = await this.roomRepository.save(room);
    const result = await this.roomRepository.findOne({
      where: { id: saved.id },
      relations: ['products'],
    });
    return successResponse(result, 'Room created successfully', 201);
  }

  async findAll(pagination: PaginationDto) {
    const pageNumber = this.utilityService.validatePageNumber(
      pagination.pageNumber,
    )
      ? Number(pagination.pageNumber)
      : 1;
    const pageSize = this.utilityService.validatePageSize(pagination.pageSize)
      ? Number(pagination.pageSize)
      : 10;
    const column = SORTABLE_ROOM_COLUMNS.has(String(pagination.column))
      ? String(pagination.column)
      : 'id';
    const direction =
      String(pagination.order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const query = this.roomRepository
      .createQueryBuilder('room')
      .loadRelationCountAndMap('room.productCount', 'room.products')
      .orderBy(`room.${column}`, direction)
      .skip((pageNumber - 1) * pageSize)
      .take(pageSize);

    if (
      pagination.search &&
      this.utilityService.validateSearch(pagination.search)
    ) {
      query.andWhere('(room.name ILIKE :search OR room.slug ILIKE :search)', {
        search: `%${pagination.search.trim()}%`,
      });
    }

    const [rows, count] = await query.getManyAndCount();
    return successResponse({ rows, count }, 'Rooms fetched successfully');
  }

  async findOne(id: number) {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!room) throw new NotFoundException('Room not found');
    return successResponse(room, 'Room fetched successfully');
  }

  async update(id: number, dto: UpdateRoomDto) {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!room) throw new NotFoundException('Room not found');

    if (dto.name !== undefined) room.name = dto.name.trim();
    if (dto.slug !== undefined) {
      room.slug = await this.createUniqueSlug(dto.slug, id);
    }
    if (dto.image !== undefined) room.image = dto.image?.trim() || null;
    if (dto.mobileImage !== undefined) {
      room.mobileImage = dto.mobileImage?.trim() || null;
    }
    if (dto.isActive !== undefined) room.isActive = dto.isActive;
    if (dto.showOnHomePage !== undefined) {
      room.showOnHomePage = dto.showOnHomePage;
    }
    if (dto.sortOrder !== undefined) room.sortOrder = dto.sortOrder;
    if (dto.productIds !== undefined) {
      room.products = await this.resolveProducts(dto.productIds);
    }

    await this.roomRepository.save(room);
    const result = await this.roomRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    return successResponse(result, 'Room updated successfully');
  }

  async remove(id: number) {
    const room = await this.roomRepository.findOne({ where: { id } });
    if (!room) throw new NotFoundException('Room not found');
    await this.roomRepository.remove(room);
    return successResponse(null, 'Room deleted successfully');
  }

  private async resolveProducts(productIds: number[]): Promise<Product[]> {
    const uniqueIds = [...new Set(productIds)];
    if (!uniqueIds.length) return [];

    const products = await this.productRepository.find({
      where: { id: In(uniqueIds) },
      select: ['id', 'productName', 'productSlug', 'isActive'],
    });
    if (products.length !== uniqueIds.length) {
      throw new NotFoundException('One or more products were not found');
    }
    return products;
  }

  private async createUniqueSlug(value: string, excludeId?: number) {
    const baseSlug = this.utilityService.createSlug(value) || 'room';
    let slug = baseSlug;
    let suffix = 2;

    while (true) {
      const existing = await this.roomRepository.findOne({
        where: { slug },
        select: ['id'],
      });
      if (!existing || existing.id === excludeId) return slug;
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  }
}
