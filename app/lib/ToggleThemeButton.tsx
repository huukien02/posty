import { useContext } from "react";
import { ColorModeContext } from "./theme-implementation";
import { IconButton } from "@mui/material";
import { Brightness4, Brightness7 } from "@mui/icons-material";

export default function ToggleThemeButton() {
  const { toggleColorMode, mode } = useContext(ColorModeContext);

  return (
    <IconButton onClick={toggleColorMode} color="inherit">
      {mode === "dark" ? <Brightness7 /> : <Brightness4 />}
    </IconButton>
  );
}
