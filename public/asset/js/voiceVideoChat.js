// /asset/js/voiceVideoChat.js
import {
  peer,
  localStream,
  mediaConnections,
  localUsername,
  localAvatar,
  peerDetails,
  localVideoStream,
  localScreenStream,
  videoEnabled,
  micEnabled,
  setLocalStream,
  setLocalVideoStream,
  setLocalScreenStream,
  setVideoEnabled,
  connections,
  setMicEnabled,
} from "./globals.js";

let isInVoiceChannel = false;
let audioContext = null;
let analyser = null;
let dataArray = null;

function showError(message) {
  const errorBox = document.getElementById("error-message");
  const errorText = document.getElementById("error-text");
  errorText.textContent = message;
  errorBox.classList.remove("hidden");
  setTimeout(() => errorBox.classList.add("hidden"), 5000);
}

export function joinVoiceChannel() {
  if (isInVoiceChannel) return;
  
  document.getElementById("media-control-dock").classList.remove("hidden");
  document.getElementById("voice-top-panel").classList.remove("hidden");
  document.getElementById("voice-channel").classList.add("bg-[#404249]");
  
  navigator.mediaDevices
    .getUserMedia({ audio: true, video: false })
    .then((stream) => {
      setLocalStream(stream);
      isInVoiceChannel = true;
      setupAudioVisualization(stream);
      addUserToVoiceUI(peer.id, localUsername, localAvatar);
      
      for (const id in connections) {
        if (!mediaConnections[id]) {
          const call = peer.call(id, stream);
          mediaConnections[id] = call;
          call.on("stream", (remoteStream) => {
            addUserToVoiceUI(
              call.peer,
              peerDetails[call.peer]?.username || "Unknown",
              peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20"
            );
            setupRemoteAudioVisualization(call.peer, remoteStream);
          });
          call.on("close", () => removeUserFromVoiceUI(call.peer));
        }
      }
    })
    .catch((err) => {
      console.error("Failed to access microphone", err);
      showError("Microphone access denied or failed.");
    });
}

function setupAudioVisualization(stream) {
  try {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    
    analyser.fftSize = 256;
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    animateVoiceActivity();
  } catch (error) {
    console.warn('Audio visualization not supported:', error);
  }
}

function setupRemoteAudioVisualization(peerId, stream) {
  try {
    const remoteAudioContext = new (window.AudioContext || window.webkitAudioContext)();
    const remoteAnalyser = remoteAudioContext.createAnalyser();
    const remoteSource = remoteAudioContext.createMediaStreamSource(stream);
    remoteSource.connect(remoteAnalyser);
    
    remoteAnalyser.fftSize = 256;
    const remoteBufferLength = remoteAnalyser.frequencyBinCount;
    const remoteDataArray = new Uint8Array(remoteBufferLength);
    
    function animateRemoteVoice() {
      if (!document.getElementById(`voice-user-${peerId}`)) return;
      
      remoteAnalyser.getByteFrequencyData(remoteDataArray);
      const average = remoteDataArray.reduce((a, b) => a + b) / remoteDataArray.length;
      
      const userElement = document.getElementById(`voice-user-${peerId}`);
      const avatar = userElement?.querySelector('img');
      if (avatar && average > 30) {
        avatar.style.boxShadow = `0 0 ${Math.min(average / 5, 20)}px rgba(88, 101, 242, 0.8)`;
      } else if (avatar) {
        avatar.style.boxShadow = 'none';
      }
      
      requestAnimationFrame(animateRemoteVoice);
    }
    
    animateRemoteVoice();
  } catch (error) {
    console.warn('Remote audio visualization not supported:', error);
  }
}

function animateVoiceActivity() {
  if (!analyser || !isInVoiceChannel) return;
  
  analyser.getByteFrequencyData(dataArray);
  const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
  
  const localUserElement = document.getElementById(`voice-user-${peer.id}`);
  const avatar = localUserElement?.querySelector('img');
  if (avatar && average > 30) {
    avatar.style.boxShadow = `0 0 ${Math.min(average / 5, 20)}px rgba(88, 101, 242, 0.8)`;
  } else if (avatar) {
    avatar.style.boxShadow = 'none';
  }
  
  requestAnimationFrame(animateVoiceActivity);
}
peer.on("call", (call) => {
  if (localStream && isInVoiceChannel) {
    // Only answer the call if the user is in the voice channel
    call.answer(localStream);
    mediaConnections[call.peer] = call;
    call.on("stream", (remoteStream) => {
      addUserToVoiceUI(
        call.peer,
        peerDetails[call.peer]?.username || "Unknown",
        peerDetails[call.peer]?.avatar || "https://via.placeholder.com/20"
      );
      setupRemoteAudioVisualization(call.peer, remoteStream);
    });
    call.on("close", () => removeUserFromVoiceUI(call.peer));
  } else {
    // Ignore the call if not in the voice channel
    call.close();
  }
});

export function addUserToVoiceUI(id, username, avatar) {
  if (document.getElementById(`voice-user-${id}`)) return;
  const voiceUsers = document.getElementById("voice-users");
  const div = document.createElement("div");
  div.id = `voice-user-${id}`;
  div.className = "voice-user flex items-center gap-2 px-2 py-1 rounded hover:bg-[#3c3f45]";
  div.innerHTML = `
    <div class="relative">
      <img src="${avatar}" alt="${username}" class="w-6 h-6 rounded-full transition-all duration-200">
      <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2b2d31]"></div>
    </div>
    <span class="text-sm text-gray-300">${username}</span>
    ${id === peer.id ? '<i class="fas fa-microphone text-xs text-gray-400 ml-auto"></i>' : ''}
  `;
  voiceUsers.appendChild(div);
}

export function removeUserFromVoiceUI(id) {
  const el = document.getElementById(`voice-user-${id}`);
  if (el) el.remove();
}

document.getElementById("toggle-mic").onclick = () => {
  setMicEnabled(!micEnabled);
  if (localStream) {
    localStream.getAudioTracks().forEach((track) => (track.enabled = micEnabled));
  }
  const micBtn = document.getElementById("toggle-mic");
  micBtn.innerHTML = micEnabled
    ? '<i class="fas fa-microphone"></i>'
    : '<i class="fas fa-microphone-slash text-red-400"></i>';
  micBtn.className = micEnabled 
    ? "hover:text-red-500 p-2 rounded transition-colors" 
    : "text-red-400 hover:text-red-300 p-2 rounded transition-colors bg-red-600 bg-opacity-20";
    
  // Update local user mic status
  const localUser = document.getElementById(`voice-user-${peer.id}`);
  const micIcon = localUser?.querySelector('.fa-microphone, .fa-microphone-slash');
  if (micIcon) {
    micIcon.className = micEnabled 
      ? 'fas fa-microphone text-xs text-gray-400 ml-auto'
      : 'fas fa-microphone-slash text-xs text-red-400 ml-auto';
  }
};

document.getElementById("toggle-cam").onclick = async () => {
  if (!videoEnabled) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setLocalVideoStream(stream);
      replaceTracks(localVideoStream.getVideoTracks()[0]);
      setVideoEnabled(true);
      const camBtn = document.getElementById("toggle-cam");
      camBtn.innerHTML = '<i class="fas fa-video"></i>';
      camBtn.className = "hover:text-red-500 p-2 rounded transition-colors";
    } catch (e) {
      console.error("Failed to access webcam:", e);
      showError("Camera access denied or failed.");
    }
  } else {
    if (localVideoStream) {
      localVideoStream.getTracks().forEach((t) => t.stop());
    }
    replaceTracks(null);
    setVideoEnabled(false);
    setLocalVideoStream(null);
    const camBtn = document.getElementById("toggle-cam");
    camBtn.innerHTML = '<i class="fas fa-video-slash text-red-400"></i>';
    camBtn.className = "text-red-400 hover:text-red-300 p-2 rounded transition-colors bg-red-600 bg-opacity-20";
  }
};

document.getElementById("share-screen").onclick = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    setLocalScreenStream(stream);
    replaceTracks(localScreenStream.getVideoTracks()[0]);
    const screenBtn = document.getElementById("share-screen");
    screenBtn.innerHTML = '<i class="fas fa-desktop text-yellow-400"></i>';
    screenBtn.className = "text-yellow-400 hover:text-yellow-300 p-2 rounded transition-colors bg-yellow-600 bg-opacity-20";
    
    localScreenStream.getVideoTracks()[0].onended = () => {
      replaceTracks(null);
      setLocalScreenStream(null);
      screenBtn.innerHTML = '<i class="fas fa-desktop"></i>';
      screenBtn.className = "hover:text-yellow-400 p-2 rounded transition-colors";
    };
  } catch (e) {
    console.error("Screen share cancelled or failed", e);
    showError("Screen share denied or failed.");
  }
};

export function leaveVoiceChannel() {
  isInVoiceChannel = false;
  
  for (let id in mediaConnections) {
    mediaConnections[id].close();
    delete mediaConnections[id];
  }
  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
  }
  if (localVideoStream) {
    localVideoStream.getTracks().forEach((track) => track.stop());
  }
  if (localScreenStream) {
    localScreenStream.getTracks().forEach((track) => track.stop());
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  setLocalStream(null);
  setMicEnabled(true);
  setVideoEnabled(false);
  setLocalVideoStream(null);
  setLocalScreenStream(null);

  document.getElementById("media-control-dock").classList.add("hidden");
  document.getElementById("voice-top-panel").classList.add("hidden");
  document.getElementById("voice-channel").classList.remove("bg-[#404249]");

  document.getElementById("voice-users").innerHTML = "";
  
  // Reset button states
  document.getElementById("toggle-mic").innerHTML = '<i class="fas fa-microphone"></i>';
  document.getElementById("toggle-cam").innerHTML = '<i class="fas fa-video"></i>';
  document.getElementById("share-screen").innerHTML = '<i class="fas fa-desktop"></i>';
  
  document.getElementById("toggle-mic").className = "hover:text-red-500 p-2 rounded transition-colors";
  document.getElementById("toggle-cam").className = "hover:text-red-500 p-2 rounded transition-colors";
  document.getElementById("share-screen").className = "hover:text-yellow-400 p-2 rounded transition-colors";
}

document.getElementById("leave-voice").onclick = leaveVoiceChannel;

function replaceTracks(newVideoTrack) {
  Object.values(mediaConnections).forEach((call) => {
    const sender = call.peerConnection
      .getSenders()
      .find((s) => s.track && s.track.kind === "video");
    if (sender) {
      if (newVideoTrack) sender.replaceTrack(newVideoTrack);
      else sender.replaceTrack(null);
    }
  });
}
