import Stripe from "stripe";

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret) {
  throw new Error("Thiếu STRIPE_SECRET_KEY trong biến môi trường");
}

// Dùng chung cho mọi route server-side. KHÔNG bao giờ import file này ở client.
export const stripe = new Stripe(secret);

// Bảng plan định nghĩa ở server để client không thể tự đặt số slot.
// amount = số tiền (USD) đồng thời là id plan; slots = số lượt đăng bài nhận được.
export const PLANS = [
  { amount: 1, slots: 100 },
  { amount: 10, slots: 1000 },
  { amount: 100, slots: 10000 },
  { amount: 1000, slots: 100000 },
] as const;

export function getPlan(amount: number) {
  return PLANS.find((p) => p.amount === amount) ?? null;
}
