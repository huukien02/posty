import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
} from "@mui/material";
import { ref, update } from "firebase/database";
import { rtdb } from "../../../lib/firebase.config"; // export Realtime Database từ firebase init

type SettingDialogProps = {
  open: boolean;
  onClose: () => void;
  theme: { background: string; fontFamily: string };
  setTheme: (theme: { background: string; fontFamily: string }) => void;
  roomId: string;
};

export default function SettingDialog({
  open,
  onClose,
  theme,
  setTheme,
  roomId,
}: SettingDialogProps) {
  const fonts = [
    "Segoe UI",
    "Roboto",
    "Poppins",
    "Arial",
    "Georgia",
    "Courier New",
  ];

  const handleSave = async () => {
    try {
      const roomRef = ref(rtdb, `rooms/${roomId}`);
      await update(roomRef, { config: theme });
      onClose();
    } catch (error) {
      console.error("Error saving theme:", error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle>Chat Settings</DialogTitle>
      <DialogContent>
        <TextField
          label="Background Color"
          type="color"
          fullWidth
          margin="dense"
          value={theme.background}
          onChange={(e) => setTheme({ ...theme, background: e.target.value })}
        />
        <TextField
          select
          label="Font Family"
          fullWidth
          margin="dense"
          value={theme.fontFamily}
          onChange={(e) => setTheme({ ...theme, fontFamily: e.target.value })}
        >
          {fonts.map((f) => (
            <MenuItem key={f} value={f}>
              {f}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
