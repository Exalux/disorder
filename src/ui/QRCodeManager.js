// QR Code functionality
import { stateManager } from '../core/StateManager.js';
import { peerManager } from '../core/PeerManager.js';
import { NotificationManager } from './NotificationManager.js';

export class QRCodeManager {
  static async showQRCode() {
    const { default: QRCode } = await import('https://cdn.skypack.dev/qrcode');
    
    const peerId = stateManager.getStateValue('user.id');
    const inviteUrl = `${window.location.origin}?id=${peerId}`;
    
    const modal = this.createQRModal();
    document.body.appendChild(modal);
    
    try {
      const canvas = await QRCode.toCanvas(inviteUrl, { 
        width: 200, 
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      const container = modal.querySelector('#qr-container');
      container.appendChild(canvas);
    } catch (error) {
      console.error('QR Code generation failed:', error);
      NotificationManager.showError('Failed to generate QR code');
      modal.remove();
    }
  }

  static createQRModal() {
    const peerId = stateManager.getStateValue('user.id');
    const inviteUrl = `${window.location.origin}?id=${peerId}`;
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-[#36393f] rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-semibold">Share Invite</h3>
          <button class="close-btn text-gray-400 hover:text-white text-xl transition-colors">&times;</button>
        </div>
        <div class="text-center">
          <div id="qr-container" class="bg-white p-4 rounded-lg mb-4 flex justify-center items-center min-h-[200px]">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5865f2]"></div>
          </div>
          <p class="text-gray-300 text-sm mb-3">Scan QR code to join</p>
          <div class="space-y-2">
            <button class="copy-invite-btn w-full bg-[#5865f2] hover:bg-[#4752c4] text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              <i class="fas fa-copy mr-2"></i>Copy Invite Link
            </button>
            <button class="copy-peer-id-btn w-full bg-[#2f3136] hover:bg-[#40444b] text-white py-2 px-4 rounded text-sm font-medium transition-colors">
              <i class="fas fa-id-card mr-2"></i>Copy Peer ID
            </button>
          </div>
        </div>
      </div>
    `;

    // Event listeners
    modal.querySelector('.close-btn').onclick = () => modal.remove();
    
    modal.querySelector('.copy-invite-btn').onclick = () => {
      navigator.clipboard.writeText(inviteUrl);
      NotificationManager.showSuccess('Invite link copied!');
    };
    
    modal.querySelector('.copy-peer-id-btn').onclick = () => {
      navigator.clipboard.writeText(peerId);
      NotificationManager.showSuccess('Peer ID copied!');
    };

    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    return modal;
  }

  static async showQRScanner() {
    const { default: jsQR } = await import('https://cdn.skypack.dev/jsqr');
    
    const modal = this.createScannerModal();
    document.body.appendChild(modal);
    
    const video = modal.querySelector('#qr-video');
    const canvas = modal.querySelector('#qr-canvas');
    const context = canvas.getContext('2d');
    
    let videoStream = null;
    let scanning = true;
    
    try {
      videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      video.srcObject = videoStream;
      video.play();
      
      const scanQRCode = () => {
        if (!scanning) return;
        
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          
          if (code) {
            try {
              const url = new URL(code.data);
              const peerId = url.searchParams.get('id');
              if (peerId) {
                this.connectToPeer(peerId);
                this.closeScannerModal(modal, videoStream);
                return;
              }
            } catch (error) {
              // Invalid URL, continue scanning
            }
          }
        }
        
        requestAnimationFrame(scanQRCode);
      };
      
      scanQRCode();
      
    } catch (error) {
      console.error('Camera access denied:', error);
      NotificationManager.showError('Camera access required for QR scanning');
      modal.remove();
    }
    
    // Setup close handlers
    modal.querySelector('.close-scanner').onclick = () => {
      this.closeScannerModal(modal, videoStream);
    };
    
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeScannerModal(modal, videoStream);
      }
    };
    
    // Cleanup function
    modal._cleanup = () => {
      scanning = false;
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
    };
  }

  static createScannerModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
    modal.innerHTML = `
      <div class="bg-[#36393f] rounded-lg p-6 max-w-sm w-full mx-4">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-white text-lg font-semibold">Scan QR Code</h3>
          <button class="close-scanner text-gray-400 hover:text-white text-xl transition-colors">&times;</button>
        </div>
        <div class="text-center">
          <div class="relative">
            <video id="qr-video" class="w-full rounded-lg mb-4 bg-black" autoplay muted playsinline></video>
            <div class="absolute inset-0 border-2 border-[#5865f2] rounded-lg pointer-events-none">
              <div class="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#5865f2]"></div>
              <div class="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#5865f2]"></div>
              <div class="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#5865f2]"></div>
              <div class="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#5865f2]"></div>
            </div>
          </div>
          <canvas id="qr-canvas" class="hidden"></canvas>
          <p class="text-gray-300 text-sm mb-3">Point camera at QR code</p>
          <button class="close-scanner w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm font-medium transition-colors">
            <i class="fas fa-stop mr-2"></i>Stop Scanner
          </button>
        </div>
      </div>
    `;
    
    return modal;
  }

  static async connectToPeer(peerId) {
    const success = await peerManager.connectToPeer(peerId);
    if (success) {
      NotificationManager.showSuccess(`Connecting to ${peerId}...`);
    } else {
      NotificationManager.showError(`Failed to connect to ${peerId}`);
    }
  }

  static closeScannerModal(modal, videoStream) {
    if (modal._cleanup) {
      modal._cleanup();
    }
    
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    
    modal.remove();
  }
}