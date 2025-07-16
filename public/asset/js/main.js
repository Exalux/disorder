// /asset/js/main.js
import "./peerConnection.js";
import "./messaging.js";
import "./fileHandling.js";
import "./uiUpdates.js";
import "./profileManagement.js";
import "./emojiHandling.js";
import "./voiceVideoChat.js";
import "./utils.js";
import "./qrCodeHandler.js";
import { initializeMobileHandlers } from "./mobileHandler.js";

// Initialize mobile handlers when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  initializeMobileHandlers();
});
// Expose profile functions to global scope for HTML onclick handlers
window.toggleProfilePanel = () => {
  import("./profileManagement.js").then(({ toggleProfilePanel }) =>
    toggleProfilePanel()
  );
};

window.saveProfile = () => {
  import("./profileManagement.js").then(({ saveProfile }) => saveProfile());
};

window.joinVoiceChannel = () => {
  import("./voiceVideoChat.js").then(({ joinVoiceChannel }) =>
    joinVoiceChannel()
  );
};

window.showQRCode = () => {
  import("./qrCodeHandler.js").then(({ showQRCode }) => showQRCode());
};

window.showQRScanner = () => {
  import("./qrCodeHandler.js").then(({ showQRScanner }) => showQRScanner());
};