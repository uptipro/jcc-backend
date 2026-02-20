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

@Module({
  imports: [
    ImagesModule,
    AudiosModule,
    ContactsModule,
    SchedulesModule,
    SubscriptionsModule,
    TrendingModule,
  ],
  controllers: [AppController],
  providers: [AppService, FirestoreService],
})
export class AppModule { }
