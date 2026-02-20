import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';

@Controller('trending')
export class TrendingController {
    constructor(private readonly firestoreService: FirestoreService) { }

    @Get()
    async getTrending() {
        return this.firestoreService.getTrending();
    }

    @Post()
    async createTrending(@Body() body: { content: string }) {
        return this.firestoreService.saveTrending(body.content);
    }

    @Delete(':id')
    async deleteTrending(@Param('id') id: string) {
        await this.firestoreService.removeTrending(id);
        return { message: 'Trending item deleted' };
    }
}
