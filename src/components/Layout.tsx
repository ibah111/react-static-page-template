import { Box } from "@mui/material";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: "280px", // Отступ для сайдбара
          minHeight: "100vh",
          p: 3
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
