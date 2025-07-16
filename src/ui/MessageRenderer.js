// Enhanced message rendering with Discord-like features
import { stateManager } from "../core/StateManager.js"
import { eventBus } from "../core/EventBus.js"
import { EmojiManager } from "./EmojiManager.js"

export class MessageRenderer {
  constructor(container) {
    this.container = container
    this.messageCache = new Map()
    this.observer = null
    this.setupIntersectionObserver()
  }

  setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId
            // Mark message as read
            eventBus.emit("messageRead", { messageId })
          }
        })
      },
      { threshold: 0.5 },
    )
  }

  renderMessage(message) {
    if (this.messageCache.has(message.id)) {
      return this.messageCache.get(message.id)
    }

    const messageElement = this.createMessageElement(message)
    this.messageCache.set(message.id, messageElement)
    this.observer.observe(messageElement)

    return messageElement
  }

  createMessageElement(message) {
    const container = document.createElement("div")
    container.className = "message-container group relative hover:bg-[#32353b] px-4 py-1 mx-2 rounded"
    container.dataset.messageId = message.id
    container.dataset.authorId = message.author.id

    // Check if this message should be grouped with the previous one
    const shouldGroup = this.shouldGroupMessage(message)

    if (shouldGroup) {
      container.classList.add("grouped-message")
      container.innerHTML = this.createGroupedMessageContent(message)
    } else {
      container.innerHTML = this.createFullMessageContent(message)
    }

    // Add message actions
    this.addMessageActions(container, message)

    // Add mention highlighting
    if (this.isMentioned(message)) {
      container.classList.add("mentioned-message")
    }

    return container
  }

  createFullMessageContent(message) {
    const timestamp = this.formatTimestamp(message.timestamp)
    const replyContent = message.replyTo ? this.createReplyContent(message.replyTo) : ""
    const attachmentContent = message.attachments ? this.createAttachmentContent(message.attachments) : ""
    const embedContent = message.embeds ? this.createEmbedContent(message.embeds) : ""

    return `
      ${replyContent}
      <div class="flex items-start gap-3">
        <img src="${message.author.avatar}" 
             alt="${message.author.username}" 
             class="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
             data-user-id="${message.author.id}">
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2 mb-1">
            <span class="font-semibold text-white hover:underline cursor-pointer" 
                  data-user-id="${message.author.id}">
              ${message.author.username}
            </span>
            <span class="text-xs text-[#72767d] hover:text-[#dcddde] cursor-default">
              ${timestamp}
            </span>
          </div>
          <div class="text-[#dcddde] leading-relaxed">
            ${this.processMessageContent(message.content)}
          </div>
          ${attachmentContent}
          ${embedContent}
        </div>
      </div>
    `
  }

  createGroupedMessageContent(message) {
    const attachmentContent = message.attachments ? this.createAttachmentContent(message.attachments) : ""
    const embedContent = message.embeds ? this.createEmbedContent(message.embeds) : ""

    return `
      <div class="flex items-start gap-3">
        <div class="w-10 flex justify-center">
          <span class="text-xs text-[#72767d] opacity-0 group-hover:opacity-100 transition-opacity">
            ${this.formatTimestamp(message.timestamp, true)}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="text-[#dcddde] leading-relaxed">
            ${this.processMessageContent(message.content)}
          </div>
          ${attachmentContent}
          ${embedContent}
        </div>
      </div>
    `
  }

  createReplyContent(replyTo) {
    return `
      <div class="flex items-center gap-2 mb-2 ml-14 text-sm">
        <i class="fas fa-reply text-[#72767d]"></i>
        <img src="${replyTo.author.avatar}" class="w-4 h-4 rounded-full">
        <span class="text-[#72767d]">
          <span class="font-medium hover:underline cursor-pointer">${replyTo.author.username}</span>
          ${replyTo.content.slice(0, 50)}${replyTo.content.length > 50 ? "..." : ""}
        </span>
      </div>
    `
  }

  createAttachmentContent(attachments) {
    return attachments
      .map((attachment) => {
        if (attachment.isGif || attachment.type === "image/gif") {
          return this.createGifAttachment(attachment)
        } else if (attachment.type.startsWith("image/")) {
          return this.createImageAttachment(attachment)
        } else if (attachment.type.startsWith("video/")) {
          return this.createVideoAttachment(attachment)
        } else if (attachment.type.startsWith("audio/")) {
          return this.createAudioAttachment(attachment)
        } else {
          return this.createFileAttachment(attachment)
        }
      })
      .join("")
  }

  createGifAttachment(attachment) {
    return `
      <div class="mt-2">
        <div class="relative inline-block max-w-sm rounded-lg overflow-hidden bg-[#2f3136] cursor-pointer hover:opacity-90 transition-opacity">
          <img src="${attachment.data}" 
               alt="${attachment.filename}"
               class="max-w-full h-auto rounded-lg gif-image"
               loading="lazy">
          <div class="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
            GIF
          </div>
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div class="text-white text-sm font-medium">${attachment.filename}</div>
          </div>
        </div>
      </div>
    `
  }

  createImageAttachment(attachment) {
    return `
      <div class="mt-2">
        <div class="relative inline-block max-w-sm rounded-lg overflow-hidden bg-[#2f3136] cursor-pointer hover:opacity-90 transition-opacity">
          <img src="${attachment.data}" 
               alt="${attachment.filename}"
               class="max-w-full h-auto rounded-lg"
               onclick="this.requestFullscreen()"
               loading="lazy">
          <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <div class="text-white text-sm font-medium">${attachment.filename}</div>
            <div class="text-gray-300 text-xs">${this.formatFileSize(attachment.size)}</div>
          </div>
        </div>
      </div>
    `
  }

  createVideoAttachment(attachment) {
    return `
      <div class="mt-2">
        <video controls class="max-w-sm rounded-lg bg-[#2f3136]">
          <source src="${attachment.data}" type="${attachment.type}">
          Your browser does not support the video tag.
        </video>
        <div class="text-xs text-[#72767d] mt-1">
          ${attachment.filename} • ${this.formatFileSize(attachment.size)}
        </div>
      </div>
    `
  }

  createAudioAttachment(attachment) {
    return `
      <div class="mt-2 bg-[#2f3136] rounded-lg p-3 max-w-sm">
        <div class="flex items-center gap-3 mb-2">
          <i class="fas fa-file-audio text-[#5865f2] text-xl"></i>
          <div>
            <div class="text-white font-medium">${attachment.filename}</div>
            <div class="text-xs text-[#72767d]">${this.formatFileSize(attachment.size)}</div>
          </div>
        </div>
        <audio controls class="w-full">
          <source src="${attachment.data}" type="${attachment.type}">
          Your browser does not support the audio tag.
        </audio>
      </div>
    `
  }

  createFileAttachment(attachment) {
    const icon = this.getFileIcon(attachment.type)
    const downloadUrl = attachment.data

    return `
      <div class="mt-2 bg-[#2f3136] rounded-lg p-3 max-w-sm hover:bg-[#36393f] transition-colors cursor-pointer">
        <a href="${downloadUrl}" download="${attachment.filename}" class="flex items-center gap-3 text-white no-underline">
          <i class="${icon} text-[#5865f2] text-2xl"></i>
          <div class="flex-1">
            <div class="font-medium">${attachment.filename}</div>
            <div class="text-xs text-[#72767d]">${this.formatFileSize(attachment.size)}</div>
          </div>
          <i class="fas fa-download text-[#72767d] hover:text-white transition-colors"></i>
        </a>
      </div>
    `
  }

  createEmbedContent(embeds) {
    return embeds
      .map(
        (embed) => `
      <div class="mt-2 border-l-4 border-[#5865f2] bg-[#2f3136] rounded-r-lg p-3 max-w-lg">
        ${embed.title ? `<div class="font-semibold text-white mb-1">${embed.title}</div>` : ""}
        ${embed.description ? `<div class="text-[#dcddde] text-sm">${embed.description}</div>` : ""}
        ${embed.image ? `<img src="${embed.image}" class="mt-2 rounded max-w-full h-auto">` : ""}
      </div>
    `,
      )
      .join("")
  }

  processMessageContent(content) {
    if (!content) return ""

    // Process mentions
    content = content.replace(/@(\w+)/g, (match, username) => {
      const currentUser = stateManager.getStateValue("user.username")
      const isSelfMention = username === currentUser
      const className = isSelfMention ? "bg-[#5865f2] text-white" : "bg-[#5865f2]/20 text-[#5865f2]"
      return `<span class="${className} px-1 rounded font-medium hover:bg-[#5865f2] hover:text-white transition-colors cursor-pointer">${match}</span>`
    })

    // Process emojis
    content = EmojiManager.processEmojis(content)

    // Process URLs
    content = content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" class="text-[#00aff4] hover:underline">$1</a>',
    )

    // Process code blocks
    content = content.replace(
      /```([\s\S]*?)```/g,
      '<pre class="bg-[#2f3136] p-2 rounded mt-1 overflow-x-auto"><code>$1</code></pre>',
    )
    content = content.replace(/`([^`]+)`/g, '<code class="bg-[#2f3136] px-1 rounded text-[#f47fff]">$1</code>')

    // Process bold and italic
    content = content.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    content = content.replace(/\*(.*?)\*/g, "<em>$1</em>")
    content = content.replace(/__(.*?)__/g, "<u>$1</u>")
    content = content.replace(/~~(.*?)~~/g, "<s>$1</s>")

    return content
  }

  addMessageActions(container, message) {
    const actions = document.createElement("div")
    actions.className =
      "message-actions absolute top-0 right-4 bg-[#36393f] border border-[#40444b] rounded shadow-lg px-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
    actions.innerHTML = `
      <button class="p-1 hover:bg-[#40444b] rounded text-[#72767d] hover:text-white transition-colors" title="Add Reaction">
        <i class="fas fa-smile text-sm"></i>
      </button>
      <button class="p-1 hover:bg-[#40444b] rounded text-[#72767d] hover:text-white transition-colors" title="Reply" data-action="reply">
        <i class="fas fa-reply text-sm"></i>
      </button>
      <button class="p-1 hover:bg-[#40444b] rounded text-[#72767d] hover:text-white transition-colors" title="More">
        <i class="fas fa-ellipsis-h text-sm"></i>
      </button>
    `

    // Add event listeners
    actions.querySelector('[data-action="reply"]').onclick = () => {
      eventBus.emit("replyToMessage", { message })
    }

    container.appendChild(actions)
  }

  shouldGroupMessage(message) {
    const messages = stateManager.getStateValue("messages")
    const lastMessage = messages[messages.length - 2] // -2 because current message is already added

    if (!lastMessage) return false

    const timeDiff = message.timestamp - lastMessage.timestamp
    const sameAuthor = message.author.id === lastMessage.author.id
    const withinTimeLimit = timeDiff < 5 * 60 * 1000 // 5 minutes

    return sameAuthor && withinTimeLimit && !message.replyTo
  }

  isMentioned(message) {
    const currentUser = stateManager.getStateValue("user")
    return message.mentions && message.mentions.includes(currentUser.username)
  }

  formatTimestamp(timestamp, shortFormat = false) {
    const now = new Date()
    const messageDate = new Date(timestamp)
    const isToday = now.toDateString() === messageDate.toDateString()

    if (shortFormat) {
      return messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }

    if (isToday) {
      return `Today at ${messageDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
    } else {
      return messageDate.toLocaleDateString([], {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  getFileIcon(mimeType) {
    if (mimeType.includes("pdf")) return "fas fa-file-pdf"
    if (mimeType.includes("word") || mimeType.includes("document")) return "fas fa-file-word"
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) return "fas fa-file-excel"
    if (mimeType.includes("powerpoint") || mimeType.includes("presentation")) return "fas fa-file-powerpoint"
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return "fas fa-file-archive"
    if (mimeType.includes("text")) return "fas fa-file-alt"
    return "fas fa-file"
  }

  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight
  }

  clear() {
    this.container.innerHTML = ""
    this.messageCache.clear()
  }
}
