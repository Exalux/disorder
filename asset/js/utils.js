// /asset/js/utils.js
import { peer, chatBox, copyPeerIdBtn } from "./globals.js";

export function showToast(message) {
  const toast = document.createElement("div");
  toast.innerHTML = message;
  toast.className =
    "fixed bottom-20 md:bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in border border-green-400";
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

export function appendSystemMessage(msg) {
  const div = document.createElement("div");
  div.className = "text-center text-gray-400 text-sm my-2 px-4 py-1 bg-[#2b2d31] bg-opacity-50 rounded-full mx-auto max-w-fit";
  div.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${msg}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

copyPeerIdBtn.addEventListener("click", () => {
  const peerId = peer.id;
  navigator.clipboard
    .writeText(peerId)
    .then(() => {
      showToast("Peer ID copied! <i class='fas fa-check text-green-400 ml-1'></i>");
    })
    .catch((err) => console.error("Failed to copy: ", err));
});

document.getElementById("copy-invite-btn").onclick = () => {
  const id = peer.id;
  if (id) {
    const url = `${window.location.origin}?id=${id}`;
    navigator.clipboard.writeText(url);
    showToast("Invite link copied <i class='fas fa-link text-blue-400 ml-1'></i>");
  }
};
