import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { Kafka, Consumer, ConsumerSubscribeTopic, ConsumerRunConfig } from 'kafkajs';

@Injectable()
export class KafkaConsumerService implements OnApplicationShutdown {
  private readonly kafka = new Kafka({
    brokers: ['localhost:9092'], // Array of broker addresses
  });

  private readonly consumers: Consumer[] = []; // Initialize consumers array

  /**
   * Consumes messages from a Kafka topic
   * 
   * @param {ConsumerSubscribeTopic} topic - Kafka topic to subscribe to
   * @param {ConsumerRunConfig} config - Consumer configuration
   */
  async consume(topic: ConsumerSubscribeTopic, config: ConsumerRunConfig,groupId:string) {
    const consumer = this.kafka.consumer({ groupId: groupId });
    

    await consumer.connect();
    await consumer.subscribe(topic);
    await consumer.run(config);
    
    this.consumers.push(consumer); // Store the consumer for later shutdown
  }
  

  /**
   * Gracefully shutdown Kafka consumers when the application is shutting down
   */
  async onApplicationShutdown() {
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}
