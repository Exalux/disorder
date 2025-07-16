// Enhanced voice and video management
import { stateManager } from '../core/StateManager.js';
import { eventBus } from '../core/EventBus.js';
import { peerManager } from '../core/PeerManager.js';
import { NotificationManager } from './NotificationManager.js';

export class VoiceManager {
  constructor() {
    this.localStream = null;
    this.localVideoStream = null;
    this.localScreenStream = null;
    this.mediaConnections = {};
    this.audioContext = null;
    this.analyser = null;
    this.isInVoiceChannel = false;
    this.voiceActivityThreshold = 30;
    this.setupEventListeners();
  }

  setupEventListeners() {
    eventBus.on('peerConnected', ({ peerId }) => {
      if (this.isInVoiceChannel && this.localStream) {
        this.callPeer(peerId);
      }
    });

    eventBus.on('peerDisconnected', ({ peerId }) => {
      this.handlePeerDisconnected(peerId);
    });
  }

  async joinVoiceChannel() {
    if (this.isInVoiceChannel) return;

    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        },
        video: false
      });

      this.isInVoiceChannel = true;
      this.setupAudioVisualization();
      this.updateVoiceState();
      
      // Call all connected peers
      Object.keys(peerManager.connections).forEach(peerId => {
        this.callPeer(peerId);
      });

      // Update UI
      this.showVoiceControls();
      this.addUserToVoiceChannel(stateManager.getStateValue('user.id'));
      
      NotificationManager.showSuccess('Joined voice channel');
      
    } catch (error) {
      console.error('Failed to join voice channel:', error);
      NotificationManager.showError('Failed to access microphone');
    }
  }

  async leaveVoiceChannel() {
    if (!this.isInVoiceChannel) return;

    this.isInVoiceChannel = false;
    
    // Stop all streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    if (this.localVideoStream) {
      this.localVideoStream.getTracks().forEach(track => track.stop());
      this.localVideoStream = null;
    }
    
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;
    }

    // Close all media connections
    Object.values(this.mediaConnections).forEach(call => {
      call.close();
    });
    this.mediaConnections = {};

    // Clean up audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Update state
    stateManager.setState('voiceChannel.active', false);
    stateManager.setState('voiceChannel.users', {});
    
    // Update UI
    this.hideVoiceControls();
    this.clearVoiceUsers();
    this.updateVoiceState();
    
    NotificationManager.showInfo('Left voice channel');
  }

  callPeer(peerId) {
    if (!this.localStream || this.mediaConnections[peerId]) return;

    const call = peerManager.peer.call(peerId, this.localStream, {
      metadata: {
        username: stateManager.getStateValue('user.username'),
        avatar: stateManager.getStateValue('user.avatar')
      }
    });

    this.setupMediaConnection(call);
  }

  setupMediaConnection(call) {
    this.mediaConnections[call.peer] = call;

    call.on('stream', (remoteStream) => {
      this.handleRemoteStream(call.peer, remoteStream);
    });

    call.on('close', () => {
      this.handleCallClosed(call.peer);
    });

    call.on('error', (error) => {
      console.error('Media connection error:', error);
      this.handleCallClosed(call.peer);
    });
  }

  handleIncomingCall(call) {
    if (!this.isInVoiceChannel || !this.localStream) {
      call.close();
      return;
    }

    call.answer(this.localStream);
    this.setupMediaConnection(call);
  }

  handleRemoteStream(peerId, stream) {
    // Create audio element for remote stream
    const audio = document.createElement('audio');
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.id = `audio-${peerId}`;
    document.body.appendChild(audio);

    // Add user to voice channel UI
    this.addUserToVoiceChannel(peerId);
    
    // Setup remote audio visualization
    this.setupRemoteAudioVisualization(peerId, stream);
  }

  handleCallClosed(peerId) {
    delete this.mediaConnections[peerId];
    
    // Remove audio element
    const audio = document.getElementById(`audio-${peerId}`);
    if (audio) {
      audio.remove();
    }
    
    // Remove from voice channel UI
    this.removeUserFromVoiceChannel(peerId);
  }

  handlePeerDisconnected(peerId) {
    this.handleCallClosed(peerId);
  }

  setupAudioVisualization() {
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      const source = this.audioContext.createMediaStreamSource(this.localStream);
      source.connect(this.analyser);
      
      this.analyser.fftSize = 256;
      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const animate = () => {
        if (!this.isInVoiceChannel) return;
        
        this.analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        this.updateVoiceActivity(stateManager.getStateValue('user.id'), average);
        requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.warn('Audio visualization not supported:', error);
    }
  }

  setupRemoteAudioVisualization(peerId, stream) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const animate = () => {
        const userElement = document.getElementById(`voice-user-${peerId}`);
        if (!userElement) return;
        
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        
        this.updateVoiceActivity(peerId, average);
        requestAnimationFrame(animate);
      };
      
      animate();
    } catch (error) {
      console.warn('Remote audio visualization not supported:', error);
    }
  }

  updateVoiceActivity(userId, level) {
    const userElement = document.getElementById(`voice-user-${userId}`);
    if (!userElement) return;
    
    const avatar = userElement.querySelector('img');
    if (!avatar) return;
    
    if (level > this.voiceActivityThreshold) {
      const intensity = Math.min(level / 5, 20);
      avatar.style.boxShadow = `0 0 ${intensity}px rgba(88, 101, 242, 0.8)`;
      userElement.classList.add('speaking');
    } else {
      avatar.style.boxShadow = 'none';
      userElement.classList.remove('speaking');
    }
  }

  async toggleMicrophone() {
    if (!this.localStream) return;
    
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      stateManager.setState('voiceChannel.micEnabled', audioTrack.enabled);
      this.updateMicButton();
      this.updateVoiceState();
    }
  }

  async toggleCamera() {
    const videoEnabled = stateManager.getStateValue('voiceChannel.videoEnabled');
    
    if (!videoEnabled) {
      try {
        this.localVideoStream = await navigator.mediaDevices.getUserMedia({ 
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 }
          } 
        });
        
        this.replaceVideoTrack(this.localVideoStream.getVideoTracks()[0]);
        stateManager.setState('voiceChannel.videoEnabled', true);
        this.updateCameraButton();
        
      } catch (error) {
        console.error('Failed to access camera:', error);
        NotificationManager.showError('Failed to access camera');
      }
    } else {
      if (this.localVideoStream) {
        this.localVideoStream.getTracks().forEach(track => track.stop());
        this.localVideoStream = null;
      }
      
      this.replaceVideoTrack(null);
      stateManager.setState('voiceChannel.videoEnabled', false);
      this.updateCameraButton();
    }
    
    this.updateVoiceState();
  }

  async toggleScreenShare() {
    const screenSharing = stateManager.getStateValue('voiceChannel.screenSharing');
    
    if (!screenSharing) {
      try {
        this.localScreenStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor'
          },
          audio: true
        });
        
        this.replaceVideoTrack(this.localScreenStream.getVideoTracks()[0]);
        stateManager.setState('voiceChannel.screenSharing', true);
        this.updateScreenShareButton();
        
        // Handle screen share end
        this.localScreenStream.getVideoTracks()[0].onended = () => {
          this.stopScreenShare();
        };
        
      } catch (error) {
        console.error('Screen share failed:', error);
        NotificationManager.showError('Screen share denied or failed');
      }
    } else {
      this.stopScreenShare();
    }
  }

  stopScreenShare() {
    if (this.localScreenStream) {
      this.localScreenStream.getTracks().forEach(track => track.stop());
      this.localScreenStream = null;
    }
    
    this.replaceVideoTrack(null);
    stateManager.setState('voiceChannel.screenSharing', false);
    this.updateScreenShareButton();
    this.updateVoiceState();
  }

  replaceVideoTrack(newTrack) {
    Object.values(this.mediaConnections).forEach(call => {
      const sender = call.peerConnection
        .getSenders()
        .find(s => s.track && s.track.kind === 'video');
      
      if (sender) {
        sender.replaceTrack(newTrack);
      } else if (newTrack) {
        call.peerConnection.addTrack(newTrack, this.localStream);
      }
    });
  }

  updateVoiceState() {
    const state = {
      inVoice: this.isInVoiceChannel,
      micEnabled: stateManager.getStateValue('voiceChannel.micEnabled'),
      videoEnabled: stateManager.getStateValue('voiceChannel.videoEnabled'),
      screenSharing: stateManager.getStateValue('voiceChannel.screenSharing')
    };
    
    peerManager.broadcast({
      type: 'voice_state',
      state
    });
  }

  showVoiceControls() {
    const controls = document.getElementById('media-control-dock');
    if (controls) {
      controls.classList.remove('hidden');
    }
    
    const voicePanel = document.getElementById('voice-top-panel');
    if (voicePanel) {
      voicePanel.classList.remove('hidden');
    }
    
    const voiceChannel = document.getElementById('voice-channel');
    if (voiceChannel) {
      voiceChannel.classList.add('bg-[#404249]');
    }
  }

  hideVoiceControls() {
    const controls = document.getElementById('media-control-dock');
    if (controls) {
      controls.classList.add('hidden');
    }
    
    const voicePanel = document.getElementById('voice-top-panel');
    if (voicePanel) {
      voicePanel.classList.add('hidden');
    }
    
    const voiceChannel = document.getElementById('voice-channel');
    if (voiceChannel) {
      voiceChannel.classList.remove('bg-[#404249]');
    }
  }

  addUserToVoiceChannel(userId) {
    const user = stateManager.getStateValue(`peers.${userId}`) || stateManager.getStateValue('user');
    if (!user) return;
    
    const voiceUsers = document.getElementById('voice-users');
    if (!voiceUsers || document.getElementById(`voice-user-${userId}`)) return;
    
    const userElement = document.createElement('div');
    userElement.id = `voice-user-${userId}`;
    userElement.className = 'voice-user flex items-center gap-2 px-2 py-1 rounded hover:bg-[#3c3f45] transition-colors';
    
    userElement.innerHTML = `
      <div class="relative">
        <img src="${user.avatar}" alt="${user.username}" class="w-6 h-6 rounded-full transition-all duration-200">
        <div class="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2b2d31]"></div>
      </div>
      <span class="text-sm text-gray-300 flex-1">${user.username}</span>
      ${userId === stateManager.getStateValue('user.id') ? '<i class="fas fa-microphone text-xs text-gray-400"></i>' : ''}
    `;
    
    voiceUsers.appendChild(userElement);
    
    // Update mobile voice users
    const mobileVoiceUsers = document.getElementById('mobile-voice-users');
    if (mobileVoiceUsers) {
      mobileVoiceUsers.appendChild(userElement.cloneNode(true));
    }
  }

  removeUserFromVoiceChannel(userId) {
    const userElement = document.getElementById(`voice-user-${userId}`);
    if (userElement) {
      userElement.remove();
    }
    
    const mobileUserElement = document.querySelector(`#mobile-voice-users #voice-user-${userId}`);
    if (mobileUserElement) {
      mobileUserElement.remove();
    }
  }

  clearVoiceUsers() {
    const voiceUsers = document.getElementById('voice-users');
    if (voiceUsers) {
      voiceUsers.innerHTML = '';
    }
    
    const mobileVoiceUsers = document.getElementById('mobile-voice-users');
    if (mobileVoiceUsers) {
      mobileVoiceUsers.innerHTML = '';
    }
  }

  updateMicButton() {
    const micEnabled = stateManager.getStateValue('voiceChannel.micEnabled');
    const micBtn = document.getElementById('toggle-mic');
    
    if (micBtn) {
      micBtn.innerHTML = micEnabled
        ? '<i class="fas fa-microphone"></i>'
        : '<i class="fas fa-microphone-slash text-red-400"></i>';
      
      micBtn.className = micEnabled 
        ? "hover:text-red-500 p-2 rounded transition-colors" 
        : "text-red-400 hover:text-red-300 p-2 rounded transition-colors bg-red-600 bg-opacity-20";
    }
    
    // Update local user mic status
    const localUser = document.getElementById(`voice-user-${stateManager.getStateValue('user.id')}`);
    const micIcon = localUser?.querySelector('.fa-microphone, .fa-microphone-slash');
    if (micIcon) {
      micIcon.className = micEnabled 
        ? 'fas fa-microphone text-xs text-gray-400'
        : 'fas fa-microphone-slash text-xs text-red-400';
    }
  }

  updateCameraButton() {
    const videoEnabled = stateManager.getStateValue('voiceChannel.videoEnabled');
    const camBtn = document.getElementById('toggle-cam');
    
    if (camBtn) {
      camBtn.innerHTML = videoEnabled
        ? '<i class="fas fa-video"></i>'
        : '<i class="fas fa-video-slash text-red-400"></i>';
      
      camBtn.className = videoEnabled 
        ? "hover:text-red-500 p-2 rounded transition-colors" 
        : "text-red-400 hover:text-red-300 p-2 rounded transition-colors bg-red-600 bg-opacity-20";
    }
  }

  updateScreenShareButton() {
    const screenSharing = stateManager.getStateValue('voiceChannel.screenSharing');
    const screenBtn = document.getElementById('share-screen');
    
    if (screenBtn) {
      screenBtn.innerHTML = screenSharing
        ? '<i class="fas fa-desktop text-yellow-400"></i>'
        : '<i class="fas fa-desktop"></i>';
      
      screenBtn.className = screenSharing 
        ? "text-yellow-400 hover:text-yellow-300 p-2 rounded transition-colors bg-yellow-600 bg-opacity-20"
        : "hover:text-yellow-400 p-2 rounded transition-colors";
    }
  }
}

export const voiceManager = new VoiceManager();
