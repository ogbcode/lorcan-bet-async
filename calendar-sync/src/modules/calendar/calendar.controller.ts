import { Controller, Get, Req, Res, Body, HttpStatus, Version, Post, Param, NotFoundException, InternalServerErrorException, BadRequestException, Logger, Inject } from '@nestjs/common';
import { CalendarService } from './calendar.service';
import { Response } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Event } from '../event/entities/event.entity';
import { ClientKafka } from '@nestjs/microservices';
import { KafkaProducerService } from '../kafka/kafka.producer.service';

@ApiTags('calendar')
@Controller('calendar')
export class CalendarController {
  private readonly logger = new Logger(CalendarController.name);

  constructor(
    private readonly producerService:KafkaProducerService,
    private readonly calendarService: CalendarService
  ) {}

  @Get('/:userId/calendars')
  @Version("1")
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List user calendars' })
  @ApiResponse({ status: 200, description: 'List of user calendars' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async listUserCalendars(@Param('userId') userId: string, @Res() res: Response): Promise<any> {
    try {
      const calendars = await this.calendarService.findAllCalendars(userId);
      return res.status(HttpStatus.OK).json(calendars);
    } catch (error) {
      this.logger.error(`Failed to fetch calendars for user ${userId}: ${error.message}`);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message });
    }
  }

  @Post('sync')
  @Version("1")
  @ApiOperation({ summary: 'Sync Google Calendar events to internal system' })
  @ApiResponse({ status: 200, description: 'Events synced successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  async syncGoogleEvents(@Req() req: any): Promise<{ message: string }> {
    const { userId, accessToken } = req.body;

    if (!userId || !accessToken) {
      throw new BadRequestException('userId and accessToken are required');
    }

    try {
      await this.producerService.produce({
        topic: 'sync_google_calendar',
        messages: [
          {
            value: JSON.stringify({ userId: userId, accessToken: accessToken }),
          },
        ],
      });
      
      return { message: 'Sync request submitted successfully' };
    } catch (error) {
      this.logger.error(`Failed to emit sync request: ${error.message}`);
      throw new InternalServerErrorException('Error submitting sync request');
    }
  }

  @Get('/:calendarId/events')
  @Version("1")
  @ApiOperation({ summary: 'Get all events for a specific calendar' })
  @ApiResponse({ status: 200, description: 'Events fetched successfully', type: [Event] }) 
  @ApiResponse({ status: 404, description: 'Calendar not found' })
  async getEventsForCalendar(@Param('calendarId') calendarId: string): Promise<Event[]> {
    try {
      return await this.calendarService.findAllEventsForCalendar(calendarId);
    } catch (error) {
      this.logger.error(`Failed to fetch events for calendar ${calendarId}: ${error.message}`);
      throw new NotFoundException(`Calendar with ID ${calendarId} not found`);
    }
  }

  @Post('/event/update')
  @Version("1")
  
  @ApiOperation({ summary: 'Sync event updates from Google Calendar' })
  @ApiResponse({ status: 201, description: 'Successfully synced event updates' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async syncEventChanges(@Body() eventData: CalendarEvent): Promise<{ message: string }> {
    if (!eventData || !eventData.id) {
      throw new BadRequestException('Event data with an ID is required');
    }

    try {
   
      await this.producerService.produce({
        topic: 'sync_events_update', 
        messages: [
          {
            key: eventData.id, 
            value: JSON.stringify(eventData), 
          },
        ],
      });

      return { message: 'Sync request enqueued successfully' };
    } catch (error) {
      this.logger.error(`Error enqueuing sync request for event ${eventData.id}: ${error.message}`);
      throw new InternalServerErrorException('Error enqueuing sync request');
    }
  }
}