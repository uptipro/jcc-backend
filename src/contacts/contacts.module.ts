import { Module } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { FirestoreService } from 'src/firestore/firestore.service';

@Module({
  controllers: [ContactsController],
  providers: [FirestoreService],
})
export class ContactsModule {}
