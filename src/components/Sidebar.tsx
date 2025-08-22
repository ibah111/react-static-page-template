import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Paper,
} from "@mui/material";
import {
  Home,
  TextFields,
  // AudioFile,
  // SmartToy
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: "Главная", icon: <Home />, path: "/" },
    { text: "Транскрибация + AI", icon: <TextFields />, path: "/transcribe" },
    // { text: "Только транскрибация", icon: <AudioFile />, path: "/transcribe-only" },
    // { text: "Только AI", icon: <SmartToy />, path: "/ai-only" },
  ];

  return (
    <Paper
      elevation={2}
      sx={{
        width: 280,
        height: "100vh",
        borderRadius: 0,
        position: "fixed",
        left: 0,
        top: 0,
        zIndex: 1000,
      }}
    >
      <Box sx={{ p: 3, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" component="h1" sx={{ fontWeight: "bold" }}>
          Навигация
        </Typography>
      </Box>

      <List sx={{ pt: 2 }}>
        {menuItems.map((item) => (
          <ListItem key={item.path} disablePadding>
            <ListItemButton
              onClick={() => navigate(item.path)}
              selected={location.pathname === item.path}
              sx={{
                mx: 1,
                borderRadius: 1,
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": {
                    backgroundColor: "primary.dark",
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color:
                    location.pathname === item.path
                      ? "inherit"
                      : "text.secondary",
                  minWidth: 40,
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Paper>
  );
}
