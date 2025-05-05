// EchoRoom - Main JavaScript file

// Global state
const state = {
  socket: null,
  currentUser: {
    id: null,
    username: "",
    avatar: "",
  },
  currentRoom: {
    id: null,
    users: [],
  },
  screenSharing: {
    active: false,
    userId: null,
  },
  darkMode:
    localStorage.getItem("darkMode") === "true" ||
    window.matchMedia("(prefers-color-scheme: dark)").matches,
};

// DOM Elements
const elements = {
  landingPage: document.getElementById("landingPage"),
  userInfoForm: document.getElementById("userInfoForm"),
  chatRoom: document.getElementById("chatRoom"),
  createRoomBtn: document.getElementById("createRoomBtn"),
  joinRoomForm: document.getElementById("joinRoomForm"),
  roomIdInput: document.getElementById("roomIdInput"),
  profileForm: document.getElementById("profileForm"),
  usernameInput: document.getElementById("usernameInput"),
  avatarOptions: document.getElementById("avatarOptions"),
  roomIdDisplay: document.getElementById("roomIdDisplay"),
  userCountDisplay: document.getElementById("userCountDisplay"),
  messagesContainer: document.getElementById("messagesContainer"),
  messageForm: document.getElementById("messageForm"),
  messageInput: document.getElementById("messageInput"),
  participantsList: document.getElementById("participantsList"),
  shareRoomBtn: document.getElementById("shareRoomBtn"),
  screenShareBtn: document.getElementById("screenShareBtn"),
  leaveRoomBtn: document.getElementById("leaveRoomBtn"),
  noScreenShare: document.getElementById("noScreenShare"),
  screenShareVideo: document.getElementById("screenShareVideo"),
  toastContainer: document.getElementById("toastContainer"),
  themeToggle: document.getElementById("themeToggle"),
};

// Initialize the application
function init() {
  // Connect to the Socket.io server
  state.socket = io(
    window.location.hostname === "localhost"
      ? "http://localhost:3000"
      : "https://your-production-server.com"
  );

  // Generate avatar options
  generateAvatarOptions();

  // Apply dark mode if stored
  applyTheme();

  // Set up event listeners
  setupEventListeners();

  // Setup socket event handlers
  setupSocketHandlers();

  // Check URL for room ID
  checkUrlForRoomId();
}

// Set up event listeners
function setupEventListeners() {
  // Create a new room
  elements.createRoomBtn.addEventListener("click", handleCreateRoom);

  // Join an existing room
  elements.joinRoomForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleJoinRoom(elements.roomIdInput.value);
  });

  // Submit user profile info
  elements.profileForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleProfileSubmit();
  });

  // Send a message
  elements.messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSendMessage();
  });

  // Share room link
  elements.shareRoomBtn.addEventListener("click", handleShareRoom);

  // Screen share button
  elements.screenShareBtn.addEventListener("click", handleScreenShare);

  // Leave room button
  elements.leaveRoomBtn.addEventListener("click", handleLeaveRoom);

  // Theme toggle
  elements.themeToggle.addEventListener("click", toggleTheme);
}

// Set up Socket.io event handlers
function setupSocketHandlers() {
  // User joined room
  state.socket.on("user-joined", ({ user, userCount, users }) => {
    updateParticipantsList(users);
    elements.userCountDisplay.textContent = userCount;

    if (user.id !== state.socket.id) {
      showToast(`${user.username} joined the room`, "info");
    }
  });

  // User left room
  state.socket.on("user-left", ({ userId, userCount, users }) => {
    updateParticipantsList(users);
    elements.userCountDisplay.textContent = userCount;

    const leftUser = state.currentRoom.users.find((u) => u.id === userId);
    if (leftUser) {
      showToast(`${leftUser.username} left the room`, "info");
    }

    // If this user was sharing their screen, remove it
    if (state.screenSharing.userId === userId) {
      stopScreenShareViewing();
    }

    // Update our local list of users
    state.currentRoom.users = users;
  });

  // New message received
  state.socket.on("new-message", (message) => {
    addMessageToChat(message);
  });

  // Screen sharing updates
  state.socket.on("user-screen-share", ({ userId, isSharing }) => {
    if (isSharing) {
      state.screenSharing.userId = userId;

      if (userId !== state.socket.id) {
        const sharingUser = state.currentRoom.users.find(
          (u) => u.id === userId
        );
        showToast(
          `${sharingUser?.username || "Someone"} is sharing their screen`,
          "info"
        );
      }
    } else {
      if (state.screenSharing.userId === userId) {
        stopScreenShareViewing();
      }
    }
  });
}

// Generate avatar options using DiceBear
function generateAvatarOptions() {
  const styles = ["avataaars", "bottts", "identicon", "micah", "miniavs"];
  const container = elements.avatarOptions;

  // Clear existing options
  container.innerHTML = "";

  // Generate 8 random avatars (2 from each of 4 random styles)
  const randomStyles = styles.sort(() => 0.5 - Math.random()).slice(0, 4);

  for (let i = 0; i < 8; i++) {
    const style = randomStyles[Math.floor(i / 2)];
    const seed = Math.random().toString(36).substring(2, 8);
    const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;

    const div = document.createElement("div");
    div.className = "cursor-pointer";
    div.innerHTML = `<img src="${url}" alt="Avatar Option" class="avatar" data-avatar="${url}">`;

    div.addEventListener("click", (e) => {
      // Remove selected class from all avatars
      document
        .querySelectorAll(".avatar")
        .forEach((avatar) => avatar.classList.remove("avatar-selected"));

      // Add selected class to this avatar
      const img = e.target.closest("img");
      img.classList.add("avatar-selected");

      // Store the selection
      state.currentUser.avatar = img.dataset.avatar;
    });

    container.appendChild(div);
  }
}

// Create a new room
function handleCreateRoom() {
  state.socket.emit("create-room", (response) => {
    if (response.roomId) {
      showUserInfoForm(response.roomId);
    } else {
      showToast("Failed to create room. Please try again.", "error");
    }
  });
}

// Join an existing room
function handleJoinRoom(roomId) {
  if (!roomId) {
    showToast("Please enter a room ID", "error");
    return;
  }

  showUserInfoForm(roomId);
}

// Show the user info form to collect name and avatar
function showUserInfoForm(roomId) {
  state.currentRoom.id = roomId;
  elements.landingPage.classList.add("hidden");
  elements.userInfoForm.classList.remove("hidden");
  elements.usernameInput.focus();
}

// Handle user profile submission
function handleProfileSubmit() {
  const username = elements.usernameInput.value.trim();

  if (!username) {
    showToast("Please enter your name", "error");
    return;
  }

  if (!state.currentUser.avatar) {
    // If no avatar selected, choose the first one
    const firstAvatar = document.querySelector(".avatar");
    if (firstAvatar) {
      state.currentUser.avatar = firstAvatar.dataset.avatar;
      firstAvatar.classList.add("avatar-selected");
    } else {
      // If no avatars loaded, use a default
      state.currentUser.avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${state.socket.id}`;
    }
  }

  state.currentUser.username = username;

  // Join the room with user info
  state.socket.emit(
    "join-room",
    {
      roomId: state.currentRoom.id,
      username: state.currentUser.username,
      avatar: state.currentUser.avatar,
    },
    (response) => {
      if (response.success) {
        showChatRoom(response.roomData);
      } else {
        showToast(response.error || "Failed to join room", "error");
        goToLandingPage();
      }
    }
  );
}

// Show the chat room interface
function showChatRoom(roomData) {
  // Update our state
  state.currentRoom.id = roomData.id;
  state.currentRoom.users = roomData.users;

  // Update the UI
  elements.userInfoForm.classList.add("hidden");
  elements.chatRoom.classList.remove("hidden");
  elements.roomIdDisplay.textContent = state.currentRoom.id;
  elements.userCountDisplay.textContent = roomData.userCount;

  // Clear any existing messages
  elements.messagesContainer.innerHTML = "";

  // Update URL with room ID for sharing
  updateUrlWithRoomId(state.currentRoom.id);

  // Update participants list
  updateParticipantsList(roomData.users);

  // Focus on message input
  elements.messageInput.focus();

  // Show welcome toast
  showToast("Welcome to the chat room!", "success");
}

// Send a message
function handleSendMessage() {
  const messageText = elements.messageInput.value.trim();

  if (messageText) {
    state.socket.emit("send-message", messageText);
    elements.messageInput.value = "";
    elements.messageInput.focus();
  }
}

// Add a message to the chat
function addMessageToChat(message) {
  const isOutgoing = message.sender.id === state.socket.id;
  const messageDiv = document.createElement("div");

  messageDiv.className = "animate-fade-in";
  messageDiv.innerHTML = `
    <div class="flex ${isOutgoing ? "justify-end" : "items-start"}">
      ${
        !isOutgoing
          ? `<img src="${message.sender.avatar}" alt="${message.sender.username}" class="avatar-sm mr-2">`
          : ""
      }
      <div>
        ${
          !isOutgoing
            ? `<div class="text-xs text-gray-500 dark:text-gray-400 mb-1">${message.sender.username}</div>`
            : ""
        }
        <div class="message-bubble ${
          isOutgoing ? "message-outgoing" : "message-incoming"
        }">
          ${sanitizeHTML(message.text)}
        </div>
      </div>
      ${
        isOutgoing
          ? `<img src="${message.sender.avatar}" alt="${message.sender.username}" class="avatar-sm ml-2">`
          : ""
      }
    </div>
  `;

  elements.messagesContainer.appendChild(messageDiv);
  scrollToBottom(elements.messagesContainer);
}

// Update participants list
function updateParticipantsList(users) {
  elements.participantsList.innerHTML = "";

  users.forEach((user) => {
    const participantItem = document.createElement("li");
    participantItem.className =
      "flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700";

    // Add screen share indicator if this user is sharing
    const isSharing = state.screenSharing.userId === user.id;

    participantItem.innerHTML = `
      <img src="${user.avatar}" alt="${user.username}" class="avatar-sm">
      <div class="flex-1">
        <div class="font-medium ${
          user.id === state.socket.id
            ? "text-indigo-600 dark:text-indigo-400"
            : "text-gray-800 dark:text-white"
        }">${user.username} ${user.id === state.socket.id ? "(You)" : ""}</div>
      </div>
      ${
        isSharing
          ? '<span class="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">Sharing</span>'
          : ""
      }
    `;

    elements.participantsList.appendChild(participantItem);
  });
}

// Share the room link
function handleShareRoom() {
  const roomUrl = window.location.href;

  if (navigator.share) {
    navigator
      .share({
        title: "Join my EchoRoom chat",
        text: "Join my temporary chat room!",
        url: roomUrl,
      })
      .then(() => showToast("Room link shared!", "success"))
      .catch(() => {
        // Fallback if share API fails or is cancelled
        copyToClipboard(roomUrl);
      });
  } else {
    // Fallback for browsers that don't support the Web Share API
    copyToClipboard(roomUrl);
  }
}

// Copy text to clipboard and show notification
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => showToast("Room link copied to clipboard!", "success"))
    .catch(() =>
      showToast("Failed to copy link. Please copy it manually.", "error")
    );
}

// Handle screen sharing toggle
function handleScreenShare() {
  if (state.screenSharing.active) {
    stopScreenSharing();
  } else {
    startScreenSharing();
  }
}

// Start screen sharing
async function startScreenSharing() {
  try {
    // This function is defined in webrtc.js
    await startCapturingScreen();

    // Update UI
    elements.screenShareBtn.textContent = "Stop Sharing";
    elements.screenShareBtn.classList.add(
      "bg-red-100",
      "dark:bg-red-900",
      "text-red-800",
      "dark:text-red-200"
    );
    elements.screenShareBtn.classList.remove(
      "bg-purple-100",
      "dark:bg-purple-900",
      "text-purple-800",
      "dark:text-purple-200"
    );

    // Update state
    state.screenSharing.active = true;
    state.screenSharing.userId = state.socket.id;

    // Notify others
    state.socket.emit("screen-share-started");

    showToast("Screen sharing started", "success");
  } catch (error) {
    console.error("Error starting screen share:", error);
    showToast(
      error.name === "NotAllowedError"
        ? "You need to allow screen sharing permissions"
        : "Failed to start screen sharing",
      "error"
    );
  }
}

// Stop screen sharing
function stopScreenSharing() {
  // This function is defined in webrtc.js
  stopCapturingScreen();

  // Update UI
  elements.screenShareBtn.textContent = "Share Screen";
  elements.screenShareBtn.classList.remove(
    "bg-red-100",
    "dark:bg-red-900",
    "text-red-800",
    "dark:text-red-200"
  );
  elements.screenShareBtn.classList.add(
    "bg-purple-100",
    "dark:bg-purple-900",
    "text-purple-800",
    "dark:text-purple-200"
  );

  // Update state
  state.screenSharing.active = false;

  // Notify others
  state.socket.emit("screen-share-stopped");

  showToast("Screen sharing stopped", "info");
}

// Stop viewing a shared screen
function stopScreenShareViewing() {
  // Hide the video and show the placeholder
  elements.screenShareVideo.classList.add("hidden");
  elements.noScreenShare.classList.remove("hidden");

  // Reset state
  state.screenSharing.userId = null;
}

// Leave the current room
function handleLeaveRoom() {
  // Disconnect from room
  window.location.href = window.location.origin + window.location.pathname;
}

// Check URL for room ID
function checkUrlForRoomId() {
  const urlParams = new URLSearchParams(window.location.search);
  const roomId = urlParams.get("room");

  if (roomId) {
    handleJoinRoom(roomId);
  }
}

// Update the URL with room ID for sharing
function updateUrlWithRoomId(roomId) {
  const url = new URL(window.location);
  url.searchParams.set("room", roomId);
  window.history.pushState({}, "", url);
}

// Go back to landing page
function goToLandingPage() {
  // Reset the form
  elements.userInfoForm.classList.add("hidden");
  elements.chatRoom.classList.add("hidden");
  elements.landingPage.classList.remove("hidden");
  elements.joinRoomForm.reset();

  // Clear the URL parameters
  window.history.pushState({}, "", window.location.pathname);

  // Reset state
  state.currentRoom.id = null;
  state.currentRoom.users = [];
}

// Toggle between light and dark themes
function toggleTheme() {
  state.darkMode = !state.darkMode;
  localStorage.setItem("darkMode", state.darkMode);
  applyTheme();
  showToast(`${state.darkMode ? "Dark" : "Light"} mode enabled`, "info");
}

// Apply theme based on state
function applyTheme() {
  if (state.darkMode) {
    document.documentElement.classList.add("dark");
    document.body.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    document.body.setAttribute("data-theme", "light");
  }
}

// Show a toast notification
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;

  // Create icon based on type
  let icon = "";
  switch (type) {
    case "success":
      icon =
        '<svg class="w-5 h-5 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
      break;
    case "error":
      icon =
        '<svg class="w-5 h-5 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
      break;
    case "warning":
      icon =
        '<svg class="w-5 h-5 mr-2 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>';
      break;
    default:
      icon =
        '<svg class="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';
  }

  toast.innerHTML = `
    ${icon}
    <span class="text-gray-800 dark:text-white">${message}</span>
  `;

  elements.toastContainer.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  }, 3000);
}

// Utility to sanitize HTML to prevent XSS
function sanitizeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// Utility to scroll an element to the bottom
function scrollToBottom(element) {
  element.scrollTop = element.scrollHeight;
}

// Initialize the app when the document is ready
document.addEventListener("DOMContentLoaded", init);
