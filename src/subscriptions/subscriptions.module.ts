import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { FirestoreService } from 'src/firestore/firestore.service';

@Module({
    controllers: [SubscriptionsController],
    providers: [FirestoreService],
})
export class SubscriptionsModule { }
