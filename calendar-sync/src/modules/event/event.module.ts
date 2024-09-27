import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventService } from './event.service';
import { EventController } from './event.controller';
import { Event } from './entities/event.entity';
import { CalendarModule } from '../calendar/calendar.module';  // Use forwardRef

@Module({
  imports: [
    TypeOrmModule.forFeature([Event]), 
    forwardRef(() => CalendarModule),  // Use forwardRef to avoid circular dependency
  ],
  controllers: [EventController],
  providers: [EventService],
  exports: [EventService],
})
export class EventModule {}
