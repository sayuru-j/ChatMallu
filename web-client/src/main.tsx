import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

function setViewportUnit() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

setViewportUnit();
window.addEventListener("resize", setViewportUnit);

createRoot(document.getElementById("root")!).render(<App />);
