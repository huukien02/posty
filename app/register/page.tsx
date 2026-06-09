import { redirect } from "next/navigation";

// Đăng ký riêng đã bị bỏ — chỉ đăng nhập bằng Google (tự tạo tài khoản nếu chưa có).
export default function RegisterPage() {
  redirect("/login");
}
