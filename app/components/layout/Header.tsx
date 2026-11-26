"use client";

import { useState, useEffect, useContext } from "react";
import { useRouter, usePathname } from "next/navigation";
import { alpha } from "@mui/material/styles";
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
  Divider,
  Avatar,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  HomeOutlined,
  HomeRounded,
  GroupOutlined,
  GroupRounded,
  ChatBubbleOutline,
  ChatBubble,
  PersonOutline,
  Person,
  WorkspacePremiumOutlined,
  LogoutOutlined,
} from "@mui/icons-material";
import { layout } from "@/app/lib/theme";

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
  const pathname = usePathname();

  // Xác định tab đang active theo route hiện tại
  const isActive = (href?: string) => {
    if (!href) return false;
    return href === "/" ? pathname === "/" : pathname.startsWith(href);
  };

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

  // ---------- Giao diện ----------
  const u = user as any;
  const displayName: string = u?.username || u?.name || u?.email || "";

  const navItems = [
    { label: "Trang chủ", href: "/", icon: <HomeOutlined />, activeIcon: <HomeRounded />, dot: false, auth: false },
    { label: "Bạn bè", href: "/friends", icon: <GroupOutlined />, activeIcon: <GroupRounded />, dot: hasFriendRequest, auth: true },
    { label: "Tin nhắn", href: "/chat", icon: <ChatBubbleOutline />, activeIcon: <ChatBubble />, dot: hasUnread, auth: true },
  ].filter((i) => !i.auth || user);

  const mobileItems = user
    ? [
        ...navItems,
        { label: "Hồ sơ", href: "/profile", icon: <PersonOutline />, activeIcon: <Person />, dot: false, auth: true },
      ]
    : navItems;

  return (
    <>
      <AppBar
        position="static"
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.background.paper, 0.85),
          backdropFilter: "saturate(180%) blur(12px)",
          color: theme.palette.text.primary,
          borderBottom: `1px solid ${theme.palette.divider}`,
        })}
      >
        <Toolbar
          sx={{
            minHeight: { xs: 56, md: layout.headerHeight },
            width: "100%",
            maxWidth: layout.contentWidth,
            mx: "auto",
            px: { xs: 2, md: 3 },
            gap: 2,
          }}
        >
          {/* Logo */}
          <Box
            onClick={() => router.push("/")}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.25,
              cursor: "pointer",
              flex: { md: 1 },
              userSelect: "none",
            }}
          >
            <Image src="/favicon.ico" alt="Posty" width={28} height={28} />
            <Typography
              component="span"
              sx={{ fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em" }}
            >
              Posty
            </Typography>
          </Box>

          {/* Điều hướng chính (desktop) */}
          <Box
            component="nav"
            sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, alignItems: "center" }}
          >
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Tooltip key={item.href} title={item.label}>
                  <Button
                    color="inherit"
                    href={item.href}
                    aria-label={item.label}
                    sx={(theme) => ({
                      position: "relative",
                      minWidth: 96,
                      height: layout.headerHeight,
                      borderRadius: 0,
                      color: active ? "primary.main" : "text.secondary",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.text.primary, 0.04),
                        color: active ? "primary.main" : "text.primary",
                      },
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        left: 16,
                        right: 16,
                        bottom: 0,
                        height: 3,
                        borderRadius: "3px 3px 0 0",
                        bgcolor: active ? "primary.main" : "transparent",
                      },
                    })}
                  >
                    <Badge color="error" variant="dot" invisible={!item.dot} overlap="circular">
                      {active ? item.activeIcon : item.icon}
                    </Badge>
                  </Button>
                </Tooltip>
              );
            })}
          </Box>

          {/* Bên phải */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "flex-end",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box sx={{ display: { xs: user ? "none" : "block", md: "block" } }}>
              <ToggleThemeButton />
            </Box>

            {user ? (
              <>
                <Button
                  variant="outlined"
                  size="small"
                  href="/checkout"
                  startIcon={<WorkspacePremiumOutlined />}
                  sx={{ display: { xs: "none", sm: "inline-flex" }, color: "text.primary" }}
                >
                  Nâng cấp
                </Button>
                <IconButton
                  onClick={handleMenuOpen}
                  aria-label="Tài khoản"
                  sx={{ p: 0.5, borderRadius: "50%" }}
                >
                  <Avatar
                    src={u?.avatar || undefined}
                    alt={displayName}
                    sx={{ width: 34, height: 34, fontSize: 14 }}
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </Avatar>
                </IconButton>
              </>
            ) : (
              <Button variant="contained" href="/login">
                Đăng nhập
              </Button>
            )}
          </Box>

          {/* Menu tài khoản */}
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            slotProps={{ paper: { sx: { minWidth: 240 } } }}
          >
            <Box sx={{ px: 1.5, py: 1, display: "flex", gap: 1.5, alignItems: "center" }}>
              <Avatar src={u?.avatar || undefined} sx={{ width: 40, height: 40 }}>
                {displayName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography fontWeight={600} noWrap>
                  {displayName}
                </Typography>
                {u?.email && (
                  <Typography variant="caption" color="text.secondary" noWrap component="div">
                    {u.email}
                  </Typography>
                )}
              </Box>
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem component="a" href="/profile" onClick={handleMenuClose} selected={isActive("/profile")}>
              <PersonOutline fontSize="small" /> Hồ sơ của tôi
            </MenuItem>
            <MenuItem component="a" href="/checkout" onClick={handleMenuClose} selected={isActive("/checkout")}>
              <WorkspacePremiumOutlined fontSize="small" /> Nâng cấp gói
            </MenuItem>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                pl: 2,
                pr: 0.5,
                minHeight: 40,
              }}
            >
              <Typography variant="body2">Giao diện sáng / tối</Typography>
              <ToggleThemeButton />
            </Box>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
              <LogoutOutlined fontSize="small" /> Đăng xuất
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Thanh điều hướng dưới (mobile) */}
      <Paper
        component="nav"
        sx={(theme) => ({
          display: { xs: "flex", md: "none" },
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          height: layout.bottomNavHeight,
          pb: "env(safe-area-inset-bottom)",
          zIndex: theme.zIndex.appBar,
          borderTop: `1px solid ${theme.palette.divider}`,
          borderRadius: 0,
          bgcolor: alpha(theme.palette.background.paper, 0.92),
          backdropFilter: "saturate(180%) blur(12px)",
        })}
      >
        {mobileItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Box
              key={item.href}
              component="a"
              href={item.href}
              sx={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.25,
                textDecoration: "none",
                color: active ? "primary.main" : "text.secondary",
                fontSize: 11,
                fontWeight: active ? 600 : 500,
              }}
            >
              <Badge color="error" variant="dot" invisible={!item.dot} overlap="circular">
                {active ? item.activeIcon : item.icon}
              </Badge>
              {item.label}
            </Box>
          );
        })}
      </Paper>
    </>
  );
};

export default Header;
