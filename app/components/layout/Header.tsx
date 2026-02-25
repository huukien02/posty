"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Badge,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ChatIcon from "@mui/icons-material/Chat";
import GroupIcon from "@mui/icons-material/Group";

// Firebase
import { ref, onValue, off } from "firebase/database";
import { db, rtdb } from "@/lib/firebase.config";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { toast } from "react-toastify";
import ToggleThemeButton from "@/app/lib/ToggleThemeButton";
import Image from "next/image";
import { getMessaging, getToken } from "firebase/messaging";

// 🔹 Import ThemeContext

interface User {
  name: string;
  email: string;
}

const Header = () => {
  const [user, setUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const [hasFriendRequest, setHasFriendRequest] = useState(false);

  const router = useRouter();

  const loadUser = () => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);
  };

  useEffect(() => {
    let originalTitle = "Posty";
    let interval: number | null = null;
    let step = 0;

    const getNotificationTitle = () => {
      const arrowSteps = ["", "->", "-->"];
      const arrow = arrowSteps[step % arrowSteps.length];

      if (hasUnread && hasFriendRequest) return `${arrow} 💌 & 📩`;
      if (hasUnread) return `${arrow} 💌`;
      if (hasFriendRequest) return `${arrow} 📩`;
      return originalTitle;
    };

    if (hasUnread || hasFriendRequest) {
      interval = window.setInterval(() => {
        document.title = getNotificationTitle();
        step++;
      }, 1000);
    } else {
      document.title = originalTitle;
    }

    return () => {
      if (interval !== null) window.clearInterval(interval);
    };
  }, [hasUnread, hasFriendRequest]);

  useEffect(() => {
    loadUser();
    window.addEventListener("storage", loadUser);
    window.addEventListener("userChanged", loadUser);
    return () => {
      window.removeEventListener("storage", loadUser);
      window.removeEventListener("userChanged", loadUser);
    };
  }, []);

  // // 🔹 Lắng nghe rooms để check unread
  // useEffect(() => {
  //   if (!user?.email) return;

  //   const roomsRef = ref(rtdb, "rooms");
  //   const unsubscribe = onValue(roomsRef, (snap) => {
  //     const data = snap.val();
  //     if (!data) {
  //       setHasUnread(false);
  //       return;
  //     }

  //     const rooms = Object.values<any>(data);
  //     const found = rooms.some(
  //       (room: any) =>
  //         Array.isArray(room.unreadBy) && room.unreadBy.includes(user.email)
  //     );
  //     setHasUnread(found);
  //   });

  //   return () => off(roomsRef);
  // }, [user?.email]);

  useEffect(() => {
    if (!user?.email) return;

    const roomsRef = ref(rtdb, "rooms");

    const unsubscribe = onValue(roomsRef, async (snap) => {
      const data = snap.val();
      if (!data) {
        setHasUnread(false);
        return;
      }

      const rooms = Object.values<any>(data);
      const found = rooms.some(
        (room: any) =>
          Array.isArray(room.unreadBy) && room.unreadBy.includes(user.email)
      );

      // 🔹 Giữ logic cũ: thông báo trong app
      setHasUnread(found);

      // 🔹 Gửi notification về device nếu có tin nhắn mới
      if (found) {
        try {
          const permission = await Notification.requestPermission();
          console.log(Notification.permission);
          if (permission !== "granted") return;
          const messaging = getMessaging();
          // Lấy device token hiện tại
          const deviceToken = await getToken(messaging, {
            vapidKey:
              "BABGj89Iz012ZOTTYPDwo46uHzF96LGbLernupXvvMEwE4V022rdyMPS-9UjTo8nHBUPUY4rY7tyZk3Q_Wqd-uo", // lấy từ Firebase Console
          });

          if (deviceToken) {
            await fetch("/api/notice", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: deviceToken,
                title: "Bạn có tin nhắn mới",
                body: "Mở app để xem ngay nào!",
              }),
            });
          }
        } catch (err) {
          console.error("Error getting device token or sending FCM:", err);
        }
      }
    });

    return () => off(roomsRef);
  }, [user?.email]);

  // ✅ Lắng nghe lời mời kết bạn
  useEffect(() => {
    if (!user?.email) return;

    const q = query(
      collection(db, "friendships"),
      where("to", "==", user.email),
      where("status", "==", "pending")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      setHasFriendRequest(!snap.empty);
    });

    return () => unsubscribe();
  }, [user?.email]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("userChanged"));
    router.push("/login");
    toast.success("Đăng xuất thành công!");
    handleMenuClose();
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  const handleMenuClose = () => setAnchorEl(null);

  const menuItems = user
    ? [
        { label: "Home", href: "/" },
        { label: "Profile", href: "/profile" },
        { label: "Checkout", href: "/checkout" },
        {
          label: "Friends",
          href: "/friends",
          icon: hasFriendRequest && (
            <Badge
              color="error"
              variant="dot"
              invisible={!hasFriendRequest}
              overlap="circular"
            >
              <GroupIcon />
            </Badge>
          ),
        },
        {
          label: "Chat",
          href: "/chat",
          icon: hasUnread && (
            <Badge
              color="error"
              variant="dot"
              invisible={!hasUnread}
              overlap="circular"
            >
              <ChatIcon />
            </Badge>
          ),
        },
        { label: "Logout", onClick: handleLogout },
      ]
    : [
        { label: "Home", href: "/" },
        { label: "Login", href: "/login" },
        { label: "Register", href: "/register" },
        { label: "Reset Password", href: "/reset-password" },
      ];

  return (
    <AppBar position="static" color="primary">
      <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography
          onClick={() => router.push("/")}
          variant="h4"
          component="div"
          sx={{
            cursor: "pointer",
            fontWeight: "bold",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Image src="/favicon.ico" alt="Logo" width={32} height={32} /> Posty
        </Typography>

        {/* Desktop menu */}
        <Box
          sx={{
            display: { xs: "none", md: "flex" },
            gap: 1,
            alignItems: "center",
          }}
        >
          {menuItems.map((item) =>
            item.href ? (
              <Button
                key={item.label}
                color="inherit"
                href={item.href}
                startIcon={item.icon}
              >
                {item.label}
              </Button>
            ) : (
              <Button key={item.label} color="inherit" onClick={item.onClick}>
                {item.label}
              </Button>
            )
          )}
          <ToggleThemeButton />
        </Box>

        {/* Mobile menu */}
        <Box sx={{ display: { xs: "flex", md: "none" } }}>
          <IconButton color="inherit" onClick={handleMenuOpen}>
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            {menuItems.map((item) =>
              item.href ? (
                <MenuItem
                  key={item.label}
                  onClick={handleMenuClose}
                  component="a"
                  href={item.href}
                >
                  {item.icon}
                  <Typography sx={{ ml: 1 }}>{item.label}</Typography>
                </MenuItem>
              ) : (
                <MenuItem key={item.label} onClick={item.onClick}>
                  {item.label}
                </MenuItem>
              )
            )}

            <ToggleThemeButton />
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
