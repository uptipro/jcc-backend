import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';

@Controller('subscriptions')
export class SubscriptionsController {
    constructor(private firestoreService: FirestoreService) { }

    @Post()
    async subscribe(
        @Body() body: { email: string },
    ) {
        await this.firestoreService.saveSubscription(body.email);
        return { message: 'Subscribed successfully', data: body };
    }

    @Get()
    async getSubscriptions() {
        return await this.firestoreService.getSubscriptions();
    }

    @Get(':id')
    async getSubscriptionById(@Param('id') id: string) {
        return await this.firestoreService.getSubscriptionById(id);
    }

    @Post('unsubscribe/:id')
    async unsubscribe(
        @Param('id') id: string,
    ) {
        await this.firestoreService.removeSubscription(id);
        return { message: 'Unsubscribed successfully' };
    }
}
