import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// 无状态会话：把最小必要信息（仅 userId）签进 JWT，存进 HttpOnly Cookie。
// 不在 Cookie 里放邮箱等个人敏感信息。
const secretKey =
  process.env.AUTH_SECRET || "docmind-insecure-default-secret-change-me";
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: string;
  expiresAt: Date;
}

export async function encrypt(payload: SessionPayload): Promise<string> {
  return new SignJWT({ userId: payload.userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(key);
}

export async function decrypt(
  session: string | undefined,
): Promise<{ userId: string } | null> {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ["HS256"],
    });
    if (typeof payload.userId !== "string") return null;
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

export async function createSession(userId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expiresAt });
  const store = await cookies();
  store.set("session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession(): Promise<void> {
  const store = await cookies();
  store.delete("session");
}
