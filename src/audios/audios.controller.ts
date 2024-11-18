import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseStorageService } from 'src/firebase-storage/firebase-storage.service';

@Controller('audios')
export class AudiosController {
  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(@UploadedFile() file: Express.Multer.File) {
    try {
      const fileUrl = await this.firebaseStorageService.uploadFile(
        file,
        'audio',
      );
      return { message: 'Audio uploaded successfully', fileUrl };
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  @Get('list')
  async getAudios() {
    try {
      const files = await this.firebaseStorageService.listFiles('audio');
      return files;
    } catch (error) {
      return { message: 'Error fetching audios', error: error.message };
    }
  }
}
