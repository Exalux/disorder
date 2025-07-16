import { QRCodeManager } from "./QRCodeManager.js"

class MobileHandler {
  constructor() {
    this.sidebarOpen = false
    this.overlay = null
    this.sidebar = null
    this.closeBtn = null
    this.menuBtn = null
    this.init()
  }

  init() {
    this.overlay = document.getElementById("mobile-sidebar-overlay")
    this.sidebar = document.getElementById("mobile-sidebar")
    this.closeBtn = document.getElementById("mobile-sidebar-close")
    this.menuBtn = document.getElementById("mobile-menu-btn")

    this.setupEventListeners()
    this.setupConnections()
    this.setupGestures()
    this.setupKeyboard()
    this.setupOrientation()
  }

  setupEventListeners() {
    // Menu button to open sidebar
    this.menuBtn?.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.openSidebar()
    })

    // Close button
    this.closeBtn?.addEventListener("click", (e) => {
      e.preventDefault()
      e.stopPropagation()
      this.closeSidebar()
    })

    // Overlay click to close
    this.overlay?.addEventListener("click", (e) => {
      if (e.target === this.overlay) {
        this.closeSidebar()
      }
    })

    // Prevent sidebar content clicks from closing
    this.sidebar?.addEventListener("click", (e) => {
      e.stopPropagation()
    })

    // ESC key to close
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.sidebarOpen) {
        this.closeSidebar()
      }
    })

    // Voice channel button
    const mobileVoiceChannel = document.getElementById("mobile-voice-channel")
    mobileVoiceChannel?.addEventListener("click", () => {
      window.app?.voiceManager?.joinVoiceChannel()
      this.closeSidebar()
    })
  }

  setupConnections() {
    const qrBtn = document.getElementById("mobile-qr-btn")
    const scanBtn = document.getElementById("mobile-scan-btn")
    const connectBtn = document.getElementById("mobile-connect-btn")
    const peerInput = document.getElementById("mobile-peer-input")

    qrBtn?.addEventListener("click", () => {
      QRCodeManager.showQRCode()
      this.closeSidebar()
    })

    scanBtn?.addEventListener("click", () => {
      QRCodeManager.showQRScanner()
      this.closeSidebar()
    })

    connectBtn?.addEventListener("click", async () => {
      const peerId = peerInput?.value?.trim()
      if (peerId && window.app) {
        await window.app.connectToPeer(peerId)
        if (peerInput) peerInput.value = ""
        this.closeSidebar()
      }
    })

    peerInput?.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        connectBtn?.click()
      }
    })
  }

  setupGestures() {
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    document.addEventListener(
      "touchstart",
      (e) => {
        touchStartX = e.touches[0].clientX
        touchStartY = e.touches[0].clientY
        touchStartTime = Date.now()
      },
      { passive: true },
    )

    document.addEventListener(
      "touchend",
      (e) => {
        if (!touchStartX || !touchStartY) return

        const touchEndX = e.changedTouches[0].clientX
        const touchEndY = e.changedTouches[0].clientY
        const touchEndTime = Date.now()

        const diffX = touchStartX - touchEndX
        const diffY = touchStartY - touchEndY
        const timeDiff = touchEndTime - touchStartTime

        // Only process quick swipes
        if (timeDiff > 300) return

        // Only trigger if horizontal swipe is more significant than vertical
        if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
          // Swipe right to open sidebar (from left edge)
          if (diffX < 0 && touchStartX < 50 && !this.sidebarOpen) {
            this.openSidebar()
          }

          // Swipe left to close sidebar
          if (diffX > 0 && this.sidebarOpen) {
            this.closeSidebar()
          }
        }

        touchStartX = 0
        touchStartY = 0
      },
      { passive: true },
    )
  }

  setupKeyboard() {
    const messageInput = document.getElementById("message-input")
    if (!messageInput) return

    let keyboardOpen = false

    messageInput.addEventListener("focus", () => {
      keyboardOpen = true
      document.body.classList.add("keyboard-open")

      // Adjust chat box height for mobile keyboard
      const chatBox = document.getElementById("chat-box")
      if (chatBox && window.innerWidth < 768) {
        chatBox.style.paddingBottom = "200px"
      }

      // Scroll to input after keyboard animation
      setTimeout(() => {
        messageInput.scrollIntoView({
          behavior: "smooth",
          block: "center",
        })
      }, 300)
    })

    messageInput.addEventListener("blur", () => {
      keyboardOpen = false
      document.body.classList.remove("keyboard-open")

      // Reset chat box padding
      const chatBox = document.getElementById("chat-box")
      if (chatBox) {
        chatBox.style.paddingBottom = ""
      }
    })

    // Handle viewport changes for keyboard detection
    const initialViewportHeight = window.innerHeight

    window.addEventListener("resize", () => {
      const currentHeight = window.innerHeight
      const heightDiff = initialViewportHeight - currentHeight

      // Keyboard likely opened if height decreased significantly
      if (heightDiff > 150 && !keyboardOpen) {
        document.body.classList.add("keyboard-open")
      } else if (heightDiff < 50 && keyboardOpen) {
        document.body.classList.remove("keyboard-open")
      }
    })
  }

  setupOrientation() {
    window.addEventListener("orientationchange", () => {
      // Delay to allow orientation change to complete
      setTimeout(() => {
        const chatBox = document.getElementById("chat-box")
        if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight
        }

        // Recalculate viewport
        const vh = window.innerHeight * 0.01
        document.documentElement.style.setProperty("--vh", `${vh}px`)
      }, 500)
    })

    // Set initial viewport height
    const vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty("--vh", `${vh}px`)
  }

  openSidebar() {
    if (!this.overlay || !this.sidebar) return

    this.sidebarOpen = true
    this.overlay.classList.remove("hidden")
    document.body.style.overflow = "hidden"

    // Trigger animation
    requestAnimationFrame(() => {
      this.sidebar.classList.remove("-translate-x-full")
      this.sidebar.classList.add("translate-x-0")
    })

    // Sync lists when opening
    this.syncLists()
  }

  closeSidebar() {
    if (!this.overlay || !this.sidebar) return

    this.sidebarOpen = false
    document.body.style.overflow = ""

    // Trigger animation
    this.sidebar.classList.remove("translate-x-0")
    this.sidebar.classList.add("-translate-x-full")

    // Hide overlay after animation
    setTimeout(() => {
      this.overlay.classList.add("hidden")
    }, 300)
  }

  syncLists() {
    // Sync peer list
    const peerList = document.getElementById("peer-list")
    const mobilePeerList = document.getElementById("mobile-peer-list")

    if (peerList && mobilePeerList) {
      mobilePeerList.innerHTML = peerList.innerHTML
    }

    // Sync voice users
    const voiceUsersGrid = document.getElementById("voice-users-grid")
    const mobileVoiceUsersGrid = document.getElementById("mobile-voice-users-grid")

    if (voiceUsersGrid && mobileVoiceUsersGrid) {
      mobileVoiceUsersGrid.innerHTML = voiceUsersGrid.innerHTML
    }
  }

  updateVoiceChannel(users) {
    const container = document.getElementById("mobile-voice-users-container")
    const grid = document.getElementById("mobile-voice-users-grid")

    if (!container || !grid) return

    if (users.length > 0) {
      container.classList.remove("hidden")
      grid.innerHTML = users
        .map(
          (user) => `
        <div class="voice-user-mobile flex flex-col items-center p-2 rounded hover:bg-[#3c3f45] transition-colors">
          <div class="relative mb-1">
            <img src="${user.avatar}" alt="${user.username}" class="w-8 h-8 rounded-full ${user.speaking ? "ring-2 ring-green-400" : ""}">
            ${user.micEnabled ? '<i class="fas fa-microphone text-xs text-green-400 absolute -bottom-1 -right-1 bg-[#2b2d31] rounded-full p-0.5"></i>' : '<i class="fas fa-microphone-slash text-xs text-red-400 absolute -bottom-1 -right-1 bg-[#2b2d31] rounded-full p-0.5"></i>'}
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
}

export function initializeMobileHandlers() {
  new MobileHandler()
}
