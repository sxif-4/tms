import { Module } from '@nestjs/common';
import { ImageStorageService } from './image-storage.service';
import { ImagesRepository } from './images.repository';

@Module({
  providers: [ImagesRepository, ImageStorageService],
  exports: [ImagesRepository, ImageStorageService],
})
export class ImagesModule {}
