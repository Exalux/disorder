// Main application entry point with enhanced voice and mobile support
import { stateManager } from "./core/StateManager.js"
import { eventBus } from "./core/EventBus.js"
import { peerManager } from "./core/PeerManager.js"
import { MessageRenderer } from "./ui/MessageRenderer.js"
import { NotificationManager } from "./ui/NotificationManager.js"
import { voiceManager } from "./ui/VoiceManager.js"
import { typingIndicator } from "./ui/TypingIndicator.js"
import { UserProfileModal } from "./ui/UserProfileModal.js"
import { EmojiManager } from "./ui/EmojiManager.js"

class DiscordApp {
  constructor() {
    this.messageRenderer = null
    this.currentEmojiPicker = null
    this.currentGifPicker = null
    this.voiceManager = voiceManager
    this.setupEventListeners()
  }

  async init() {
    try {
      // Initialize core systems
      NotificationManager.init()
      NotificationManager.requestPermission()

      // Initialize peer connection
      const peerId = await peerManager.initialize()
      console.log("Connected with peer ID:", peerId)

      // Initialize UI components
      this.initializeUI()
      this.setupMessageInput()
      this.setupFileHandling()
      this.setupVoiceControls()
      this.setupProfileManagement()
      this.setupQRCodeHandling()
      this.setupUserControls()
      this.checkForAutoConnect()
    } catch (error) {
      console.error("Failed to initialize app:", error)
      NotificationManager.showError("Failed to initialize application")
    }
  }

  setupEventListeners() {
    eventBus.on("messageAdded", (message) => {
      this.renderMessage(message)
    })

    eventBus.on("peerAdded", ({ peerId, peer }) => {
      this.updatePeerList()
    })

    eventBus.on("peerRemoved", ({ peerId }) => {
      this.updatePeerList()
    })

    eventBus.on("replyToMessage", ({ message }) => {
      this.setReplyingTo(message)
    })

    eventBus.on("openProfileEditor", () => {
      this.toggleProfilePanel()
    })

    eventBus.on("voiceStateUpdate", ({ peerId, state }) => {
      this.handleVoiceStateUpdate(peerId, state)
    })
  }

  initializeUI() {
    const chatBox = document.getElementById("chat-box")
    this.messageRenderer = new MessageRenderer(chatBox)

    // Add typing indicator
    const typingIndicatorElement = typingIndicator.createTypingIndicatorElement()
    chatBox.parentNode.insertBefore(typingIndicatorElement, chatBox.nextSibling)

    // Update peer ID display
    const currentPeerId = document.getElementById("current-peer-id")
    if (currentPeerId) {
      currentPeerId.textContent = `ID: ${stateManager.getStateValue("user.id")}`
    }

    // Update nickname display
    const nicknameDisplay = document.getElementById("nickname-display")
    if (nicknameDisplay) {
      nicknameDisplay.textContent = stateManager.getStateValue("user.username")
    }

    // Setup avatar click handlers
    this.setupAvatarClickHandlers()

    // Setup copy peer ID functionality
    this.setupCopyPeerIdButton()
  }

  setupMessageInput() {
    const messageInput = document.getElementById("message-input")
    const sendBtn = document.getElementById("send-btn")

    if (!messageInput || !sendBtn) return

    let lastTypingTime = 0

    messageInput.addEventListener("input", (e) => {
      const now = Date.now()
      if (now - lastTypingTime > 1000) {
        typingIndicator.startTyping()
        lastTypingTime = now
      }

      // Handle emoji suggestions
      this.handleEmojiSuggestions(e.target)
    })

    messageInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage()
      }
    })

    messageInput.addEventListener("blur", () => {
      typingIndicator.stopTyping()
    })

    sendBtn.addEventListener("click", () => {
      this.sendMessage()
    })

    // Setup emoji picker
    this.setupEmojiPicker()

    // Setup GIF picker
    this.setupGifPicker()
  }

  setupEmojiPicker() {
    const emojiBtn = document.getElementById("emoji-btn")
    if (!emojiBtn) return

    emojiBtn.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleEmojiPicker()
    })

    // Close emoji picker when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".emoji-picker")) {
        this.closeEmojiPicker()
      }
    })
  }

  setupGifPicker() {
    // Add GIF button to the input area
    const gifBtn = document.querySelector('[title="GIF"]')
    if (gifBtn) {
      gifBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleGifPicker()
      })
    }

    // Close GIF picker when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".gif-picker")) {
        this.closeGifPicker()
      }
    })
  }

  toggleEmojiPicker() {
    if (this.currentEmojiPicker) {
      this.closeEmojiPicker()
      return
    }

    this.closeGifPicker() // Close GIF picker if open

    this.currentEmojiPicker = EmojiManager.createEmojiPicker()
    this.currentEmojiPicker.style.position = "absolute"
    this.currentEmojiPicker.style.bottom = "70px"
    this.currentEmojiPicker.style.right = "20px"
    this.currentEmojiPicker.style.zIndex = "1000"

    this.currentEmojiPicker.addEventListener("emojiSelect", (e) => {
      const messageInput = document.getElementById("message-input")
      if (messageInput) {
        const cursorPos = messageInput.selectionStart
        const textBefore = messageInput.value.substring(0, cursorPos)
        const textAfter = messageInput.value.substring(messageInput.selectionEnd)
        messageInput.value = textBefore + e.detail.emoji + textAfter
        messageInput.focus()
        messageInput.setSelectionRange(cursorPos + e.detail.emoji.length, cursorPos + e.detail.emoji.length)
      }
      this.closeEmojiPicker()
    })

    document.body.appendChild(this.currentEmojiPicker)
  }

  toggleGifPicker() {
    if (this.currentGifPicker) {
      this.closeGifPicker()
      return
    }

    this.closeEmojiPicker() // Close emoji picker if open

    this.currentGifPicker = EmojiManager.createGifPicker()
    this.currentGifPicker.style.position = "absolute"
    this.currentGifPicker.style.bottom = "70px"
    this.currentGifPicker.style.right = "20px"
    this.currentGifPicker.style.zIndex = "1000"

    this.currentGifPicker.addEventListener("gifSelect", (e) => {
      this.sendGif(e.detail.url, e.detail.title)
      this.closeGifPicker()
    })

    document.body.appendChild(this.currentGifPicker)
  }

  closeEmojiPicker() {
    if (this.currentEmojiPicker) {
      this.currentEmojiPicker.remove()
      this.currentEmojiPicker = null
    }
  }

  closeGifPicker() {
    if (this.currentGifPicker) {
      this.currentGifPicker.remove()
      this.currentGifPicker = null
    }
  }

  handleEmojiSuggestions(input) {
    const value = input.value
    const cursorPos = input.selectionStart
    const textBeforeCursor = value.substring(0, cursorPos)
    const lastColonIndex = textBeforeCursor.lastIndexOf(":")

    if (lastColonIndex === -1) return

    const query = textBeforeCursor.substring(lastColonIndex)
    const suggestions = EmojiManager.getEmojiSuggestions(query)

    if (suggestions.length > 0) {
      this.showEmojiSuggestions(suggestions, input, lastColonIndex)
    } else {
      this.hideEmojiSuggestions()
    }
  }

  showEmojiSuggestions(suggestions, input, startPos) {
    this.hideEmojiSuggestions()

    const suggestionBox = document.createElement("div")
    suggestionBox.id = "emoji-suggestions"
    suggestionBox.className =
      "absolute bottom-16 left-4 bg-[#36393f] border border-[#40444b] rounded-lg shadow-xl p-2 max-h-40 overflow-y-auto z-50"

    suggestions.forEach((suggestion, index) => {
      const item = document.createElement("div")
      item.className = "flex items-center gap-2 p-2 hover:bg-[#40444b] rounded cursor-pointer text-white"
      item.innerHTML = `
        <span class="text-lg">${suggestion.emoji}</span>
        <span class="text-sm">${suggestion.name}</span>
      `

      item.onclick = () => {
        const value = input.value
        const beforeEmoji = value.substring(0, startPos)
        const afterEmoji = value.substring(input.selectionStart)
        input.value = beforeEmoji + suggestion.emoji + afterEmoji
        input.focus()
        this.hideEmojiSuggestions()
      }

      suggestionBox.appendChild(item)
    })

    input.parentNode.appendChild(suggestionBox)
  }

  hideEmojiSuggestions() {
    const existing = document.getElementById("emoji-suggestions")
    if (existing) {
      existing.remove()
    }
  }

  sendMessage() {
    const messageInput = document.getElementById("message-input")
    const content = messageInput.value.trim()

    if (!content) return

    const replyingTo = stateManager.getStateValue("ui.replyingTo")
    const mentions = this.extractMentions(content)

    const messageData = {
      type: "message",
      id: Date.now() + Math.random(),
      content,
      timestamp: new Date().toISOString(),
      replyTo: replyingTo,
      mentions,
    }

    // Send to peers
    peerManager.broadcast(messageData)

    // Add to local messages
    const localMessage = {
      ...messageData,
      author: {
        id: stateManager.getStateValue("user.id"),
        username: stateManager.getStateValue("user.username"),
        avatar: stateManager.getStateValue("user.avatar"),
      },
      timestamp: new Date(),
    }

    stateManager.addMessage(localMessage)

    // Update user stats
    const user = stateManager.getStateValue("user")
    user.messageCount = (user.messageCount || 0) + 1

    // Clear input and reply
    messageInput.value = ""
    this.clearReply()
    typingIndicator.stopTyping()

    // Update peer list
    this.updatePeerList()
  }

  sendGif(gifUrl, title) {
    const messageData = {
      type: "message",
      id: Date.now() + Math.random(),
      content: "",
      timestamp: new Date().toISOString(),
      attachments: [
        {
          filename: title || "GIF",
          type: "image/gif",
          data: gifUrl,
          isGif: true,
        },
      ],
    }

    // Send to peers
    peerManager.broadcast({
      ...messageData,
      type: "file",
      filename: title || "GIF",
      fileType: "image/gif",
      fileData: gifUrl,
      isGif: true,
    })

    // Add to local messages
    const localMessage = {
      ...messageData,
      author: {
        id: stateManager.getStateValue("user.id"),
        username: stateManager.getStateValue("user.username"),
        avatar: stateManager.getStateValue("user.avatar"),
      },
      timestamp: new Date(),
    }

    stateManager.addMessage(localMessage)

    // Update user stats
    const user = stateManager.getStateValue("user")
    user.fileCount = (user.fileCount || 0) + 1

    this.updatePeerList()
  }

  extractMentions(content) {
    const mentionRegex = /@(\w+)/g
    const mentions = []
    let match

    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    return mentions
  }

  renderMessage(message) {
    const messageElement = this.messageRenderer.renderMessage(message)
    const chatBox = document.getElementById("chat-box")
    chatBox.appendChild(messageElement)
    this.messageRenderer.scrollToBottom()
  }

  setupFileHandling() {
    const fileInput = document.getElementById("file-input")
    const plusFileInput = document.getElementById("plus-file-input")
    ;[fileInput, plusFileInput].forEach((input) => {
      if (!input) return

      input.addEventListener("change", (e) => {
        this.handleFileUpload(e.target.files[0])
      })
    })

    // Setup drag and drop
    const chatBox = document.getElementById("chat-box")
    if (chatBox) {
      chatBox.addEventListener("dragover", (e) => {
        e.preventDefault()
        chatBox.classList.add("drag-over")
      })

      chatBox.addEventListener("dragleave", () => {
        chatBox.classList.remove("drag-over")
      })

      chatBox.addEventListener("drop", (e) => {
        e.preventDefault()
        chatBox.classList.remove("drag-over")

        const files = Array.from(e.dataTransfer.files)
        files.forEach((file) => this.handleFileUpload(file))
      })
    }
  }

  async handleFileUpload(file) {
    if (!file) return

    const maxSize = 30 * 1024 * 1024 // 30MB
    if (file.size > maxSize) {
      NotificationManager.showError("File exceeds 30MB limit")
      return
    }

    try {
      const fileData = await this.readFileAsDataURL(file)

      const messageData = {
        type: "file",
        id: Date.now() + Math.random(),
        filename: file.name,
        size: file.size,
        fileType: file.type,
        fileData,
        timestamp: new Date().toISOString(),
      }

      // Send to peers
      peerManager.broadcast(messageData)

      // Add to local messages
      const localMessage = {
        id: messageData.id,
        content: "",
        author: {
          id: stateManager.getStateValue("user.id"),
          username: stateManager.getStateValue("user.username"),
          avatar: stateManager.getStateValue("user.avatar"),
        },
        timestamp: new Date(),
        attachments: [
          {
            filename: file.name,
            size: file.size,
            type: file.type,
            data: fileData,
          },
        ],
      }

      stateManager.addMessage(localMessage)

      // Update user stats
      const user = stateManager.getStateValue("user")
      user.fileCount = (user.fileCount || 0) + 1

      this.updatePeerList()
    } catch (error) {
      console.error("File upload failed:", error)
      NotificationManager.showError("Failed to upload file")
    }
  }

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  setupVoiceControls() {
    const joinVoiceBtn = document.getElementById("voice-channel")
    const mobileVoiceBtn = document.getElementById("mobile-voice-channel")
    const toggleMicBtn = document.getElementById("toggle-mic")
    const toggleCamBtn = document.getElementById("toggle-cam")
    const shareScreenBtn = document.getElementById("share-screen")
    const leaveVoiceBtn = document.getElementById("leave-voice")
    const leaveVoiceChannelBtn = document.getElementById("leave-voice-channel")
    ;[joinVoiceBtn, mobileVoiceBtn].forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", () => {
          this.voiceManager.joinVoiceChannel()
        })
      }
    })

    if (toggleMicBtn) {
      toggleMicBtn.addEventListener("click", () => {
        this.voiceManager.toggleMicrophone()
      })
    }

    if (toggleCamBtn) {
      toggleCamBtn.addEventListener("click", () => {
        this.voiceManager.toggleCamera()
      })
    }

    if (shareScreenBtn) {
      shareScreenBtn.addEventListener("click", () => {
        this.voiceManager.toggleScreenShare()
      })
    }
    ;[leaveVoiceBtn, leaveVoiceChannelBtn].forEach((btn) => {
      if (btn) {
        btn.addEventListener("click", () => {
          this.voiceManager.leaveVoiceChannel()
        })
      }
    })
  }

  setupProfileManagement() {
    const avatarPreview = document.getElementById("avatar-preview")

    if (avatarPreview) {
      avatarPreview.addEventListener("click", () => {
        this.toggleProfilePanel()
      })
    }

    // Setup save profile functionality
    window.saveProfile = () => {
      this.saveProfile()
    }

    window.toggleProfilePanel = () => {
      this.toggleProfilePanel()
    }
  }

  toggleProfilePanel() {
    const panel = document.getElementById("profile-panel")
    const nicknameInput = document.getElementById("nickname-input")

    if (panel) {
      panel.classList.toggle("hidden")

      if (!panel.classList.contains("hidden") && nicknameInput) {
        nicknameInput.value = stateManager.getStateValue("user.username")
        nicknameInput.focus()
      }
    }
  }

  async saveProfile() {
    const nicknameInput = document.getElementById("nickname-input")
    const avatarUpload = document.getElementById("avatar-upload")
    const avatarPreview = document.getElementById("avatar-preview")
    const nicknameDisplay = document.getElementById("nickname-display")

    let updated = false

    // Update username
    if (nicknameInput && nicknameInput.value.trim()) {
      const newUsername = nicknameInput.value.trim()
      stateManager.setState("user.username", newUsername)

      if (nicknameDisplay) {
        nicknameDisplay.textContent = newUsername
      }

      updated = true
    }

    // Update avatar
    if (avatarUpload && avatarUpload.files[0]) {
      try {
        const file = avatarUpload.files[0]
        if (file.type.startsWith("image/")) {
          const avatarData = await this.readFileAsDataURL(file)
          stateManager.setState("user.avatar", avatarData)

          if (avatarPreview) {
            avatarPreview.src = avatarData
          }

          updated = true
        }
      } catch (error) {
        console.error("Failed to update avatar:", error)
        NotificationManager.showError("Failed to update avatar")
      }
    }

    if (updated) {
      // Broadcast profile update to peers
      peerManager.broadcast({
        type: "profile",
        user: stateManager.getStateValue("user"),
      })

      // Update local peer data
      const userId = stateManager.getStateValue("user.id")
      stateManager.addPeer(userId, stateManager.getStateValue("user"))

      this.updatePeerList()
      NotificationManager.showSuccess("Profile updated")
    }

    this.toggleProfilePanel()
  }

  setupAvatarClickHandlers() {
    document.addEventListener("click", (e) => {
      // Remove existing profile cards
      document.querySelectorAll(".user-profile-card").forEach((card) => card.remove())

      // Check if clicked on avatar or user element
      const avatar = e.target.closest(".avatar") || e.target.closest("[data-user-id]")
      if (avatar) {
        const userId = avatar.dataset.userId || avatar.dataset.peerId
        if (userId) {
          UserProfileModal.show(userId)
        }
      }
    })
  }

  setupCopyPeerIdButton() {
    const copyBtn = document.getElementById("copy-peer-id")
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        const peerId = stateManager.getStateValue("user.id")
        navigator.clipboard.writeText(peerId).then(() => {
          NotificationManager.showSuccess("Peer ID copied to clipboard")
        })
      })
    }
  }

  setupQRCodeHandling() {
    // QR code functions are exposed globally for HTML onclick handlers
    window.showQRCode = () => {
      import("./ui/QRCodeManager.js").then(({ QRCodeManager }) => {
        QRCodeManager.showQRCode()
      })
    }

    window.showQRScanner = () => {
      import("./ui/QRCodeManager.js").then(({ QRCodeManager }) => {
        QRCodeManager.showQRScanner()
      })
    }

    // Setup connect button
    const connectBtn = document.getElementById("connect-btn")
    const peerIdInput = document.getElementById("peer-id-input")

    if (connectBtn && peerIdInput) {
      connectBtn.addEventListener("click", () => {
        const peerId = peerIdInput.value.trim()
        if (peerId) {
          this.connectToPeer(peerId)
          peerIdInput.value = ""
        }
      })

      peerIdInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          connectBtn.click()
        }
      })
    }
  }

  async connectToPeer(peerId) {
    const success = await peerManager.connectToPeer(peerId)
    if (success) {
      NotificationManager.showSuccess(`Connecting to ${peerId}...`)
    } else {
      NotificationManager.showError(`Failed to connect to ${peerId}`)
    }
  }

  checkForAutoConnect() {
    const urlParams = new URLSearchParams(window.location.search)
    const remoteId = urlParams.get("id")

    if (remoteId) {
      setTimeout(() => {
        this.connectToPeer(remoteId)
      }, 1000)
    }
  }

  updatePeerList() {
    const peerList = document.getElementById("peer-list")
    const peerCount = document.getElementById("peer-count")

    if (!peerList || !peerCount) return

    const peers = stateManager.getStateValue("peers")
    const activePeers = Object.values(peers).filter((peer) => peer.status === "online")

    peerCount.textContent = `Online - ${activePeers.length}`
    peerList.innerHTML = ""

    activePeers.forEach((peer) => {
      const peerElement = document.createElement("div")
      peerElement.className = "flex items-center gap-2 p-2 hover:bg-[#3c3f45] rounded cursor-pointer transition-colors"
      peerElement.dataset.userId = peer.id

      peerElement.innerHTML = `
        <div class="relative">
          <img src="${peer.avatar}" alt="${peer.username}" class="w-8 h-8 rounded-full">
          <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2b2d31]"></div>
        </div>
        <div class="flex-1">
          <div class="text-white text-sm font-medium">${peer.username}</div>
          <div class="text-xs text-gray-400">Online</div>
        </div>
      `

      peerList.appendChild(peerElement)
    })

    // Update mobile peer list
    const mobilePeerList = document.getElementById("mobile-peer-list")
    if (mobilePeerList) {
      mobilePeerList.innerHTML = peerList.innerHTML
    }
  }

  setReplyingTo(message) {
    stateManager.setState("ui.replyingTo", message)
    this.updateReplyPreview()

    const messageInput = document.getElementById("message-input")
    if (messageInput) {
      messageInput.focus()
    }
  }

  clearReply() {
    stateManager.setState("ui.replyingTo", null)
    this.updateReplyPreview()
  }

  updateReplyPreview() {
    const replyPreview = document.getElementById("reply-preview")
    const replyingTo = stateManager.getStateValue("ui.replyingTo")

    if (!replyPreview) return

    if (replyingTo) {
      replyPreview.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fas fa-reply text-blue-400"></i>
            <span class="text-sm">
              Replying to <span class="font-medium">${replyingTo.author.username}</span>: 
              ${replyingTo.content.slice(0, 50)}${replyingTo.content.length > 50 ? "..." : ""}
            </span>
          </div>
          <button class="text-gray-400 hover:text-white transition-colors" onclick="app.clearReply()">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `
      replyPreview.classList.remove("hidden")
    } else {
      replyPreview.classList.add("hidden")
    }
  }

  handleVoiceStateUpdate(peerId, state) {
    // Update voice user UI based on state changes
    const user = this.voiceManager.voiceUsers.get(peerId)
    if (user) {
      user.micEnabled = state.micEnabled
      this.voiceManager.voiceUsers.set(peerId, user)
      this.voiceManager.updateVoiceChannelDisplay()
    }
  }

  setupUserControls() {
    // Setup user control buttons in the bottom left
    const userMicBtn = document.getElementById("user-mic-btn")
    const userHeadphonesBtn = document.getElementById("user-headphones-btn")
    const userSettingsBtn = document.getElementById("user-settings-btn")

    if (userMicBtn) {
      userMicBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.voiceManager.toggleMicrophone()
      })
    }

    if (userHeadphonesBtn) {
      userHeadphonesBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.toggleDeafen()
      })
    }

    if (userSettingsBtn) {
      userSettingsBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.openSettings()
      })
    }
  }

  toggleDeafen() {
    const isDeafened = stateManager.getStateValue("voiceChannel.deafened") || false
    stateManager.setState("voiceChannel.deafened", !isDeafened)

    // Mute all remote audio
    document.querySelectorAll("audio").forEach((audio) => {
      if (audio.id.startsWith("audio-")) {
        audio.muted = !isDeafened
      }
    })

    // Update button appearance
    const headphonesBtn = document.getElementById("user-headphones-btn")
    if (headphonesBtn) {
      const icon = headphonesBtn.querySelector("i")
      if (!isDeafened) {
        icon.className = "fas fa-volume-mute text-xs"
        headphonesBtn.classList.add("bg-red-600", "bg-opacity-20", "text-red-400")
      } else {
        icon.className = "fas fa-headphones text-xs"
        headphonesBtn.className = headphonesBtn.className.replace(/bg-red-\d+/, "").replace(/text-red-\d+/, "")
      }
    }
  }

  openSettings() {
    // Open settings modal or panel
    console.log("Settings opened")
    NotificationManager.showInfo("Settings panel coming soon!")
  }
}

// Initialize mobile handlers
import("./ui/MobileHandler.js").then(({ initializeMobileHandlers }) => {
  document.addEventListener("DOMContentLoaded", () => {
    initializeMobileHandlers()
  })
})

// Initialize and start the application
const app = new DiscordApp()
window.app = app // Expose for global access

document.addEventListener("DOMContentLoaded", () => {
  app.init()
})

// Handle page unload
window.addEventListener("beforeunload", () => {
  peerManager.destroy()
})

// Add CSS for new features
const additionalStyles = document.createElement("style")
additionalStyles.textContent = `
.drag-over {
  background-color: rgba(88, 101, 242, 0.1) !important;
  border: 2px dashed #5865f2;
}

.highlight-flash {
  animation: highlightFlash 2s ease-out;
}

@keyframes highlightFlash {
  0% { background-color: rgba(88, 101, 242, 0.3); }
  100% { background-color: transparent; }
}

.speaking img {
  animation: speakingPulse 1s ease-in-out infinite alternate;
}

@keyframes speakingPulse {
  0% { transform: scale(1); }
  100% { transform: scale(1.05); }
}

.mentioned-message {
  background-color: rgba(250, 166, 26, 0.05) !important;
  border-left: 3px solid #faa61a;
  padding-left: 8px;
}

.message-actions {
  transform: translateY(-50%);
}

.grouped-message {
  margin-top: 0.125rem;
}

.typing-dots div {
  animation: typingBounce 1.4s ease-in-out infinite both;
}

@keyframes typingBounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* Mobile sidebar improvements */
#mobile-sidebar-overlay {
  backdrop-filter: blur(2px);
}

#mobile-sidebar {
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.3);
}

/* Voice channel enhancements */
.voice-user-item:hover,
.voice-user-mobile:hover,
.voice-user-panel:hover {
  transform: translateY(-1px);
}

.voice-user-item img,
.voice-user-mobile img,
.voice-user-panel img {
  transition: all 0.2s ease;
}

/* Mobile adjustments */
@media (max-width: 767px) {
  #chat-box {
    padding-bottom: 80px;
  }
  
  .keyboard-open #chat-box {
    padding-bottom: 200px;
  }
  
  #voice-channel-panel {
    padding: 12px;
  }
  
  #voice-channel-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
}
`
document.head.appendChild(additionalStyles)
