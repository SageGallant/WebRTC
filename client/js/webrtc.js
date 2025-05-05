// EchoRoom - WebRTC functionality for screen sharing

// Global variables
let localStream = null;
let peerConnections = {};
let isInitiator = false;

// WebRTC configuration (using free STUN servers)
const configuration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
    { urls: "stun:stun4.l.google.com:19302" },
  ],
};

// Initialize WebRTC functionality when document is ready
document.addEventListener("DOMContentLoaded", () => {
  // Listen for WebRTC signaling messages from Socket.io
  if (state && state.socket) {
    state.socket.on("signal", async ({ from, signal }) => {
      try {
        if (signal.type === "offer") {
          await handleVideoOffer(from, signal);
        } else if (signal.type === "answer") {
          await handleVideoAnswer(from, signal);
        } else if (signal.type === "candidate") {
          handleNewICECandidate(from, signal.candidate);
        }
      } catch (error) {
        console.error("Error handling signal:", error);
      }
    });
  }
});

// Start capturing screen for sharing
async function startCapturingScreen() {
  try {
    // Request screen sharing stream
    localStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: "always",
        displaySurface: "monitor",
      },
      audio: false,
    });

    // Show the stream to the local user
    const screenShareVideo = document.getElementById("screenShareVideo");
    const noScreenShare = document.getElementById("noScreenShare");

    if (screenShareVideo && noScreenShare) {
      screenShareVideo.srcObject = localStream;
      screenShareVideo.classList.remove("hidden");
      noScreenShare.classList.add("hidden");

      // Play the video (needed for Safari)
      screenShareVideo.play();
    }

    // Set up event listener for when screen sharing stops
    localStream.getVideoTracks()[0].addEventListener("ended", () => {
      stopCapturingScreen();
      if (state && state.socket) {
        state.socket.emit("screen-share-stopped");
      }
    });

    // Create peer connections for all users in the room
    isInitiator = true;
    await createPeerConnections();
  } catch (error) {
    console.error("Error starting screen capture:", error);
    throw error;
  }
}

// Stop capturing the screen
function stopCapturingScreen() {
  // Stop all tracks in the local stream
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  // Clear video element and show placeholder
  const screenShareVideo = document.getElementById("screenShareVideo");
  const noScreenShare = document.getElementById("noScreenShare");

  if (screenShareVideo && noScreenShare) {
    screenShareVideo.srcObject = null;
    screenShareVideo.classList.add("hidden");
    noScreenShare.classList.remove("hidden");
  }

  // Close all peer connections
  closePeerConnections();

  // Update state
  if (state) {
    state.screenSharing.active = false;
  }
}

// Create peer connections to all users in the room
async function createPeerConnections() {
  if (!state || !state.currentRoom || !state.currentRoom.users) return;

  try {
    // Create a peer connection for each user in the room (except self)
    for (const user of state.currentRoom.users) {
      if (user.id !== state.socket.id) {
        await createPeerConnection(user.id);
      }
    }
  } catch (error) {
    console.error("Error creating peer connections:", error);
    throw error;
  }
}

// Create a peer connection to a specific user
async function createPeerConnection(userId) {
  try {
    // Create new RTCPeerConnection
    const peerConnection = new RTCPeerConnection(configuration);

    // Add the local stream
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream);
      });
    }

    // Set up ICE candidate handling
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal(userId, {
          type: "candidate",
          candidate: event.candidate,
        });
      }
    };

    // Save the peer connection for later use
    peerConnections[userId] = peerConnection;

    // If we're the initiator, send an offer
    if (isInitiator) {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      sendSignal(userId, {
        type: "offer",
        sdp: peerConnection.localDescription,
      });
    }

    return peerConnection;
  } catch (error) {
    console.error("Error creating peer connection:", error);
    throw error;
  }
}

// Handle incoming video offers
async function handleVideoOffer(from, offerDescription) {
  try {
    // Create a peer connection if it doesn't exist
    if (!peerConnections[from]) {
      await createPeerConnection(from);
    }

    const peerConnection = peerConnections[from];

    // Set the remote description
    await peerConnection.setRemoteDescription(
      new RTCSessionDescription(offerDescription)
    );

    // Create and set the local description (answer)
    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    // Send the answer
    sendSignal(from, {
      type: "answer",
      sdp: peerConnection.localDescription,
    });

    // Set up event handler for incoming streams
    peerConnection.ontrack = (event) => {
      handleRemoteStreamAdded(event.streams[0]);
    };
  } catch (error) {
    console.error("Error handling video offer:", error);
  }
}

// Handle incoming video answers
async function handleVideoAnswer(from, answerDescription) {
  try {
    const peerConnection = peerConnections[from];

    if (peerConnection) {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(answerDescription)
      );
    }
  } catch (error) {
    console.error("Error handling video answer:", error);
  }
}

// Handle new ICE candidates
function handleNewICECandidate(from, candidate) {
  try {
    const peerConnection = peerConnections[from];

    if (peerConnection) {
      peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    }
  } catch (error) {
    console.error("Error handling ICE candidate:", error);
  }
}

// Handle remote stream being added
function handleRemoteStreamAdded(stream) {
  const screenShareVideo = document.getElementById("screenShareVideo");
  const noScreenShare = document.getElementById("noScreenShare");

  if (screenShareVideo && noScreenShare) {
    screenShareVideo.srcObject = stream;
    screenShareVideo.classList.remove("hidden");
    noScreenShare.classList.add("hidden");

    // Play the video (needed for Safari)
    screenShareVideo.play();
  }
}

// Close all peer connections
function closePeerConnections() {
  for (const userId in peerConnections) {
    const connection = peerConnections[userId];
    connection.close();
    delete peerConnections[userId];
  }

  peerConnections = {};
}

// Send a WebRTC signaling message via Socket.io
function sendSignal(to, signal) {
  if (state && state.socket) {
    state.socket.emit("signal", { to, signal });
  }
}

// Expose necessary functions to the global scope
window.startCapturingScreen = startCapturingScreen;
window.stopCapturingScreen = stopCapturingScreen;
