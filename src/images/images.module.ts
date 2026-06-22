import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  controllers: [ImagesController],
  providers: [CloudinaryService],
})
export class ImagesModule {}
