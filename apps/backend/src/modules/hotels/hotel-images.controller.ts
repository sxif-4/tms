import {
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { Role } from '../../shared/enums/role.enum';
import {
  ALLOWED_IMAGE_MIME,
  MAX_IMAGE_BYTES,
} from '../../shared/images/image-storage.service';
import type { OwnedImage } from '../../shared/images/images.repository';
import type { AuthenticatedUser } from '../../shared/interfaces/authenticated-user.interface';
import { HotelImagesService } from './hotel-images.service';

/**
 * Photo management for a hotel — the same shape as room-type images, admin
 * only: the hotel record itself is admin-owned, hotel_staff manage rooms and
 * bookings within it (see `HotelsController`).
 */
@Controller('hotels/:hotelId/images')
@Roles(Role.Admin)
export class HotelImagesController {
  constructor(private readonly imagesService: HotelImagesService) {}

  @Get()
  list(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.list(user, hotelId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('hotelId', ParseIntPipe) hotelId: number,
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
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage> {
    return this.imagesService.upload(user, hotelId, file);
  }

  @Patch(':imageId/cover')
  setCover(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.setCover(user, hotelId, imageId);
  }

  @Delete(':imageId')
  remove(
    @Param('hotelId', ParseIntPipe) hotelId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.remove(user, hotelId, imageId);
  }
}
