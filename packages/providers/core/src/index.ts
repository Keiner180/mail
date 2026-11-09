import {
  EmailMessageSummary,
  EmailMessageDetail,
  SendEmailInput,
  MailFolder,
  CalendarEvent,
  CreateCalendarEventInput,
} from "@jabvox/contracts";

export interface MailProviderAdapter {
  listMessages(params: {
    folder: MailFolder;
    query?: string;
    pageToken?: string;
    maxResults?: number;
  }): Promise<{
    messages: EmailMessageSummary[];
    nextPageToken: string | null;
    resultSizeEstimate: number;
  }>;

  getMessage(messageId: string): Promise<EmailMessageDetail>;

  sendMessage(payload: SendEmailInput): Promise<{ id: string; threadId?: string }>;

  getAttachmentBuffer(
    messageId: string,
    attachmentId: string
  ): Promise<{ buffer: Buffer; size: number }>;

  batchModify(
    messageIds: string[],
    action: "read" | "unread" | "star" | "unstar" | "trash" | "spam"
  ): Promise<void>;
}

export interface CalendarProviderAdapter {
  listEvents(params?: {
    timeMin?: string;
    timeMax?: string;
    query?: string;
  }): Promise<CalendarEvent[]>;

  createEvent(input: CreateCalendarEventInput): Promise<CalendarEvent>;

  updateEvent(
    eventId: string,
    input: Partial<CreateCalendarEventInput>
  ): Promise<CalendarEvent>;

  deleteEvent(eventId: string): Promise<void>;
}
