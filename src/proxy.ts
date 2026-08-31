import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { decrypt } from "@/lib/session";

// Next 16 中 Middleware 更名为 Proxy。
// 这里做「乐观鉴权」：只读 Cookie 判断是否登录，未登录访问受保护页面时重定向到登录页。
// 注意：这只是第一道防线，真正的数据权限校验在各接口/数据访问层完成。

const PROTECTED_PREFIXES = ["/dashboard", "/kb"];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const cookie = req.cookies.get("session")?.value;
  const session = await decrypt(cookie);

  if (!session?.userId) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
