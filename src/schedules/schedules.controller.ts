import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SchedulesService } from './schedules.service';

@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  async createSchedule(
    @Body()
    body: {
      title: string;
      description: string;
      date: string;
      time: string;
      color: string;
    },
  ) {
    const schedule = await this.schedulesService.createSchedule(body);
    return { message: 'Schedule created successfully', schedule };
  }

  @Get()
  async getSchedules() {
    return await this.schedulesService.getSchedules();
  }

  @Get(':id')
  async getScheduleById(@Param('id') id: string) {
    return await this.schedulesService.getScheduleById(id);
  }
}
