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

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private firestoreService: FirestoreService) {}

  @Post()
  async subscribe(@Body() body: { email: string }) {
    await this.firestoreService.saveSubscription(body.email);
    return { message: 'Subscribed successfully', data: body };
  }

  @Get()
  @UseGuards(AuthGuard)
  async getSubscriptions() {
    return await this.firestoreService.getSubscriptions();
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getSubscriptionById(@Param('id') id: string) {
    return await this.firestoreService.getSubscriptionById(id);
  }

  @Post('unsubscribe/:id')
  @UseGuards(AuthGuard)
  async unsubscribe(@Param('id') id: string) {
    await this.firestoreService.removeSubscription(id);
    return { message: 'Unsubscribed successfully' };
  }
}
