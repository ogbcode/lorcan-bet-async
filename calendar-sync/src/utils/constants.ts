interface GoogleCalendarResponse {
    kind: string;
    etag: string;
    summary: string;
    description: string;
    updated: string;
    timeZone: string;
    accessRole: string;
    defaultReminders: any[];
    nextSyncToken: string;
    items: CalendarEvent[]; // Array of events
  }
  
  interface CalendarEvent {
    kind: string;
    etag: string;
    id: string;
    status: string;
    htmlLink: string;
    created: string;
    updated: string;
    summary: string;
    description: string;
    creator: {
      email: string;
    };
    organizer: {
      email: string;
      displayName: string;
      self: boolean;
    };
    start: {
      dateTime: Date;
      timeZone: string;
    };
    end: {
      dateTime: Date;
      timeZone: string;
    };
    iCalUID: string;
    sequence: number;
    reminders: {
      useDefault: boolean;
    };
    eventType: string;
  }
  
  interface DefaultReminder {
    method: string;
    minutes: number;
}

interface NotificationSetting {
    type: string;
    method: string;
}

interface ConferenceProperties {
    allowedConferenceSolutionTypes: string[];
}

interface CalendarListEntry {
    kind: "calendar#calendarListEntry";
    etag: string;
    id: string;
    summary: string;
    description?: string;
    timeZone: string;
    colorId: string;
    backgroundColor: string;
    foregroundColor: string;
    selected: boolean;
    accessRole: "owner" | "reader" | "writer";
    defaultReminders: DefaultReminder[];
    notificationSettings?: {
        notifications: NotificationSetting[];
    };
    primary?: boolean;
    conferenceProperties: ConferenceProperties;
}

interface CalendarListResponse {
    kind: "calendar#calendarList";
    etag: string;
    nextSyncToken: string;
    items: CalendarListEntry[];
}
