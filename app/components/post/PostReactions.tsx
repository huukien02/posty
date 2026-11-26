"use client";
import { useState, useEffect } from "react";
import { Box, IconButton, Popover, Typography } from "@mui/material";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import EmojiEmotionsIcon from "@mui/icons-material/EmojiEmotions";
import { doc, onSnapshot, runTransaction, increment } from "firebase/firestore";
import { db } from "@/lib/firebase.config";

const reactions = [
  { type: "love", icon: "❤️" },
  { type: "like", icon: "👍" },
  { type: "dislike", icon: "👎" },
  { type: "funny", icon: "😀" },
];

interface PostReactionsProps {
  post: any;
  currentUserId: string;
}

export default function PostReactions({
  post,
  currentUserId,
}: PostReactionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [reactionsCount, setReactionsCount] = useState<Record<string, number>>(
    {}
  );
  const [userReaction, setUserReaction] = useState<string | null>(null);

  const handleOpen = (e: React.MouseEvent<HTMLElement>) =>
    setAnchorEl(e.currentTarget);
  const handleClose = () => setAnchorEl(null);

  // default counts để luôn có đủ key
  const defaultCounts = reactions.reduce((acc, r) => {
    acc[r.type] = 0;
    return acc;
  }, {} as Record<string, number>);

  const handleSelectReaction = async (type: string) => {
    handleClose();
    if (!post?.id || !currentUserId) return;

    const postRef = doc(db, "posts", post.id);
    const userReactionRef = doc(
      db,
      "posts",
      post.id,
      "reactions",
      currentUserId
    );

    try {
      await runTransaction(db, async (transaction) => {
        // đọc dữ liệu
        const postSnap = await transaction.get(postRef);
        const userSnap = await transaction.get(userReactionRef);

        if (!postSnap.exists()) throw new Error("Post not found");

        const data = postSnap.data();
        const counts: Record<string, number> = {
          ...defaultCounts,
          ...(data.reactionsCount || {}),
        };

        // nếu user bấm lại cùng reaction → remove
        if (userSnap.exists() && userSnap.data().type === type) {
          transaction.delete(userReactionRef);
          counts[type] = Math.max(0, (counts[type] || 0) - 1);
        } else {
          // nếu có reaction cũ → trừ
          if (userSnap.exists()) {
            const oldType = userSnap.data().type;
            counts[oldType] = Math.max(0, (counts[oldType] || 0) - 1);
          }
          // set reaction mới
          transaction.set(userReactionRef, { type, createdAt: Date.now() });
          counts[type] = (counts[type] || 0) + 1;
        }

        // update lại counts
        transaction.update(postRef, { reactionsCount: counts });
      });
    } catch (err) {
      console.error("Transaction failed:", err);
    }
  };

  // listen tổng reactionsCount
  useEffect(() => {
    if (!post?.id) return;
    const unsub = onSnapshot(doc(db, "posts", post.id), (snap) => {
      if (!snap.exists()) return;
      const rc = snap.data().reactionsCount || {};
      setReactionsCount({ ...defaultCounts, ...rc });
    });
    return () => unsub();
  }, [post?.id]);

  // listen reaction của chính user
  useEffect(() => {
    if (!post?.id || !currentUserId) {
      setUserReaction(null);
      return;
    }
    const unsub = onSnapshot(
      doc(db, "posts", post.id, "reactions", currentUserId),
      (snap) => {
        if (!snap.exists()) setUserReaction(null);
        else setUserReaction(snap.data().type || null);
      }
    );
    return () => unsub();
  }, [post?.id, currentUserId]);

  if (!post?.id || !currentUserId) return null;

  return (
    <Box display="flex" alignItems="center" gap={1}>
      {/* nút mở reactions */}
      <IconButton
        onClick={handleOpen}
        size="small"
        aria-label="Bày tỏ cảm xúc"
        sx={{
          fontSize: 18,
          borderRadius: "999px",
          border: 1,
          borderColor: userReaction ? "primary.main" : "divider",
          bgcolor: userReaction ? "action.selected" : "transparent",
          px: 1.25,
        }}
      >
        {userReaction ? (
          reactions.find((r) => r.type === userReaction)?.icon
        ) : (
          // <ThumbUpIcon />
          <span style={{ fontSize: "1em" }}>👍</span>
        )}
      </IconButton>

      {/* popup chọn reaction */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        transformOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Box display="flex" p={0.75} gap={0.25}>
          {reactions.map((r) => (
            <IconButton
              key={r.type}
              onClick={() => handleSelectReaction(r.type)}
              sx={{
                bgcolor:
                  userReaction === r.type ? "action.selected" : "transparent",
                borderRadius: "50%",
                fontSize: 22,
                transition: "transform .15s",
                "&:hover": { transform: "scale(1.25)" },
              }}
            >
              {r.icon}
            </IconButton>
          ))}
        </Box>
      </Popover>

      {/* hiển thị counts */}
      <Box display="flex" alignItems="center" gap={1.25} sx={{ color: "text.secondary" }}>
        {reactions
          .filter((r) => (reactionsCount[r.type] ?? 0) > 0)
          .map((r) => (
            <Box key={r.type} display="flex" alignItems="center" gap={0.5} sx={{ fontSize: 14 }}>
              {r.icon}
              <Typography variant="caption" fontWeight={600}>
                {reactionsCount[r.type] ?? 0}
              </Typography>
            </Box>
          ))}
      </Box>
    </Box>
  );
}
