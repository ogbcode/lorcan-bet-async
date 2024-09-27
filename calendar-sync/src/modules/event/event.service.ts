import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from './entities/event.entity';
import { Calendar } from '../calendar/entities/calendar.entity';

@Injectable()
export class EventService {
  private oAuth2Client: OAuth2Client;

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
  ) {
    const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;
    
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REDIRECT_URI) {
      throw new BadRequestException('Google OAuth environment variables not configured properly.');
    }

    this.oAuth2Client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);
  }

  /**
   * Sets OAuth client credentials using the provided access token
   * @param accessToken - Google OAuth access token
   */
  async setOAuthClient(accessToken: string): Promise<void> {
    if (!accessToken) {
      throw new BadRequestException('Access token is required.');
    }
    this.oAuth2Client.setCredentials({ access_token: accessToken });
  }

  /**
   * Finds an event by Google Event ID
   * @param googleEventId - Google Event ID
   * @returns The event or throws a NotFoundException if not found
   */
  async findOneByGoogleId(googleEventId: string): Promise<Event> {
    if (!googleEventId) {
      throw new BadRequestException('Google Event ID is required.');
    }

    const event = await this.eventRepository.findOne({ where: { googleEventId: googleEventId } });

    if (!event) {
      return null
    }
    
    return event;
  }

  /**
   * Creates a new event linked to the given calendar
   * @param calendar - The calendar to which the event is linked
   * @param eventData - Data Transfer Object for creating the event
   * @returns The created event
   */
  async createEvent(calendar: Calendar, eventData: CreateEventDto): Promise<Event> {
    if (!calendar) {
      throw new BadRequestException('A valid calendar is required.');
    }

    const event = this.eventRepository.create({
      ...eventData,
      calendar,
    });

    return await this.eventRepository.save(event);
  }

  /**
   * Updates an existing event by its ID
   * @param eventId - ID of the event to update
   * @param eventData - Data Transfer Object for updating the event
   * @returns The updated event
   */
  async updateEvent(eventId: string, eventData: UpdateEventDto): Promise<any> {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }

    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    
    if (!event) {
      throw new NotFoundException(`Event with ID ${eventId} not found.`);
    }

    Object.assign(event, eventData);
    await this.eventRepository.update(eventId,eventData);
    return {messsage:"Event updated successfully"}
  }

  /**
   * Deletes an event by its ID
   * @param eventId - ID of the event to delete
   */
  async deleteEvent(eventId: string): Promise<void> {
    if (!eventId) {
      throw new BadRequestException('Event ID is required.');
    }

    const result = await this.eventRepository.delete(eventId);

    if (result.affected === 0) {
      throw new NotFoundException(`Event with ID ${eventId} not found.`);
    }
  }

  /**
   * Finds all events for a specific calendar by calendar ID
   * @param calendarId - The ID of the calendar
   * @returns An array of events for the given calendar
   */
  async findEventsByCalendarId(calendarId: string): Promise<Event[]> {
    return await this.eventRepository.find({
      where: { calendar: { googleCalendarId: calendarId } },
      order: { startTime: 'ASC' }, // Optional: orders events by start time
    });
  }
}
