import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });

  const possibleCookies = [
    "supabase-auth-token",
    "sb:token",
    "sb:refresh-token",
    "sb-kegskzgwkhltieyddbby-auth-token", // ← your project ref cookie
  ];

  for (const name of possibleCookies) {
    response.cookies.set({
      name,
      value: "",
      path: "/",
      maxAge: -1,
    });
  }

  return response;
}
