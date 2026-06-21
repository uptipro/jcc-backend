import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import { ensureFirebaseInitialized } from '../firebase/firebase-credential';

@Injectable()
export class FirebaseStorageService {
  constructor() {
    ensureFirebaseInitialized();
  }

  // Upload file to Firebase Storage (images and audios in their respective directories)
  async uploadFile(
    file: Express.Multer.File,
    type: 'image' | 'audio',
  ): Promise<string> {
    const bucket = admin.storage().bucket('hr-dashboard-18e9e.appspot.com');
    const directory = type === 'image' ? 'jcc/images' : 'jcc/audios';
    const fileName = `${directory}/${uuidv4()}-${file.originalname}`; // Simplified naming with UUID for uniqueness

    const fileExtension = file.originalname.split('.').pop();
    const mimeTypeMapping: Record<string, string> = {
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      ogg: 'audio/ogg',
      jpg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
    };

    const contentType = mimeTypeMapping[fileExtension] || file.mimetype;

    const fileUpload = bucket.file(fileName);

    try {
      // Save the file with explicit metadata
      await fileUpload.save(file.buffer, {
        metadata: {
          contentType,
          cacheControl: 'public, max-age=31536000', // Cache control for long-term access
        },
      });

      // Make the file publicly accessible
      await fileUpload.makePublic();

      console.log('File uploaded and made public successfully.');

      return `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    } catch (error) {
      console.error('Error during file upload:', error);
      throw new Error('Failed to upload file to Firebase Storage');
    }
  }

  // List all files in a specific directory (images or audios)
  async listFiles(type: 'image' | 'audio'): Promise<string[]> {
    const bucket = admin.storage().bucket('hr-dashboard-18e9e.appspot.com');
    const directory = type === 'image' ? 'jcc/images' : 'jcc/audios';

    try {
      const [files] = await bucket.getFiles({ prefix: directory });
      console.log(`Found ${files.length} files in directory: ${directory}`);

      // Generate public URLs for each file
      const fileUrls = files.map((file) => {
        const encodedFileName = encodeURIComponent(file.name); // Encode file name for URL
        return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedFileName}?alt=media&token=${file.metadata.metadata?.firebaseStorageDownloadTokens || ''}`;
      });

      return fileUrls;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Unable to fetch files from Firebase Storage');
    }
  }

  // Delete a file from Firebase Storage
  async deleteFile(fileName: string, type: 'image' | 'audio'): Promise<void> {
    console.log(fileName);
    const bucket = admin.storage().bucket('hr-dashboard-18e9e.appspot.com');
    const directory = type === 'image' ? 'jcc/images' : 'jcc/audios';
    const filePath = `${directory}/${fileName}`;
    try {
      const file = bucket.file(filePath);
      await file.delete();
      console.log(`File ${filePath} deleted successfully.`);
    } catch (error) {
      console.error(`Error deleting file ${filePath}:`, error);
      throw new Error(`Failed to delete file: ${fileName}`);
    }
  }
}
