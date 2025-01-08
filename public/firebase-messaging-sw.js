importScripts(
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBdP9U9K37q-a3GUQrKS1hTXOP84w9yD_A",
  authDomain: "bambuu-e5b3d.firebaseapp.com",
  projectId: "bambuu-e5b3d",
  storageBucket: "bambuu-e5b3d.appspot.com",
  messagingSenderId: "307767240976",
  appId: "1:307767240976:web:c118e1aaa095c35a90dd95",
  measurementId: "G-F4E4NL282J",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("Received background message:", payload);
});
