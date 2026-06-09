import { NextResponse } from "next/server";
import { adminMessaging } from "@/lib/firebase.admin";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { token, title, body } = await req.json();

  const message = {
    token,
    notification: { title, body },
    webpush: { notification: { icon: "/icon.png" } },
  };

  try {
    const res = await adminMessaging.send(message);

    return NextResponse.json({ success: true, res });
  } catch (err) {
    console.error("Error sending FCM:", err);
    return NextResponse.json({ success: false, error: String(err) });
  }
}
