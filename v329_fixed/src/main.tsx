import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
const loader = rootEl.querySelector(".il-wrap") as HTMLElement | null;
const root = createRoot(rootEl);

const renderApp = () => {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

if (loader) {
  const bar = document.getElementById("il-bar");
  if (bar) {
    bar.style.animation = "none";
    bar.style.width = "100%";
    bar.style.transition = "width 0.3s ease-out";
  }
  setTimeout(() => {
    loader.classList.add("il-fade-out");
    setTimeout(() => {
      loader.remove();
      renderApp();
    }, 700);
  }, 350);
} else {
  renderApp();
}
