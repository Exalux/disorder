// /public/asset/js/mobileHandler.js
import { showQRCode, showQRScanner } from './qrCodeHandler.js';
import { peer, connections } from './globals.js';
import { setupConnection } from './messaging.js';

let mobileSidebarOpen = false;

export function initializeMobileHandlers() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const closeSidebar = document.getElementById('close-sidebar');
  const mobileQRBtn = document.getElementById('mobile-qr-btn');
  const mobileScanBtn = document.getElementById('mobile-scan-btn');
  const mobileConnectBtn = document.getElementById('mobile-connect-btn');
  const mobilePeerInput = document.getElementById('mobile-peer-input');

  // Mobile menu toggle
  mobileMenuBtn?.addEventListener('click', () => {
    mobileSidebar.classList.remove('hidden');
    mobileSidebarOpen = true;
    document.body.style.overflow = 'hidden';
  });

  closeSidebar?.addEventListener('click', () => {
    mobileSidebar.classList.add('hidden');
    mobileSidebarOpen = false;
    document.body.style.overflow = '';
  });

  // Close sidebar when clicking outside
  mobileSidebar?.addEventListener('click', (e) => {
    if (e.target === mobileSidebar) {
      mobileSidebar.classList.add('hidden');
      mobileSidebarOpen = false;
      document.body.style.overflow = '';
    }
  });

  // QR code handlers
  mobileQRBtn?.addEventListener('click', showQRCode);
  mobileScanBtn?.addEventListener('click', showQRScanner);

  // Mobile connect functionality
  mobileConnectBtn?.addEventListener('click', () => {
    const id = mobilePeerInput.value.trim();
    if (id && !connections[id]) {
      const conn = peer.connect(id);
      setupConnection(conn);
      mobilePeerInput.value = '';
      mobileSidebar.classList.add('hidden');
      mobileSidebarOpen = false;
      document.body.style.overflow = '';
    }
  });

  mobilePeerInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      mobileConnectBtn.click();
    }
  });

  // Handle keyboard on mobile
  const messageInput = document.getElementById('message-input');
  if (messageInput) {
    messageInput.addEventListener('focus', () => {
      document.body.classList.add('keyboard-open');
      setTimeout(() => {
        messageInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    });

    messageInput.addEventListener('blur', () => {
      document.body.classList.remove('keyboard-open');
    });
  }

  // Handle orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(() => {
      const chatBox = document.getElementById('chat-box');
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
    }, 500);
  });

  // Sync mobile peer list with main peer list
  const observer = new MutationObserver(() => {
    syncMobilePeerList();
    syncMobileVoiceUsers();
  });

  const peerList = document.getElementById('peer-list');
  const voiceUsers = document.getElementById('voice-users');
  
  if (peerList) observer.observe(peerList, { childList: true, subtree: true });
  if (voiceUsers) observer.observe(voiceUsers, { childList: true, subtree: true });
}

function syncMobilePeerList() {
  const peerList = document.getElementById('peer-list');
  const mobilePeerList = document.getElementById('mobile-peer-list');
  
  if (peerList && mobilePeerList) {
    mobilePeerList.innerHTML = peerList.innerHTML;
  }
}

function syncMobileVoiceUsers() {
  const voiceUsers = document.getElementById('voice-users');
  const mobileVoiceUsers = document.getElementById('mobile-voice-users');
  
  if (voiceUsers && mobileVoiceUsers) {
    mobileVoiceUsers.innerHTML = voiceUsers.innerHTML;
  }
}

// Swipe gestures for mobile
let touchStartX = 0;
let touchStartY = 0;

document.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

document.addEventListener('touchend', (e) => {
  if (!touchStartX || !touchStartY) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;
  
  const diffX = touchStartX - touchEndX;
  const diffY = touchStartY - touchEndY;

  // Only trigger if horizontal swipe is more significant than vertical
  if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
    const mobileSidebar = document.getElementById('mobile-sidebar');
    
    // Swipe right to open sidebar (from left edge)
    if (diffX < 0 && touchStartX < 50 && !mobileSidebarOpen) {
      mobileSidebar?.classList.remove('hidden');
      mobileSidebarOpen = true;
      document.body.style.overflow = 'hidden';
    }
    
    // Swipe left to close sidebar
    if (diffX > 0 && mobileSidebarOpen) {
      mobileSidebar?.classList.add('hidden');
      mobileSidebarOpen = false;
      document.body.style.overflow = '';
    }
  }

  touchStartX = 0;
  touchStartY = 0;
});