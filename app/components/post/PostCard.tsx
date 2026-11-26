import {
  Card,
  CardHeader,
  Avatar,
  CardContent,
  Typography,
  Box,
  Divider,
  IconButton,
  Button,
  Stack,
  Tooltip,
} from "@mui/material";
import CommentBox from "./CommentBox";
import CommentList from "./CommentList";
import { useUser } from "@/hooks/useUser";
import { MoreVert, Share as ShareIcon } from "@mui/icons-material";
import {
  addDoc,
  collection,
  doc,
  increment,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase.config";
import { useFacebookSDK } from "@/hooks/useFacebookSDK";
import PostReactions from "./PostReactions";
import ChatBubbleOutlineIcon from "@mui/icons-material/ChatBubbleOutline";
import FriendAction from "./FriendAction";
import PostImageDisplay from "./PostImageDisplay";
import PostTitle from "./PostTitle";
import dayjs from "@/app/lib/dayjs";
interface User {
  id: string;
  username: string;
  avatar: string;
}

interface Comment {
  id: string;
  text: string;
  user: User;
}

interface Post {
  shareCount: number;
  id: string;
  title: string;
  thrilled: string;
  imageUrl: string;
  imageUrls: string[];
  author: User;
  comments: Comment[];
  sent: boolean;
  createdAt: string | number; // timestamp hoặc string
}

interface PostCardProps {
  post: Post;
  currentUserId: string;
  onRefresh: () => void;
}

export default function PostCard({
  post,
  currentUserId,
  onRefresh,
}: PostCardProps) {
  const user = useUser();
  useFacebookSDK();
  // Convert createdAt sang Date
  const createdDate =
    typeof post.createdAt === "number"
      ? new Date(post.createdAt)
      : new Date(post.createdAt);

  const handleShare = () => {
    const FB = (window as any).FB;

    if (!FB) {
      console.error("Facebook SDK chưa load xong");
      return;
    }

    FB.ui(
      {
        method: "share",
        href: `https://x-fe7d.vercel.app/posts/${post.id}`,
      },
      () => {
        // Không check response nữa
        console.log("✅ Share popup đã mở, ghi nhận share");
        saveShareToFirestore();
      },
    );
  };

  // Tách async riêng
  async function saveShareToFirestore() {
    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, {
      shareCount: increment(1),
    });
    onRefresh();
  }


  const actionSx = {
    flex: 1,
    color: "text.secondary",
    fontWeight: 600,
    gap: 0.75,
    "&:hover": { color: "text.primary" },
  } as const;

  return (
    <Card
      sx={{
        mb: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <CardHeader
        avatar={
          <Avatar
            src={post.author.avatar ?? ""}
            sx={{ width: 40, height: 40 }}
          >
            {post.author.username?.charAt(0)?.toUpperCase()}
          </Avatar>
        }
        title={
          <Typography fontWeight={600} variant="body2" color="text.primary">
            {post.author.username}
          </Typography>
        }
        subheader={
          <Tooltip title={createdDate.toLocaleString("vi-VN")} placement="bottom-start">
            <Typography variant="caption" color="text.secondary" component="span">
              {dayjs(createdDate).fromNow()}
            </Typography>
          </Tooltip>
        }
        action={<FriendAction postToShare={post} />}
        sx={{ pb: 1, "& .MuiCardHeader-action": { alignSelf: "center", m: 0 } }}
      />

      <PostTitle post={post} />

      {/* Image */}
      {post.imageUrl && (
        <Box sx={{ mt: 1, bgcolor: "action.hover" }}>
          <img
            src={post.imageUrl}
            alt={post.title}
            style={{
              display: "block",
              width: "100%",
              maxHeight: 640,
              objectFit: "cover",
            }}
          />
        </Box>
      )}

      {post?.imageUrls?.length > 0 && <PostImageDisplay post={post} />}

      <CardContent sx={{ pt: 1, pb: "12px !important", flex: 1 }}>
        {/* Content */}
        {post.thrilled && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, whiteSpace: "pre-line" }}
            noWrap
          >
            {post.thrilled}
          </Typography>
        )}

        {/* Reactions */}
        {user && <PostReactions post={post} currentUserId={currentUserId} />}

        {/* Actions */}
        <Divider sx={{ mt: 1 }} />
        <Stack direction="row" sx={{ py: 0.5 }}>
          <Button color="inherit" sx={actionSx} startIcon={<ChatBubbleOutlineIcon fontSize="small" />}>
            Bình luận
            {post.comments.length > 0 && (
              <Box component="span" sx={{ fontWeight: 500 }}>
                ({post.comments.length})
              </Box>
            )}
          </Button>
          <Button
            color="inherit"
            onClick={handleShare}
            sx={actionSx}
            startIcon={<ShareIcon fontSize="small" />}
          >
            Chia sẻ
            {post.shareCount > 0 && (
              <Box component="span" sx={{ fontWeight: 500 }}>
                ({post.shareCount})
              </Box>
            )}
          </Button>
        </Stack>
        <Divider sx={{ mb: 1 }} />

        {/* Comment list */}
        <Box sx={{ maxHeight: 220, overflowY: "auto", pr: 1 }}>
          <CommentList comments={post.comments} />
        </Box>

        {/* Comment form  */}
        {user && (
          <CommentBox
            postId={post.id}
            userId={currentUserId}
            onCommentAdded={onRefresh}
          />
        )}
      </CardContent>
    </Card>
  );
}
