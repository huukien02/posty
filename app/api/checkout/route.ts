import { NextResponse } from "next/server";
import { stripe, getPlan } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { amount, email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Thiếu email" }, { status: 400 });
    }

    // Plan được kiểm tra ở server -> client không thể tự đặt giá / số slot.
    const plan = getPlan(Number(amount));
    if (!plan) {
      return NextResponse.json({ error: "Plan không hợp lệ" }, { status: 400 });
    }

    // Ưu tiên origin của request, fallback về domain cấu hình.
    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: `Buy ${plan.slots} post slot(s)` },
            unit_amount: plan.amount * 100,
          },
          quantity: 1,
        },
      ],
      // Nguồn sự thật để webhook cộng slot. Không tin tham số từ URL.
      metadata: {
        email,
        slots: String(plan.slots),
        amount: String(plan.amount),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return NextResponse.json(
      { error: "Không tạo được phiên thanh toán" },
      { status: 500 },
    );
  }
}
