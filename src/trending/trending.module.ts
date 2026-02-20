import { Module } from '@nestjs/common';
import { TrendingController } from './trending.controller';
import { FirestoreService } from 'src/firestore/firestore.service';

@Module({
    controllers: [TrendingController],
    providers: [FirestoreService],
})
export class TrendingModule { }
