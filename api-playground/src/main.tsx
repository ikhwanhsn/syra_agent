import { createRoot } from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App.tsx";
import "./index.css";

// Polyfill Buffer for Solana wallet adapter
window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
