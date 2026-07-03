import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BeachDataProvider } from "./store/BeachDataContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BeachDataProvider>
      <App />
    </BeachDataProvider>
  </React.StrictMode>
);
