import {
  Controller,
  Post,
  Put,
  Body,
  Get,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('schedules')
export class SchedulesController {
  constructor(private firestoreService: FirestoreService) { }

  @Post()
  @UseGuards(AuthGuard)
  async createSchedule(
    @Body() body: { title: string; description: string; startTime: string; endTime: string; location: string },
  ) {
    const schedule = await this.firestoreService.saveSchedule(body);
    return { message: 'Schedule created successfully', data: schedule };
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updateSchedule(
    @Param('id') id: string,
    @Body()
    body: {
      title?: string;
      description?: string;
      date?: string;
      startTime?: string;
      endTime?: string;
      location?: string;
    },
  ) {
    const schedule = await this.firestoreService.updateSchedule(id, body);
    return { message: 'Schedule updated successfully', data: schedule };
  }

  @Get()
  async getSchedules() {
    return await this.firestoreService.getSchedules();
  }

  @Get(':id')
  async getScheduleById(@Param('id') id: string) {
    return await this.firestoreService.getScheduleById(id);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deleteSchedule(@Param('id') id: string) {
    await this.firestoreService.deleteSchedule(id);
    return { message: 'Schedule deleted successfully' };
  }
}
