import { Injectable, OnModuleInit, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Producer, ProducerRecord } from 'kafkajs';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnApplicationShutdown {
  // Initialize Kafka instance with the appropriate broker address
  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'], // Make sure your Kafka broker is correctly set here
  });

  // Initialize a Kafka producer
  private readonly producer: Producer = this.kafka.producer();

  // Called when the module is initialized
  async onModuleInit() {
    await this.producer.connect();
  }

  // Method to produce/send messages to Kafka topics
  async produce(record: ProducerRecord) {
    await this.producer.send(record);
  }

  // Called when the application is shut down
  async onApplicationShutdown(signal?: string) {
    await this.producer.disconnect();
  }
}
