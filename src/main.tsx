import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Preload both logo variants so theme switching is instant
import inwWideLogo from '@/assets/inw-wide.png';
import inwWideWhiteLogo from '@/assets/inw-wide-white.png';
[inwWideLogo, inwWideWhiteLogo].forEach(src => {
  const img = new Image();
  img.src = src;
});

createRoot(document.getElementById("root")!).render(<App />);
