// import React from "react";
// import ReactDOM from "react-dom/client";
// import "./index.css";
// import App from "./App";
// import { BrowserRouter } from "react-router-dom";

// import { MantineProvider } from "@mantine/core";

// import "@mantine/core/styles.css";

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <MantineProvider>
//     <BrowserRouter>
//       <App />
//     </BrowserRouter>
//   </MantineProvider>
// );

// src/index.js
import React from "react";
import ReactDOM from "react-dom";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { MantineProvider } from "@mantine/core";
import { Chat } from "stream-chat-react";
import "@mantine/core/styles.css";
import "stream-chat-react/dist/css/v2/index.css";
import { messaging } from "./firebaseConfig"; // Add this
import { getToken } from "firebase/messaging"; // Add this
import "./index.css";

if ("serviceWorker" in navigator && "PushManager" in window) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("ServiceWorker registered:", registration);
    } catch (error) {
      console.error("ServiceWorker registration failed:", error);
    }
  });
}

ReactDOM.render(
  <React.StrictMode>
    <AuthProvider>
      <MantineProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MantineProvider>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
