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
import "./index.css";

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
