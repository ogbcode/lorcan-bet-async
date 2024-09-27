import { Logger, Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { typeOrmConfig } from './config/typeormconfig';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ErrorInterceptor } from './interceptors/error.interceptor';
import { ErrorFilter } from './filters/error.filters';
import { AuthModule } from './modules/auth/auth.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { EventModule } from './modules/event/event.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { UserModule } from './modules/user/user.module';
import { KafkaConsumerService } from './modules/kafka/kafka.consumer.service';

@Module({
  imports: [TypeOrmModule.forRoot(typeOrmConfig),AuthModule,CalendarModule,EventModule,KafkaModule, UserModule],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: ErrorInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: ErrorFilter,
    },
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    KafkaConsumerService
  ],
})
export class AppModule {}
