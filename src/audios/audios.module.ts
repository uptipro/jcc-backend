import { Module } from '@nestjs/common';
import { AudiosController } from './audios.controller';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Module({
  controllers: [AudiosController],
  providers: [CloudinaryService],
})
export class AudiosModule {}
