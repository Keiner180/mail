import { google, calendar_v3 } from "googleapis";
import { ConnectedAccount } from "@prisma/client";
import { getAuthenticatedClient } from "../gmail/oauth";

export interface CalendarEventSummary {
  id: string;
  summary: string;
  description?: string;
  start: string; // ISO date-time or YYYY-MM-DD
  end: string;
  isAllDay: boolean;
  location?: string;
  meetUrl?: string;
  hangoutLink?: string;
  attendees?: {
    email: string;
    displayName?: string;
    responseStatus?: string;
  }[];
  colorId?: string;
  htmlLink?: string;
  status?: string;
  creatorEmail?: string;
}

export interface CreateEventInput {
  summary: string;
  description?: string;
  start: string; // ISO string or YYYY-MM-DD
  end: string;
  isAllDay?: boolean;
  location?: string;
  attendees?: string[];
  createMeetLink?: boolean;
  colorId?: string;
}

export interface UpdateEventInput extends CreateEventInput {
  eventId: string;
}

export async function getCalendarClient(account: ConnectedAccount) {
  const authClient = await getAuthenticatedClient(account);
  return google.calendar({ version: "v3", auth: authClient });
}

export async function listCalendarEvents(
  account: ConnectedAccount,
  options?: {
    timeMin?: string;
    timeMax?: string;
    maxResults?: number;
    q?: string;
  }
): Promise<CalendarEventSummary[]> {
  const calendar = await getCalendarClient(account);

  const timeMin = options?.timeMin || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const timeMax = options?.timeMax || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString();

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    singleEvents: true,
    orderBy: "startTime",
    maxResults: options?.maxResults || 250,
    q: options?.q || undefined,
  });

  const rawEvents = response.data.items || [];

  return rawEvents.map((evt): CalendarEventSummary => {
    const isAllDay = Boolean(evt.start?.date);
    const start = evt.start?.dateTime || evt.start?.date || "";
    const end = evt.end?.dateTime || evt.end?.date || "";

    // Extract Meet URL from conferenceData or hangoutLink
    let meetUrl: string | undefined = evt.hangoutLink || undefined;
    if (!meetUrl && evt.conferenceData?.entryPoints) {
      const videoEntry = evt.conferenceData.entryPoints.find(
        (ep) => ep.entryPointType === "video"
      );
      if (videoEntry?.uri) {
        meetUrl = videoEntry.uri;
      }
    }

    return {
      id: evt.id || "",
      summary: evt.summary || "(Sin título)",
      description: evt.description || undefined,
      start,
      end,
      isAllDay,
      location: evt.location || undefined,
      meetUrl,
      hangoutLink: evt.hangoutLink || undefined,
      attendees: evt.attendees?.map((a) => ({
        email: a.email || "",
        displayName: a.displayName || undefined,
        responseStatus: a.responseStatus || undefined,
      })),
      colorId: evt.colorId || undefined,
      htmlLink: evt.htmlLink || undefined,
      status: evt.status || "confirmed",
      creatorEmail: evt.creator?.email || undefined,
    };
  });
}

export async function createCalendarEvent(
  account: ConnectedAccount,
  input: CreateEventInput
): Promise<CalendarEventSummary> {
  const calendar = await getCalendarClient(account);

  const requestBody: calendar_v3.Schema$Event = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    colorId: input.colorId || undefined,
  };

  if (input.isAllDay) {
    const startDateOnly = input.start.split("T")[0];
    const endDateOnly = input.end.split("T")[0];
    requestBody.start = { date: startDateOnly };
    requestBody.end = { date: endDateOnly };
  } else {
    requestBody.start = { dateTime: new Date(input.start).toISOString() };
    requestBody.end = { dateTime: new Date(input.end).toISOString() };
  }

  if (input.attendees && input.attendees.length > 0) {
    requestBody.attendees = input.attendees.map((email) => ({ email: email.trim() }));
  }

  if (input.createMeetLink) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await calendar.events.insert({
    calendarId: "primary",
    conferenceDataVersion: input.createMeetLink ? 1 : 0,
    requestBody,
  });

  const evt = response.data;
  const isAllDay = Boolean(evt.start?.date);

  let meetUrl: string | undefined = evt.hangoutLink || undefined;
  if (!meetUrl && evt.conferenceData?.entryPoints) {
    const videoEntry = evt.conferenceData.entryPoints.find((ep) => ep.entryPointType === "video");
    if (videoEntry?.uri) {
      meetUrl = videoEntry.uri;
    }
  }

  return {
    id: evt.id || "",
    summary: evt.summary || "(Sin título)",
    description: evt.description || undefined,
    start: evt.start?.dateTime || evt.start?.date || "",
    end: evt.end?.dateTime || evt.end?.date || "",
    isAllDay,
    location: evt.location || undefined,
    meetUrl,
    hangoutLink: evt.hangoutLink || undefined,
    attendees: evt.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName || undefined,
      responseStatus: a.responseStatus || undefined,
    })),
    colorId: evt.colorId || undefined,
    htmlLink: evt.htmlLink || undefined,
    status: evt.status || "confirmed",
  };
}

export async function updateCalendarEvent(
  account: ConnectedAccount,
  input: UpdateEventInput
): Promise<CalendarEventSummary> {
  const calendar = await getCalendarClient(account);

  const requestBody: calendar_v3.Schema$Event = {
    summary: input.summary,
    description: input.description,
    location: input.location,
    colorId: input.colorId || undefined,
  };

  if (input.isAllDay) {
    const startDateOnly = input.start.split("T")[0];
    const endDateOnly = input.end.split("T")[0];
    requestBody.start = { date: startDateOnly };
    requestBody.end = { date: endDateOnly };
  } else {
    requestBody.start = { dateTime: new Date(input.start).toISOString() };
    requestBody.end = { dateTime: new Date(input.end).toISOString() };
  }

  if (input.attendees && input.attendees.length > 0) {
    requestBody.attendees = input.attendees.map((email) => ({ email: email.trim() }));
  }

  if (input.createMeetLink) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: `meet-update-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    };
  }

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    conferenceDataVersion: input.createMeetLink ? 1 : 0,
    requestBody,
  });

  const evt = response.data;
  const isAllDay = Boolean(evt.start?.date);

  let meetUrl: string | undefined = evt.hangoutLink || undefined;
  if (!meetUrl && evt.conferenceData?.entryPoints) {
    const videoEntry = evt.conferenceData.entryPoints.find((ep) => ep.entryPointType === "video");
    if (videoEntry?.uri) {
      meetUrl = videoEntry.uri;
    }
  }

  return {
    id: evt.id || "",
    summary: evt.summary || "(Sin título)",
    description: evt.description || undefined,
    start: evt.start?.dateTime || evt.start?.date || "",
    end: evt.end?.dateTime || evt.end?.date || "",
    isAllDay,
    location: evt.location || undefined,
    meetUrl,
    hangoutLink: evt.hangoutLink || undefined,
    attendees: evt.attendees?.map((a) => ({
      email: a.email || "",
      displayName: a.displayName || undefined,
      responseStatus: a.responseStatus || undefined,
    })),
    colorId: evt.colorId || undefined,
    htmlLink: evt.htmlLink || undefined,
    status: evt.status || "confirmed",
  };
}

export async function deleteCalendarEvent(
  account: ConnectedAccount,
  eventId: string
): Promise<boolean> {
  const calendar = await getCalendarClient(account);
  await calendar.events.delete({
    calendarId: "primary",
    eventId,
  });
  return true;
}

