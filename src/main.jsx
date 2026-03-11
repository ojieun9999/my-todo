import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

if (!window.storage) {
  window.storage = {
    get: async (k) => {
      const v = localStorage.getItem(k);
      return v ? { key: k, value: v } : null;
    },
    set: async (k, v) => {
      localStorage.setItem(k, v);
      return { key: k, value: v };
    },
  };
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><App /></React.StrictMode>
);
