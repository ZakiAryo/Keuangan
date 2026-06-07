import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createPinSession,
  secureCompare,
  SESSION_COOKIE,
  SESSION_MAX_AGE,
} from "@/lib/session";
import { handleApiError } from "@/lib/api";
import { parseJson } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const { pin } = await parseJson(
      request,
      z.object({ pin: z.string().min(1).max(128) }),
    );
    const appPin = process.env.APP_PIN;
    const secret = process.env.PIN_SESSION_SECRET;

    if (!appPin || !secret) {
      return NextResponse.json(
        { error: "Konfigurasi PIN server belum lengkap." },
        { status: 500 },
      );
    }

    if (!secureCompare(pin, appPin)) {
      return NextResponse.json({ error: "PIN salah." }, { status: 401 });
    }

    const token = await createPinSession(secret);
    const response = NextResponse.json({ success: true });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
