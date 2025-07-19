// Enhanced emoji management with comprehensive emoji support
export class EmojiManager {
  static emojiData = null
  static gifCache = new Map()

  // Comprehensive emoji categories with Unicode emojis
  static emojiCategories = {
    "Smileys & Emotion": [
      "😀",
      "😃",
      "😄",
      "😁",
      "😆",
      "😅",
      "🤣",
      "😂",
      "🙂",
      "🙃",
      "😉",
      "😊",
      "😇",
      "🥰",
      "😍",
      "🤩",
      "😘",
      "😗",
      "☺️",
      "😚",
      "😙",
      "🥲",
      "😋",
      "😛",
      "😜",
      "🤪",
      "😝",
      "🤑",
      "🤗",
      "🤭",
      "🤫",
      "🤔",
      "🤐",
      "🤨",
      "😐",
      "😑",
      "😶",
      "😏",
      "😒",
      "🙄",
      "😬",
      "🤥",
      "😔",
      "😪",
      "🤤",
      "😴",
      "😷",
      "🤒",
      "🤕",
      "🤢",
      "🤮",
      "🤧",
      "🥵",
      "🥶",
      "🥴",
      "😵",
      "🤯",
      "🤠",
      "🥳",
      "🥸",
      "😎",
      "🤓",
      "🧐",
      "😕",
      "😟",
      "🙁",
      "☹️",
      "😮",
      "😯",
      "😲",
      "😳",
      "🥺",
      "😦",
      "😧",
      "😨",
      "😰",
      "😥",
      "😢",
      "😭",
      "😱",
      "😖",
      "😣",
      "😞",
      "😓",
      "😩",
      "😫",
      "🥱",
      "😤",
      "😡",
      "😠",
      "🤬",
      "😈",
      "👿",
      "💀",
      "☠️",
      "💩",
      "🤡",
      "👹",
      "👺",
      "👻",
      "👽",
      "👾",
      "🤖",
    ],
    "People & Body": [
      "👋",
      "🤚",
      "🖐️",
      "✋",
      "🖖",
      "👌",
      "🤌",
      "🤏",
      "✌️",
      "🤞",
      "🤟",
      "🤘",
      "🤙",
      "👈",
      "👉",
      "👆",
      "🖕",
      "👇",
      "☝️",
      "👍",
      "👎",
      "👊",
      "✊",
      "🤛",
      "🤜",
      "👏",
      "🙌",
      "👐",
      "🤲",
      "🤝",
      "🙏",
      "✍️",
      "💅",
      "🤳",
      "💪",
      "🦾",
      "🦿",
      "🦵",
      "🦶",
      "👂",
      "🦻",
      "👃",
      "🧠",
      "🫀",
      "🫁",
      "🦷",
      "🦴",
      "👀",
      "👁️",
      "👅",
      "👄",
      "💋",
    ],
    "Animals & Nature": [
      "🐶",
      "🐱",
      "🐭",
      "🐹",
      "🐰",
      "🦊",
      "🐻",
      "🐼",
      "🐨",
      "🐯",
      "🦁",
      "🐮",
      "🐷",
      "🐽",
      "🐸",
      "🐵",
      "🙈",
      "🙉",
      "🙊",
      "🐒",
      "🐔",
      "🐧",
      "🐦",
      "🐤",
      "🐣",
      "🐥",
      "🦆",
      "🦅",
      "🦉",
      "🦇",
      "🐺",
      "🐗",
      "🐴",
      "🦄",
      "🐝",
      "🐛",
      "🦋",
      "🐌",
      "🐞",
      "🐜",
      "🦟",
      "🦗",
      "🕷️",
      "🕸️",
      "🦂",
      "🐢",
      "🐍",
      "🦎",
      "🦖",
      "🦕",
      "🐙",
      "🦑",
      "🦐",
      "🦞",
      "🦀",
      "🐡",
      "🐠",
      "🐟",
      "🐬",
      "🐳",
      "🐋",
      "🦈",
      "🐊",
      "🐅",
      "🐆",
      "🦓",
      "🦍",
      "🦧",
      "🐘",
      "🦛",
      "🦏",
      "🐪",
      "🐫",
      "🦒",
      "🦘",
      "🐃",
      "🐂",
      "🐄",
      "🐎",
      "🐖",
      "🐏",
      "🐑",
      "🦙",
      "🐐",
      "🦌",
      "🐕",
      "🐩",
      "🦮",
      "🐕‍🦺",
      "🐈",
      "🐈‍⬛",
    ],
    "Food & Drink": [
      "🍎",
      "🍐",
      "🍊",
      "🍋",
      "🍌",
      "🍉",
      "🍇",
      "🍓",
      "🫐",
      "🍈",
      "🍒",
      "🍑",
      "🥭",
      "🍍",
      "🥥",
      "🥝",
      "🍅",
      "🍆",
      "🥑",
      "🥦",
      "🥬",
      "🥒",
      "🌶️",
      "🫑",
      "🌽",
      "🥕",
      "🫒",
      "🧄",
      "🧅",
      "🥔",
      "🍠",
      "🥐",
      "🥯",
      "🍞",
      "🥖",
      "🥨",
      "🧀",
      "🥚",
      "🍳",
      "🧈",
      "🥞",
      "🧇",
      "🥓",
      "🥩",
      "🍗",
      "🍖",
      "🦴",
      "🌭",
      "🍔",
      "🍟",
      "🍕",
      "🫓",
      "🥪",
      "🥙",
      "🧆",
      "🌮",
      "🌯",
      "🫔",
      "🥗",
      "🥘",
      "🫕",
      "🥫",
      "🍝",
      "🍜",
      "🍲",
      "🍛",
      "🍣",
      "🍱",
      "🥟",
      "🦪",
      "🍤",
      "🍙",
      "🍚",
      "🍘",
      "🍥",
      "🥠",
      "🥮",
      "🍢",
      "🍡",
      "🍧",
      "🍨",
      "🍦",
      "🥧",
      "🧁",
      "🍰",
      "🎂",
      "🍮",
      "🍭",
      "🍬",
      "🍫",
      "🍿",
      "🍩",
      "🍪",
      "🌰",
      "🥜",
      "🍯",
      "🥛",
      "🍼",
      "☕",
      "🫖",
      "🍵",
      "🧃",
      "🥤",
      "🧋",
      "🍶",
      "🍺",
      "🍻",
      "🥂",
      "🍷",
      "🥃",
      "🍸",
      "🍹",
      "🧉",
      "🍾",
    ],
    Activities: [
      "⚽",
      "🏀",
      "🏈",
      "⚾",
      "🥎",
      "🎾",
      "🏐",
      "🏉",
      "🥏",
      "🎱",
      "🪀",
      "🏓",
      "🏸",
      "🏒",
      "🏑",
      "🥍",
      "🏏",
      "🪃",
      "🥅",
      "⛳",
      "🪁",
      "🏹",
      "🎣",
      "🤿",
      "🥊",
      "🥋",
      "🎽",
      "🛹",
      "🛷",
      "⛸️",
      "🥌",
      "🎿",
      "⛷️",
      "🏂",
      "🪂",
      "🏋️‍♀️",
      "🏋️",
      "🏋️‍♂️",
      "🤼‍♀️",
      "🤼",
      "🤼‍♂️",
      "🤸‍♀️",
      "🤸",
      "🤸‍♂️",
      "⛹️‍♀️",
      "⛹️",
      "⛹️‍♂️",
      "🤺",
      "🤾‍♀️",
      "🤾",
      "🤾‍♂️",
      "🏌️‍♀️",
      "🏌️",
      "🏌️‍♂️",
      "🏇",
      "🧘‍♀️",
      "🧘",
      "🧘‍♂️",
      "🏄‍♀️",
      "🏄",
      "🏄‍♂️",
      "🏊‍♀️",
      "🏊",
      "🏊‍♂️",
      "🤽‍♀️",
      "🤽",
      "🤽‍♂️",
      "🚣‍♀️",
      "🚣",
      "🚣‍♂️",
      "🧗‍♀️",
      "🧗",
      "🧗‍♂️",
      "🚵‍♀️",
      "🚵",
      "🚵‍♂️",
      "🚴‍♀️",
      "🚴",
      "🚴‍♂️",
      "🏆",
      "🥇",
      "🥈",
      "🥉",
      "🏅",
      "🎖️",
      "🏵️",
      "🎗️",
    ],
    "Travel & Places": [
      "🚗",
      "🚕",
      "🚙",
      "🚌",
      "🚎",
      "🏎️",
      "🚓",
      "🚑",
      "🚒",
      "🚐",
      "🛻",
      "🚚",
      "🚛",
      "🚜",
      "🏍️",
      "🛵",
      "🚲",
      "🛴",
      "🛹",
      "🛼",
      "🚁",
      "🛸",
      "✈️",
      "🛩️",
      "🛫",
      "🛬",
      "🪂",
      "💺",
      "🚀",
      "🛰️",
      "🚢",
      "⛵",
      "🚤",
      "🛥️",
      "🛳️",
      "⛴️",
      "🚁",
      "🚂",
      "🚃",
      "🚄",
      "🚅",
      "🚆",
      "🚇",
      "🚈",
      "🚉",
      "🚊",
      "🚝",
      "🚞",
      "🚋",
      "🚌",
      "🚍",
      "🎡",
      "🎢",
      "🎠",
      "🏗️",
      "🌁",
      "🗼",
      "🏭",
      "⛲",
      "🎡",
      "🎢",
      "🏰",
      "🏯",
      "🏟️",
      "🎪",
      "🏕️",
      "🏞️",
      "🏜️",
      "🏝️",
      "🏖️",
      "⛱️",
      "🏔️",
      "⛰️",
      "🌋",
      "🗻",
      "🏘️",
      "🏚️",
      "🏠",
      "🏡",
      "🏢",
      "🏣",
      "🏤",
      "🏥",
      "🏦",
      "🏨",
      "🏩",
      "🏪",
      "🏫",
      "🏬",
      "🏭",
      "🏯",
      "🏰",
      "💒",
      "🗼",
      "🗽",
      "⛪",
      "🕌",
      "🛕",
      "🕍",
      "⛩️",
      "🕋",
    ],
    Objects: [
      "⌚",
      "📱",
      "📲",
      "💻",
      "⌨️",
      "🖥️",
      "🖨️",
      "🖱️",
      "🖲️",
      "🕹️",
      "🗜️",
      "💽",
      "💾",
      "💿",
      "📀",
      "📼",
      "📷",
      "📸",
      "📹",
      "🎥",
      "📽️",
      "🎞️",
      "📞",
      "☎️",
      "📟",
      "📠",
      "📺",
      "📻",
      "🎙️",
      "🎚️",
      "🎛️",
      "🧭",
      "⏱️",
      "⏲️",
      "⏰",
      "🕰️",
      "⌛",
      "⏳",
      "📡",
      "🔋",
      "🔌",
      "💡",
      "🔦",
      "🕯️",
      "🪔",
      "🧯",
      "🛢️",
      "💸",
      "💵",
      "💴",
      "💶",
      "💷",
      "🪙",
      "💰",
      "💳",
      "💎",
      "⚖️",
      "🪜",
      "🧰",
      "🔧",
      "🔨",
      "⚒️",
      "🛠️",
      "⛏️",
      "🪓",
      "🪚",
      "🔩",
      "⚙️",
      "🪤",
      "🧱",
      "⛓️",
      "🧲",
      "🔫",
      "💣",
      "🧨",
      "🪓",
      "🔪",
      "🗡️",
      "⚔️",
      "🛡️",
      "🚬",
      "⚰️",
      "🪦",
      "⚱️",
      "🏺",
      "🔮",
      "📿",
      "🧿",
      "💈",
      "⚗️",
      "🔭",
      "🔬",
      "🕳️",
      "🩹",
      "🩺",
      "💊",
      "💉",
      "🩸",
      "🧬",
      "🦠",
      "🧫",
      "🧪",
      "🌡️",
    ],
    Symbols: [
      "❤️",
      "🧡",
      "💛",
      "💚",
      "💙",
      "💜",
      "🖤",
      "🤍",
      "🤎",
      "💔",
      "❣️",
      "💕",
      "💞",
      "💓",
      "💗",
      "💖",
      "💘",
      "💝",
      "💟",
      "☮️",
      "✝️",
      "☪️",
      "🕉️",
      "☸️",
      "✡️",
      "🔯",
      "🕎",
      "☯️",
      "☦️",
      "🛐",
      "⛎",
      "♈",
      "♉",
      "♊",
      "♋",
      "♌",
      "♍",
      "♎",
      "♏",
      "♐",
      "♑",
      "♒",
      "♓",
      "🆔",
      "⚛️",
      "🉑",
      "☢️",
      "☣️",
      "📴",
      "📳",
      "🈶",
      "🈚",
      "🈸",
      "🈺",
      "🈷️",
      "✴️",
      "🆚",
      "💮",
      "🉐",
      "㊙️",
      "㊗️",
      "🈴",
      "🈵",
      "🈹",
      "🈲",
      "🅰️",
      "🅱️",
      "🆎",
      "🆑",
      "🅾️",
      "🆘",
      "❌",
      "⭕",
      "🛑",
      "⛔",
      "📛",
      "🚫",
      "💯",
      "💢",
      "♨️",
      "🚷",
      "🚯",
      "🚳",
      "🚱",
      "🔞",
      "📵",
      "🚭",
      "❗",
      "❕",
      "❓",
      "❔",
      "‼️",
      "⁉️",
      "🔅",
      "🔆",
      "〽️",
      "⚠️",
      "🚸",
      "🔱",
      "⚜️",
      "🔰",
      "♻️",
    ],
    Flags: [
      "🏁",
      "🚩",
      "🎌",
      "🏴",
      "🏳️",
      "🏳️‍🌈",
      "🏳️‍⚧️",
      "🏴‍☠️",
      "🇦🇨",
      "🇦🇩",
      "🇦🇪",
      "🇦🇫",
      "🇦🇬",
      "🇦🇮",
      "🇦🇱",
      "🇦🇲",
      "🇦🇴",
      "🇦🇶",
      "🇦🇷",
      "🇦🇸",
      "🇦🇹",
      "🇦🇺",
      "🇦🇼",
      "🇦🇽",
      "🇦🇿",
      "🇧🇦",
      "🇧🇧",
      "🇧🇩",
      "🇧🇪",
      "🇧🇫",
      "🇧🇬",
      "🇧🇭",
      "🇧🇮",
      "🇧🇯",
      "🇧🇱",
      "🇧🇲",
      "🇧🇳",
      "🇧🇴",
      "🇧🇶",
      "🇧🇷",
      "🇧🇸",
      "🇧🇹",
      "🇧🇻",
      "🇧🇼",
      "🇧🇾",
      "🇧🇿",
      "🇨🇦",
      "🇨🇨",
      "🇨🇩",
      "🇨🇫",
      "🇨🇬",
      "🇨🇭",
      "🇨🇮",
      "🇨🇰",
      "🇨🇱",
      "🇨🇲",
      "🇨🇳",
      "🇨🇴",
      "🇨🇵",
      "🇨🇷",
      "🇨🇺",
      "🇨🇻",
      "🇨🇼",
      "🇨🇽",
      "🇨🇾",
      "🇨🇿",
    ],
  }

  static shortcodeMap = {
    ":)": "😊",
    ":D": "😃",
    ":(": "😢",
    ":P": "😛",
    ";)": "😉",
    ":o": "😮",
    ":heart:": "❤️",
    ":thumbsup:": "👍",
    ":thumbsdown:": "👎",
    ":fire:": "🔥",
    ":100:": "💯",
    ":clap:": "👏",
    ":wave:": "👋",
    ":eyes:": "👀",
    ":thinking:": "🤔",
    ":shrug:": "🤷",
    ":facepalm:": "🤦",
    ":joy:": "😂",
    ":sob:": "😭",
    ":rage:": "😡",
    ":cool:": "😎",
    ":nerd:": "🤓",
    ":robot:": "🤖",
    ":ghost:": "👻",
    ":skull:": "💀",
    ":poop:": "💩",
    ":unicorn:": "🦄",
    ":pizza:": "🍕",
    ":beer:": "🍺",
    ":coffee:": "☕",
    ":rocket:": "🚀",
    ":star:": "⭐",
    ":moon:": "🌙",
    ":sun:": "☀️",
    ":rainbow:": "🌈",
  }

  static processEmojis(text) {
    let processed = text

    // Replace emoji shortcodes
    Object.entries(this.shortcodeMap).forEach(([shortcode, emoji]) => {
      const regex = new RegExp(this.escapeRegex(shortcode), "g")
      processed = processed.replace(regex, emoji)
    })

    return processed
  }

  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  }

  static getEmojiSuggestions(query) {
    if (!query.startsWith(":") || query.length < 2) return []

    const searchTerm = query.slice(1).toLowerCase()
    const suggestions = []

    // Search through shortcodes
    Object.entries(this.shortcodeMap).forEach(([shortcode, emoji]) => {
      if (shortcode.slice(1, -1).includes(searchTerm)) {
        suggestions.push({
          shortcode,
          emoji,
          name: shortcode.slice(1, -1),
        })
      }
    })

    // Search through emoji names (basic implementation)
    const emojiNames = {
      smile: "😊",
      laugh: "😂",
      cry: "😢",
      angry: "😡",
      love: "❤️",
      party: "🎉",
      cake: "🎂",
      gift: "🎁",
      music: "🎵",
      dance: "💃",
      cat: "🐱",
      dog: "🐶",
      food: "🍕",
      drink: "🍺",
      car: "🚗",
    }

    Object.entries(emojiNames).forEach(([name, emoji]) => {
      if (name.includes(searchTerm)) {
        suggestions.push({
          shortcode: `:${name}:`,
          emoji,
          name,
        })
      }
    })

    return suggestions.slice(0, 10)
  }

  static createEmojiPicker() {
    const picker = document.createElement("div")
    picker.className = "emoji-picker bg-[#36393f] border border-[#40444b] rounded-lg shadow-xl overflow-hidden"
    picker.style.width = "350px"
    picker.style.height = "400px"

    // Create tabs
    const tabs = document.createElement("div")
    tabs.className = "flex border-b border-[#40444b] bg-[#2f3136]"

    const tabButtons = []
    Object.keys(this.emojiCategories).forEach((category, index) => {
      const tab = document.createElement("button")
      tab.className = `px-3 py-2 text-xs font-medium transition-colors ${index === 0 ? "text-[#5865f2] border-b-2 border-[#5865f2]" : "text-[#72767d] hover:text-white"}`
      tab.textContent = category.split(" ")[0]
      tab.onclick = () => this.switchEmojiCategory(picker, category, tabButtons, tab)
      tabs.appendChild(tab)
      tabButtons.push(tab)
    })

    // Create search
    const searchContainer = document.createElement("div")
    searchContainer.className = "p-2 border-b border-[#40444b]"
    searchContainer.innerHTML = `
      <input type="text" placeholder="Search emojis..." 
             class="w-full px-3 py-2 bg-[#1e1f22] text-white text-sm rounded border border-[#40444b] focus:border-[#5865f2] focus:outline-none">
    `

    // Create content area
    const content = document.createElement("div")
    content.className = "emoji-content p-2 overflow-y-auto"
    content.style.height = "300px"

    picker.appendChild(tabs)
    picker.appendChild(searchContainer)
    picker.appendChild(content)

    // Initialize with first category
    this.renderEmojiCategory(content, Object.keys(this.emojiCategories)[0], picker)

    // Setup search
    const searchInput = searchContainer.querySelector("input")
    searchInput.addEventListener("input", (e) => {
      this.searchEmojis(content, e.target.value, picker)
    })

    return picker
  }

  static switchEmojiCategory(picker, category, tabButtons, activeTab) {
    // Update tab styles
    tabButtons.forEach((tab) => {
      tab.className = "px-3 py-2 text-xs font-medium transition-colors text-[#72767d] hover:text-white"
    })
    activeTab.className = "px-3 py-2 text-xs font-medium transition-colors text-[#5865f2] border-b-2 border-[#5865f2]"

    // Render category
    const content = picker.querySelector(".emoji-content")
    this.renderEmojiCategory(content, category, picker)
  }

  static renderEmojiCategory(container, category, picker) {
    const emojis = this.emojiCategories[category] || []

    container.innerHTML = `
      <div class="grid grid-cols-8 gap-1">
        ${emojis
          .map(
            (emoji) => `
          <button class="w-8 h-8 flex items-center justify-center hover:bg-[#40444b] rounded text-lg transition-colors emoji-btn" 
                  data-emoji="${emoji}" title="${emoji}">
            ${emoji}
          </button>
        `,
          )
          .join("")}
      </div>
    `

    // Add click handlers
    container.querySelectorAll(".emoji-btn").forEach((btn) => {
      btn.onclick = () => {
        picker.dispatchEvent(
          new CustomEvent("emojiSelect", {
            detail: { emoji: btn.dataset.emoji },
          }),
        )
      }
    })
  }

  static searchEmojis(container, query, picker) {
    if (!query.trim()) {
      this.renderEmojiCategory(container, Object.keys(this.emojiCategories)[0], picker)
      return
    }

    const searchResults = []
    const lowerQuery = query.toLowerCase()

    // Search through all categories
    Object.values(this.emojiCategories).forEach((emojis) => {
      emojis.forEach((emoji) => {
        // Simple search - you could enhance this with emoji names/keywords
        if (searchResults.length < 64) {
          // Limit results
          searchResults.push(emoji)
        }
      })
    })

    container.innerHTML = `
      <div class="grid grid-cols-8 gap-1">
        ${searchResults
          .map(
            (emoji) => `
          <button class="w-8 h-8 flex items-center justify-center hover:bg-[#40444b] rounded text-lg transition-colors emoji-btn" 
                  data-emoji="${emoji}" title="${emoji}">
            ${emoji}
          </button>
        `,
          )
          .join("")}
      </div>
    `

    // Add click handlers
    container.querySelectorAll(".emoji-btn").forEach((btn) => {
      btn.onclick = () => {
        picker.dispatchEvent(
          new CustomEvent("emojiSelect", {
            detail: { emoji: btn.dataset.emoji },
          }),
        )
      }
    })
  }

  // GIF functionality
  static async searchGifs(query, limit = 20) {
    const cacheKey = `${query}_${limit}`
    if (this.gifCache.has(cacheKey)) {
      return this.gifCache.get(cacheKey)
    }

    try {
      // Using Tenor API (free tier)
      const apiKey = "AIzaSyAyimkuYQYF_FXVALexPuGQctUWRDdYaTg" // Public demo key
      const response = await fetch(
        `https://tenor.googleapis.com/v2/search?q=${encodeURIComponent(query)}&key=${apiKey}&limit=${limit}&media_filter=gif`,
      )

      if (!response.ok) {
        throw new Error("GIF search failed")
      }

      const data = await response.json()
      const gifs = data.results.map((gif) => ({
        id: gif.id,
        title: gif.content_description,
        url: gif.media_formats.gif.url,
        preview: gif.media_formats.tinygif.url,
        width: gif.media_formats.gif.dims[0],
        height: gif.media_formats.gif.dims[1],
      }))

      this.gifCache.set(cacheKey, gifs)
      return gifs
    } catch (error) {
      console.error("GIF search error:", error)
      return []
    }
  }

  static createGifPicker() {
    const picker = document.createElement("div")
    picker.className = "gif-picker bg-[#36393f] border border-[#40444b] rounded-lg shadow-xl overflow-hidden"
    picker.style.width = "400px"
    picker.style.height = "450px"

    picker.innerHTML = `
      <div class="p-3 border-b border-[#40444b] bg-[#2f3136]">
        <input type="text" placeholder="Search GIFs..." 
               class="w-full px-3 py-2 bg-[#1e1f22] text-white text-sm rounded border border-[#40444b] focus:border-[#5865f2] focus:outline-none gif-search">
      </div>
      <div class="gif-content p-2 overflow-y-auto" style="height: 380px;">
        <div class="text-center text-[#72767d] py-8">
          <i class="fas fa-search text-2xl mb-2"></i>
          <p>Search for GIFs to share</p>
        </div>
      </div>
      <div class="gif-loading hidden text-center py-4">
        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-[#5865f2] mx-auto"></div>
      </div>
    `

    const searchInput = picker.querySelector(".gif-search")
    const content = picker.querySelector(".gif-content")
    const loading = picker.querySelector(".gif-loading")

    let searchTimeout
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchTimeout)
      const query = e.target.value.trim()

      if (!query) {
        content.innerHTML = `
          <div class="text-center text-[#72767d] py-8">
            <i class="fas fa-search text-2xl mb-2"></i>
            <p>Search for GIFs to share</p>
          </div>
        `
        return
      }

      searchTimeout = setTimeout(async () => {
        loading.classList.remove("hidden")
        content.classList.add("hidden")

        const gifs = await this.searchGifs(query)

        loading.classList.add("hidden")
        content.classList.remove("hidden")

        if (gifs.length === 0) {
          content.innerHTML = `
            <div class="text-center text-[#72767d] py-8">
              <i class="fas fa-frown text-2xl mb-2"></i>
              <p>No GIFs found</p>
            </div>
          `
          return
        }

        content.innerHTML = `
          <div class="grid grid-cols-2 gap-2">
            ${gifs
              .map(
                (gif) => `
              <div class="gif-item cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden" 
                   data-gif-url="${gif.url}" data-gif-title="${gif.title}">
                <img src="${gif.preview}" alt="${gif.title}" class="w-full h-auto">
              </div>
            `,
              )
              .join("")}
          </div>
        `

        // Add click handlers
        content.querySelectorAll(".gif-item").forEach((item) => {
          item.onclick = () => {
            picker.dispatchEvent(
              new CustomEvent("gifSelect", {
                detail: {
                  url: item.dataset.gifUrl,
                  title: item.dataset.gifTitle,
                },
              }),
            )
          }
        })
      }, 500)
    })

    // Load trending GIFs initially
    setTimeout(async () => {
      const trendingGifs = await this.searchGifs("trending")
      if (trendingGifs.length > 0) {
        searchInput.placeholder = "Search GIFs... (showing trending)"
        content.innerHTML = `
          <div class="grid grid-cols-2 gap-2">
            ${trendingGifs
              .slice(0, 10)
              .map(
                (gif) => `
              <div class="gif-item cursor-pointer hover:opacity-80 transition-opacity rounded overflow-hidden" 
                   data-gif-url="${gif.url}" data-gif-title="${gif.title}">
                <img src="${gif.preview}" alt="${gif.title}" class="w-full h-auto">
              </div>
            `,
              )
              .join("")}
          </div>
        `

        content.querySelectorAll(".gif-item").forEach((item) => {
          item.onclick = () => {
            picker.dispatchEvent(
              new CustomEvent("gifSelect", {
                detail: {
                  url: item.dataset.gifUrl,
                  title: item.dataset.gifTitle,
                },
              }),
            )
          }
        })
      }
    }, 100)

    return picker
  }
}
