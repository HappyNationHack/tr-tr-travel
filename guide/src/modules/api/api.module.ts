import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Entities } from '../../db/entity';
import { PointsService } from './services/point.service';
import { AuthService } from './services/auth.service';
import { InfoService } from './services/info.service';
import { PathService } from './services/path.service';
import { AuthController } from './controllers/auth.controller';
import { PointsController } from './controllers/point.controller';
import { InfoController } from './controllers/info.controller';
import { CityController } from './controllers/city.controller';
import { LanguageController } from './controllers/language.controller';
import { PathsController } from './controllers/path.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature(Entities),
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1h' },
      }),
    }),
  ],
  controllers: [
    AuthController,
    PointsController,
    InfoController,
    CityController,
    LanguageController,
    PathsController,
  ],
  providers: [
    AuthService,
    PointsService,
    InfoService,
    PathService,
    LocalStrategy,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [AuthService],
})
export class ApiModule {}
