import { Controller, Post, UploadedFile, UseInterceptors, Get, Delete, Param, HttpException, HttpStatus } from '@nestjs/common';
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
    try {
      const fileUrl = await this.firebaseStorageService.uploadFile(file, 'image');
      return { message: 'Image uploaded successfully', fileUrl };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new HttpException('Failed to upload image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('list')
  async getImages() {
    try {
      const files = await this.firebaseStorageService.listFiles('image');
      return files;
    } catch (error) {
      console.error('Error fetching images:', error);
      throw new HttpException('Error fetching images', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':name')
  async deleteImage(@Param('name') fileName: string) {
    try {
      await this.firebaseStorageService.deleteFile(fileName, 'image');
      return { message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new HttpException('Error deleting image', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
