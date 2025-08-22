import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme } from "@mui/material";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./components/Layout";
import Main from "./pages/main/index.tsx";
import TranscribePage from "./pages/transcribe/index.tsx";
import TranscribeOnlyPage from "./pages/transcribe-only/index.tsx";
import AIOnlyPage from "./pages/ai-only/index.tsx";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#ffffff",
      paper: "#ffffff",
    },
    text: {
      primary: "#000000",
      secondary: "#666666",
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "*",
        element: <Main />,
      },
      {
        path: "/",
        index: true,
        element: <Main />,
      },
      {
        path: "transcribe",
        element: <TranscribePage />,
      },
      {
        path: "transcribe-only",
        element: <TranscribeOnlyPage />,
      },
      {
        path: "ai-only",
        element: <AIOnlyPage />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </StrictMode>
);
