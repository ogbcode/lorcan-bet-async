import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EachMessagePayload } from 'kafkajs';
import { CalendarService } from '../calendar/calendar.service';
import { KafkaConsumerService } from './kafka.consumer.service';

@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private readonly logger = new Logger(KafkaConsumer.name);
  private readonly maxRetries = 3; // Configurable max retry attempts
  private readonly retryDelay = 1000; // Configurable delay between retries in ms

  constructor(
    private readonly consumerService: KafkaConsumerService,
    private readonly calendarService: CalendarService
  ) {}

  /**
   * Called when the module is initialized.
   * This method starts Kafka consumers for the relevant topics.
   * Consumers are run in parallel using Promise.all for efficient startup.
   */
  async onModuleInit() {
    await Promise.all([
      this.consumeGoogleCalendarSync(),
      this.consumeEventUpdates(),
    ]);
  }

  /**
   * Consumes messages from the 'sync_google_calendar' Kafka topic.
   * Each message is processed by the handleSyncGoogleCalendarMessage method.
   */
  private async consumeGoogleCalendarSync() {
    await this.consumerService.consume(
      { topic: 'sync_google_calendar' ,},
      {
        eachMessage: async (payload: EachMessagePayload) => {
          console.log(`Received message from sync_google_calendar topic.`);
          await this.handleSyncGoogleCalendarMessage(payload);
        },
      },'nestjs-kafka'
    );
  }

  /**
   * Consumes messages from the 'sync_events_update' Kafka topic.
   * Each message is processed by the handleEventUpdates method.
   */
  private async consumeEventUpdates() {
    await this.consumerService.consume(
      { topic: 'sync_events_update' },
      {
        eachMessage: async (payload: EachMessagePayload) => {
          this.logger.debug(`Received message from sync_events_update topic.`);
          await this.handleEventUpdates(payload);
        },
      },"nestjs-kafka-event"
    );
  }

  /**
   * Processes event update messages received from the 'sync_events_update' Kafka topic.
   * Attempts to sync the event data with Google Calendar using calendarService.
   * Implements retry logic to handle failures, with exponential backoff for retrying.
   * 
   * @param payload - The message payload from Kafka containing event data.
   */
  private async handleEventUpdates(payload: EachMessagePayload) {
    const eventData = JSON.parse(payload.message.value.toString());
    
    try {
      await this.calendarService.syncGoogleEventChanges(eventData, eventData.id);
      this.logger.log(`Successfully updated event: ${eventData.id}`);
    } catch (error) {
      await this.retrySync(
        () => this.calendarService.syncGoogleEventChanges(eventData, eventData.id),
        `sync event ${eventData.id}`,
        this.maxRetries
      );
    }
  }

  /**
   * Processes sync requests for Google Calendar received from the 'sync_google_calendar' Kafka topic.
   * Attempts to sync Google Calendar data for a given user using calendarService.
   * Implements retry logic with exponential backoff for failures.
   * 
   * @param payload - The message payload from Kafka containing the user ID and access token.
   */
  private async handleSyncGoogleCalendarMessage(payload: EachMessagePayload) {
    const { userId, accessToken } = JSON.parse(payload.message.value.toString());
    this.logger.debug(`Processing Google Calendar sync for user: ${userId}`);

    try {
      const result = await this.retrySync(
        () => this.calendarService.syncGoogleEventsToInternal(userId, accessToken),
        `sync Google Calendars for user: ${userId}`,
        this.maxRetries
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to sync Google Calendars for user: ${userId} after ${this.maxRetries} attempts.`);
    }
  }

  /**
   * Handles retry logic for failed operations.
   * If an operation fails, it retries up to a maximum number of attempts with exponential backoff.
   * 
   * @param operation - A function representing the operation to retry (e.g., syncing an event or calendar).
   * @param description - A string describing the operation (used for logging purposes).
   * @param maxRetries - The maximum number of retry attempts.
   * 
   * @returns The result of the successful operation or undefined if all retries fail.
   */
  private async retrySync<T>(
    operation: () => Promise<T>, 
    description: string, 
    maxRetries: number
  ): Promise<T | undefined> {
    let attempts = 0;
    while (attempts < maxRetries) {
      try {
        const result = await operation();
        this.logger.log(`Successfully completed operation: ${description}`);
        return result;
      } catch (error) {
        attempts++;
        this.logger.warn(`Attempt ${attempts} failed for operation: ${description}, retrying...`, error.stack);

        if (attempts === maxRetries) {
          this.logger.error(`Operation ${description} failed after ${maxRetries} attempts.`);
          throw error;
        }
        
        // Exponential backoff: wait for an increasing amount of time before retrying
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * 2 ** (attempts - 1)));
      }
    }
  }
}
