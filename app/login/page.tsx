"use client";

import { useState } from "react";
import { Box, Button, Typography, Divider } from "@mui/material";
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
      display="flex"
      justifyContent="center"
      alignItems="center"
      width="100%"
    >
      <Box
        width={400}
        border="1px solid #ccc"
        borderRadius={2}
        p={3}
        boxShadow={1}
      >
        <Typography variant="h5" align="center" mb={1}>
          Đăng nhập
        </Typography>
        <Typography
          variant="body2"
          align="center"
          color="text.secondary"
          mb={3}
        >
          Chọn một tài khoản để tiếp tục
        </Typography>

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleGoogleLogin}
          startIcon={<Google />}
        >
          Đăng nhập với Google
        </Button>

        <Divider sx={{ my: 2 }}>hoặc</Divider>

        <Button
          variant="contained"
          fullWidth
          size="large"
          disabled={loading}
          onClick={handleFacebookLogin}
          startIcon={<Facebook />}
          sx={{ bgcolor: "#1877F2", "&:hover": { bgcolor: "#166FE5" } }}
        >
          Đăng nhập với Facebook
        </Button>
      </Box>
    </Box>
  );
}
