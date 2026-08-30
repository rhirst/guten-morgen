import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GoogleAuthProvider } from "./providers/GoogleAuthProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GoogleAuthProvider>
      <App />
    </GoogleAuthProvider>
  </StrictMode>
);