import React from "react";
import { createRoot } from "react-dom/client";
import "../app/globals.css";
import { PurinPet } from "../components/PurinPet";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PurinPet />
  </React.StrictMode>,
);
