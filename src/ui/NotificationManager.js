// Enhanced notification system
export class NotificationManager {
  static notifications = [];
  static container = null;

  static init() {
    this.container = document.createElement('div');
    this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
    document.body.appendChild(this.container);
  }

  static show(message, type = 'info', duration = 5000) {
    const notification = this.createNotification(message, type);
    this.container.appendChild(notification);
    this.notifications.push(notification);

    // Animate in
    requestAnimationFrame(() => {
      notification.classList.add('translate-x-0', 'opacity-100');
    });

    // Auto remove
    if (duration > 0) {
      setTimeout(() => {
        this.remove(notification);
      }, duration);
    }

    return notification;
  }

  static createNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `transform translate-x-full opacity-0 transition-all duration-300 ease-out max-w-sm w-full bg-[#36393f] border-l-4 rounded-lg shadow-lg p-4 ${this.getTypeStyles(type)}`;
    
    const icon = this.getTypeIcon(type);
    
    notification.innerHTML = `
      <div class="flex items-start">
        <div class="flex-shrink-0">
          <i class="${icon} text-lg"></i>
        </div>
        <div class="ml-3 flex-1">
          <div class="text-sm font-medium text-white">
            ${message}
          </div>
        </div>
        <div class="ml-4 flex-shrink-0">
          <button class="text-[#72767d] hover:text-white transition-colors">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;

    // Add close functionality
    notification.querySelector('button').onclick = () => {
      this.remove(notification);
    };

    return notification;
  }

  static getTypeStyles(type) {
    const styles = {
      success: 'border-green-500',
      error: 'border-red-500',
      warning: 'border-yellow-500',
      info: 'border-blue-500'
    };
    return styles[type] || styles.info;
  }

  static getTypeIcon(type) {
    const icons = {
      success: 'fas fa-check-circle text-green-400',
      error: 'fas fa-exclamation-circle text-red-400',
      warning: 'fas fa-exclamation-triangle text-yellow-400',
      info: 'fas fa-info-circle text-blue-400'
    };
    return icons[type] || icons.info;
  }

  static remove(notification) {
    notification.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      this.notifications = this.notifications.filter(n => n !== notification);
    }, 300);
  }

  static showSuccess(message, duration = 3000) {
    return this.show(message, 'success', duration);
  }

  static showError(message, duration = 5000) {
    return this.show(message, 'error', duration);
  }

  static showWarning(message, duration = 4000) {
    return this.show(message, 'warning', duration);
  }

  static showInfo(message, duration = 3000) {
    return this.show(message, 'info', duration);
  }

  static showMention(message) {
    const notification = this.show(
      `${message.author.username} mentioned you in #general`,
      'info',
      0
    );
    
    notification.classList.add('cursor-pointer');
    notification.onclick = () => {
      // Scroll to message
      const messageElement = document.querySelector(`[data-message-id="${message.id}"]`);
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        messageElement.classList.add('highlight-flash');
        setTimeout(() => {
          messageElement.classList.remove('highlight-flash');
        }, 2000);
      }
      this.remove(notification);
    };

    // Play notification sound
    this.playNotificationSound();
    
    // Request desktop notification permission
    if (Notification.permission === 'granted') {
      new Notification(`${message.author.username} mentioned you`, {
        body: message.content.slice(0, 100),
        icon: message.author.avatar,
        tag: 'mention'
      });
    }
  }

  static playNotificationSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.warn('Audio notification not supported:', error);
    }
  }

  static requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  static clear() {
    this.notifications.forEach(notification => {
      this.remove(notification);
    });
  }
}
