import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Delete,
  Param,
  Body,
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
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string, // Receive file name from frontend
  ) {
    try {
      const fileUrl = await this.firebaseStorageService.uploadFile(
        file,
        'audio',
      );
      return { message: 'Audio uploaded successfully', fileName, fileUrl };
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  @Get('list')
  async getAudios() {
    try {
      const files = await this.firebaseStorageService.listFiles('audio');
      function getFileName(url) {
        // Decode the URL to handle any URL-encoded characters
        const decodedUrl = decodeURIComponent(url);

        // Extract the file name with ID and extension
        const fileNameWithIdAndExt = decodedUrl.split('/').pop();

        // Extract the file name without the ID and extension
        const fileName = fileNameWithIdAndExt
          .split('-')
          .slice(5, fileNameWithIdAndExt.length - 1)
          .join('-')
          .split('.mp3')[0]
          .split('-')
          .join(' ');

        return fileName;
      }

      return files.map((file) => ({
        name: getFileName(file.split('/').pop()), // Extract file name
        url: file,
      }));
    } catch (error) {
      return {
        message: 'Error fetching audios',
        error: (error as any).message,
      };
    }
  }

  @Delete(':name')
  async deleteAudio(@Param('name') fileName: string) {
    try {
      await this.firebaseStorageService.deleteFile(fileName, 'audio');
      return { message: 'Audio deleted successfully' };
    } catch (error) {
      return { message: 'Error deleting audio', error: (error as any).message };
    }
  }
}
