import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import admin, { adminDb } from "@/lib/firebase.admin";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json(
      { error: "Thiếu chữ ký hoặc webhook secret" },
      { status: 400 },
    );
  }

  // Cần raw body để verify chữ ký.
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Chữ ký không hợp lệ" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Chỉ cộng slot khi thực sự đã thanh toán.
    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "unpaid" });
    }

    const email = session.metadata?.email;
    const slots = Number(session.metadata?.slots ?? 0);

    if (!email || !slots) {
      console.error("Webhook thiếu metadata email/slots", session.id);
      return NextResponse.json({ received: true, skipped: "no-metadata" });
    }

    try {
      await grantSlots(session.id, email, slots, session.amount_total ?? 0);
    } catch (err) {
      console.error("Lỗi cộng slot:", err);
      // Trả 500 để Stripe retry.
      return NextResponse.json({ error: "Xử lý thất bại" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

// Cộng slot một cách idempotent: dùng transaction trên doc transactions/{sessionId}.
// Nếu đã completed thì bỏ qua -> webhook gửi lại không cộng trùng.
async function grantSlots(
  sessionId: string,
  email: string,
  slots: number,
  amountTotal: number,
) {
  const txRef = adminDb.collection("transactions").doc(sessionId);

  await adminDb.runTransaction(async (t) => {
    const txSnap = await t.get(txRef);
    if (txSnap.exists && txSnap.data()?.status === "completed") {
      return; // đã xử lý rồi
    }

    const usersSnap = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (usersSnap.empty) {
      throw new Error(`Không tìm thấy user với email ${email}`);
    }

    const userRef = usersSnap.docs[0].ref;
    t.update(userRef, {
      postsRemaining: admin.firestore.FieldValue.increment(slots),
    });

    t.set(txRef, {
      email,
      slots,
      amountTotal,
      status: "completed",
      completedAt: Date.now(),
    });
  });
}
