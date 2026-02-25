import { useState } from "react";
import { Box, IconButton } from "@mui/material";
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
        borderRadius: "8px",
        overflow: "hidden",
      }}
    >
      <img
        src={images[current]}
        alt={`shared-${current}`}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: "8px",
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
              color: "white",
              backgroundColor: "rgba(0,0,0,0.3)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
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
              color: "white",
              backgroundColor: "rgba(0,0,0,0.3)",
              "&:hover": { backgroundColor: "rgba(0,0,0,0.5)" },
            }}
          >
            <ArrowForwardIosIcon fontSize="small" />
          </IconButton>
        </>
      )}
    </Box>
  );
}
