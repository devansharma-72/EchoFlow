import React from "react";
import ReactDOM from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const clerk_key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerk_key) {
  throw new Error("Clerk publishable key not found. Ensure it's set in your .env file.");
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={clerk_key}>
      <App />
    </ClerkProvider>
  </React.StrictMode>
);