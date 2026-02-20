import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';

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
  async getMessages() {
    return await this.firebaseFirestoreService.getMessages();
  }

  @Get('messages/:id')
  async getMessageById(@Param('id') id: string) {
    return await this.firebaseFirestoreService.getMessageById(id);
  }

  @Post('reply/:id')
  async replyToMessage(
    @Param('id') id: string,
    @Body() body: { replyMessage: string },
  ) {
    await this.firebaseFirestoreService.replyToMessage(id, body.replyMessage);
    return { message: 'Reply sent successfully' };
  }
}
