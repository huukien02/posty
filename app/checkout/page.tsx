"use client";
import React from "react";
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
} from "@mui/material";
import { loadStripe } from "@stripe/stripe-js";
import Stripe from "stripe";
import { useUser } from "@/hooks/useUser";

const plans = [
  { amount: 1, slots: 100 },
  { amount: 10, slots: 1000 },
  { amount: 100, slots: 10000 },
  { amount: 1000, slots: 100000 },
];

export default function StripeTestPage() {
  const user = useUser();

  const handleCheckout = async (amount: number) => {
    if (!user) {
      alert("User not logged in");
      return;
    }

    const stripe = new Stripe(
      "sk_test_51S8Cx2EDgScNEVgkWtz2HT6egYnqryuAn9kdkvOfETv91LdobcraXBGBlnq9CsfSA0c8KDDW041wqpkabTtAHS9n00VUKjP5lC"
    );

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Buy ${amount} post slot(s)`,
            },
            unit_amount: amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `https://x-fe7d.vercel.app/checkout/success?amount=${amount}&email=${encodeURIComponent(
        user.email
      )}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: "https://x-fe7d.vercel.app/checkout/cancel",
    });

    const stripeJs = await loadStripe(
      "pk_test_51S8Cx2EDgScNEVgkRKUcCaqxPgaGgysQuP8hkdrSW73opPciHfpmiQTPQpsp2TSy9bUOI7aE7rTynrs8MHSe3EWR00Btspet4f"
    );
    if (session.id) {
      stripeJs?.redirectToCheckout({ sessionId: session.id });
    }
  };

  if (!user) return null;

  return (
    <Container maxWidth="sm">
      <Box
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 6,
          bgcolor: theme.palette.background.default, // theo theme
        })}
      >
        <Container maxWidth="md">
          <Typography align="center" sx={{ fontWeight: 700, mb: 6 }}>
            Choose Your Plan
          </Typography>

          <Grid container spacing={4}>
            {plans.map((plan) => (
              <Card
                key={plan.amount}
                sx={(theme) => ({
                  width: { xs: "100%", sm: 220 },
                  textAlign: "center",
                  py: 4,
                  px: 2,
                  borderRadius: 3,
                  bgcolor: theme.palette.background.paper, // nền theo theme
                  boxShadow: theme.shadows[3],
                  transition: "transform 0.3s, box-shadow 0.3s",
                  "&:hover": {
                    transform: "translateY(-8px)",
                    boxShadow: theme.shadows[6],
                  },
                })}
              >
                <CardContent>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    ${plan.amount}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, color: "text.secondary" }}
                  >
                    +{plan.slots} slots
                  </Typography>
                </CardContent>
                <CardActions sx={{ justifyContent: "center" }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => handleCheckout(plan.amount)}
                    sx={{
                      borderRadius: 2,
                      px: 4,
                      py: 1.5,
                      fontWeight: 600,
                      textTransform: "none",
                      transition: "all 0.3s",
                      "&:hover": {
                        transform: "scale(1.05)",
                      },
                    }}
                  >
                    Pay ${plan.amount}
                  </Button>
                </CardActions>
              </Card>
            ))}
          </Grid>
        </Container>
      </Box>
    </Container>
  );
}
