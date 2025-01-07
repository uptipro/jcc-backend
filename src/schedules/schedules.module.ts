import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { FirestoreService } from 'src/firestore/firestore.service';

@Module({
  controllers: [SchedulesController],
  providers: [FirestoreService],

})
export class SchedulesModule { }
