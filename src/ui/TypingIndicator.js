// Typing indicator functionality
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { peerManager } from '../core/PeerManager.js';

export class TypingIndicator {
  constructor() {
    this.typingTimeout = null;
    this.isTyping = false;
    this.typingUsers = new Set();
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('typingUpdate', ({ peerId, isTyping }) => {
      if (isTyping) {
        this.addTypingUser(peerId);
      } else {
        this.removeTypingUser(peerId);
      }
      this.updateTypingDisplay();
    });

    eventBus.on('messageAdded', () => {
      this.typingUsers.clear();
      this.updateTypingDisplay();
    });
  }

  startTyping() {
    if (!this.isTyping) {
      this.isTyping = true;
      peerManager.broadcast({
        type: 'typing',
        isTyping: true
      });
    }

    // Reset timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 3000);
  }

  stopTyping() {
    if (this.isTyping) {
      this.isTyping = false;
      peerManager.broadcast({
        type: 'typing',
        isTyping: false
      });
    }

    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
      this.typingTimeout = null;
    }
  }

  addTypingUser(peerId) {
    this.typingUsers.add(peerId);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeTypingUser(peerId);
    }, 5000);
  }

  removeTypingUser(peerId) {
    this.typingUsers.delete(peerId);
    this.updateTypingDisplay();
  }

  updateTypingDisplay() {
    const typingContainer = document.getElementById('typing-indicator');
    if (!typingContainer) return;

    if (this.typingUsers.size === 0) {
      typingContainer.classList.add('hidden');
      return;
    }

    const usernames = Array.from(this.typingUsers).map(peerId => {
      const peer = stateManager.getStateValue(`peers.${peerId}`);
      return peer ? peer.username : peerId;
    });

    let text = '';
    if (usernames.length === 1) {
      text = `${usernames[0]} is typing...`;
    } else if (usernames.length === 2) {
      text = `${usernames[0]} and ${usernames[1]} are typing...`;
    } else {
      text = `${usernames.slice(0, -1).join(', ')} and ${usernames[usernames.length - 1]} are typing...`;
    }

    typingContainer.innerHTML = `
      <div class="flex items-center gap-2 px-4 py-2 text-sm text-[#72767d]">
        <div class="typing-dots flex gap-1">
          <div class="w-1 h-1 bg-[#72767d] rounded-full animate-bounce" style="animation-delay: 0ms"></div>
          <div class="w-1 h-1 bg-[#72767d] rounded-full animate-bounce" style="animation-delay: 150ms"></div>
          <div class="w-1 h-1 bg-[#72767d] rounded-full animate-bounce" style="animation-delay: 300ms"></div>
        </div>
        <span>${text}</span>
      </div>
    `;
    
    typingContainer.classList.remove('hidden');
  }

  createTypingIndicatorElement() {
    const indicator = document.createElement('div');
    indicator.id = 'typing-indicator';
    indicator.className = 'hidden';
    return indicator;
  }
}

export const typingIndicator = new TypingIndicator();
