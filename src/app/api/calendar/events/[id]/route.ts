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

    const updated = await updateCalendarEvent(account, {
      ...eventInput,
      eventId,
    });

    return NextResponse.json({
      success: true,
      event: updated,
    });
  } catch (error: any) {
    console.error("Error updating calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al actualizar evento en Google Calendar" },
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
    const { searchParams } = req.nextUrl;
    const accountId = searchParams.get("accountId");

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

    await deleteCalendarEvent(account, eventId);

    return NextResponse.json({
      success: true,
      deletedId: eventId,
    });
  } catch (error: any) {
    console.error("Error deleting calendar event:", error);
    return NextResponse.json(
      { error: error.message || "Error al eliminar evento en Google Calendar" },
      { status: 500 }
    );
  }
}

