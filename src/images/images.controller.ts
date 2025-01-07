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
      function getFileNameFromUrl(url) {
        // Split the URL by '/' and get the last part
        var parts = url.split('/');
        var fileNameWithToken = parts[parts.length - 1];

        // Split the file name and token by '?' and take the first part (file name)
        var tempName = fileNameWithToken.split('?')[0];

        var fileName = tempName.split('%')[2];

        if (fileName.startsWith('2F')) {
          fileName = fileName.substring(2);
        }

        return fileName;
      }
      console.log(getFileNameFromUrl(files[0]));
      return files.map((file) => ({
        id: getFileNameFromUrl(file),
        url: file,
      }));
    } catch (error) {
      console.error('Error fetching images:', error);
      throw new HttpException('Error fetching images', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete(':id')
  async deleteImage(@Param('id') fileName: string) {
    console.log(fileName);
    try {
      const files = await this.firebaseStorageService.listFiles('image');

      // Find the file URL that matches the given name
      const targetFile = files.find((file) =>
        decodeURIComponent(file).includes(fileName)
      );

      if (!targetFile) {
        return { message: `File with name "${fileName}" not found.` };
      }

      // Use the full path to delete the file
      await this.firebaseStorageService.deleteFile(fileName, 'image');
      return { message: 'Image deleted successfully' };
    } catch (error) {
      console.error('Error deleting image:', error);
      return { message: 'Error deleting image', error: (error as any).message };
    }
  }
}
