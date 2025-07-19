// Centralized state management
import { eventBus } from './EventBus.js';

class StateManager {
  constructor() {
    this.state = {
      user: {
        id: null,
        username: `Stranger #${Math.floor(1000 + Math.random() * 9000)}`,
        avatar: '/asset/img/favicon.png',
        status: 'online',
        customStatus: null
      },
      peers: {},
      connections: {},
      mediaConnections: {},
      currentChannel: 'general',
      voiceChannel: {
        active: false,
        users: {},
        localStream: null,
        micEnabled: true,
        videoEnabled: false,
        screenSharing: false
      },
      ui: {
        sidebarCollapsed: false,
        memberListVisible: true,
        currentModal: null,
        replyingTo: null,
        typingUsers: new Set()
      },
      messages: [],
      notifications: {
        enabled: true,
        sound: true,
        desktop: false
      }
    };
  }

  getState() {
    return this.state;
  }

  setState(path, value) {
    const keys = path.split('.');
    let current = this.state;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    eventBus.emit('stateChange', { path, value });
  }

  getStateValue(path) {
    const keys = path.split('.');
    let current = this.state;
    
    for (const key of keys) {
      if (current[key] === undefined) return undefined;
      current = current[key];
    }
    
    return current;
  }

  addPeer(peerId, peerData) {
    this.state.peers[peerId] = {
      id: peerId,
      username: peerData.username || peerId,
      avatar: peerData.avatar || '/asset/img/favicon.png',
      status: 'online',
      joinedAt: new Date(),
      messageCount: 0,
      fileCount: 0,
      ...peerData
    };
    eventBus.emit('peerAdded', { peerId, peer: this.state.peers[peerId] });
  }

  removePeer(peerId) {
    if (this.state.peers[peerId]) {
      this.state.peers[peerId].status = 'offline';
      eventBus.emit('peerRemoved', { peerId });
    }
  }

  addMessage(message) {
    this.state.messages.push({
      id: Date.now() + Math.random(),
      timestamp: new Date(),
      ...message
    });
    eventBus.emit('messageAdded', message);
  }
}

export const stateManager = new StateManager();
