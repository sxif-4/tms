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
import { RoomTypeImagesService } from './room-type-images.service';

/**
 * Photo management for a room type. Uploads are held in memory by multer and
 * written to disk by `ImageStorageService`, so the size/type guards below run
 * before anything touches the filesystem.
 */
@Controller('room-types/:roomTypeId/images')
@Roles(Role.Admin, Role.HotelStaff)
export class RoomTypeImagesController {
  constructor(private readonly imagesService: RoomTypeImagesService) {}

  @Get()
  list(
    @Param('roomTypeId', ParseIntPipe) roomTypeId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.list(user, roomTypeId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('roomTypeId', ParseIntPipe) roomTypeId: number,
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
    return this.imagesService.upload(user, roomTypeId, file);
  }

  @Patch(':imageId/cover')
  setCover(
    @Param('roomTypeId', ParseIntPipe) roomTypeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.setCover(user, roomTypeId, imageId);
  }

  @Delete(':imageId')
  remove(
    @Param('roomTypeId', ParseIntPipe) roomTypeId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.remove(user, roomTypeId, imageId);
  }
}
