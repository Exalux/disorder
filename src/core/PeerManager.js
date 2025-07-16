// Enhanced peer connection management
import { stateManager } from './StateManager.js';
import { eventBus } from './EventBus.js';
import { NotificationManager } from '../ui/NotificationManager.js';

export class PeerManager {
  constructor() {
    this.peer = null;
    this.connections = {};
    this.mediaConnections = {};
    this.reconnectAttempts = {};
    this.maxReconnectAttempts = 3;
    this.heartbeatInterval = 30000; // 30 seconds
    this.heartbeatTimers = {};
  }

  async initialize() {
    try {
      this.peer = new Peer({
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:global.stun.twilio.com:3478' }
          ]
        }
      });

      this.setupPeerEvents();
      return new Promise((resolve, reject) => {
        this.peer.on('open', (id) => {
          stateManager.setState('user.id', id);
          stateManager.addPeer(id, stateManager.getStateValue('user'));
          this.showConnectionAlert();
          resolve(id);
        });

        this.peer.on('error', (error) => {
          console.error('Peer error:', error);
          NotificationManager.showError(`Connection error: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to initialize peer:', error);
      throw error;
    }
  }

  setupPeerEvents() {
    this.peer.on('connection', (conn) => {
      this.handleIncomingConnection(conn);
    });

    this.peer.on('call', (call) => {
      this.handleIncomingCall(call);
    });

    this.peer.on('disconnected', () => {
      NotificationManager.showWarning('Connection lost. Attempting to reconnect...');
      this.attemptReconnect();
    });
  }

  showConnectionAlert() {
    const message = `All messages and content will be gone when all members disconnect. Your peer ID will change if you refresh or leave the chat. EVERYTHING IS LOST WHEN YOU LEAVE.`;
    
    // Create a more Discord-like modal instead of alert
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-[#36393f] rounded-lg p-6 max-w-md mx-4 text-white">
        <div class="flex items-center mb-4">
          <i class="fas fa-exclamation-triangle text-yellow-400 text-xl mr-3"></i>
          <h3 class="text-lg font-semibold">Important Notice</h3>
        </div>
        <p class="text-gray-300 mb-6 leading-relaxed">${message}</p>
        <div class="flex justify-end">
          <button class="bg-[#5865f2] hover:bg-[#4752c4] px-4 py-2 rounded font-medium transition-colors">
            I Understand
          </button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    modal.querySelector('button').onclick = () => modal.remove();
  }

  async connectToPeer(peerId) {
    if (this.connections[peerId] || peerId === this.peer.id) {
      return false;
    }

    try {
      const conn = this.peer.connect(peerId, {
        metadata: {
          username: stateManager.getStateValue('user.username'),
          avatar: stateManager.getStateValue('user.avatar')
        }
      });

      this.handleOutgoingConnection(conn);
      return true;
    } catch (error) {
      console.error('Failed to connect to peer:', error);
      NotificationManager.showError(`Failed to connect to ${peerId}`);
      return false;
    }
  }

  handleIncomingConnection(conn) {
    this.setupConnection(conn);
    NotificationManager.showSuccess(`${conn.metadata?.username || conn.peer} joined the server`);
  }

  handleOutgoingConnection(conn) {
    this.setupConnection(conn);
  }

  setupConnection(conn) {
    this.connections[conn.peer] = conn;
    
    conn.on('open', () => {
      this.onConnectionOpen(conn);
    });

    conn.on('data', (data) => {
      this.handleIncomingData(conn, data);
    });

    conn.on('close', () => {
      this.onConnectionClose(conn);
    });

    conn.on('error', (error) => {
      console.error('Connection error:', error);
      this.handleConnectionError(conn, error);
    });
  }

  onConnectionOpen(conn) {
    const userData = stateManager.getStateValue('user');
    stateManager.addPeer(conn.peer, conn.metadata || {});
    
    // Send initial profile data
    this.sendToPeer(conn.peer, {
      type: 'profile',
      user: userData
    });

    // Start heartbeat
    this.startHeartbeat(conn.peer);
    
    eventBus.emit('peerConnected', { peerId: conn.peer });
  }

  onConnectionClose(conn) {
    stateManager.removePeer(conn.peer);
    delete this.connections[conn.peer];
    
    if (this.heartbeatTimers[conn.peer]) {
      clearInterval(this.heartbeatTimers[conn.peer]);
      delete this.heartbeatTimers[conn.peer];
    }

    NotificationManager.showInfo(`${conn.metadata?.username || conn.peer} left the server`);
    eventBus.emit('peerDisconnected', { peerId: conn.peer });
  }

  handleConnectionError(conn, error) {
    console.error(`Connection error with ${conn.peer}:`, error);
    this.attemptReconnect(conn.peer);
  }

  handleIncomingData(conn, data) {
    switch (data.type) {
      case 'message':
        this.handleMessage(conn, data);
        break;
      case 'file':
        this.handleFile(conn, data);
        break;
      case 'profile':
        this.handleProfileUpdate(conn, data);
        break;
      case 'typing':
        this.handleTyping(conn, data);
        break;
      case 'heartbeat':
        this.handleHeartbeat(conn, data);
        break;
      case 'voice_state':
        this.handleVoiceState(conn, data);
        break;
      default:
        console.warn('Unknown data type:', data.type);
    }
  }

  handleMessage(conn, data) {
    const message = {
      id: data.id || Date.now(),
      content: data.content,
      author: {
        id: conn.peer,
        username: stateManager.getStateValue(`peers.${conn.peer}.username`) || conn.peer,
        avatar: stateManager.getStateValue(`peers.${conn.peer}.avatar`)
      },
      timestamp: new Date(data.timestamp),
      replyTo: data.replyTo,
      mentions: data.mentions || []
    };

    stateManager.addMessage(message);
    
    // Update peer message count
    const peer = stateManager.getStateValue(`peers.${conn.peer}`);
    if (peer) {
      peer.messageCount++;
    }

    // Check for mentions
    const currentUser = stateManager.getStateValue('user');
    if (data.mentions && data.mentions.includes(currentUser.username)) {
      NotificationManager.showMention(message);
    }
  }

  handleFile(conn, data) {
    const message = {
      id: data.id || Date.now(),
      content: '',
      author: {
        id: conn.peer,
        username: stateManager.getStateValue(`peers.${conn.peer}.username`) || conn.peer,
        avatar: stateManager.getStateValue(`peers.${conn.peer}.avatar`)
      },
      timestamp: new Date(data.timestamp),
      attachments: [{
        filename: data.filename,
        size: data.size,
        type: data.fileType,
        data: data.fileData
      }]
    };

    stateManager.addMessage(message);
    
    // Update peer file count
    const peer = stateManager.getStateValue(`peers.${conn.peer}`);
    if (peer) {
      peer.fileCount++;
    }
  }

  handleProfileUpdate(conn, data) {
    stateManager.addPeer(conn.peer, data.user);
  }

  handleTyping(conn, data) {
    const typingUsers = stateManager.getStateValue('ui.typingUsers');
    
    if (data.isTyping) {
      typingUsers.add(conn.peer);
    } else {
      typingUsers.delete(conn.peer);
    }
    
    eventBus.emit('typingUpdate', { peerId: conn.peer, isTyping: data.isTyping });
  }

  handleHeartbeat(conn, data) {
    // Respond to heartbeat
    this.sendToPeer(conn.peer, {
      type: 'heartbeat_response',
      timestamp: Date.now()
    });
  }

  handleVoiceState(conn, data) {
    eventBus.emit('voiceStateUpdate', {
      peerId: conn.peer,
      state: data.state
    });
  }

  sendToPeer(peerId, data) {
    const conn = this.connections[peerId];
    if (conn && conn.open) {
      try {
        conn.send(data);
        return true;
      } catch (error) {
        console.error('Failed to send data to peer:', error);
        return false;
      }
    }
    return false;
  }

  broadcast(data) {
    const results = {};
    Object.keys(this.connections).forEach(peerId => {
      results[peerId] = this.sendToPeer(peerId, data);
    });
    return results;
  }

  startHeartbeat(peerId) {
    this.heartbeatTimers[peerId] = setInterval(() => {
      this.sendToPeer(peerId, {
        type: 'heartbeat',
        timestamp: Date.now()
      });
    }, this.heartbeatInterval);
  }

  attemptReconnect(peerId = null) {
    if (peerId) {
      // Reconnect to specific peer
      const attempts = this.reconnectAttempts[peerId] || 0;
      if (attempts < this.maxReconnectAttempts) {
        this.reconnectAttempts[peerId] = attempts + 1;
        setTimeout(() => {
          this.connectToPeer(peerId);
        }, 1000 * Math.pow(2, attempts)); // Exponential backoff
      }
    } else {
      // Reconnect peer instance
      if (!this.peer.destroyed) {
        this.peer.reconnect();
      }
    }
  }

  destroy() {
    Object.values(this.heartbeatTimers).forEach(timer => clearInterval(timer));
    Object.values(this.connections).forEach(conn => conn.close());
    Object.values(this.mediaConnections).forEach(call => call.close());
    
    if (this.peer && !this.peer.destroyed) {
      this.peer.destroy();
    }
  }
}

export const peerManager = new PeerManager();
