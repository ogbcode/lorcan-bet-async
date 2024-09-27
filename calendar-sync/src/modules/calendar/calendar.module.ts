import { Module } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { CalendarController } from './calendar.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Calendar } from './entities/calendar.entity';
import { EventService } from '../event/event.service';
import { EventModule } from '../event/event.module';
import { UserModule } from '../user/user.module';
import { KafkaModule } from '../kafka/kafka.module';

@Module({
  imports:[TypeOrmModule.forFeature([Calendar]),EventModule,UserModule,KafkaModule],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
