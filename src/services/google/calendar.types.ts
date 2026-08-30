export type GoogleCalendar = {
    id: string;
    summary: string;
    description?: string;
    backgroundColor?: string;
    foregroundColor?: string;
    primary?: boolean;
  };
  
  export type GoogleCalendarListResponse = {
    items?: GoogleCalendar[];
    nextPageToken?: string;
  };
  
  export type GoogleEventDateTime = {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  
  export type GoogleCalendarEvent = {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
  
    start: GoogleEventDateTime;
    end: GoogleEventDateTime;
  
    status?: string;
    htmlLink?: string;
  };
  
  export type GoogleEventsResponse = {
    items?: GoogleCalendarEvent[];
    nextPageToken?: string;
  };
  
  export type CalendarEvent = {
    id: string;
    calendarId: string;
    calendarName: string;
  
    title: string;
    description?: string;
    location?: string;
  
    start: Date;
    end: Date;
  
    allDay: boolean;
  
    calendarColor?: string;
  };