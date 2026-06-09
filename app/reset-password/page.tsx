import { redirect } from "next/navigation";

// Không còn mật khẩu nội bộ — chỉ đăng nhập bằng Google nên không cần reset.
export default function ResetPasswordPage() {
  redirect("/login");
}
