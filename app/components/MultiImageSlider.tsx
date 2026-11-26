import { useState } from "react";
import { Box, IconButton } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

export function MultiImageSlider({ images }: { images: string[] }) {
  const [current, setCurrent] = useState(0);

  const handlePrev = (e: any) => {
    e.stopPropagation();
    setCurrent((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e: any) => {
    e.stopPropagation();
    setCurrent((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: 150,
        height: 150,
        borderRadius: "12px",
        overflow: "hidden",
        bgcolor: "action.hover",
      }}
    >
      <img
        src={images[current]}
        alt={`shared-${current}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {images.length > 1 && (
        <>
          <IconButton
            size="small"
            onClick={handlePrev}
            sx={{
              position: "absolute",
              top: "50%",
              left: 0,
              transform: "translateY(-50%)",
              m: 0.5,
              borderRadius: "50%",
              color: "common.white",
              bgcolor: (t) => alpha(t.palette.common.black, 0.45),
              "& svg": { fontSize: 12 },
              "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
            }}
          >
            <ArrowBackIosNewIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={handleNext}
            sx={{
              position: "absolute",
              top: "50%",
              right: 0,
              transform: "translateY(-50%)",
              m: 0.5,
              borderRadius: "50%",
              color: "common.white",
              bgcolor: (t) => alpha(t.palette.common.black, 0.45),
              "& svg": { fontSize: 12 },
              "&:hover": { bgcolor: (t) => alpha(t.palette.common.black, 0.65) },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
}
