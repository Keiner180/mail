import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/calendar/service";
import { z } from "zod";

const UpdateEventSchema = z.object({
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

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: eventId } = await context.params;
    const body = await req.json();
    const parsed = UpdateEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Datos del evento inválidos" },
        { status: 400 }
      );
    }

    const { accountId, ...eventInput } = parsed.data;

    // Check if event exists locally
    const localEvent = await db.calendarEvent.findFirst({
      where: {
        userId: user.id,
        OR: [{ id: eventId }, { googleEventId: eventId }],
      },
    });

    const googleAccount = await db.connectedAccount.findFirst({
      where: { userId: user.id, provider: "google" },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    // If Google account is available and event is in Google, update Google event
    const targetGoogleId = localEvent?.googleEventId || eventId;
    if (googleAccount && targetGoogleId && !localEvent) {
      try {
        await updateCalendarEvent(googleAccount, {
          ...eventInput,
          eventId: targetGoogleId,
        });
      } catch (err) {
        console.warn("Could not update in Google Calendar:", err);
      }
    }

    // Update in local DB if exists or create
    if (localEvent) {
      await db.calendarEvent.update({
        where: { id: localEvent.id },
        data: {
          summary: eventInput.summary,
          description: eventInput.description || null,
          location: eventInput.location || null,
          start: new Date(eventInput.start),
          end: new Date(eventInput.end),
          isAllDay: Boolean(eventInput.isAllDay),
          colorId: eventInput.colorId || "7",
          attendees: eventInput.attendees ? JSON.stringify(eventInput.attendees) : null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: eventId,
        summary: eventInput.summary,
        description: eventInput.description,
        start: eventInput.start,
        end: eventInput.end,
        isAllDay: Boolean(eventInput.isAllDay),
        location: eventInput.location,
        colorId: eventInput.colorId,
        attendees: eventInput.attendees?.map((e) => ({ email: e })),
      },
    });
  } catch (error: any) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar evento" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: eventId } = await context.params;

    const localEvent = await db.calendarEvent.findFirst({
      where: {
        userId: user.id,
        OR: [{ id: eventId }, { googleEventId: eventId }],
      },
    });

    const googleAccount = await db.connectedAccount.findFirst({
      where: { userId: user.id, provider: "google" },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    if (googleAccount) {
      const googleId = localEvent?.googleEventId || eventId;
      try {
        await deleteCalendarEvent(googleAccount, googleId);
      } catch (err) {
        console.warn("Could not delete from Google Calendar:", err);
      }
    }

    if (localEvent) {
      await db.calendarEvent.delete({
        where: { id: localEvent.id },
      });
    }

    return NextResponse.json({
      success: true,
      deletedId: eventId,
    });
  } catch (error: any) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar evento" },
      { status: 500 }
    );
  }
}
