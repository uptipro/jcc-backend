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
  ) { }

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string,
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
      console.log(files)
      const getFileName = (url: string) => {
        const decodedUrl = decodeURIComponent(url);
        const fileNameWithIdAndExt = decodedUrl.split('/').pop();
        const fileName = fileNameWithIdAndExt
          ?.split('-')
          .slice(5, fileNameWithIdAndExt.length - 1)
          .join('-')
          .split('.mp3')[0]
          .split('-')
          .join(' ');

        return fileName || 'Unknown';
      };

      function getFileNameFromUrl(url) {
        // Split the URL by '/' and get the last part 
        var parts = url.split('/');
        var fileNameWithToken = parts[parts.length - 1];

        // Split the file name and token by '?' and take the first part (file name) 
        var fileName = fileNameWithToken.split('?')[0];
        return fileName;
      }

      return files.map((file) => ({
        id: getFileNameFromUrl(file),
        name: getFileName(file),
        url: file,
      }));
    } catch (error) {
      return {
        message: 'Error fetching audios',
        error: (error as any).message,
      };
    }
  }

  @Delete(':id')
  async deleteAudio(@Param('id') fileName: string) {
    try {
      const files = await this.firebaseStorageService.listFiles('audio');

      // Find the file URL that matches the given name
      const targetFile = files.find((file) =>
        decodeURIComponent(file).includes(fileName)
      );

      if (!targetFile) {
        return { message: `File with name "${fileName}" not found.` };
      }

      // Use the full path to delete the file
      const response = await this.firebaseStorageService.deleteFile(fileName, 'audio');
      console.log(response)
      return { message: 'Audio deleted successfully' };
    } catch (error) {
      console.error('Error deleting audio:', error);
      return { message: 'Error deleting audio', error: (error as any).message };
    }
  }

}
