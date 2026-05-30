import { Buffer } from "buffer";
import { createRoot } from "react-dom/client";
import "@/polyfills";
import App from "./App";
import "./index.css";

window.Buffer = Buffer;

createRoot(document.getElementById("root")!).render(<App />);
