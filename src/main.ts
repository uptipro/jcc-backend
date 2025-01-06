import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS with specific configuration
  app.enableCors({
    origin: ['https://rccg-jcc.vercel.app', 'https://jcc-admin.vercel.app'], // Allow requests from your frontend
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], // Allowed methods
    credentials: true, // Allow cookies if needed
  });

  await app.listen(5000);
}
bootstrap();
