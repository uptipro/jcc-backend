import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('contacts')
export class ContactsController {
  constructor(private firebaseFirestoreService: FirestoreService) { }

  @Post()
  async sendMessage(
    @Body()
    body: {
      name: string;
      email: string;
      message: string;
      type?: string;
      churchEmail?: string;
    },
  ) {
    await this.firebaseFirestoreService.saveMessage(
      body.name,
      body.email,
      body.message,
      body.type,
      body.churchEmail,
    );
    return { message: 'Contact message received', data: body };
  }

  @Get('messages')
  @UseGuards(AuthGuard)
  async getMessages() {
    return await this.firebaseFirestoreService.getMessages();
  }

  @Get('messages/:id')
  @UseGuards(AuthGuard)
  async getMessageById(@Param('id') id: string) {
    return await this.firebaseFirestoreService.getMessageById(id);
  }

  @Post('reply/:id')
  @UseGuards(AuthGuard)
  async replyToMessage(
    @Param('id') id: string,
    @Body() body: { replyMessage: string },
  ) {
    await this.firebaseFirestoreService.replyToMessage(id, body.replyMessage);
    return { message: 'Reply sent successfully' };
  }
}
