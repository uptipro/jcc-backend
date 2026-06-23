import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImagesModule } from './images/images.module';
import { AudiosModule } from './audios/audios.module';
import { ContactsModule } from './contacts/contacts.module';
import { FirestoreService } from './firestore/firestore.service';
import { SchedulesModule } from './schedules/schedules.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { TrendingModule } from './trending/trending.module';
import { DatabaseModule } from './database/database.module';
import { DepartmentsModule } from './departments/departments.module';
import { MembersModule } from './members/members.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ImagesModule,
    AudiosModule,
    ContactsModule,
    SchedulesModule,
    SubscriptionsModule,
    TrendingModule,
    DepartmentsModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirestoreService],
})
export class AppModule { }
