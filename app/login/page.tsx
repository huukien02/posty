"use client";

import { useState } from "react";
import { Box, Button, Typography, Divider, Paper } from "@mui/material";
import { alpha } from "@mui/material/styles";
import Image from "next/image";
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
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";
        return {
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 2,
          width: "100%",
          background: `radial-gradient(60% 60% at 50% 0%, ${alpha(
            theme.palette.primary.main,
            isDark ? 0.12 : 0.08
          )} 0%, transparent 70%)`,
        };
      }}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          width: "100%",
          maxWidth: 410,
          p: { xs: 3, md: 4 },
          borderRadius: 4,
          textAlign: "center",
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: "0 16px 48px rgba(2,6,23,0.12)",
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            mx: "auto",
            mb: 2,
            borderRadius: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
          }}
        >
          <Image src="/favicon.ico" alt="Posty" width={36} height={36} />
        </Box>

        <Typography variant="h5" fontWeight={800}>
          Chào mừng đến Posty
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3.5}>
          Đăng nhập để tiếp tục
        </Typography>

        <Button
          variant="outlined"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleGoogleLogin}
          startIcon={<Google />}
          sx={(theme) => ({
            borderRadius: 2.5,
            py: 1.25,
            fontWeight: 600,
            color: theme.palette.text.primary,
            borderColor: theme.palette.divider,
            "&:hover": {
              borderColor: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.main, 0.06),
            },
          })}
        >
          Đăng nhập với Google
        </Button>

        <Divider sx={{ my: 2, color: "text.secondary", fontSize: 13 }}>
          hoặc
        </Divider>

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleFacebookLogin}
          startIcon={<Facebook />}
          sx={{
            borderRadius: 2.5,
            py: 1.25,
            fontWeight: 600,
            bgcolor: "#1877F2",
            "&:hover": { bgcolor: "#166FE5" },
          }}
        >
          Đăng nhập với Facebook
        </Button>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mt: 3.5, lineHeight: 1.6 }}
        >
          Bằng việc đăng nhập, bạn đồng ý với Điều khoản dịch vụ và Chính sách
          bảo mật của chúng tôi.
        </Typography>
      </Paper>
    </Box>
  );
}
