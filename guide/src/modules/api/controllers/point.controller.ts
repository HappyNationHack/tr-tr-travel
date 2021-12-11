import {
  Controller,
  Headers,
  Get,
  Put,
  Delete,
  Query,
  Body,
  Res,
  UseInterceptors,
  NotFoundException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiQuery,
  ApiResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectEntityManager } from '@nestjs/typeorm'; 
import { EntityManager } from 'typeorm';
import { RolesAllowed } from '../decorators/roles-allowed.decorator';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { PointEntity } from '../../../db/entity/point.entity';
import { PointsService } from '../services/point.service';
import { SearchQueryDto } from '../dto/search-query.dto';
import { DeleteDto } from '../dto/delete-query.dto';
import { Languages } from '../../../common/enums/languages';
import { ApiHeaderLangInterceptor } from '../interceptors/api-header-lang.interceptor';
import { ApiHeaderCityInterceptor } from '../interceptors/api-header-city.interceptor';

@ApiTags('Points')
@UseInterceptors(ApiHeaderLangInterceptor)
@UseInterceptors(ApiHeaderCityInterceptor)
@Controller('api/points')
export class PointsController {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly pointsService: PointsService,
  ) { }

  /* GET points */
  @ApiQuery({
    name: 'id',
    schema: {
      type: 'number'
    },
    required: false,
    description: 'Point id',
  })
  @ApiQuery({
    name: 'typeid',
    schema: {
      type: 'number'
    },
    required: false,
    description: `Point's type id`,
  })
  @ApiQuery({
    name: 'search',
    schema: {
      type: 'string'
    },
    required: false,
    description: 'Search by name or description',
  })
  @ApiQuery({
    name: 'page',
    schema: {
      type: 'number'
    },
    required: false,
    description: 'Extract page #',
  })
  @ApiQuery({
    name: 'itemsperpage',
    schema: {
      type: 'number'
    },
    required: false,
    description: 'Set the amount of items per page',
  })
  @ApiOkResponse({
    isArray: true,
    description: 'Array of extracted points',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name:	{ type: 'string' },
          description:	{ type: 'string' },
          coords: {
            type: 'object',
            properties: {
              x: { type: 'number' },
              y: { type: 'number' },
            }
          },
          top:	{ type: 'number' },
          pics: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of relative paths to point pics'
          },
          videos: {
            type: 'array',
            items: {
              type: 'string'
            },
            description: 'Array of relative paths to point videos'
          },
          url: { type: 'string' },
          workHours:	{ type: 'string' },
          email: { type: 'string' },
          phone: { type: 'string' },
          type_id:	{ type: 'number' },
          type_name: { type: 'string' },
          type_icon: { type: 'string' },
          type_sort_order:	{ type: 'number' },
          city_id:	{ type: 'number' },
          city_name: { type: 'string' },
          rating:	{ type: 'number' },
        }
      }
    },
  })
  @ApiBadRequestResponse({
    description: 'Wrong header(s) or query parameter(s)',
  })
  @ApiNotFoundResponse({
    description: `No points found`
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @Get()
  async get(
    @Headers('accept-language') lang: Languages,
    @Headers('x-city') city: number,
    @Query() searchQueryParams: SearchQueryDto
  ) {
    Object.assign(searchQueryParams, { lang, city });
    const items = await this.pointsService.find(searchQueryParams);
    if (items.length) {
      return items;
    } else {
      throw new NotFoundException();
    }
  }

  /* PUT points (create or update) */
  @ApiCreatedResponse({
    description: `Point successfully created`,
    type: PointEntity,
  })
  @ApiOkResponse({
    description: `Point successfully updated`,
    type: PointEntity,
  })
  @ApiBadRequestResponse({
    description: 'Wrong header(s) or query parameter(s)',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @Put()
  async createOrUpdate(
    @Headers('accept-language') lang: Languages,
    @Headers('x-city') city: number,
    @Body() pointParams: PointEntity,
    @Res() res,
  ) {
    Object.assign(pointParams, { city });
    let item, statusCode = 200;
    const whereCond = {
      name_blr: pointParams.name_blr,
      city: city,
    };
    const pointItem = await this.entityManager.findOne(PointEntity, { where: whereCond });
    if (!pointItem) {
      const { name_blr, ...cleanParams } = pointParams;
      item = await this.entityManager.save(PointEntity, cleanParams);
      statusCode = 201;
    } else {
      await this.entityManager.update(PointEntity, whereCond, pointParams);
      item = await this.entityManager.findOne(PointEntity, { where: whereCond });
    }
    return res.status(statusCode).send(item);
  }

  /* DELETE points */
  @ApiQuery({
    name: 'id',
    schema: {
      type: 'number'
    },
    required: true,
    description: `Point ID`,
  })
  @ApiResponse({
    status: 204,
    description: `Point successfully deleted`,
  })
  @ApiBadRequestResponse({ description: `Wrong query params` })
  @ApiNotFoundResponse({ description: `Point not found` })
  @Delete()
  async delete(
    @Headers('accept-language') lang: Languages,
    @Headers('x-city') city: number,
    @Query() params: DeleteDto,
    @Res() res,
  ) {
    let statusCode = 204, message = `Deleted`;
    try {
      const result = await this.entityManager.delete(PointEntity, { id: params.id, city: city });
      if (!result.affected) {
        statusCode = 404;
        message = 'Point not found';
      }
    } catch (e) {
      statusCode = 400;
      message = e.detail;
    }
    return res.status(statusCode).send(message);
  }
}
