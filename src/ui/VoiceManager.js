// Enhanced voice and video management
import { stateManager } from "../core/StateManager.js"
import { eventBus } from "../core/EventBus.js"
import { peerManager } from "../core/PeerManager.js"
import { NotificationManager } from "./NotificationManager.js"

export class VoiceManager {
  constructor() {
    this.localStream = null
    this.localVideoStream = null
    this.localScreenStream = null
    this.mediaConnections = {}
    this.audioContext = null
    this.analyser = null
    this.isInVoiceChannel = false
    this.voiceActivityThreshold = 30
    this.voiceUsers = new Map()
    this.setupEventListeners()
  }

  setupEventListeners() {
    eventBus.on("peerConnected", ({ peerId }) => {
      if (this.isInVoiceChannel && this.localStream) {
        this.callPeer(peerId)
      }
    })

    eventBus.on("peerDisconnected", ({ peerId }) => {
      this.handlePeerDisconnected(peerId)
    })
  }

  async joinVoiceChannel() {
    if (this.isInVoiceChannel) return

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
        video: false,
      })

      this.isInVoiceChannel = true
      this.setupAudioVisualization()
      this.updateVoiceState()

      // Add current user to voice channel
      const currentUser = stateManager.getStateValue("user")
      this.addUserToVoiceChannel(currentUser.id, {
        ...currentUser,
        micEnabled: true,
        speaking: false,
      })

      // Call all connected peers
      Object.keys(peerManager.connections).forEach((peerId) => {
        this.callPeer(peerId)
      })

      // Update UI
      this.showVoiceChannelPanel()
      this.showVoiceControls()

      NotificationManager.showSuccess("Joined voice channel")
    } catch (error) {
      console.error("Failed to join voice channel:", error)
      NotificationManager.showError("Failed to access microphone")
    }
  }

  async leaveVoiceChannel() {
    if (!this.isInVoiceChannel) return

    this.isInVoiceChannel = false

    // Stop all streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop())
      this.localStream = null
    }

    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach((track) => track.stop())
      this.localVideoStream = null
    }

    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop())
      this.localScreenStream = null
    }

    // Close all media connections
    Object.values(this.mediaConnections).forEach((call) => {
      call.close()
    })
    this.mediaConnections = {}

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    // Clear voice users
    this.voiceUsers.clear()

    // Update state
    stateManager.setState("voiceChannel.active", false)
    stateManager.setState("voiceChannel.users", {})

    // Update UI
    this.hideVoiceChannelPanel()
    this.hideVoiceControls()
    this.updateVoiceState()

    NotificationManager.showInfo("Left voice channel")
  }

  callPeer(peerId) {
    if (!this.localStream || this.mediaConnections[peerId]) return

    const call = peerManager.peer.call(peerId, this.localStream, {
      metadata: {
        username: stateManager.getStateValue("user.username"),
        avatar: stateManager.getStateValue("user.avatar"),
      },
    })

    this.setupMediaConnection(call)
  }

  setupMediaConnection(call) {
    this.mediaConnections[call.peer] = call

    call.on("stream", (remoteStream) => {
      this.handleRemoteStream(call.peer, remoteStream)
    })

    call.on("close", () => {
      this.handleCallClosed(call.peer)
    })

    call.on("error", (error) => {
      console.error("Media connection error:", error)
      this.handleCallClosed(call.peer)
    })
  }

  handleIncomingCall(call) {
    if (!this.isInVoiceChannel || !this.localStream) {
      call.close()
      return
    }

    call.answer(this.localStream)
    this.setupMediaConnection(call)
  }

  handleRemoteStream(peerId, stream) {
    // Create audio element for remote stream
    const audio = document.createElement("audio")
    audio.srcObject = stream
    audio.autoplay = true
    audio.id = `audio-${peerId}`
    document.body.appendChild(audio)

    // Add user to voice channel UI
    const peerData = stateManager.getStateValue(`peers.${peerId}`)
    if (peerData) {
      this.addUserToVoiceChannel(peerId, {
        ...peerData,
        micEnabled: true,
        speaking: false,
      })
    }

    // Setup remote audio visualization
    this.setupRemoteAudioVisualization(peerId, stream)
  }

  handleCallClosed(peerId) {
    delete this.mediaConnections[peerId]

    // Remove audio element
    const audio = document.getElementById(`audio-${peerId}`)
    if (audio) {
      audio.remove()
    }

    // Remove from voice channel UI
    this.removeUserFromVoiceChannel(peerId)
  }

  handlePeerDisconnected(peerId) {
    this.handleCallClosed(peerId)
  }

  setupAudioVisualization() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      this.analyser = this.audioContext.createAnalyser()
      const source = this.audioContext.createMediaStreamSource(this.localStream)
      source.connect(this.analyser)

      this.analyser.fftSize = 256
      const bufferLength = this.analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const animate = () => {
        if (!this.isInVoiceChannel) return

        this.analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        this.updateVoiceActivity(stateManager.getStateValue("user.id"), average)
        requestAnimationFrame(animate)
      }

      animate()
    } catch (error) {
      console.warn("Audio visualization not supported:", error)
    }
  }

  setupRemoteAudioVisualization(peerId, stream) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      analyser.fftSize = 256
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const animate = () => {
        if (!this.voiceUsers.has(peerId)) return

        analyser.getByteFrequencyData(dataArray)
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length

        this.updateVoiceActivity(peerId, average)
        requestAnimationFrame(animate)
      }

      animate()
    } catch (error) {
      console.warn("Remote audio visualization not supported:", error)
    }
  }

  updateVoiceActivity(userId, level) {
    const user = this.voiceUsers.get(userId)
    if (!user) return

    const isSpeaking = level > this.voiceActivityThreshold
    if (user.speaking !== isSpeaking) {
      user.speaking = isSpeaking
      this.voiceUsers.set(userId, user)
      this.updateVoiceChannelDisplay()
    }
  }

  addUserToVoiceChannel(userId, userData) {
    this.voiceUsers.set(userId, userData)
    this.updateVoiceChannelDisplay()
  }

  removeUserFromVoiceChannel(userId) {
    this.voiceUsers.delete(userId)
    this.updateVoiceChannelDisplay()
  }

  updateVoiceChannelDisplay() {
    this.updateDesktopVoiceChannel()
    this.updateMobileVoiceChannel()
    this.updateVoiceChannelPanel()
  }

  updateDesktopVoiceChannel() {
    const container = document.getElementById("voice-users-container")
    const grid = document.getElementById("voice-users-grid")

    if (!container || !grid) return

    if (this.voiceUsers.size > 0) {
      container.classList.remove("hidden")
      grid.innerHTML = Array.from(this.voiceUsers.values())
        .map(
          (user) => `
          <div class="voice-user-item flex flex-col items-center p-2 rounded hover:bg-[#3c3f45] transition-colors cursor-pointer" data-user-id="${user.id}">
            <div class="relative mb-1">
              <img src="${user.avatar}" alt="${user.username}" class="w-8 h-8 rounded-full transition-all duration-200 ${user.speaking ? "ring-2 ring-green-400 ring-opacity-80" : ""}">
              <div class="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center ${user.micEnabled ? "bg-green-600" : "bg-red-600"}">
                <i class="fas ${user.micEnabled ? "fa-microphone" : "fa-microphone-slash"} text-xs text-white"></i>
              </div>
            </div>
            <span class="text-xs text-white truncate w-full text-center max-w-[60px]" title="${user.username}">${user.username}</span>
          </div>
        `,
        )
        .join("")
    } else {
      container.classList.add("hidden")
    }
  }

  updateMobileVoiceChannel() {
    const container = document.getElementById("mobile-voice-users-container")
    const grid = document.getElementById("mobile-voice-users-grid")

    if (!container || !grid) return

    if (this.voiceUsers.size > 0) {
      container.classList.remove("hidden")
      grid.innerHTML = Array.from(this.voiceUsers.values())
        .map(
          (user) => `
          <div class="voice-user-mobile flex flex-col items-center p-2 rounded hover:bg-[#3c3f45] transition-colors">
            <div class="relative mb-1">
              <img src="${user.avatar}" alt="${user.username}" class="w-8 h-8 rounded-full transition-all duration-200 ${user.speaking ? "ring-2 ring-green-400 ring-opacity-80" : ""}">
              <div class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center ${user.micEnabled ? "bg-green-600" : "bg-red-600"}">
                <i class="fas ${user.micEnabled ? "fa-microphone" : "fa-microphone-slash"} text-xs text-white" style="font-size: 8px;"></i>
              </div>
            </div>
            <span class="text-xs text-white truncate w-full text-center">${user.username}</span>
          </div>
        `,
        )
        .join("")
    } else {
      container.classList.add("hidden")
    }
  }

  updateVoiceChannelPanel() {
    const panel = document.getElementById("voice-channel-panel")
    const grid = document.getElementById("voice-channel-grid")
    const userCount = document.getElementById("voice-user-count")

    if (!panel || !grid || !userCount) return

    userCount.textContent = `(${this.voiceUsers.size})`

    if (this.voiceUsers.size > 0) {
      grid.innerHTML = Array.from(this.voiceUsers.values())
        .map(
          (user) => `
          <div class="voice-user-panel flex flex-col items-center p-3 rounded-lg bg-[#36393f] hover:bg-[#40444b] transition-colors cursor-pointer" data-user-id="${user.id}">
            <div class="relative mb-2">
              <img src="${user.avatar}" alt="${user.username}" class="w-12 h-12 rounded-full transition-all duration-200 ${user.speaking ? "ring-3 ring-green-400 ring-opacity-80 shadow-lg shadow-green-400/20" : ""}">
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${user.micEnabled ? "bg-green-600" : "bg-red-600"} border-2 border-[#2b2d31]">
                <i class="fas ${user.micEnabled ? "fa-microphone" : "fa-microphone-slash"} text-xs text-white"></i>
              </div>
            </div>
            <span class="text-sm text-white font-medium truncate w-full text-center max-w-[80px]" title="${user.username}">${user.username}</span>
            ${user.speaking ? '<div class="text-xs text-green-400 mt-1">Speaking</div>' : '<div class="text-xs text-gray-400 mt-1">Idle</div>'}
          </div>
        `,
        )
        .join("")
    }
  }

  showVoiceChannelPanel() {
    const panel = document.getElementById("voice-channel-panel")
    if (panel) {
      panel.classList.remove("hidden")
    }

    // Update voice channel button state
    const voiceChannel = document.getElementById("voice-channel")
    if (voiceChannel) {
      voiceChannel.classList.add("bg-[#404249]", "text-white")
    }
  }

  hideVoiceChannelPanel() {
    const panel = document.getElementById("voice-channel-panel")
    if (panel) {
      panel.classList.add("hidden")
    }

    // Reset voice channel button state
    const voiceChannel = document.getElementById("voice-channel")
    if (voiceChannel) {
      voiceChannel.classList.remove("bg-[#404249]", "text-white")
    }
  }

  showVoiceControls() {
    const controls = document.getElementById("voice-control-dock")
    if (controls) {
      controls.classList.remove("hidden")
    }
  }

  hideVoiceControls() {
    const controls = document.getElementById("voice-control-dock")
    if (controls) {
      controls.classList.add("hidden")
    }
  }

  async toggleMicrophone() {
    if (!this.localStream) return

    const audioTrack = this.localStream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      stateManager.setState("voiceChannel.micEnabled", audioTrack.enabled)

      // Update current user in voice channel
      const currentUser = this.voiceUsers.get(stateManager.getStateValue("user.id"))
      if (currentUser) {
        currentUser.micEnabled = audioTrack.enabled
        this.voiceUsers.set(stateManager.getStateValue("user.id"), currentUser)
        this.updateVoiceChannelDisplay()
      }

      this.updateMicButton()
      this.updateVoiceState()
    }
  }

  async toggleCamera() {
    const videoEnabled = stateManager.getStateValue("voiceChannel.videoEnabled")

    if (!videoEnabled) {
      try {
        this.localVideoStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
          },
        })

        this.replaceVideoTrack(this.localVideoStream.getVideoTracks()[0])
        stateManager.setState("voiceChannel.videoEnabled", true)
        this.updateCameraButton()
      } catch (error) {
        console.error("Failed to access camera:", error)
        NotificationManager.showError("Failed to access camera")
      }
    } else {
      if (this.localVideoStream) {
        this.localVideoStream.getTracks().forEach((track) => track.stop())
        this.localVideoStream = null
      }

      this.replaceVideoTrack(null)
      stateManager.setState("voiceChannel.videoEnabled", false)
      this.updateCameraButton()
    }

    this.updateVoiceState()
  }

  async toggleScreenShare() {
    const screenSharing = stateManager.getStateValue("voiceChannel.screenSharing")

    if (!screenSharing) {
      try {
        this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            displaySurface: "monitor",
          },
          audio: true,
        })

        this.replaceVideoTrack(this.localScreenStream.getVideoTracks()[0])
        stateManager.setState("voiceChannel.screenSharing", true)
        this.updateScreenShareButton()

        // Handle screen share end
        this.localScreenStream.getVideoTracks()[0].onended = () => {
          this.stopScreenShare()
        }
      } catch (error) {
        console.error("Screen share failed:", error)
        NotificationManager.showError("Screen share denied or failed")
      }
    } else {
      this.stopScreenShare()
    }
  }

  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach((track) => track.stop())
      this.localScreenStream = null
    }

    this.replaceVideoTrack(null)
    stateManager.setState("voiceChannel.screenSharing", false)
    this.updateScreenShareButton()
    this.updateVoiceState()
  }

  replaceVideoTrack(newTrack) {
    Object.values(this.mediaConnections).forEach((call) => {
      const sender = call.peerConnection.getSenders().find((s) => s.track && s.track.kind === "video")

      if (sender) {
        sender.replaceTrack(newTrack)
      } else if (newTrack) {
        call.peerConnection.addTrack(newTrack, this.localStream)
      }
    })
  }

  updateVoiceState() {
    const state = {
      inVoice: this.isInVoiceChannel,
      micEnabled: stateManager.getStateValue("voiceChannel.micEnabled"),
      videoEnabled: stateManager.getStateValue("voiceChannel.videoEnabled"),
      screenSharing: stateManager.getStateValue("voiceChannel.screenSharing"),
    }

    peerManager.broadcast({
      type: "voice_state",
      state,
    })
  }

  updateMicButton() {
    const micEnabled = stateManager.getStateValue("voiceChannel.micEnabled")
    const micBtn = document.getElementById("toggle-mic")
    const userMicBtn = document.getElementById("user-mic-btn")
    ;[micBtn, userMicBtn].forEach((btn) => {
      if (btn) {
        const icon = btn.querySelector("i")
        if (micEnabled) {
          icon.className = "fas fa-microphone text-xs"
          btn.className = btn.className.replace(/bg-red-\d+/, "").replace(/text-red-\d+/, "")
        } else {
          icon.className = "fas fa-microphone-slash text-xs"
          btn.classList.add("bg-red-600", "bg-opacity-20", "text-red-400")
        }
      }
    })
  }

  updateCameraButton() {
    const videoEnabled = stateManager.getStateValue("voiceChannel.videoEnabled")
    const camBtn = document.getElementById("toggle-cam")

    if (camBtn) {
      const icon = camBtn.querySelector("i")
      if (videoEnabled) {
        icon.className = "fas fa-video"
        camBtn.className = camBtn.className.replace(/bg-red-\d+/, "").replace(/text-red-\d+/, "")
      } else {
        icon.className = "fas fa-video-slash"
        camBtn.classList.add("bg-red-600", "bg-opacity-20", "text-red-400")
      }
    }
  }

  updateScreenShareButton() {
    const screenSharing = stateManager.getStateValue("voiceChannel.screenSharing")
    const screenBtn = document.getElementById("share-screen")

    if (screenBtn) {
      if (screenSharing) {
        screenBtn.classList.add("bg-yellow-600", "bg-opacity-20", "text-yellow-400")
      } else {
        screenBtn.className = screenBtn.className.replace(/bg-yellow-\d+/, "").replace(/text-yellow-\d+/, "")
      }
    }
  }
}

export const voiceManager = new VoiceManager()
