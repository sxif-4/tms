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
import { EventImagesService } from './event-images.service';

/**
 * Photo management for a ride, show or beach event — the same shape as hotel
 * and room-type images. Open to park staff as well as admins, matching
 * `EventsController`: whoever can create the ride can photograph it.
 */
@Controller('events/:eventId/images')
@Roles(Role.Admin, Role.ParkStaff)
export class EventImagesController {
  constructor(private readonly imagesService: EventImagesService) {}

  @Get()
  list(
    @Param('eventId', ParseIntPipe) eventId: number,
  ): Promise<OwnedImage[]> {
    return this.imagesService.list(eventId);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @Param('eventId', ParseIntPipe) eventId: number,
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
    return this.imagesService.upload(user, eventId, file);
  }

  @Patch(':imageId/cover')
  setCover(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
  ): Promise<OwnedImage[]> {
    return this.imagesService.setCover(eventId, imageId);
  }

  @Delete(':imageId')
  remove(
    @Param('eventId', ParseIntPipe) eventId: number,
    @Param('imageId', ParseIntPipe) imageId: number,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<OwnedImage[]> {
    return this.imagesService.remove(user, eventId, imageId);
  }
}
