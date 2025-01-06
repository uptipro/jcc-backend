import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseStorageService } from 'src/firebase-storage/firebase-storage.service';

@Controller('images')
export class ImagesController {
  constructor(
    private readonly firebaseStorageService: FirebaseStorageService,
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const fileUrl = await this.firebaseStorageService.uploadFile(file, 'image');
    return { message: 'Image uploaded successfully', fileUrl };
  }

  @Get('list')
  async getImages() {
    try {
      const files = await this.firebaseStorageService.listFiles('image');
      return files;
    } catch (error) {
      return { message: 'Error fetching images', error: (error as Error).message };
    }
  }
}
