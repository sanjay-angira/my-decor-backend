import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UtilityService } from 'src/commonServices/utility.service';
import { successResponse } from 'src/commonServices/response.service';
import { PaginationDto } from 'src/dto/common.dto';
import { CreateRoomDto, UpdateRoomDto } from 'src/dto/room.dto';
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
    private readonly utilityService: UtilityService,
  ) {}

  async create(dto: CreateRoomDto) {
    const room = this.roomRepository.create({
      name: dto.name.trim(),
      slug: await this.createUniqueSlug(dto.name),
      image: dto.image?.trim() || null,
      mobileImage: dto.mobileImage?.trim() || null,
      isActive: dto.isActive ?? true,
      showOnHomePage: dto.showOnHomePage ?? false,
      sortOrder: dto.sortOrder ?? 0,
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

    if (dto.name !== undefined) {
      room.name = dto.name.trim();
      room.slug = await this.createUniqueSlug(room.name, id);
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
