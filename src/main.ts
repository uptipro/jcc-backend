import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific configuration
  app.enableCors({
    origin: [
      'https://rccg-jcc.vercel.app',
      'https://jcc-admin.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001',
      'https://www.experiencejubilee.org',
      'https://experiencejubilee.org',
    ], // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed methods
    credentials: true, // Allow cookies if needed
  });

  await app.listen(process.env.PORT ?? 5000);
}
bootstrap();
