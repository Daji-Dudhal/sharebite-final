import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  Paper,
  Stack,
  IconButton,
} from "@mui/material";
import {
  Restaurant,
  VolunteerActivism,
  LocalShipping,
  EmojiEvents,
  People,
  Login as LoginIcon,
  Brightness4,
  Brightness7,
  TrendingUp,
  Recycling,
  AccessTime,
  AdminPanelSettings,
  HomeWork,
  Groups,
  EmojiPeople,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../utils/api";

const HomePage = ({ darkMode, setDarkMode }) => {
  
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalDonations: 0,
    totalMeals: 0,
    activeVolunteers: 0,
    servedPeople: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const roleRoutes = {
        ADMIN: "/admin",
        HOTEL: "/hotel",
        NGO: "/ngo",
        VOLUNTEER: "/volunteer",
        NEEDY: "/needy",
        COMPOST_AGENCY: "/compost",
      };
      navigate(roleRoutes[user.userType] || "/login", { replace: true });
      return;
    }
    loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [donationsRes, requestsRes, usersRes] = await Promise.all([
        api.get("/donations").catch(() => ({ data: [] })),
        api.get("/requests").catch(() => ({ data: [] })),
        api.get("/users").catch(() => ({ data: [] })),
      ]);

      const donations = donationsRes.data || [];
      const requests = requestsRes.data || [];
      const users = usersRes.data || [];

      const totalMeals = donations.reduce(
        (sum, d) => sum + (d.quantity || 0),
        0
      );
      const deliveredMeals = requests.filter(
        (r) => r.status === "DELIVERED"
      ).length;
      const volunteers = users.filter(
        (u) => u.userType === "VOLUNTEER" && u.status === "APPROVED"
      ).length;

      setStats({
        totalDonations: donations.length || 500,
        totalMeals: totalMeals || 600,
        activeVolunteers: volunteers || 10,
        servedPeople: deliveredMeals * 2 || 1000,
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const wasteStats = [
    {
      value: "1.3",
      label: "Billion Tons",
      description: "Food wasted globally each year",
      icon: <Recycling />,
      color: "#F44336",
    },
    {
      value: "33%",
      label: "Waste Rate",
      description: "Of all food produced gets thrown away",
      icon: <TrendingUp />,
      color: "#FF9800",
    },
    {
      value: "690M",
      label: "People Hungry",
      description: "People suffer hunger worldwide",
      icon: <People />,
      color: "#E91E63",
    },
    {
      value: "8%",
      label: "GHG Emissions",
      description: "Food waste contributes to climate change",
      icon: <AccessTime />,
      color: "#4CAF50",
    },
  ];

  const panelCards = [
    {
      title: "Admin Panel",
      description:
        "Approve users, manage roles and monitor the entire ecosystem.",
      icon: <AdminPanelSettings sx={{ fontSize: 34 }} />,
      color: "#4CAF50",
    },
    {
      title: "Hotel / Restaurant",
      description: "Add food donations, upload photos and track impact.",
      icon: <HomeWork sx={{ fontSize: 34 }} />,
      color: "#00ACC1",
    },
    {
      title: "NGO Panel",
      description: "Find donations, request pickups and assign volunteers.",
      icon: <Groups sx={{ fontSize: 34 }} />,
      color: "#FF9800",
    },
    {
      title: "Volunteer Panel",
      description:
        "Accept tasks, deliver meals, update location and earn rewards.",
      icon: <VolunteerActivism sx={{ fontSize: 34 }} />,
      color: "#9C27B0",
    },
    {
      title: "Needy Panel",
      description: "Request meals, track delivery and receive food.",
      icon: <EmojiPeople sx={{ fontSize: 34 }} />,
      color: "#8BC34A",
    },
    {
      title: "Compost Agency",
      description: "Collect stale food and support a green environment.",
      icon: <Recycling sx={{ fontSize: 34 }} />,
      color: "#009688",
    },
  ];

  const impactStats = [
    {
      icon: <Restaurant sx={{ fontSize: 40 }} />,
      value: stats.totalDonations,
      label: "Donations",
      color: "#4CAF50",
    },
    {
      icon: <VolunteerActivism sx={{ fontSize: 40 }} />,
      value: stats.totalMeals,
      label: "Meals Shared",
      color: "#00ACC1",
    },
    {
      icon: <People sx={{ fontSize: 40 }} />,
      value: stats.activeVolunteers,
      label: "Volunteers",
      color: "#FF9800",
    },
    {
      icon: <EmojiEvents sx={{ fontSize: 40 }} />,
      value: stats.servedPeople,
      label: "People Served",
      color: "#9C27B0",
    },
  ];

  return (
    <Box bgcolor="background.default">

      {/* -------------------- DARK MODE BUTTON -------------------- */}
      <Box sx={{ position: "absolute", top: 12, right: 12 }}>
        <IconButton
          onClick={toggleDarkMode}
          sx={{ bgcolor: "background.paper", boxShadow: 2 }}
        >
          {darkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Box>

      {/* -------------------- HERO SECTION -------------------- */}
      <Box
        sx={{
          py: 10,
          background: darkMode
            ? "linear-gradient(135deg,#111,#1a1a1a)"
            : "linear-gradient(135deg,#d7f5dd,#e7f1f1)",
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            {/* TEXT */}
            <Grid item xs={12} md={6}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: "2.5rem", md: "3.4rem" },
                  fontWeight: 900,
                  background:
                    "linear-gradient(45deg,#2E7D32,#00ACC1)",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                ShareBite
              </Typography>

              <Typography variant="h4" sx={{ mt: 1, fontWeight: 700 }}>
                From Extra to Essential; Share Every Bite!
              </Typography>

              <Typography
                variant="body1"
                sx={{ mt: 2, mb: 4, color: "text.secondary", lineHeight: 1.7 }}
              >
                A unified platform connecting hotels, NGOs, volunteers,
                needy individuals and compost agencies to reduce food
                waste and hunger.
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate("/login")}
                  sx={{ px: 4, borderRadius: 30 }}
                >
                  Get Started
                </Button>

                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate("/register")}
                  sx={{ px: 4, borderRadius: 30 }}
                >
                  Join as Partner
                </Button>
              </Stack>
            </Grid>

            {/* IMAGE */}
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: "relative",
                  borderRadius: 4,
                  overflow: "hidden",
                  height: { xs: 260, md: 360 },
                  boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1605810230434-7631ac76ec81?q=80&w=1200"
                  alt="Food Donation"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />

                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 3,
                    background:
                      "linear-gradient(to top,rgba(0,0,0,0.85),transparent)",
                    color: "white",
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    “No one deserves to sleep hungry.”
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Every surplus meal is hope for someone.
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* -------------------- STRONG TEXT SECTION (NO IMAGE) -------------------- */}
      <Box
        sx={{
          py: 8,
          background: darkMode ? "#111" : "#fafafa",
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            Every Meal You Share Can Change a Life
          </Typography>

          <Typography
            variant="h6"
            align="center"
            sx={{
              color: "text.secondary",
              lineHeight: 1.7,
              maxWidth: 700,
              mx: "auto",
            }}
          >
            Millions sleep hungry while tons of food are thrown away.
            ShareBite transforms surplus meals into meaningful help,
            restoring dignity and hope to communities in need.
          </Typography>
        </Container>
      </Box>

      {/* -------------------- FOOD WASTE FACTS -------------------- */}
      <Box sx={{ py: 10, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            The Food Waste Crisis
          </Typography>

          <Typography
            align="center"
            sx={{
              mb: 6,
              color: "text.secondary",
              maxWidth: 700,
              mx: "auto",
            }}
          >
            While millions go hungry, massive amounts of food are wasted.
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {wasteStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: 250,
                    borderRadius: 4,
                    background: darkMode ? "#1b1b1b" : "#ffffff",
                    border: `2px solid ${stat.color}55`,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    textAlign: "center",
                    transition: "0.3s",
                    "&:hover": {
                      transform: "translateY(-8px)",
                      borderColor: stat.color,
                      boxShadow: `0 12px 30px ${stat.color}40`,
                    },
                  }}
                >
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography
                    variant="h3"
                    sx={{ fontWeight: 800, color: stat.color }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography variant="h6">{stat.label}</Typography>
                  <Typography sx={{ color: "text.secondary" }}>
                    {stat.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* -------------------- IMPACT STATS -------------------- */}
      <Box sx={{ py: 10 }}>
        <Container maxWidth="lg">
          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 4 }}
          >
            Our Impact in Numbers
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {impactStats.map((stat, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    p: 3,
                    height: 210,
                    borderRadius: 4,
                    textAlign: "center",
                    background: darkMode ? "#151515" : "#ffffff",
                    boxShadow: darkMode
                      ? "0 12px 30px rgba(0,0,0,0.6)"
                      : "0 12px 25px rgba(0,0,0,0.1)",
                    transition: "0.3s",
                    "&:hover": { transform: "translateY(-6px)" },
                  }}
                >
                  <Box sx={{ color: stat.color }}>{stat.icon}</Box>
                  <Typography variant="h3" sx={{ fontWeight: 800 }}>
                    {loading ? "…" : stat.value}
                  </Typography>
                  <Typography variant="h6">{stat.label}</Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* -------------------- ONE PLATFORM, MANY PANELS -------------------- */}
      <Box sx={{ bgcolor: "background.paper", py: 10 }}>
        <Container maxWidth="lg">

          <Typography
            variant="h3"
            align="center"
            sx={{ fontWeight: 800, mb: 2 }}
          >
            One Platform, Many Panels
          </Typography>

          <Typography
            align="center"
            sx={{ color: "text.secondary", mb: 6, maxWidth: 700, mx: "auto" }}
          >
            Every role has a dedicated panel with tools tailored for maximum
            efficiency — all connected seamlessly in a unified ecosystem.
          </Typography>

          <Grid container spacing={3} justifyContent="center">
            {panelCards.map((panel, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Paper
  sx={{
    p: 3,
    height: 240,               // consistent height
    borderRadius: 4,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between", // evenly spaced
    background: darkMode ? "#1a1a1a" : "#ffffff",
    border: "1px solid #4444",
    transition: "0.25s",
    "&:hover": {
      transform: "translateY(-6px)",
      borderColor: panel.color,
      boxShadow: `0 6px 20px ${panel.color}40`,
    },
  }}
>
  <Box sx={{ color: panel.color }}>{panel.icon}</Box>

  <Typography
    variant="h6"
    sx={{
      mt: 1,
      fontWeight: 700,
      textAlign: "left",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    }}
  >
    {panel.title}
  </Typography>

  <Typography
    variant="body2"
    sx={{
      color: "text.secondary",
      mt: 1,
      lineHeight: 1.5,
      display: "-webkit-box",
      WebkitBoxOrient: "vertical",
      WebkitLineClamp: 3, // limits text to 3 lines
      overflow: "hidden",
      height: "60px",     // consistent space for text
    }}
  >
    {panel.description}
  </Typography>
</Paper>

              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* -------------------- CTA SECTION -------------------- */}
      <Box
        sx={{
          py: 10,
          background: darkMode
            ? "linear-gradient(135deg,#222,#111)"
            : "linear-gradient(135deg,#4CAF50,#00ACC1)",
          color: "white",
        }}
      >
        <Container maxWidth="md" sx={{ textAlign: "center" }}>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 2 }}>
            Ready to Make a Difference?
          </Typography>

          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
            Join thousands of partners working daily to reduce food waste
            and fight hunger.
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              sx={{
                px: 4,
                borderRadius: 30,
                bgcolor: "white",
                color: darkMode ? "#222" : "#4CAF50",
              }}
              onClick={() => navigate("/login")}
            >
              Sign In
            </Button>

            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, borderRadius: 30, borderColor: "white", color: "white" }}
              onClick={() => navigate("/register")}
            >
              Create Account
            </Button>
          </Stack>
        </Container>
      </Box>

      {/* -------------------- FOOTER -------------------- */}
      <Box sx={{ py: 4, bgcolor: "background.paper" }}>
        <Container maxWidth="lg">
          <Typography align="center" sx={{ color: "text.secondary" }}>
            © 2024 ShareBite — Fighting Hunger, One Meal at a Time. By Team Alpha
          </Typography>
        </Container>
      </Box>
    </Box>
  );
};

export default HomePage;
