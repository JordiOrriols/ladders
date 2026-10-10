import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { loadUmami } from "@jordiorriols/ui";
import "./i18n";
import App from "./App";

loadUmami({ websiteId: "e6e5aaac-6c09-4bbc-8900-45d5859a983e" });

createRoot(document.getElementById("root")).render(
  <HashRouter>
    <App />
  </HashRouter>
);
