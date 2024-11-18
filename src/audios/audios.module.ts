import { Module } from '@nestjs/common';
import { AudiosController } from './audios.controller';
import { FirebaseStorageService } from 'src/firebase-storage/firebase-storage.service';

@Module({
  controllers: [AudiosController],
  providers: [FirebaseStorageService],
})
export class AudiosModule {}
