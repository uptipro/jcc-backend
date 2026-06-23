import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Get,
  Delete,
  Param,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryService } from 'src/cloudinary/cloudinary.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('images')
export class ImagesController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('upload')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      const fileUrl = await this.cloudinaryService.uploadFile(file, 'image');
      return { message: 'Image uploaded successfully', fileUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new HttpException(
        'Failed to upload image',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('list')
  async getImages() {
    try {
      const files = await this.cloudinaryService.listFiles('image');
      return files.map((file) => ({ id: file.id, url: file.url }));
    } catch (error) {
      console.error('Error fetching images:', error);
      throw new HttpException(
        `Error fetching images: ${(error as Error).message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteImage(@Param('id') fileName: string) {
    try {
      await this.cloudinaryService.deleteFile(fileName, 'image');
      return { message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { message: 'Error deleting image', error: (error as any).message };
    }
  }
}
