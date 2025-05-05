// App State
const state = {
  peer: null,
  peerId: null,
  roomId: null,
  userId: null,
  username: null,
  avatar: null,
  connections: {}, // Store active peer connections
  participants: {}, // Store participant info
  isRoomCreator: false,
  screenShareStream: null,
  isDarkMode: false,
  selectedAvatar: null,
  connectionStatus: "disconnected", // Track connection status
};

// DOM Elements
const elements = {
  homeScreen: document.getElementById("home-screen"),
  chatRoom: document.getElementById("chat-room"),
  usernameInput: document.getElementById("username"),
  roomIdInput: document.getElementById("room-id"),
  createRoomBtn: document.getElementById("create-room-btn"),
  joinRoomBtn: document.getElementById("join-room-btn"),
  leaveRoomBtn: document.getElementById("leave-room-btn"),
  currentRoomId: document.getElementById("current-room-id"),
  messageInput: document.getElementById("message-input"),
  sendMessageBtn: document.getElementById("send-message-btn"),
  messagesContainer: document.getElementById("messages-container"),
  participantsList: document.getElementById("participants-list"),
  avatars: document.querySelectorAll(".avatar"),
  themeToggle: document.getElementById("theme-toggle"),
  shareScreenBtn: document.getElementById("share-screen-btn"),
  stopScreenShareBtn: document.getElementById("stop-screen-share"),
  screenShareContainer: document.getElementById("screen-share-container"),
  screenShareVideo: document.getElementById("screen-share-video"),
  screenShareUser: document.getElementById("screen-share-user"),
  copyRoomIdBtn: document.getElementById("copy-room-id"),
  refreshAvatarsBtn: document.getElementById("refresh-avatars"),
  customAvatarUrlInput: document.getElementById("custom-avatar-url"),
  useCustomAvatarBtn: document.getElementById("use-custom-avatar"),
};

// Add this after the state definition
let heartbeatInterval = null;

// Initialize the application
function init() {
  setupEventListeners();
  setupThemeToggle();
  setupAvatarSelection();
  setupHeartbeat();
}

// Setup Event Listeners
function setupEventListeners() {
  elements.createRoomBtn.addEventListener("click", createRoom);
  elements.joinRoomBtn.addEventListener("click", joinRoom);
  elements.leaveRoomBtn.addEventListener("click", leaveRoom);
  elements.sendMessageBtn.addEventListener("click", sendMessage);
  elements.messageInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });
  elements.shareScreenBtn.addEventListener("click", startScreenShare);
  elements.stopScreenShareBtn.addEventListener("click", stopScreenShare);
  elements.copyRoomIdBtn.addEventListener("click", copyRoomIdToClipboard);

  // Avatar selection buttons
  elements.refreshAvatarsBtn.addEventListener("click", refreshAvatars);
  elements.useCustomAvatarBtn.addEventListener("click", useCustomAvatar);
}

// Setup Theme Toggle
function setupThemeToggle() {
  elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';

  elements.themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    document.body.classList.toggle("light-mode");

    state.isDarkMode = document.body.classList.contains("dark-mode");

    if (state.isDarkMode) {
      elements.themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
      elements.themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
  });
}

// Setup Avatar Selection
function setupAvatarSelection() {
  elements.avatars.forEach((avatar) => {
    avatar.addEventListener("click", () => {
      // Clear custom avatar URL when selecting a generated avatar
      elements.customAvatarUrlInput.value = "";
      elements.customAvatarUrlInput.style.borderColor = "";

      // Apply the selected class
      elements.avatars.forEach((a) => a.classList.remove("selected"));
      avatar.classList.add("selected");

      // Store the avatar URL
      state.selectedAvatar = avatar.getAttribute("data-avatar");
    });
  });
}

// Setup heartbeat mechanism to monitor connection health
function setupHeartbeat() {
  // Clear any existing heartbeat
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Set up a new heartbeat interval
  heartbeatInterval = setInterval(() => {
    // Only run if we're connected to a room
    if (
      state.peer &&
      state.peer.open &&
      state.roomId &&
      Object.keys(state.connections).length > 0
    ) {
      // Send a heartbeat to all connections
      broadcastToPeers({
        type: "heartbeat",
        timestamp: Date.now(),
      });

      // Check if any connections haven't responded recently
      Object.entries(state.connections).forEach(([peerId, conn]) => {
        // If connection is not open, try to reconnect
        if (!conn.open) {
          console.warn(
            `Connection to ${peerId} is closed. Removing from connections.`
          );
          delete state.connections[peerId];
        }
      });
    }
  }, 15000); // Check every 15 seconds
}

// Validate user input
function validateUserInput() {
  const username = elements.usernameInput.value.trim();

  if (!username) {
    showError("Please enter your display name");
    return false;
  }

  // Check if either a predefined avatar is selected or a custom URL is provided
  if (!state.selectedAvatar && !elements.customAvatarUrlInput.value.trim()) {
    showError("Please select a profile picture or enter a custom avatar URL");
    return false;
  }

  // If custom URL is provided but no avatar is selected, use the custom URL
  if (!state.selectedAvatar && elements.customAvatarUrlInput.value.trim()) {
    useCustomAvatar();
    if (!state.selectedAvatar) {
      // useCustomAvatar failed validation
      return false;
    }
  }

  state.username = username;
  state.avatar = state.selectedAvatar;
  state.userId = generateUserId();

  return true;
}

// Show error message
function showError(message) {
  alert(message);
}

// Generate a unique user ID
function generateUserId() {
  return "user_" + uuid.v4();
}

// Create a new room
function createRoom() {
  if (!validateUserInput()) return;

  // Generate room ID
  state.roomId = "room_" + uuid.v4().substring(0, 8);

  // Set as room creator
  state.isRoomCreator = true;

  // Initialize PeerJS with the room ID as the peer ID
  initializePeer(state.roomId);

  // Update UI
  displayRoom();
}

// Join an existing room
function joinRoom() {
  if (!validateUserInput()) return;

  const roomId = elements.roomIdInput.value.trim();

  if (!roomId) {
    showError("Please enter a room ID");
    return;
  }

  state.roomId = roomId;

  // Show connecting status
  displayConnectionStatus("connecting");

  // Initialize PeerJS with a random ID for joiners
  initializePeer();
}

// Initialize PeerJS
function initializePeer(peerId) {
  // Create a new peer with either provided ID (for room creator) or random ID (for joiners)
  state.peer = new Peer(peerId, {
    config: {
      iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:global.stun.twilio.com:3478" },
      ],
    },
    debug: 3, // Set debug level to help with troubleshooting
  });

  // Handle peer open event
  state.peer.on("open", (id) => {
    state.peerId = id;
    console.log("My peer ID is: " + id);

    if (state.isRoomCreator) {
      // If creating a room, just display the room
      displayConnectionStatus("connected", "Room created successfully");
      addSelfToParticipants();
    } else {
      // If joining, connect to the room creator
      connectToPeer(state.roomId);
    }
  });

  // Handle incoming connections
  state.peer.on("connection", (conn) => {
    console.log("Incoming connection from:", conn.peer);
    handlePeerConnection(conn);
  });

  // Handle errors
  state.peer.on("error", (err) => {
    console.error("Peer error:", err);

    if (err.type === "peer-unavailable") {
      displayConnectionStatus("error", "Room not found or no longer available");
      showError(
        "Room not found or no longer available. Please check the room ID and try again."
      );
    } else {
      displayConnectionStatus("error", err.message);
      showError("Connection error: " + err.message);
    }
  });

  // Handle disconnection
  state.peer.on("disconnected", () => {
    console.log("Peer disconnected");
    displayConnectionStatus("disconnected");

    // Try to reconnect
    setTimeout(() => {
      if (state.peer) {
        displayConnectionStatus("connecting", "Attempting to reconnect...");
        state.peer.reconnect();
      }
    }, 3000);
  });
}

// Connect to a peer
function connectToPeer(peerId) {
  console.log("Attempting to connect to peer:", peerId);
  try {
    const conn = state.peer.connect(peerId, {
      metadata: {
        userId: state.userId,
        username: state.username,
        avatar: state.avatar,
        joinRequest: true,
      },
      reliable: true,
    });

    if (conn) {
      handlePeerConnection(conn);

      // Set a timeout to detect if connection doesn't complete
      setTimeout(() => {
        // If we still haven't connected successfully
        if (state.connectionStatus !== "connected" && conn.peer === peerId) {
          displayConnectionStatus(
            "error",
            "Connection timeout - Room may no longer be available"
          );

          // Add option to retry or go back
          const retryMessage = document.createElement("div");
          retryMessage.className = "retry-message";
          retryMessage.innerHTML = `
            <button class="retry-btn">Retry Connection</button>
            <button class="cancel-btn">Go Back</button>
          `;
          elements.messagesContainer.appendChild(retryMessage);

          // Add event listeners to the buttons
          retryMessage
            .querySelector(".retry-btn")
            .addEventListener("click", () => {
              retryMessage.remove();
              retryConnection();
            });

          retryMessage
            .querySelector(".cancel-btn")
            .addEventListener("click", () => {
              retryMessage.remove();
              resetRoom();
            });
        }
      }, 10000); // 10 second timeout
    } else {
      console.error("Failed to create connection");
      showError("Failed to connect to the room");
    }
  } catch (error) {
    console.error("Error connecting to peer:", error);
    showError("Connection error: " + error.message);
  }
}

// Handle peer connection
function handlePeerConnection(conn) {
  // Store the connection
  state.connections[conn.peer] = conn;

  // Handle connection open
  conn.on("open", () => {
    console.log("Connected to peer: " + conn.peer);

    // If this is a join request, send room information
    if (conn.metadata?.joinRequest && state.isRoomCreator) {
      // Send the current participants list to the new peer
      sendRoomInfo(conn);
    }

    // If this is the room creator, display the room
    if (conn.peer === state.roomId && !state.isRoomCreator) {
      displayRoom();
      displayConnectionStatus("connected", "Joined room successfully");
      addSelfToParticipants();
    }
  });

  // Handle incoming data
  conn.on("data", (data) => {
    handleIncomingData(conn, data);
  });

  // Handle connection close
  conn.on("close", () => {
    handlePeerDisconnect(conn.peer);
  });

  // Handle errors
  conn.on("error", (err) => {
    console.error("Connection error:", err);
  });
}

// Send room information to new participant
function sendRoomInfo(conn) {
  const roomInfo = {
    type: "room_info",
    participants: state.participants,
    screenShareActive: !!state.screenShareStream,
    screenShareUser: state.screenShareUser,
  };

  conn.send(roomInfo);

  // Notify other participants about the new peer
  broadcastNewParticipant(conn.metadata);
}

// Broadcast new participant to all existing participants
function broadcastNewParticipant(participantData) {
  const message = {
    type: "new_participant",
    participant: {
      userId: participantData.userId,
      username: participantData.username,
      avatar: participantData.avatar,
      peerId: participantData.peerId || state.peerId,
    },
  };

  broadcastToPeers(message);
}

// Add self to participants list
function addSelfToParticipants() {
  state.participants[state.userId] = {
    userId: state.userId,
    username: state.username,
    avatar: state.avatar,
    peerId: state.peerId,
    isCreator: state.isRoomCreator,
  };

  updateParticipantsList();
}

// Handle incoming data from peers
function handleIncomingData(conn, data) {
  console.log("Received data:", data);

  switch (data.type) {
    case "room_info":
      handleRoomInfo(data, conn);
      break;
    case "new_participant":
      handleNewParticipant(data.participant);
      break;
    case "participant_left":
      handleParticipantLeft(data.userId);
      break;
    case "chat_message":
      displayMessage(data.message);
      break;
    case "screen_share_start":
      handleScreenShareStart(data);
      break;
    case "screen_share_stop":
      handleScreenShareStop();
      break;
    case "heartbeat":
      // Just acknowledge heartbeats silently
      conn.send({
        type: "heartbeat_ack",
        timestamp: data.timestamp,
        received: Date.now(),
      });
      break;
    case "heartbeat_ack":
      // We could calculate latency here if needed
      // const latency = Date.now() - data.timestamp;
      // console.log(`Heartbeat latency to ${conn.peer}: ${latency}ms`);
      break;
    default:
      console.log("Unknown data type:", data.type);
  }
}

// Handle room information received from room creator
function handleRoomInfo(data, conn) {
  // Add received participants to our list
  state.participants = data.participants;

  // Add ourselves to the participant list if not already added
  if (!state.participants[state.userId]) {
    state.participants[state.userId] = {
      userId: state.userId,
      username: state.username,
      avatar: state.avatar,
      peerId: state.peerId,
    };

    // Notify room creator about ourselves
    conn.send({
      type: "new_participant",
      participant: state.participants[state.userId],
    });
  }

  // Update the UI
  updateParticipantsList();

  // Handle active screen share if any
  if (data.screenShareActive && data.screenShareUser) {
    // TODO: Request the active screen share stream
  }
}

// Handle new participant joining the room
function handleNewParticipant(participant) {
  if (participant.userId !== state.userId) {
    // Store the participant info
    state.participants[participant.userId] = participant;

    // Connect to the new peer if we're not already connected
    if (
      !state.connections[participant.peerId] &&
      participant.peerId !== state.peerId
    ) {
      const conn = state.peer.connect(participant.peerId, {
        metadata: {
          userId: state.userId,
          username: state.username,
          avatar: state.avatar,
          joinRequest: false,
        },
      });

      handlePeerConnection(conn);
    }

    // Update the UI
    updateParticipantsList();

    // Display system message
    displaySystemMessage(`${participant.username} joined the room`);
  }
}

// Handle participant leaving the room
function handleParticipantLeft(userId) {
  if (state.participants[userId]) {
    const username = state.participants[userId].username;

    // Remove from participants list
    delete state.participants[userId];

    // Update the UI
    updateParticipantsList();

    // Display system message
    displaySystemMessage(`${username} left the room`);
  }
}

// Handle peer disconnect
function handlePeerDisconnect(peerId) {
  // Find and remove the participant with this peer ID
  let disconnectedUserId = null;
  let disconnectedUsername = null;

  for (const userId in state.participants) {
    if (state.participants[userId].peerId === peerId) {
      disconnectedUserId = userId;
      disconnectedUsername = state.participants[userId].username;
      break;
    }
  }

  if (disconnectedUserId) {
    // Remove from participants list
    delete state.participants[disconnectedUserId];

    // Update the UI
    updateParticipantsList();

    // Display system message
    displaySystemMessage(`${disconnectedUsername} left the room`);

    // Notify other peers
    broadcastToPeers({
      type: "participant_left",
      userId: disconnectedUserId,
    });
  }

  // Remove from connections
  if (state.connections[peerId]) {
    delete state.connections[peerId];
  }

  // If room creator left and we have participants, elect a new creator
  if (state.isRoomCreator && Object.keys(state.participants).length > 0) {
    electNewRoomCreator();
  }
}

// Elect a new room creator if the current one leaves
function electNewRoomCreator() {
  // Simple strategy: take the first remaining participant
  const remainingParticipants = Object.values(state.participants);
  if (remainingParticipants.length > 0) {
    const newCreator = remainingParticipants[0];
    newCreator.isCreator = true;

    // If it's us, update our state
    if (newCreator.userId === state.userId) {
      state.isRoomCreator = true;
    }
  }
}

// Display the chat room
function displayRoom() {
  elements.homeScreen.classList.add("hidden");
  elements.chatRoom.classList.remove("hidden");
  elements.currentRoomId.textContent = state.roomId;
}

// Update the participants list in the UI
function updateParticipantsList() {
  elements.participantsList.innerHTML = "";

  Object.values(state.participants).forEach((participant) => {
    const listItem = document.createElement("li");
    listItem.className = "participant-item";

    const avatar = document.createElement("img");
    avatar.className = "participant-avatar";
    avatar.src = participant.avatar;
    avatar.alt = participant.username;

    const nameSpan = document.createElement("span");
    nameSpan.textContent = participant.username;

    if (participant.isCreator) {
      nameSpan.textContent += " (Host)";
    }

    if (participant.userId === state.userId) {
      nameSpan.textContent += " (You)";
    }

    listItem.appendChild(avatar);
    listItem.appendChild(nameSpan);

    elements.participantsList.appendChild(listItem);
  });
}

// Send a chat message
function sendMessage() {
  const messageText = elements.messageInput.value.trim();

  if (!messageText) return;

  const message = {
    userId: state.userId,
    username: state.username,
    avatar: state.avatar,
    text: messageText,
    timestamp: new Date().toISOString(),
  };

  // Display the message locally
  displayMessage(message, true);

  // Clear the input
  elements.messageInput.value = "";

  // Send to all peers
  broadcastToPeers({
    type: "chat_message",
    message: message,
  });
}

// Display a chat message
function displayMessage(message, isOutgoing = false) {
  const messageElement = document.createElement("div");
  messageElement.className = "message";

  if (isOutgoing || message.userId === state.userId) {
    messageElement.classList.add("outgoing");
  }

  const avatar = document.createElement("img");
  avatar.className = "message-avatar";
  avatar.src = message.avatar;
  avatar.alt = message.username;

  const contentDiv = document.createElement("div");
  contentDiv.className = "message-content";

  const headerDiv = document.createElement("div");
  headerDiv.className = "message-header";

  const sender = document.createElement("span");
  sender.className = "message-sender";
  sender.textContent =
    message.userId === state.userId ? "You" : message.username;

  const time = document.createElement("span");
  time.className = "message-time";
  time.textContent = formatTime(new Date(message.timestamp));

  headerDiv.appendChild(sender);
  headerDiv.appendChild(time);

  const textDiv = document.createElement("div");
  textDiv.className = "message-text";
  textDiv.textContent = message.text;

  contentDiv.appendChild(headerDiv);
  contentDiv.appendChild(textDiv);

  messageElement.appendChild(avatar);
  messageElement.appendChild(contentDiv);

  elements.messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

// Display a system message
function displaySystemMessage(text) {
  const messageElement = document.createElement("div");
  messageElement.className = "system-message";
  messageElement.textContent = text;

  elements.messagesContainer.appendChild(messageElement);
  scrollToBottom();
}

// Format timestamp to readable time
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Scroll the messages container to the bottom
function scrollToBottom() {
  elements.messagesContainer.scrollTop =
    elements.messagesContainer.scrollHeight;
}

// Leave the room
function leaveRoom() {
  displayConnectionStatus("disconnected", "Leaving room...");

  // Notify peers that we're leaving
  broadcastToPeers({
    type: "participant_left",
    userId: state.userId,
  });

  // Give a small delay to allow the message to be sent
  setTimeout(() => {
    // Close all connections
    Object.values(state.connections).forEach((conn) => {
      try {
        if (conn && conn.open) {
          conn.close();
        }
      } catch (e) {
        console.error("Error closing connection:", e);
      }
    });

    // Stop screen sharing if active
    if (state.screenShareStream) {
      stopScreenShare();
    }

    // Close PeerJS connection
    if (state.peer) {
      try {
        state.peer.destroy();
      } catch (e) {
        console.error("Error destroying peer:", e);
      }
    }

    // Reset state
    state.peer = null;
    state.peerId = null;
    state.roomId = null;
    state.connections = {};
    state.participants = {};
    state.isRoomCreator = false;
    state.connectionStatus = "disconnected";

    // Return to home screen
    elements.chatRoom.classList.add("hidden");
    elements.homeScreen.classList.remove("hidden");

    // Clear the messages container and participants list
    elements.messagesContainer.innerHTML = "";
    elements.participantsList.innerHTML = "";
  }, 500); // Give 500ms for messages to send
}

// Broadcast a message to all connected peers
function broadcastToPeers(data) {
  Object.values(state.connections).forEach((conn) => {
    if (conn.open) {
      conn.send(data);
    }
  });
}

// Start screen sharing
async function startScreenShare() {
  try {
    // Get screen share stream
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
    });

    // Store the stream
    state.screenShareStream = stream;
    state.screenShareUser = state.username;

    // Show the screen share container
    elements.screenShareContainer.classList.remove("hidden");
    elements.screenShareVideo.srcObject = stream;
    elements.screenShareUser.textContent = "You";
    elements.stopScreenShareBtn.classList.remove("hidden");
    elements.shareScreenBtn.disabled = true;

    // Handle stream end
    stream.getVideoTracks()[0].addEventListener("ended", () => {
      stopScreenShare();
    });

    // Notify all peers
    broadcastToPeers({
      type: "screen_share_start",
      username: state.username,
      userId: state.userId,
    });
  } catch (err) {
    console.error("Error starting screen share:", err);
    showError("Could not start screen sharing: " + err.message);
  }
}

// Handle screen share start from another user
function handleScreenShareStart(data) {
  // Display the screen share container
  elements.screenShareContainer.classList.remove("hidden");
  elements.screenShareUser.textContent = data.username;
  elements.shareScreenBtn.disabled = true;

  // TODO: Receive the screen share stream using WebRTC
  // For now, we'll just show a message
  displaySystemMessage(`${data.username} is sharing their screen`);
}

// Stop screen sharing
function stopScreenShare() {
  if (state.screenShareStream) {
    // Stop all tracks
    state.screenShareStream.getTracks().forEach((track) => track.stop());

    // Reset state
    state.screenShareStream = null;
    state.screenShareUser = null;

    // Update UI
    elements.screenShareContainer.classList.add("hidden");
    elements.screenShareVideo.srcObject = null;
    elements.stopScreenShareBtn.classList.add("hidden");
    elements.shareScreenBtn.disabled = false;

    // Notify peers
    broadcastToPeers({
      type: "screen_share_stop",
      userId: state.userId,
    });
  }
}

// Handle screen share stop
function handleScreenShareStop() {
  // Update UI
  elements.screenShareContainer.classList.add("hidden");
  elements.screenShareVideo.srcObject = null;
  elements.shareScreenBtn.disabled = false;
}

// Copy room ID to clipboard
function copyRoomIdToClipboard() {
  navigator.clipboard
    .writeText(state.roomId)
    .then(() => {
      alert("Room ID copied to clipboard!");
    })
    .catch((err) => {
      console.error("Could not copy room ID:", err);

      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = state.roomId;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      alert("Room ID copied to clipboard!");
    });
}

// Display connection status
function displayConnectionStatus(status, details = "") {
  state.connectionStatus = status;

  let statusMessage = "";

  switch (status) {
    case "connecting":
      statusMessage = `Connecting to room ${state.roomId}...`;
      break;
    case "connected":
      statusMessage = `Connected to room ${state.roomId}`;
      break;
    case "disconnected":
      statusMessage = "Disconnected from room";
      break;
    case "error":
      statusMessage = `Connection error: ${details}`;
      break;
    default:
      statusMessage = status;
  }

  displaySystemMessage(statusMessage);

  // Also log to console for debugging
  console.log(`Connection status: ${status}`, details ? `- ${details}` : "");
}

// Retry connecting to room
function retryConnection() {
  // Only allow retry if we're not already connected
  if (state.connectionStatus !== "connected") {
    displayConnectionStatus("connecting", "Retrying connection...");

    // Clean up any existing peer connection
    if (state.peer) {
      state.peer.destroy();
      state.peer = null;
    }

    // Reinitialize the peer connection
    if (state.isRoomCreator) {
      initializePeer(state.roomId);
    } else {
      initializePeer();
      // Small delay to allow peer to initialize before connecting
      setTimeout(() => {
        if (state.peer && state.peer.open) {
          connectToPeer(state.roomId);
        }
      }, 1000);
    }
  }
}

// Add a Reset Room function for when connections fail
function resetRoom() {
  // Close connections and reset state
  if (state.peer) {
    state.peer.destroy();
  }

  // Reset state
  state.peer = null;
  state.peerId = null;
  state.connections = {};
  state.participants = {};
  state.isRoomCreator = false;
  state.connectionStatus = "disconnected";

  // Return to home screen
  elements.chatRoom.classList.add("hidden");
  elements.homeScreen.classList.remove("hidden");

  // Clear the messages container
  elements.messagesContainer.innerHTML = "";
  elements.participantsList.innerHTML = "";
}

// Add function to refresh avatars with new options
function refreshAvatars() {
  // Call generateAvatarOptions with "refresh" parameter to generate new random seeds
  window.generateAvatarOptions("refresh");

  // Remove any selected avatar since we're refreshing
  elements.avatars.forEach((a) => a.classList.remove("selected"));
  state.selectedAvatar = null;

  // Clear any custom avatar
  elements.customAvatarUrlInput.value = "";
  elements.customAvatarUrlInput.style.borderColor = "";

  // Display a message about the refresh
  displaySystemMessage("Avatar options refreshed");
}

// Add function to use custom avatar URL
function useCustomAvatar() {
  const customUrl = elements.customAvatarUrlInput.value.trim();

  if (!customUrl) {
    showError("Please enter a valid avatar URL");
    return;
  }

  // Create a temporary image to test if the URL is valid
  const testImg = new Image();
  testImg.onload = function () {
    // URL is valid, create a custom avatar element
    elements.avatars.forEach((a) => a.classList.remove("selected"));

    // Store the custom URL as the selected avatar
    state.selectedAvatar = customUrl;

    // Visually indicate custom avatar is selected
    displaySystemMessage("Custom avatar selected");
    elements.customAvatarUrlInput.style.borderColor = "var(--primary-color)";
    setTimeout(() => {
      elements.customAvatarUrlInput.style.borderColor = "";
    }, 2000);
  };

  testImg.onerror = function () {
    showError("Invalid image URL. Please provide a valid image URL.");
  };

  // Start loading the image to test
  testImg.src = customUrl;
}

// Initialize the app when the DOM is loaded
document.addEventListener("DOMContentLoaded", init);
