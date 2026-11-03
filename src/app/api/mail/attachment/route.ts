import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getAttachmentBuffer } from "@/lib/gmail/service";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");
    const messageId = searchParams.get("messageId");
    const attachmentId = searchParams.get("attachmentId");
    const filename = searchParams.get("filename") || "archivo_adjunto";
    const mimeType = searchParams.get("mimeType") || "application/octet-stream";

    if (!accountId || !messageId || !attachmentId) {
      return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
    }

    const account = await db.connectedAccount.findFirst({
      where: { id: accountId, userId: user.id },
    });

    if (!account) {
      return NextResponse.json({ error: "Cuenta no encontrada" }, { status: 404 });
    }

    const { buffer } = await getAttachmentBuffer(account, messageId, attachmentId);

    // Encode filename for Content-Disposition header
    const encodedFilename = encodeURIComponent(filename);

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error: unknown) {
    console.error("Error downloading attachment:", error);
    const msg = error instanceof Error ? error.message : "Error al descargar el archivo adjunto";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
