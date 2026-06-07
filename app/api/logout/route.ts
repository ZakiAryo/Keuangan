import { NextResponse } from "next/server";
import { requirePinSession, handleApiError } from "@/lib/api";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST() {
  try {
    await requirePinSession();
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, "", {
      httpOnly: true,
      expires: new Date(0),
      path: "/",
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
