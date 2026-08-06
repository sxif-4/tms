import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpCode,
  HttpStatus,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { type Advertisement } from '../../shared/database/schema';
import { Role } from '../../shared/enums/role.enum';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
} from '../../shared/images/image-storage.service';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { AdvertisementsService } from './advertisements.service';
import { CreateAdvertisementDto } from './dto/create-advertisement.dto';
import { UpdateAdvertisementDto } from './dto/update-advertisement.dto';

/** Admin-only advertisement CMS, plus a public feed of currently-running ads. */
@Controller('advertisements')
@Roles(Role.Admin)
export class AdvertisementsController {
  constructor(private readonly adsService: AdvertisementsService) {}

  /** Declared before `:id` so it isn't swallowed by the dynamic route. */
  @Get('active')
  @Public()
  @Roles()
  active(@Query('placement') placement?: string): Promise<Advertisement[]> {
    return this.adsService.listActive(placement);
  }

  @Get()
  findAll(): Promise<Advertisement[]> {
    return this.adsService.listAll();
  }

  /**
   * Uploads a creative and returns its URL, which the caller then submits as
   * `image` on create/update. Declared before `:id` for the same reason as
   * `active`.
   */
  @Post('image')
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_IMAGE_BYTES }),
          new FileTypeValidator({
            fileType: new RegExp(`^(${ALLOWED_IMAGE_MIME.join('|')})$`),
          }),
        ],
      }),
    )
    file: Express.Multer.File,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<{ url: string }> {
    return this.adsService.uploadImage(file, currentUser.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Advertisement> {
    return this.adsService.findById(id);
  }

  @Post()
  create(
    @Body() dto: CreateAdvertisementDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Advertisement> {
    return this.adsService.create(dto, currentUser.id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdvertisementDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<Advertisement> {
    return this.adsService.update(id, dto, currentUser.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() currentUser: AuthenticatedUser,
  ): Promise<void> {
    return this.adsService.remove(id, currentUser.id);
  }
}
