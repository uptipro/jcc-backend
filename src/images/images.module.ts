import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller';
import { FirebaseStorageService } from 'src/firebase-storage/firebase-storage.service';

@Module({
  controllers: [ImagesController],
  providers: [FirebaseStorageService],
})
export class ImagesModule {}
