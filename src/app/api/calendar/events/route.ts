import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listCalendarEvents, createCalendarEvent, CalendarEventSummary } from "@/lib/calendar/service";
import { z } from "zod";

const CreateEventSchema = z.object({
  accountId: z.string().optional(),
  summary: z.string().min(1, "El título del evento es obligatorio"),
  description: z.string().optional(),
  start: z.string().min(1, "Fecha de inicio obligatoria"),
  end: z.string().min(1, "Fecha de fin obligatoria"),
  isAllDay: z.boolean().optional(),
  location: z.string().optional(),
  attendees: z.array(z.string().email("Correo de invitado inválido")).optional(),
  createMeetLink: z.boolean().optional(),
  colorId: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;
    const accountId = searchParams.get("accountId");
    const timeMin = searchParams.get("timeMin") || undefined;
    const timeMax = searchParams.get("timeMax") || undefined;
    const q = searchParams.get("q") || undefined;

    // 1. Fetch all local events stored in PostgreSQL
    const localEventsDb = await db.calendarEvent.findMany({
      where: {
        userId: user.id,
        ...(q
          ? {
              OR: [
                { summary: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
                { location: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { start: "asc" },
    });

    const localEventsFormatted: CalendarEventSummary[] = localEventsDb.map((e) => {
      let parsedAttendees: { email: string }[] = [];
      if (e.attendees) {
        try {
          const arr = JSON.parse(e.attendees);
          if (Array.isArray(arr)) {
            parsedAttendees = arr.map((item: any) => ({
              email: typeof item === "string" ? item : item.email || "",
            }));
          }
        } catch {
          parsedAttendees = [];
        }
      }

      return {
        id: e.id,
        summary: e.summary,
        description: e.description || undefined,
        start: e.start.toISOString(),
        end: e.end.toISOString(),
        isAllDay: e.isAllDay,
        location: e.location || undefined,
        meetUrl: e.meetUrl || undefined,
        colorId: e.colorId || "7",
        attendees: parsedAttendees,
        status: e.status,
      };
    });

    // 2. Check for connected Google account
    let googleAccount = null;
    if (accountId) {
      googleAccount = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id, provider: "google" },
      });
    } else {
      googleAccount = await db.connectedAccount.findFirst({
        where: { userId: user.id, provider: "google" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    // If no Google account is connected, return local events smoothly
    if (!googleAccount) {
      return NextResponse.json({
        events: localEventsFormatted,
        account: null,
        isGoogleConnected: false,
        message: "Modo local activo. Puedes vincular una cuenta de Google en cualquier momento.",
      });
    }

    // Try fetching from Google Calendar API
    let googleEvents: CalendarEventSummary[] = [];
    let googleError: string | null = null;
    let apiDisabled = false;
    let activationUrl: string | null = null;

    try {
      googleEvents = await listCalendarEvents(googleAccount, { timeMin, timeMax, q });
    } catch (err: any) {
      console.warn("Google Calendar sync warning:", err?.message);
      const msg = err?.message || "";
      if (msg.includes("has not been used in project") || msg.includes("is disabled")) {
        apiDisabled = true;
        const match = msg.match(/https:\/\/[^\s]+/);
        activationUrl = match ? match[0] : "https://console.cloud.google.com/apis/library/calendar-json.googleapis.com";
        googleError = "La API de Google Calendar aún no está habilitada en tu proyecto de Google Cloud.";
      } else {
        googleError = msg;
      }
    }

    // Merge events (Google events + any local-only events not yet in Google)
    const googleIds = new Set(googleEvents.map((g) => g.id));
    const merged = [
      ...googleEvents,
      ...localEventsFormatted.filter(
        (local) => !localEventsDb.find((d) => d.id === local.id && d.googleEventId && googleIds.has(d.googleEventId))
      ),
    ];

    return NextResponse.json({
      events: merged,
      account: {
        id: googleAccount.id,
        email: googleAccount.email,
        name: googleAccount.name,
      },
      isGoogleConnected: true,
      googleError,
      apiDisabled,
      activationUrl,
    });
  } catch (error: any) {
    console.error("Error in calendar events handler:", error);
    return NextResponse.json(
      { error: error?.message || "Error al obtener eventos de calendario" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = CreateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos del evento inválidos" },
        { status: 400 }
      );
    }

    const { accountId, ...eventInput } = parsed.data;

    // Check if user has a Google account
    let googleAccount = null;
    if (accountId) {
      googleAccount = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id, provider: "google" },
      });
    } else {
      googleAccount = await db.connectedAccount.findFirst({
        where: { userId: user.id, provider: "google" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    let createdGoogleEvent: CalendarEventSummary | null = null;
    let meetUrl: string | undefined = undefined;

    if (googleAccount) {
      try {
        createdGoogleEvent = await createCalendarEvent(googleAccount, eventInput);
        meetUrl = createdGoogleEvent.meetUrl;
      } catch (err: any) {
        console.warn("Could not create event in Google, falling back to local DB:", err?.message);
      }
    }

    // Always persist event in local PostgreSQL database
    const startObj = new Date(eventInput.start);
    const endObj = new Date(eventInput.end);

    const localDbEvent = await db.calendarEvent.create({
      data: {
        userId: user.id,
        googleEventId: createdGoogleEvent?.id || null,
        summary: eventInput.summary,
        description: eventInput.description || null,
        location: eventInput.location || null,
        start: startObj,
        end: endObj,
        isAllDay: Boolean(eventInput.isAllDay),
        meetUrl: meetUrl || (eventInput.createMeetLink ? `https://meet.google.com/new` : null),
        colorId: eventInput.colorId || "7",
        attendees: eventInput.attendees ? JSON.stringify(eventInput.attendees) : null,
      },
    });

    const responseEvent: CalendarEventSummary = {
      id: createdGoogleEvent?.id || localDbEvent.id,
      summary: localDbEvent.summary,
      description: localDbEvent.description || undefined,
      start: localDbEvent.start.toISOString(),
      end: localDbEvent.end.toISOString(),
      isAllDay: localDbEvent.isAllDay,
      location: localDbEvent.location || undefined,
      meetUrl: localDbEvent.meetUrl || undefined,
      colorId: localDbEvent.colorId || "7",
      attendees: eventInput.attendees?.map((email) => ({ email })),
      status: "confirmed",
    };

    return NextResponse.json({
      success: true,
      event: responseEvent,
      syncedWithGoogle: Boolean(createdGoogleEvent),
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el evento de calendario" },
      { status: 500 }
    );
  }
}
