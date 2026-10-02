import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import AdminApp from "../src/AdminApp.jsx";
import AppErrorBoundary from "../src/AppErrorBoundary.jsx";
import "../src/admin.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppErrorBoundary appName="TourismuBD Admin" restartCommand="npm run dev:admin">
      <AdminApp />
    </AppErrorBoundary>
  </StrictMode>,
);
