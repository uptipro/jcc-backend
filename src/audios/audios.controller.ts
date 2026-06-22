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
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';

@Controller('audios')
export class AudiosController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('audio'))
  async uploadAudio(
    @UploadedFile() file: Express.Multer.File,
    @Body('fileName') fileName: string,
  ) {
    try {
      const fileUrl = await this.cloudinaryService.uploadFile(file, 'audio');
      return { message: 'Audio uploaded successfully', fileName, fileUrl };
    } catch (error) {
      console.error('Error uploading audio:', error);
      throw new Error('Failed to upload audio');
    }
  }

  @Get('list')
  async getAudios() {
    try {
      const files = await this.cloudinaryService.listFiles('audio');
      return files.map((file) => ({
        id: file.id,
        name: file.name,
        url: file.url,
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
      await this.cloudinaryService.deleteFile(fileName, 'audio');
      return { message: 'Audio deleted successfully' };
    } catch (error) {
      console.error('Error deleting audio:', error);
      return { message: 'Error deleting audio', error: (error as any).message };
    }
  }
}
