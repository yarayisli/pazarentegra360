import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { createQueryClient } from "./api/queryClient.ts";
import { AuthGate } from "./AuthGate.tsx";
import "./index.css";

const queryClient = createQueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  </StrictMode>,
);
