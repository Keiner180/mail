import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { encryptText } from "@/lib/crypto";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;

    const apps = await db.providerApplication.findMany({
      where: { projectId },
      select: {
        id: true,
        provider: true,
        applicationType: true,
        name: true,
        clientId: true,
        redirectUri: true,
        isVerified: true,
        currentAccountCount: true,
        maxAccountLimit: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, apps });
  } catch (error: unknown) {
    console.error("Error fetching project apps:", error);
    return NextResponse.json(
      { error: "Error al consultar aplicaciones del proyecto" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id: projectId } = await params;
    const body = await req.json();
    const { provider, name, clientId, clientSecret, redirectUri } = body;

    if (!provider || !["GOOGLE", "MICROSOFT"].includes(provider)) {
      return NextResponse.json(
        { error: "Proveedor inválido (debe ser GOOGLE o MICROSOFT)" },
        { status: 400 }
      );
    }

    if (!clientId || !clientSecret || !name) {
      return NextResponse.json(
        { error: "Nombre, Client ID y Client Secret son campos obligatorios" },
        { status: 400 }
      );
    }

    // Verificar pertenencia al proyecto
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { tenant: { include: { memberships: true } } },
    });

    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });
    }

    const isMember = project.tenant.memberships.some((m) => m.userId === user.id);
    if (!isMember) {
      return NextResponse.json(
        { error: "No tienes permisos para configurar aplicaciones en este proyecto" },
        { status: 403 }
      );
    }

    const origin = req.nextUrl.origin || process.env.NEXTAUTH_URL || "http://localhost:3000";
    const callbackUri =
      redirectUri ||
      (provider === "GOOGLE"
        ? `${origin}/api/auth/google/callback`
        : `${origin}/api/auth/microsoft/callback`);

    const encryptedSecret = encryptText(clientSecret);

    const app = await db.providerApplication.upsert({
      where: {
        provider_clientId: {
          provider,
          clientId: clientId.trim(),
        },
      },
      update: {
        projectId,
        applicationType: "CUSTOM_BYO",
        name: name.trim(),
        clientSecretEnc: encryptedSecret,
        redirectUri: callbackUri,
        isVerified: true,
      },
      create: {
        projectId,
        provider,
        applicationType: "CUSTOM_BYO",
        name: name.trim(),
        clientId: clientId.trim(),
        clientSecretEnc: encryptedSecret,
        redirectUri: callbackUri,
        isVerified: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        tenantId: project.tenantId,
        action: "BYO_APP_CONFIGURED",
        metadataJson: JSON.stringify({
          provider,
          appId: app.id,
          clientId: app.clientId,
          projectId,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      app: {
        id: app.id,
        provider: app.provider,
        name: app.name,
        clientId: app.clientId,
        redirectUri: app.redirectUri,
        isVerified: app.isVerified,
      },
    });
  } catch (error: unknown) {
    console.error("Error creating project app:", error);
    return NextResponse.json(
      { error: "Error al registrar aplicación en el proyecto" },
      { status: 500 }
    );
  }
}
