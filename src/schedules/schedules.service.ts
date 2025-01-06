import { Injectable } from '@nestjs/common';

@Injectable()
export class SchedulesService {
  private schedules: Array<any> = [];

  async createSchedule(schedule: any) {
    const newSchedule = { id: Date.now().toString(), ...schedule };
    console.log(schedule);
    this.schedules.push(newSchedule);
    return newSchedule;
  }

  async getSchedules() {
    return this.schedules;
  }

  async getScheduleById(id: string) {
    return this.schedules.find((schedule) => schedule.id === id);
  }
}
