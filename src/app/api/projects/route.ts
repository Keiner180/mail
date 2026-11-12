import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Proyectos asociados al tenant del usuario
    const memberships = await db.tenantMembership.findMany({
      where: { userId: user.id },
      include: {
        tenant: {
          include: {
            projects: {
              include: {
                providerApps: {
                  select: {
                    id: true,
                    provider: true,
                    applicationType: true,
                    name: true,
                    clientId: true,
                    isVerified: true,
                    currentAccountCount: true,
                  },
                },
                serviceConfigs: true,
              },
            },
          },
        },
      },
    });

    const projects = memberships.flatMap((m) => m.tenant.projects);

    return NextResponse.json({ success: true, projects });
  } catch (error: unknown) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Error al obtener proyectos" },
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
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json(
        { error: "El nombre del proyecto debe tener al menos 2 caracteres" },
        { status: 400 }
      );
    }

    // Obtener o crear el Tenant para el usuario
    let membership = await db.tenantMembership.findFirst({
      where: { userId: user.id },
      include: { tenant: true },
    });

    let tenantId: string;

    if (!membership) {
      const slug = `org-${user.id.slice(-6)}-${Date.now().toString(36)}`;
      const tenant = await db.tenant.create({
        data: {
          name: `Espacio de ${user.name}`,
          slug,
          tier: "FREE",
          status: "ACTIVE",
          memberships: {
            create: {
              userId: user.id,
              role: "OWNER",
            },
          },
        },
      });
      tenantId = tenant.id;
    } else {
      tenantId = membership.tenantId;
    }

    // Generar projectNumber único estilo Google Cloud (p.ej. jbx-78491)
    const projectNumber = `jbx-${Math.floor(10000 + Math.random() * 90000)}`;

    const project = await db.project.create({
      data: {
        tenantId,
        name: name.trim(),
        projectNumber,
        status: "ACTIVE",
        serviceConfigs: {
          create: [
            { serviceName: "SERVICE_MAIL", isEnabled: true },
            { serviceName: "SERVICE_CALENDAR", isEnabled: true },
            { serviceName: "SERVICE_MEET", isEnabled: true },
          ],
        },
      },
      include: {
        serviceConfigs: true,
        providerApps: true,
      },
    });

    await db.auditLog.create({
      data: {
        userId: user.id,
        tenantId,
        action: "PROJECT_CREATED",
        metadataJson: JSON.stringify({
          projectId: project.id,
          projectNumber: project.projectNumber,
          name: project.name,
        }),
      },
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error: unknown) {
    console.error("Error creating project:", error);
    return NextResponse.json(
      { error: "Error al crear el proyecto" },
      { status: 500 }
    );
  }
}
