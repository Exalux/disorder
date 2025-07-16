// Enhanced mobile interface handling
import { stateManager } from '../core/StateManager.js';
import { peerManager } from '../core/PeerManager.js';
import { QRCodeManager } from './QRCodeManager.js';

let mobileSidebarOpen = false;

export function initializeMobileHandlers() {
  setupMobileMenu();
  setupMobileConnections();
  setupMobileGestures();
  setupMobileKeyboard();
  setupMobileOrientation();
  syncMobileLists();
}

function setupMobileMenu() {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileSidebar = document.getElementById('mobile-sidebar');
  const closeSidebar = document.getElementById('close-sidebar');

  mobileMenuBtn?.addEventListener('click', () => {
    openMobileSidebar();
  });

  closeSidebar?.addEventListener('click', () => {
    closeMobileSidebar();
  });

  mobileSidebar?.addEventListener('click', (e) => {
    if (e.target === mobileSidebar) {
      closeMobileSidebar();
    }
  });
}

function setupMobileConnections() {
  const mobileQRBtn = document.getElementById('mobile-qr-btn');
  const mobileScanBtn = document.getElementById('mobile-scan-btn');
  const mobileConnectBtn = document.getElementById('mobile-connect-btn');
  const mobilePeerInput = document.getElementById('mobile-peer-input');

  mobileQRBtn?.addEventListener('click', () => {
    QRCodeManager.showQRCode();
    closeMobileSidebar();
  });

  mobileScanBtn?.addEventListener('click', () => {
    QRCodeManager.showQRScanner();
    closeMobileSidebar();
  });

  mobileConnectBtn?.addEventListener('click', async () => {
    const peerId = mobilePeerInput.value.trim();
    if (peerId) {
      const success = await peerManager.connectToPeer(peerId);
      if (success) {
        mobilePeerInput.value = '';
        closeMobileSidebar();
      }
    }
  });

  mobilePeerInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      mobileConnectBtn.click();
    }
  });
}

function setupMobileGestures() {
  let touchStartX = 0;
  let touchStartY = 0;
  let touchStartTime = 0;

  document.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!touchStartX || !touchStartY) return;

    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const touchEndTime = Date.now();
    
    const diffX = touchStartX - touchEndX;
    const diffY = touchStartY - touchEndY;
    const timeDiff = touchEndTime - touchStartTime;

    // Only process quick swipes
    if (timeDiff > 300) return;

    // Only trigger if horizontal swipe is more significant than vertical
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      // Swipe right to open sidebar (from left edge)
      if (diffX < 0 && touchStartX < 50 && !mobileSidebarOpen) {
        openMobileSidebar();
      }
      
      // Swipe left to close sidebar
      if (diffX > 0 && mobileSidebarOpen) {
        closeMobileSidebar();
      }
    }

    touchStartX = 0;
    touchStartY = 0;
  }, { passive: true });
}

function setupMobileKeyboard() {
  const messageInput = document.getElementById('message-input');
  if (!messageInput) return;

  let keyboardOpen = false;

  messageInput.addEventListener('focus', () => {
    keyboardOpen = true;
    document.body.classList.add('keyboard-open');
    
    // Scroll to input after keyboard animation
    setTimeout(() => {
      messageInput.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      });
    }, 300);
  });

  messageInput.addEventListener('blur', () => {
    keyboardOpen = false;
    document.body.classList.remove('keyboard-open');
  });

  // Handle viewport changes
  let initialViewportHeight = window.innerHeight;
  
  window.addEventListener('resize', () => {
    const currentHeight = window.innerHeight;
    const heightDiff = initialViewportHeight - currentHeight;
    
    // Keyboard likely opened if height decreased significantly
    if (heightDiff > 150 && !keyboardOpen) {
      document.body.classList.add('keyboard-open');
    } else if (heightDiff < 50 && keyboardOpen) {
      document.body.classList.remove('keyboard-open');
    }
  });
}

function setupMobileOrientation() {
  window.addEventListener('orientationchange', () => {
    // Delay to allow orientation change to complete
    setTimeout(() => {
      const chatBox = document.getElementById('chat-box');
      if (chatBox) {
        chatBox.scrollTop = chatBox.scrollHeight;
      }
      
      // Recalculate viewport
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }, 500);
  });

  // Set initial viewport height
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function syncMobileLists() {
  const observer = new MutationObserver(() => {
    syncMobilePeerList();
    syncMobileVoiceUsers();
  });

  const peerList = document.getElementById('peer-list');
  const voiceUsers = document.getElementById('voice-users');
  
  if (peerList) {
    observer.observe(peerList, { childList: true, subtree: true });
  }
  
  if (voiceUsers) {
    observer.observe(voiceUsers, { childList: true, subtree: true });
  }
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

function openMobileSidebar() {
  const mobileSidebar = document.getElementById('mobile-sidebar');
  if (mobileSidebar) {
    mobileSidebar.classList.remove('hidden');
    mobileSidebarOpen = true;
    document.body.style.overflow = 'hidden';
    
    // Sync lists when opening
    syncMobilePeerList();
    syncMobileVoiceUsers();
  }
}

function closeMobileSidebar() {
  const mobileSidebar = document.getElementById('mobile-sidebar');
  if (mobileSidebar) {
    mobileSidebar.classList.add('hidden');
    mobileSidebarOpen = false;
    document.body.style.overflow = '';
  }
}

// Expose functions for global access
window.openMobileSidebar = openMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;