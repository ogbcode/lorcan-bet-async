import { Module, forwardRef } from '@nestjs/common';
import { KafkaController } from './kafka.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';
import { KafkaConsumerService } from './kafka.consumer.service';
import { CalendarModule } from '../calendar/calendar.module'; // Adjusted import
import { KafkaProducerService } from './kafka.producer.service';
import { KafkaConsumer } from './kafka.consumer';
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'KAFKA_SERVICE',
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'nestjs-consumer-client',
            brokers: ['localhost:9092'], 
            // logLevel: logLevel.DEBUG,
          },
          consumer: {
            groupId: 'calendar-sync-group',
          },
        },
      },
    ]),
    forwardRef(() => CalendarModule), 
  ],
  controllers: [KafkaController],
  providers: [KafkaConsumerService,KafkaProducerService,KafkaConsumer],
  exports: [ClientsModule, KafkaConsumerService,KafkaProducerService],
})
export class KafkaModule {}
