"use client";

import { useState } from "react";
import { Box, Button, Typography, Divider, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
import { radius, softShadow, surfaceSx } from "@/app/lib/theme";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import {
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  AuthProvider,
} from "firebase/auth";
import { auth, db } from "../../lib/firebase.config";
import { collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { Google, Facebook } from "@mui/icons-material";

// Các lỗi popup vô hại (người dùng tự đóng / mở popup mới) -> không cần báo đỏ.
const BENIGN_POPUP_ERRORS = [
  "auth/cancelled-popup-request",
  "auth/popup-closed-by-user",
  "auth/user-cancelled",
];

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Đăng nhập bằng mạng xã hội (Google / Facebook).
  // Tự tạo tài khoản nếu chưa tồn tại; định danh theo email.
  const handleSocialLogin = async (
    provider: AuthProvider,
    providerName: string,
  ) => {
    if (loading) return; // chặn bấm trùng -> tránh auth/cancelled-popup-request
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // App định danh user bằng email -> bắt buộc phải có email.
      if (!firebaseUser.email) {
        toast.error(
          `Không lấy được email từ ${providerName}. Vui lòng dùng tài khoản có email.`,
        );
        await auth.signOut();
        return;
      }

      const q = query(
        collection(db, "users"),
        where("email", "==", firebaseUser.email),
      );
      const snapshot = await getDocs(q);

      let userData: any;

      if (snapshot.empty) {
        // Chưa tồn tại => tạo mới
        const newUser = {
          username: firebaseUser.displayName,
          email: firebaseUser.email,
          avatar: firebaseUser.photoURL,
          postsRemaining: 5,
          createdAt: Date.now(),
          banned: false,
        };
        const newUserRef = await addDoc(collection(db, "users"), newUser);
        userData = { id: newUserRef.id, ...newUser };
      } else {
        // Đã tồn tại => login
        const userDoc = snapshot.docs[0];
        userData = { id: userDoc.id, ...userDoc.data() };

        // 🧱 Kiểm tra tài khoản bị khóa
        if (userData.banned) {
          toast.error("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ hỗ trợ.");
          await auth.signOut();
          return;
        }
      }

      localStorage.setItem("user", JSON.stringify(userData));
      window.dispatchEvent(new Event("userChanged"));
      toast.success(`Đăng nhập ${providerName} thành công!`);
      router.push("/profile");
    } catch (err: any) {
      // Bỏ qua các lỗi popup vô hại (đóng popup / mở popup mới).
      if (BENIGN_POPUP_ERRORS.includes(err?.code)) {
        console.warn("Popup bị hủy:", err.code);
        return;
      }
      console.error(err);
      toast.error(`Đăng nhập ${providerName} lỗi: ` + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    handleSocialLogin(provider, "Google");
  };

  const handleFacebookLogin = () => {
    const provider = new FacebookAuthProvider();
    provider.addScope("email"); // xin quyền email
    handleSocialLogin(provider, "Facebook");
  };

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        width: "100%",
      }}
    >
      <Paper
        sx={(theme) => ({
          ...surfaceSx(theme),
          width: "100%",
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          textAlign: "center",
          boxShadow: softShadow(theme),
        })}
      >
        <Box
          sx={(theme) => ({
            width: 56,
            height: 56,
            mx: "auto",
            mb: 2.5,
            borderRadius: `${radius.md}px`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          })}
        >
          <Image src="/favicon.ico" alt="Posty" width={32} height={32} />
        </Box>

        <Typography variant="h5">Chào mừng đến Posty</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 3.5 }}>
          Đăng nhập để kết nối và chia sẻ cùng bạn bè
        </Typography>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleGoogleLogin}
          startIcon={<Google />}
          sx={(theme) => ({
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            "&:hover": {
              borderColor: alpha(theme.palette.text.primary, 0.3),
              bgcolor: theme.palette.action.hover,
            },
          })}
        >
          Tiếp tục với Google
        </Button>

        <Divider sx={{ my: 2, color: "text.secondary", fontSize: 12 }}>hoặc</Divider>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleFacebookLogin}
          startIcon={<Facebook sx={{ color: "#1877F2" }} />}
          sx={(theme) => ({
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            "&:hover": {
              borderColor: alpha(theme.palette.text.primary, 0.3),
              bgcolor: theme.palette.action.hover,
            },
          })}
        >
          Tiếp tục với Facebook
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3.5, lineHeight: 1.6 }}
        >
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và{" "}
          <Box
            component="a"
            href="/privacy-policy"
            sx={{ color: "primary.main", textDecoration: "none", fontWeight: 500 }}
          >
            Chính sách quyền riêng tư
          </Box>{" "}
          của chúng tôi.
        </Typography>
      </Paper>
    </Box>
  );
}
