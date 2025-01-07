import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { FirestoreService } from 'src/firestore/firestore.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private firestoreService: FirestoreService) { }

  @Post()
  async createSchedule(
    @Body() body: { title: string; description: string; startTime: string; endTime: string; location: string },
  ) {
    const schedule = await this.firestoreService.saveSchedule(body);
    return { message: 'Schedule created successfully', data: schedule };
  }

  @Get()
  async getSchedules() {
    return await this.firestoreService.getSchedules();
  }

  @Get(':id')
  async getScheduleById(@Param('id') id: string) {
    return await this.firestoreService.getScheduleById(id);
  }
}
