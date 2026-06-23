import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('trending')
export class TrendingController {
    constructor(private readonly firestoreService: FirestoreService) { }

    @Get()
    async getTrending() {
        return this.firestoreService.getTrending();
    }

    @Post()
    @UseGuards(AuthGuard)
    async createTrending(@Body() body: { content: string }) {
        return this.firestoreService.saveTrending(body.content);
    }

    @Delete(':id')
    @UseGuards(AuthGuard)
    async deleteTrending(@Param('id') id: string) {
        await this.firestoreService.removeTrending(id);
        return { message: 'Trending item deleted' };
    }
}
