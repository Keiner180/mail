import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { listCalendarEvents, createCalendarEvent } from "@/lib/calendar/service";
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

    // Find account
    let account;
    if (accountId) {
      account = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id },
      });
    } else {
      // Find first Google account
      account = await db.connectedAccount.findFirst({
        where: { userId: user.id, provider: "google" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: "No hay una cuenta de Google conectada para el calendario", noAccount: true },
        { status: 404 }
      );
    }

    const events = await listCalendarEvents(account, { timeMin, timeMax, q });

    return NextResponse.json({
      events,
      account: {
        id: account.id,
        email: account.email,
        name: account.name,
      },
    });
  } catch (error: any) {
    console.error("Error listing calendar events:", error);
    return NextResponse.json(
      { error: error.message || "Error al obtener eventos de Google Calendar" },
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

    let account;
    if (accountId) {
      account = await db.connectedAccount.findFirst({
        where: { id: accountId, userId: user.id },
      });
    } else {
      account = await db.connectedAccount.findFirst({
        where: { userId: user.id, provider: "google" },
        orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
      });
    }

    if (!account) {
      return NextResponse.json(
        { error: "No hay una cuenta de Google conectada", noAccount: true },
        { status: 404 }
      );
    }

    const createdEvent = await createCalendarEvent(account, eventInput);

    return NextResponse.json({
      success: true,
      event: createdEvent,
    });
  } catch (error: any) {
    console.error("Error creating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al crear el evento en Google Calendar" },
      { status: 500 }
    );
  }
}

