// Enhanced emoji management
export class EmojiManager {
  static emojiMap = {
    ':)': '😊',
    ':D': '😃',
    ':(': '😢',
    ':P': '😛',
    ';)': '😉',
    ':o': '😮',
    ':heart:': '❤️',
    ':thumbsup:': '👍',
    ':thumbsdown:': '👎',
    ':fire:': '🔥',
    ':100:': '💯',
    ':clap:': '👏',
    ':wave:': '👋',
    ':eyes:': '👀',
    ':thinking:': '🤔',
    ':shrug:': '🤷',
    ':facepalm:': '🤦',
    ':joy:': '😂',
    ':sob:': '😭',
    ':rage:': '😡',
    ':cool:': '😎',
    ':nerd:': '🤓',
    ':robot:': '🤖',
    ':ghost:': '👻',
    ':skull:': '💀',
    ':poop:': '💩',
    ':unicorn:': '🦄',
    ':pizza:': '🍕',
    ':beer:': '🍺',
    ':coffee:': '☕',
    ':rocket:': '🚀',
    ':star:': '⭐',
    ':moon:': '🌙',
    ':sun:': '☀️',
    ':rainbow:': '🌈',
    ':lightning:': '⚡',
    ':snowflake:': '❄️',
    ':musical_note:': '🎵',
    ':headphones:': '🎧',
    ':microphone:': '🎤',
    ':camera:': '📷',
    ':phone:': '📱',
    ':computer:': '💻',
    ':keyboard:': '⌨️',
    ':mouse:': '🖱️',
    ':joystick:': '🕹️',
    ':gem:': '💎',
    ':money:': '💰',
    ':credit_card:': '💳',
    ':gift:': '🎁',
    ':balloon:': '🎈',
    ':party:': '🎉',
    ':confetti:': '🎊',
    ':trophy:': '🏆',
    ':medal:': '🏅',
    ':crown:': '👑',
    ':key:': '🔑',
    ':lock:': '🔒',
    ':unlock:': '🔓',
    ':bell:': '🔔',
    ':mute:': '🔇',
    ':speaker:': '🔊',
    ':battery:': '🔋',
    ':plug:': '🔌',
    ':bulb:': '💡',
    ':flashlight:': '🔦',
    ':candle:': '🕯️',
    ':fire_extinguisher:': '🧯',
    ':hammer:': '🔨',
    ':wrench:': '🔧',
    ':screwdriver:': '🪛',
    ':nut_and_bolt:': '🔩',
    ':gear:': '⚙️',
    ':link:': '🔗',
    ':chains:': '⛓️',
    ':syringe:': '💉',
    ':pill:': '💊',
    ':bandage:': '🩹',
    ':thermometer:': '🌡️',
    ':test_tube:': '🧪',
    ':petri_dish:': '🧫',
    ':dna:': '🧬',
    ':microbe:': '🦠',
    ':telescope:': '🔭',
    ':microscope:': '🔬',
    ':satellite:': '🛰️',
    ':airplane:': '✈️',
    ':helicopter:': '🚁',
    ':car:': '🚗',
    ':bus:': '🚌',
    ':train:': '🚆',
    ':bike:': '🚲',
    ':scooter:': '🛴',
    ':skateboard:': '🛹',
    ':ship:': '🚢',
    ':boat:': '⛵',
    ':anchor:': '⚓',
    ':fuel:': '⛽',
    ':construction:': '🚧',
    ':warning:': '⚠️',
    ':stop:': '🛑',
    ':traffic_light:': '🚦',
    ':compass:': '🧭',
    ':map:': '🗺️',
    ':mountain:': '⛰️',
    ':volcano:': '🌋',
    ':desert:': '🏜️',
    ':beach:': '🏖️',
    ':island:': '🏝️',
    ':park:': '🏞️',
    ':camping:': '🏕️',
    ':tent:': '⛺',
    ':house:': '🏠',
    ':building:': '🏢',
    ':factory:': '🏭',
    ':castle:': '🏰',
    ':church:': '⛪',
    ':mosque:': '🕌',
    ':synagogue:': '🕍',
    ':temple:': '🛕'
  };

  static processEmojis(text) {
    let processed = text;
    
    // Replace emoji shortcodes
    Object.entries(this.emojiMap).forEach(([shortcode, emoji]) => {
      const regex = new RegExp(this.escapeRegex(shortcode), 'g');
      processed = processed.replace(regex, emoji);
    });
    
    return processed;
  }

  static escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  static getEmojiSuggestions(query) {
    if (!query.startsWith(':') || query.length < 2) return [];
    
    const searchTerm = query.slice(1).toLowerCase();
    return Object.keys(this.emojiMap)
      .filter(shortcode => shortcode.slice(1, -1).includes(searchTerm))
      .slice(0, 10)
      .map(shortcode => ({
        shortcode,
        emoji: this.emojiMap[shortcode],
        name: shortcode.slice(1, -1)
      }));
  }

  static createEmojiPicker() {
    const categories = {
      'Smileys & People': ['😊', '😃', '😢', '😛', '😉', '😮', '😂', '😭', '😡', '😎', '🤓', '🤔', '🤷', '🤦'],
      'Animals & Nature': ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸'],
      'Food & Drink': ['🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣'],
      'Activities': ['⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🏒', '🏑', '🏏'],
      'Travel & Places': ['🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜'],
      'Objects': ['⌚', '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🖲️', '🕹️', '🗜️', '💽', '💾', '💿', '📀'],
      'Symbols': ['❤️', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗']
    };

    const picker = document.createElement('div');
    picker.className = 'emoji-picker bg-[#36393f] border border-[#40444b] rounded-lg shadow-xl p-2 max-h-80 overflow-y-auto';
    picker.style.width = '320px';

    Object.entries(categories).forEach(([category, emojis]) => {
      const categoryDiv = document.createElement('div');
      categoryDiv.className = 'mb-3';
      
      const categoryTitle = document.createElement('div');
      categoryTitle.className = 'text-xs font-semibold text-[#72767d] mb-2 px-1';
      categoryTitle.textContent = category;
      
      const emojiGrid = document.createElement('div');
      emojiGrid.className = 'grid grid-cols-8 gap-1';
      
      emojis.forEach(emoji => {
        const emojiBtn = document.createElement('button');
        emojiBtn.className = 'w-8 h-8 flex items-center justify-center hover:bg-[#40444b] rounded text-lg transition-colors';
        emojiBtn.textContent = emoji;
        emojiBtn.onclick = () => {
          picker.dispatchEvent(new CustomEvent('emojiSelect', { detail: { emoji } }));
        };
        emojiGrid.appendChild(emojiBtn);
      });
      
      categoryDiv.appendChild(categoryTitle);
      categoryDiv.appendChild(emojiGrid);
      picker.appendChild(categoryDiv);
    });

    return picker;
  }
}