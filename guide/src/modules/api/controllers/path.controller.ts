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
import { Path } from '../../../db/entity/path.entity';
import { PathService } from '../services/path.service';
import { SearchQueryDto } from '../dto/search-query.dto';
import { DeleteDto } from '../dto/delete-query.dto';
import { Languages } from '../../../common/enums/languages';
import { ApiHeaderLangInterceptor } from '../interceptors/api-header-lang.interceptor';
import { ApiHeaderCityInterceptor } from '../interceptors/api-header-city.interceptor';

@ApiTags('Paths / routes')
@UseInterceptors(ApiHeaderLangInterceptor)
@UseInterceptors(ApiHeaderCityInterceptor)
@Controller('api/paths')
export class PathsController {
  constructor(
    @InjectEntityManager() private readonly entityManager: EntityManager,
    private readonly pathService: PathService,
  ) { }

  /* GET paths */
  @ApiQuery({
    name: 'id',
    schema: {
      type: 'number'
    },
    required: false,
    description: 'Point id',
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
  @ApiBadRequestResponse({
    description: 'Wrong header(s) or query parameter(s)',
  })
  @ApiNotFoundResponse({
    description: `No paths found`
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
    const items = await this.pathService.find(searchQueryParams);
    if (items.length) {
      return items;
    } else {
      throw new NotFoundException();
    }
  }

  /* PUT paths (create or update) */
  @ApiCreatedResponse({
    description: `Path successfully created`,
    type: Path,
  })
  @ApiOkResponse({
    description: `Path successfully updated`,
    type: Path,
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
    @Body() pathParams: Path,
    @Res() res,
  ) {
    Object.assign(pathParams, { city });
    let item, statusCode = 200;
    const whereCond = { name_blr: pathParams.name_blr, city: city };
    const pathItem = await this.entityManager.findOne(Path, { where: whereCond });
    if (!pathItem) {
      item = await this.entityManager.save(Path, pathParams);
      statusCode = 201;
    } else {
      const { name_blr, ...cleanParams } = pathParams;
      await this.entityManager.update(Path, whereCond, cleanParams);
      item = await this.entityManager.findOne(Path, { where: whereCond });
    }
    return res.status(statusCode).send(item);
  }

  /* DELETE paths */
  @ApiQuery({
    name: 'id',
    schema: {
      type: 'number'
    },
    required: true,
    description: `Path ID`,
  })
  @ApiResponse({
    status: 204,
    description: `Path successfully deleted`,
  })
  @ApiBadRequestResponse({ description: `Wrong query params` })
  @ApiNotFoundResponse({ description: `Path not found` })
  @Delete()
  async delete(
    @Headers('accept-language') lang: Languages,
    @Headers('x-city') city: number,
    @Query() params: DeleteDto,
    @Res() res,
  ) {
    let statusCode = 204, message = `Deleted`;
    try {
      const result = await this.entityManager.delete(Path, { id: params.id, city: city });
      if (!result.affected) {
        statusCode = 404;
        message = 'Path not found';
      }
    } catch (e) {
      statusCode = 400;
      message = e.detail;
    }
    return res.status(statusCode).send(message);
  }
}
