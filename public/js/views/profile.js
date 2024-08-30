import app from "../config.js";

import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

import {
  getDatabase,
  ref as databaseRef,
  set,
  push,
  onChildAdded,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-database.js";

import {
  getStorage,
  ref as storageRef,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";

const db = getDatabase(app);
const auth = getAuth(app);
const storage = getStorage(app); 

const profileView = `
<div class="container py-5">
        <div class="row py-5">
            <div class="col-12 col-md-6">
                <div id="chat" style="display: none">
                    <h1 class="m-0">Chat</h1>
                    <p class="mb-4">Get in touch with our support team</p>
                    <div id="chatMessages" class="mb-2">
                        <p id="errorMessage" class="text-danger m-0" style="display: none">
                            Please enter a message before sending.
                        </p>
                    </div>
                    <form action="" id="chatForm" class="d-flex">
                        <textarea id="messageInput" class="form-control" rows="1"
                            placeholder="Write a message..."></textarea>
                        <button id="sendMessageButton" class="btn-msg">
                            <i class="bi bi-send"></i>
                        </button>
                    </form>
                </div>
            </div>
            <div class="col-12 col-md-6">
                <h3 class="mb-2">Profile</h3>
                <div class="d-flex">
                  <div id="welcomeMessage" class="alert alert-success" style="display: none"></div>
                  <div id="profileImageContainer"></div>
                </div>
                <button id="logoutButton" class="btn" style="display: none">
                    Log Out
                </button>
                <div id="notAuthenticatedMessage" class="alert alert-warning" style="display: none">
                    You need to be logged to see your profile. Please,
                    <a href="#login">log in</a>.
                </div>
            </div>
        </div>
    </div>
`;

async function displayProfileView() {
  onAuthStateChanged(auth, async (user) => {
    const welcomeMessage = document.getElementById("welcomeMessage");
    const notAuthenticatedMessage = document.getElementById(
      "notAuthenticatedMessage"
    );
    const logoutButton = document.getElementById("logoutButton");
    const form = document.getElementById("chatForm");
    const input = document.getElementById("messageInput");
    const errorMessage = document.getElementById("errorMessage");

    if (user) {
      if (user.email) {
        logoutButton.style.display = "block";
        notAuthenticatedMessage.style.display = "none";

        const userName = user.email || "Usuario";
        welcomeMessage.style.display = "block";
        welcomeMessage.textContent = `Hi, ${userName}! Welcome to your profile.`;

        const chat = document.getElementById("chat");
        const uid = user.uid;
        chat.style.display = "block";

        const storageRefInstance = storageRef(
          storage,
          `profile_images/${user.uid}`
        );
        const imageUrl = await getDownloadURL(storageRefInstance);

        const profileImageContainer = document.getElementById(
          "profileImageContainer"
        );
        profileImageContainer.innerHTML = `<img src="${imageUrl}" alt="Profile Image" style="max-width: 100%;">`;

        const messagesRef = databaseRef(db, "messages/" + uid);

        getMessages(messagesRef, user.email);

        form.addEventListener("submit", function (e) {
          e.preventDefault();

          if (input.value.trim() === "") {
            errorMessage.style.display = "block";
            return;
          }

          errorMessage.style.display = "none";

          const messages = ref(db, "messages/" + uid);
          const newMessage = push(messages);

          set(newMessage, {
            userId: user.uid,
            text: input.value,
            createdAt: Date.now(),
          });

          input.value = "";
        });
      } else {
        console.error("Información del usuario no disponible");
      }
    } else {
      logoutButton.style.display = "none";
      welcomeMessage.style.display = "none";
      notAuthenticatedMessage.style.display = "block";
    }
  });

  function getMessages(messagesRef, user) {
    const conversation = document.getElementById("chatMessages");

    onChildAdded(messagesRef, (snapshot) => {
      const message = snapshot.val();

      const isSentByUser = message.sender === user.uid;

      const messageContainer = document.createElement("div");
      messageContainer.className = isSentByUser
        ? "message sent"
        : "message received";

      if (isSentByUser) {
        messageContainer.innerHTML = `
                        <p class="name-user mb-1">You sent:</p>
                        <div class="message-container">
                        <p class="message-text mb-0">${message.text}</p>
                        </div>
                    `;
      } else {
        messageContainer.innerHTML = `
                        <p class="name-user mb-1">Received:</p>
                        <div class="message-container">
                        <p class="message-text mb-0">${message.text}</p>
                        </div>
                    `;
      }

      conversation.appendChild(messageContainer);
    });
  }

  const logoutButton = document.getElementById("logoutButton");
  logoutButton.addEventListener("click", function () {
    signOut(auth)
      .then(() => {
        window.location.href = "#home";
      })
      .catch((error) => {
        console.error("Error at log in:", error);
      });
  });
}

export default {
  view: profileView,
  displayProfile: [displayProfileView],
};
