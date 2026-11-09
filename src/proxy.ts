import { NextRequest, NextResponse } from "next/server";
export function proxy(r: NextRequest) {
  if (!r.cookies.get("vbm")) return NextResponse.redirect(new URL("/login", r.url));
}
export const config = { matcher: ["/dashboard/:path*"] };
