import { Box, Typography, Link, IconButton } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={(theme) => ({
        mt: "auto",
        py: 2,
        px: { xs: 2, sm: 4 },
        bgcolor:
          theme.palette.mode === "light"
            ? theme.palette.grey[200]
            : theme.palette.background.paper,
        color: theme.palette.text.secondary,
        textAlign: "center",
      })}
    >
      <Typography variant="body2" color="text.secondary">
        © {new Date().getFullYear()} My Collection. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
