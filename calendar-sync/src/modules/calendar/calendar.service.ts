import { Injectable, NotFoundException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calendar } from './entities/calendar.entity';
import { EventService } from '../event/event.service';
import { CreateEventDto } from '../event/dto/create-event.dto';
import { Event } from '../event/entities/event.entity';
import { CreateCalendarDto } from './dto/create-calendar.dto';
import { UserService } from '../user/user.service';
@Injectable()
export class CalendarService {

  private oAuth2Client: OAuth2Client;

  constructor( @InjectRepository(Calendar)
  private readonly calendarRepository: Repository<Calendar>,private eventService: EventService,private userService: UserService) {
    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI;

    this.oAuth2Client = new OAuth2Client(
      googleClientId,
      googleClientSecret,
      googleRedirectUri,
    );
  }
  async setOAuthClient(accessToken: string): Promise<void> {
    this.oAuth2Client.setCredentials({ access_token: accessToken });
  }
  async generateRandomChannelId():Promise<string> {
    const length = 12;
    let channelId = '';
    
    for (let i = 0; i < length; i++) {
      channelId += Math.floor(Math.random() * 10); // Generate a random digit between 0-9
    }
    return channelId;
  }
async listUserCalendars(accessToken: string): Promise<CalendarListEntry[]> {
    this.setOAuthClient(accessToken);
    const { data } = await this.oAuth2Client.request<CalendarListResponse>({
        url: 'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        method: 'GET',
    });
    return data.items;
}

  async findOne(calendarId: string): Promise<Calendar | null> {
    return this.calendarRepository.findOne({ where: { googleCalendarId: calendarId } });
}
  async fetchCalendarEvents(googleCalendarId: string, accessToken: string): Promise<CalendarEvent[]> {
    this.setOAuthClient(accessToken);
    const { data } = await this.oAuth2Client.request<GoogleCalendarResponse>({
      url: `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events`,
      method: 'GET',
    });
  
    return data.items||[] ;
  }
  
  
  async syncGoogleEventsToInternal(userId: string, accessToken: string): Promise<any> {
    const calendars = await this.listUserCalendars(accessToken);
  
    for (const calendar of calendars) {
      const calendarId = calendar.id;
      calendar.id = undefined;
      const channelId=await this.generateRandomChannelId()

      const existingCalendar = await this.calendarRepository.findOne({ where: { googleCalendarId: calendarId } });
      
      if (existingCalendar) {
        await this.syncGoogleEventsForCalendar(existingCalendar.googleCalendarId, accessToken,existingCalendar.channelId);
      } else {
        const newCalendar = await this.createCalendar({ ...calendar, userId: userId, googleCalendarId: calendarId ,channelId:channelId});
        await this.syncGoogleEventsForCalendar(newCalendar.googleCalendarId, accessToken,channelId);
      }
    }
    return {message:"Succefully synced Calendars",Calendars:calendars};

  }
  
  async syncGoogleEventsForCalendar(calendarId: string, accessToken: string,channelId:string): Promise<void> {
    let googleEvents: CalendarEvent[] = [];
  
    try {
      googleEvents = await this.fetchCalendarEvents(calendarId, accessToken);
    } catch (error) {
      console.warn(`Failed to fetch events for calendar ${calendarId}: ${error.message}`);
      return;
    }
  
    for (const googleEvent of googleEvents) {
      const googleEventId = googleEvent.id;
      googleEvent.id = undefined;
  
      const eventData = {
        ...googleEvent,
        calendarId: calendarId,
        googleEventId: googleEventId,
        startTime: googleEvent.start.dateTime,
        endTime: googleEvent.end.dateTime,
        useDefaultReminders: googleEvent.reminders?.useDefault || false,
        timeZone: googleEvent.start.timeZone || null,
      };
      const existingEvent = await this.eventService.findOneByGoogleId(googleEventId);
      if (existingEvent) {
        // If the event exists, update it
        // console.log("Existing event found, updating...");
        //await this.eventService.updateEvent(existingEvent.id, eventData);
    } else {
        // If the event does not exist, add it
        console.log("No existing event found, adding new event...");
        await this.addEvent(eventData);
    
    }
  }
    await this.watchGoogleCalendar(calendarId, accessToken,channelId);
  }
  
  
  async findAllCalendars(userId: string): Promise<Calendar[]> {
    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
      
    }

    // Fetch calendars associated with the user
    return this.calendarRepository.find({ where: { user: { id: userId } } });
  }


  async watchGoogleCalendar(channelId:string,googleCalendarId: string, accessToken: string): Promise<any> {
    try {
      // Attempt to create a new watch channel
      const response = await this.oAuth2Client.request({
        url: `https://www.googleapis.com/calendar/v3/calendars/${googleCalendarId}/events/watch`,
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        data: {
          id:channelId, 
          type: 'webhook',
          address: process.env.WEBHOOKURL,
        },
      });
      console.log(response.data)
      return response.data;
      
    } catch (error) {
      
      if (error.response && error.response.status === 409) { // 409 Conflict error for duplicate channel
        // console.log(`Channel for calendar ID ${googleCalendarId} already exists. Leaving the existing channel in place.`);
        return { message: 'Channel already exists, leaving the existing channel in place.' }; // Or return any relevant data
      } else {
        
        // console.log(`Failed to watch Google Calendar: ${googleCalendarId}`, error.message);
     
      }
    }
  }
  

  async syncGoogleEventChanges(event:CalendarEvent, internalCalendarId: string): Promise<void> {
    const existingEvent = await this.eventService.findOneByGoogleId(event.id);

    if (!existingEvent) {
      const calendar=await this.findOne(internalCalendarId);
        await this.eventService.createEvent(calendar,{
          calendarId:internalCalendarId,
            googleEventId: event.id,
            summary: event.summary,
            description: event.description,
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
            status: event.status,
            htmlLink: event.htmlLink,
            iCalUID: event.iCalUID,
            sequence: event.sequence,
            useDefaultReminders: event.reminders?.useDefault || false,
            eventType: event.eventType,
            timeZone: event.start.timeZone || null,
        });
    } else if (event.status === 'cancelled') {
        await this.eventService.deleteEvent(existingEvent.id);
    } else {
        await this.eventService.updateEvent(existingEvent.id, {
            summary: event.summary,
            description: event.description,
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
            status: event.status,
          
            htmlLink: event.htmlLink,
            iCalUID: event.iCalUID,
            sequence: event.sequence,
            useDefaultReminders: event.reminders?.useDefault || false,
            eventType: event.eventType,
            timeZone: event.start.timeZone || null,
        });
    }
}

  
  async addEvent(eventData: CreateEventDto): Promise<Event> {
    const calendar = await this.calendarRepository.findOne({ where: { googleCalendarId: eventData.calendarId } });
    if (!calendar) {
      throw new NotFoundException(`Calendar with ID ${eventData.calendarId} not found`);
    }

    const event = this.eventService.createEvent(calendar ,eventData  );
    return event
  }

  async createCalendar(createCalendarDto: CreateCalendarDto): Promise<Calendar> {
    const user = await this.userService.findOne(createCalendarDto.userId);

    if (!user) {
      throw new NotFoundException(`User with ID ${createCalendarDto.userId} not found`);
    }

    const calendar = this.calendarRepository.create({ ...createCalendarDto, user });
    return this.calendarRepository.save(calendar);
  }

  async findAllEventsForCalendar(calendarId: string): Promise<Event[]> {

    const calendar = await this.calendarRepository.findOne({ where: {googleCalendarId: calendarId } });
 
    if (!calendar) {
      throw new NotFoundException(`Calendar with ID ${calendarId} not found`);
    }

    // Call the findEventsByCalendarId function
    return await this.eventService.findEventsByCalendarId(calendarId);
  }
}

