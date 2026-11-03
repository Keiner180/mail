import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { db } from "./db";
import { generateRandomToken, hashToken } from "./crypto";

const SESSION_COOKIE_NAME = "jabvox_mail_session";
const SESSION_DURATION_DAYS = 14;

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string, userAgent?: string, ip?: string): Promise<string> {
  const rawToken = generateRandomToken(48);
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  await db.session.create({
    data: {
      userId,
      token: tokenHash,
      userAgent: userAgent ? userAgent.substring(0, 255) : null,
      ip: ip ? ip.substring(0, 45) : null,
      expiresAt,
    },
  });

  return rawToken;
}

export async function setSessionCookie(rawToken: string): Promise<void> {
  const cookieStore = await cookies();
  const expires = new Date();
  expires.setDate(expires.getDate() + SESSION_DURATION_DAYS);

  cookieStore.set(SESSION_COOKIE_NAME, rawToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires,
  });
}

export async function removeSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (rawToken) {
    const tokenHash = hashToken(rawToken);
    await db.session.deleteMany({
      where: { token: tokenHash },
    });
  }
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export interface AuthUser {
  id: string;
  name: string;
  lastName: string;
  email: string;
}

export async function getSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!rawToken) return null;

    const tokenHash = hashToken(rawToken);
    const session = await db.session.findUnique({
      where: { token: tokenHash },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (new Date() > session.expiresAt) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return session.user;
  } catch (error) {
    console.error("Error retrieving session user:", error);
    return null;
  }
}
