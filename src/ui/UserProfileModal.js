// Enhanced user profile modal
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { peerManager } from '../core/PeerManager.js';

export class UserProfileModal {
  static show(userId) {
    const user = stateManager.getStateValue(`peers.${userId}`) || stateManager.getStateValue('user');
    if (!user) return;

    const modal = this.createModal(user, userId);
    document.body.appendChild(modal);
    
    // Animate in
    requestAnimationFrame(() => {
      modal.classList.add('opacity-100');
      modal.querySelector('.modal-content').classList.add('scale-100');
    });
  }

  static createModal(user, userId) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 opacity-0 transition-opacity duration-200';
    
    const isCurrentUser = userId === stateManager.getStateValue('user.id');
    const joinedTime = user.joinedAt ? this.formatJoinTime(user.joinedAt) : 'Unknown';
    
    modal.innerHTML = `
      <div class="modal-content bg-[#36393f] rounded-lg max-w-md w-full mx-4 transform scale-95 transition-transform duration-200">
        <!-- Header -->
        <div class="relative">
          <div class="h-24 bg-gradient-to-r from-[#5865f2] to-[#7289da] rounded-t-lg"></div>
          <button class="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors">
            <i class="fas fa-times text-xl"></i>
          </button>
          <div class="absolute -bottom-8 left-6">
            <div class="relative">
              <img src="${user.avatar}" alt="${user.username}" class="w-16 h-16 rounded-full border-4 border-[#36393f]">
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#36393f]"></div>
            </div>
          </div>
        </div>
        
        <!-- Content -->
        <div class="p-6 pt-12">
          <div class="mb-4">
            <h2 class="text-xl font-bold text-white mb-1">${user.username}</h2>
            <p class="text-sm text-[#72767d]">${user.customStatus || 'No status set'}</p>
          </div>
          
          <!-- Status -->
          <div class="mb-4">
            <div class="flex items-center gap-2 text-sm">
              <div class="w-3 h-3 bg-green-500 rounded-full"></div>
              <span class="text-[#72767d]">Online</span>
            </div>
          </div>
          
          <!-- Stats -->
          <div class="bg-[#2f3136] rounded-lg p-4 mb-4">
            <h3 class="text-sm font-semibold text-white mb-3">Activity</h3>
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div class="text-[#72767d]">Messages</div>
                <div class="text-white font-medium">${user.messageCount || 0}</div>
              </div>
              <div>
                <div class="text-[#72767d]">Files Shared</div>
                <div class="text-white font-medium">${user.fileCount || 0}</div>
              </div>
            </div>
          </div>
          
          <!-- Member Since -->
          <div class="bg-[#2f3136] rounded-lg p-4 mb-4">
            <h3 class="text-sm font-semibold text-white mb-2">Member Since</h3>
            <div class="text-sm text-[#72767d]">${joinedTime}</div>
          </div>
          
          <!-- Actions -->
          <div class="flex gap-2">
            ${!isCurrentUser ? `
              <button class="mention-btn flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white py-2 px-4 rounded font-medium transition-colors">
                <i class="fas fa-at mr-2"></i>Mention
              </button>
              <button class="dm-btn flex-1 bg-[#2f3136] hover:bg-[#40444b] text-white py-2 px-4 rounded font-medium transition-colors">
                <i class="fas fa-envelope mr-2"></i>Message
              </button>
            ` : `
              <button class="edit-profile-btn flex-1 bg-[#5865f2] hover:bg-[#4752c4] text-white py-2 px-4 rounded font-medium transition-colors">
                <i class="fas fa-edit mr-2"></i>Edit Profile
              </button>
            `}
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    modal.querySelector('.fa-times').parentElement.onclick = () => {
      this.close(modal);
    };

    modal.onclick = (e) => {
      if (e.target === modal) {
        this.close(modal);
      }
    };

    if (!isCurrentUser) {
      modal.querySelector('.mention-btn').onclick = () => {
        this.mentionUser(user.username);
        this.close(modal);
      };

      modal.querySelector('.dm-btn').onclick = () => {
        // TODO: Implement direct messaging
        console.log('Direct messaging not implemented yet');
        this.close(modal);
      };
    } else {
      modal.querySelector('.edit-profile-btn').onclick = () => {
        this.openProfileEditor();
        this.close(modal);
      };
    }

    return modal;
  }

  static close(modal) {
    modal.classList.add('opacity-0');
    modal.querySelector('.modal-content').classList.add('scale-95');
    
    setTimeout(() => {
      if (modal.parentNode) {
        modal.parentNode.removeChild(modal);
      }
    }, 200);
  }

  static mentionUser(username) {
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
      const currentValue = messageInput.value;
      const mention = `@${username} `;
      
      if (!currentValue.includes(mention)) {
        messageInput.value = currentValue + mention;
        messageInput.focus();
      }
    }
  }

  static openProfileEditor() {
    eventBus.emit('openProfileEditor');
  }

  static formatJoinTime(joinedAt) {
    const now = new Date();
    const joined = new Date(joinedAt);
    const diffMs = now - joined;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return joined.toLocaleDateString();
  }
}
