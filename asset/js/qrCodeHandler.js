// /public/asset/js/qrCodeHandler.js
import QRCode from 'https://cdn.skypack.dev/qrcode';
import jsQR from 'https://cdn.skypack.dev/jsqr';
import { peer } from "./globals.js";
import { showToast } from "./utils.js";

let qrModal = null;
let scannerModal = null;
let videoStream = null;

export function showQRCode() {
  if (qrModal) {
    qrModal.remove();
  }

  const peerId = peer.id;
  const inviteUrl = `${window.location.origin}?id=${peerId}`;

  qrModal = document.createElement('div');
  qrModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
  qrModal.innerHTML = `
    <div class="bg-[#2b2d31] rounded-lg p-6 max-w-sm w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-white text-lg font-semibold">Share Invite</h3>
        <button id="close-qr" class="text-gray-400 hover:text-white text-xl">&times;</button>
      </div>
      <div class="text-center">
        <div id="qr-container" class="bg-white p-4 rounded-lg mb-4 flex justify-center"></div>
        <p class="text-gray-300 text-sm mb-3">Scan QR code to join</p>
        <div class="space-y-2">
          <button id="copy-invite-qr" class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded text-sm">
            <i class="fas fa-copy mr-2"></i>Copy Invite Link
          </button>
          <button id="copy-peer-id-qr" class="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded text-sm">
            <i class="fas fa-id-card mr-2"></i>Copy Peer ID
          </button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(qrModal);

  // Generate QR code
  QRCode.toCanvas(inviteUrl, { width: 200, margin: 1 }, (error, canvas) => {
    if (error) {
      console.error('QR Code generation failed:', error);
      return;
    }
    document.getElementById('qr-container').appendChild(canvas);
  });

  // Event listeners
  document.getElementById('close-qr').onclick = closeQRModal;
  document.getElementById('copy-invite-qr').onclick = () => {
    navigator.clipboard.writeText(inviteUrl);
    showToast("Invite link copied! <i class='fas fa-check text-green-400 ml-1'></i>");
  };
  document.getElementById('copy-peer-id-qr').onclick = () => {
    navigator.clipboard.writeText(peerId);
    showToast("Peer ID copied! <i class='fas fa-check text-green-400 ml-1'></i>");
  };

  qrModal.onclick = (e) => {
    if (e.target === qrModal) closeQRModal();
  };
}

export function showQRScanner() {
  if (scannerModal) {
    scannerModal.remove();
  }

  scannerModal = document.createElement('div');
  scannerModal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50';
  scannerModal.innerHTML = `
    <div class="bg-[#2b2d31] rounded-lg p-6 max-w-sm w-full mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-white text-lg font-semibold">Scan QR Code</h3>
        <button id="close-scanner" class="text-gray-400 hover:text-white text-xl">&times;</button>
      </div>
      <div class="text-center">
        <video id="qr-video" class="w-full rounded-lg mb-4" autoplay muted playsinline></video>
        <canvas id="qr-canvas" class="hidden"></canvas>
        <p class="text-gray-300 text-sm mb-3">Point camera at QR code</p>
        <button id="stop-scanner" class="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded text-sm">
          <i class="fas fa-stop mr-2"></i>Stop Scanner
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(scannerModal);

  const video = document.getElementById('qr-video');
  const canvas = document.getElementById('qr-canvas');
  const context = canvas.getContext('2d');

  // Start camera
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      videoStream = stream;
      video.srcObject = stream;
      video.play();
      scanQRCode();
    })
    .catch(err => {
      console.error('Camera access denied:', err);
      showToast("Camera access required for QR scanning");
      closeScannerModal();
    });

  function scanQRCode() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      if (code) {
        const url = new URL(code.data);
        const peerId = url.searchParams.get('id');
        if (peerId) {
          closeScannerModal();
          connectToPeer(peerId);
          return;
        }
      }
    }
    
    if (scannerModal) {
      requestAnimationFrame(scanQRCode);
    }
  }

  // Event listeners
  document.getElementById('close-scanner').onclick = closeScannerModal;
  document.getElementById('stop-scanner').onclick = closeScannerModal;
  scannerModal.onclick = (e) => {
    if (e.target === scannerModal) closeScannerModal();
  };
}

function connectToPeer(peerId) {
  const conn = peer.connect(peerId);
  import('./messaging.js').then(({ setupConnection }) => {
    setupConnection(conn);
  });
  showToast(`Connecting to ${peerId}...`);
}

function closeQRModal() {
  if (qrModal) {
    qrModal.remove();
    qrModal = null;
  }
}

function closeScannerModal() {
  if (videoStream) {
    videoStream.getTracks().forEach(track => track.stop());
    videoStream = null;
  }
  if (scannerModal) {
    scannerModal.remove();
    scannerModal = null;
  }
}