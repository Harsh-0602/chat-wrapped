const STOP_WORDS = new Set([
  "the", "and", "that", "this", "with", "have", "from", "your", "you", "for",
  "are", "was", "were", "but", "not", "what", "when", "then", "just", "can",
  "its", "it's", "dont", "don't", "will", "would", "should", "could", "there",
  "here", "they", "them", "our", "out", "about", "okay", "ok", "yeah", "yes",
  "hai", "hain", "tha", "thi", "the", "aur", "nahi", "nhi", "kya", "kaise",
  "mein", "mai", "main", "mera", "meri", "mere", "tera", "teri", "tere", "tum",
  "aap", "ko", "ka", "ki", "ke", "se", "par", "pe", "toh", "to", "bhi",
  "kar", "karo", "kr", "ho", "haan", "han", "accha", "acha", "abhi", "fir",
  "phir", "ek", "ye", "yeh", "wo", "woh", "mat", "bas", "kyu", "kyun",
  "message", "media", "omitted", "image", "video", "sticker", "deleted"
]);

const PRODUCT_URL =
  location.protocol === "https:"
    ? `${location.origin}${location.pathname.replace(/\/[^/]*$/, "/")}`
    : "https://YOUR_USERNAME.github.io/chat-wrapped/";

const DEMO_CHAT = `[01/03/2025, 9:12:04 PM] Aisha: Reached home?
[01/03/2025, 9:12:42 PM] Kabir: Yes boss 😌
[01/03/2025, 9:13:15 PM] Aisha: Good. Aaj ka plan solid tha 😂
[01/03/2025, 9:14:20 PM] Kabir: Except tum 40 min late thi
[01/03/2025, 9:14:31 PM] Aisha: Fake news
[02/03/2025, 8:02:00 AM] Kabir: Good morning ☀️
[02/03/2025, 8:17:12 AM] Aisha: Morninggg
[02/03/2025, 8:18:22 AM] Aisha: Chai?
[02/03/2025, 8:18:59 AM] Kabir: Always. Meet at 10?
[02/03/2025, 10:02:12 AM] Aisha: 10:15 pakka 😭
[03/03/2025, 11:42:00 PM] Aisha: You awake?
[03/03/2025, 11:42:17 PM] Kabir: Obviously
[03/03/2025, 11:43:02 PM] Aisha: I have a very stupid question 😂😂
[03/03/2025, 11:44:10 PM] Kabir: My favourite category of question
[03/03/2025, 11:46:00 PM] Aisha: If we open a cafe what will we name it?
[03/03/2025, 11:46:29 PM] Kabir: Late Again Cafe
[03/03/2025, 11:47:01 PM] Aisha: blocked.
[04/03/2025, 12:02:10 AM] Kabir: Unblock, I have better names
[04/03/2025, 12:04:50 AM] Aisha: listening 👀
[04/03/2025, 8:32:11 PM] Kabir: Coffee tomorrow?
[04/03/2025, 8:34:01 PM] Aisha: Yes yes yes
[05/03/2025, 9:01:00 AM] Aisha: Don't be late
[05/03/2025, 9:01:28 AM] Kabir: The audacity 😂
[05/03/2025, 7:14:00 PM] Kabir: Today was fun
[05/03/2025, 7:16:00 PM] Aisha: Best coffee in the city honestly
[06/03/2025, 10:10:00 PM] Aisha: Sending you the playlist
[06/03/2025, 10:10:08 PM] Aisha: <Media omitted>
[06/03/2025, 10:11:30 PM] Kabir: Perfect, listening now 🎧
[07/03/2025, 11:01:00 PM] Kabir: That third song is stuck in my head
[07/03/2025, 11:05:15 PM] Aisha: I knew you'd like it 😌`;

const elements = {
  tabs: document.querySelectorAll(".tab"),
  panels: document.querySelectorAll(".tab-panel"),
  fileInput: document.querySelector("#file-input"),
  chatInput: document.querySelector("#chat-input"),
  fileName: document.querySelector("#file-name"),
  dropZone: document.querySelector("#drop-zone"),
  analyseButton: document.querySelector("#analyse-button"),
  demoButton: document.querySelector("#demo-button"),
  error: document.querySelector("#error-message"),
  hero: document.querySelector("#hero"),
  results: document.querySelector("#results"),
  newChatButton: document.querySelector("#new-chat-button"),
  canvas: document.querySelector("#share-canvas"),
  themeSelect: document.querySelector("#theme-select"),
  downloadButton: document.querySelector("#download-button"),
  shareButton: document.querySelector("#share-button")
};

let selectedFile = null;
let currentAnalysis = null;

elements.tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    elements.tabs.forEach((item) => item.classList.toggle("active", item === tab));
    elements.panels.forEach((panel) => {
      panel.classList.toggle("active", panel.id === `${tab.dataset.tab}-panel`);
    });
    hideError();
  });
});

elements.fileInput.addEventListener("change", () => {
  selectedFile = elements.fileInput.files[0] || null;
  elements.fileName.textContent = selectedFile
    ? `${selectedFile.name} · ${formatFileSize(selectedFile.size)}`
    : "Maximum 25 MB";
  hideError();
});

["dragenter", "dragover"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.add("dragging");
  });
});

["dragleave", "drop"].forEach((eventName) => {
  elements.dropZone.addEventListener(eventName, (event) => {
    event.preventDefault();
    elements.dropZone.classList.remove("dragging");
  });
});

elements.dropZone.addEventListener("drop", (event) => {
  const file = event.dataTransfer.files[0];
  if (file) {
    selectedFile = file;
    elements.fileName.textContent = `${file.name} · ${formatFileSize(file.size)}`;
    hideError();
  }
});

elements.analyseButton.addEventListener("click", async () => {
  try {
    setLoading(true);
    const activeTab = document.querySelector(".tab.active").dataset.tab;
    let text = "";

    if (activeTab === "file") {
      if (!selectedFile) throw new Error("Choose an exported WhatsApp .txt file first.");
      if (selectedFile.size > 25 * 1024 * 1024) throw new Error("That file is over 25 MB. Try a smaller chat export.");
      text = await selectedFile.text();
    } else {
      text = elements.chatInput.value.trim();
      if (!text) throw new Error("Paste your exported chat first.");
    }

    processChat(text);
  } catch (error) {
    showError(error.message || "Something went wrong while reading this chat.");
  } finally {
    setLoading(false);
  }
});

elements.demoButton.addEventListener("click", () => processChat(DEMO_CHAT));
elements.newChatButton.addEventListener("click", resetApp);
elements.themeSelect.addEventListener("change", renderShareCard);
elements.downloadButton.addEventListener("click", downloadCard);
elements.shareButton.addEventListener("click", shareCard);

function processChat(text) {
  hideError();
  const messages = parseWhatsAppChat(text);
  if (messages.length < 5) {
    throw new Error("I couldn't find enough WhatsApp messages. Export the chat without media and try again.");
  }

  currentAnalysis = analyseChat(messages);
  renderResults(currentAnalysis);
  elements.hero.classList.add("hidden");
  elements.results.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function parseWhatsAppChat(text) {
  const normalized = text.replace(/\u200e|\u200f/g, "").replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const messages = [];
  let current = null;

  const patterns = [
    {
      order: "time-first",
      regex: /^\[?(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?),?\s+(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4})\]?\s*[-–]?\s*([^:]+?):\s([\s\S]*)$/i
    },
    {
      order: "date-first",
      regex: /^\[?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\]?\s*[-–]?\s*([^:]+?):\s([\s\S]*)$/i
    },
    {
      order: "date-first",
      regex: /^\[?(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{2,4}),?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap]\.?m\.?)?\]?\s+([^:]+?):\s([\s\S]*)$/i
    }
  ];

  for (const line of lines) {
    let match = null;
    let matchedPattern = null;
    for (const pattern of patterns) {
      match = line.match(pattern.regex);
      matchedPattern = pattern;
      if (match) break;
    }

    if (match) {
      let first;
      let second;
      let yearRaw;
      let hourRaw;
      let minute;
      let secondRaw;
      let meridiem;
      let sender;
      let body;

      if (matchedPattern.order === "time-first") {
        [, hourRaw, minute, secondRaw = "0", meridiem, first, second, yearRaw, sender, body] = match;
      } else {
        [, first, second, yearRaw, hourRaw, minute, secondRaw = "0", meridiem, sender, body] = match;
      }

      const date = buildDate(first, second, yearRaw, hourRaw, minute, secondRaw, meridiem);
      if (!Number.isNaN(date.getTime())) {
        current = {
          date,
          sender: sender.trim(),
          body: body.trim()
        };
        messages.push(current);
      }
    } else if (looksLikeTimestampedSystemLine(line)) {
      current = null;
    } else if (current && line.trim()) {
      current.body += `\n${line.trim()}`;
    }
  }

  return messages.filter((message) => message.sender && !isSystemMessage(message.body));
}

function looksLikeTimestampedSystemLine(line) {
  const dateFirst = /^\[?\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4},?\s+\d{1,2}:\d{2}/i;
  const timeFirst = /^\[?\d{1,2}:\d{2}(?::\d{2})?\s*[ap]\.?m\.?,?\s+\d{1,2}[\/.-]\d{1,2}[\/.-]\d{2,4}/i;
  return dateFirst.test(line) || timeFirst.test(line);
}

function buildDate(first, second, yearRaw, hourRaw, minute, secondRaw, meridiem) {
  const year = Number(yearRaw) < 100 ? 2000 + Number(yearRaw) : Number(yearRaw);
  const a = Number(first);
  const b = Number(second);
  let day = a;
  let month = b;

  if (a <= 12 && b > 12) {
    month = a;
    day = b;
  }

  let hour = Number(hourRaw);
  if (meridiem) {
    const clean = meridiem.toLowerCase().replace(/\./g, "");
    if (clean === "pm" && hour < 12) hour += 12;
    if (clean === "am" && hour === 12) hour = 0;
  }

  return new Date(year, month - 1, day, hour, Number(minute), Number(secondRaw));
}

function isSystemMessage(body) {
  return /messages and calls are end-to-end encrypted|created group|added you|changed the subject|security code changed/i.test(body);
}

function analyseChat(messages) {
  const participants = {};
  const hours = Array(24).fill(0);
  const days = Array(7).fill(0);
  const dayKeys = new Set();
  const words = new Map();
  const emojis = new Map();
  const starters = {};
  const replies = {};
  let longestMessage = messages[0];
  let previousDay = "";

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    const sender = message.sender;
    const dayKey = localDateKey(message.date);

    participants[sender] ||= { count: 0, characters: 0, words: 0 };
    participants[sender].count += 1;
    participants[sender].characters += message.body.length;
    participants[sender].words += tokenize(message.body).length;
    hours[message.date.getHours()] += 1;
    days[(message.date.getDay() + 6) % 7] += 1;
    dayKeys.add(dayKey);

    if (dayKey !== previousDay) {
      starters[sender] = (starters[sender] || 0) + 1;
      previousDay = dayKey;
    }

    if (message.body.length > longestMessage.body.length) longestMessage = message;

    tokenize(message.body).forEach((word) => {
      if (word.length > 2 && !STOP_WORDS.has(word)) words.set(word, (words.get(word) || 0) + 1);
    });

    extractEmojis(message.body).forEach((emoji) => {
      emojis.set(emoji, (emojis.get(emoji) || 0) + 1);
    });

    const previous = messages[index - 1];
    if (previous && previous.sender !== sender) {
      const delay = (message.date - previous.date) / 60000;
      if (delay >= 0 && delay <= 720) {
        replies[sender] ||= [];
        replies[sender].push(delay);
      }
    }
  }

  const sortedParticipants = Object.entries(participants)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.count - a.count);

  const starter = Object.entries(starters).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const replyStats = Object.entries(replies)
    .map(([name, values]) => ({ name, median: median(values), sample: values.length }))
    .filter((item) => item.sample >= 2)
    .sort((a, b) => a.median - b.median);

  const peakHour = hours.indexOf(Math.max(...hours));
  const activeDates = [...dayKeys].sort();

  return {
    messages,
    total: messages.length,
    participants: sortedParticipants,
    firstDate: messages[0].date,
    lastDate: messages[messages.length - 1].date,
    starter: { name: starter[0], days: starter[1] },
    fastest: replyStats[0] || null,
    peakHour,
    hours,
    days,
    longestStreak: calculateStreak(activeDates),
    longestMessage,
    topWords: [...words.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14),
    topEmojis: [...emojis.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
  };
}

function tokenize(text) {
  return text
    .toLocaleLowerCase()
    .replace(/https?:\/\/\S+/g, "")
    .replace(/[^\p{L}\p{N}'’]+/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function extractEmojis(text) {
  return text.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu) || [];
}

function calculateStreak(sortedDateKeys) {
  if (!sortedDateKeys.length) return 0;
  let longest = 1;
  let current = 1;
  for (let index = 1; index < sortedDateKeys.length; index += 1) {
    const previous = new Date(`${sortedDateKeys[index - 1]}T00:00:00`);
    const next = new Date(`${sortedDateKeys[index]}T00:00:00`);
    const difference = Math.round((next - previous) / 86400000);
    current = difference === 1 ? current + 1 : 1;
    longest = Math.max(longest, current);
  }
  return longest;
}

function renderResults(data) {
  const names = data.participants.slice(0, 3).map((item) => firstName(item.name));
  setText("results-title", names.length === 2 ? `${names[0]} + ${names[1]}` : "Your group Wrapped");
  setText("date-range", `${formatDate(data.firstDate)} to ${formatDate(data.lastDate)}`);
  setText("total-messages", data.total.toLocaleString("en-IN"));
  setText("total-subtext", `${data.participants.length} people · ${daysBetween(data.firstDate, data.lastDate)} days`);
  setText("starter-name", firstName(data.starter.name));
  setText("starter-subtext", `started the chat on ${data.starter.days} different days`);
  setText("fastest-name", data.fastest ? firstName(data.fastest.name) : "Not enough data");
  setText("fastest-time", data.fastest ? `${formatDuration(data.fastest.median)} median reply time` : "More replies needed");
  setText("peak-hour", formatHour(data.peakHour));
  setText("peak-hour-subtext", `${data.hours[data.peakHour].toLocaleString("en-IN")} messages sent around this hour`);
  setText("longest-streak", `${data.longestStreak} days`);
  setText("longest-message", `${data.longestMessage.body.length} chars`);
  setText("longest-message-subtext", `sent by ${firstName(data.longestMessage.sender)}`);

  renderMessageBars(data.hours);
  renderParticipants(data.participants, data.total);
  renderWords(data.topWords);
  renderEmojis(data.topEmojis);
  renderDays(data.days);
  renderShareCard();
}

function renderMessageBars(hours) {
  const max = Math.max(...hours);
  document.querySelector("#message-bars").innerHTML = hours
    .map((count) => `<span style="height:${Math.max(10, (count / max) * 100)}%"></span>`)
    .join("");
}

function renderParticipants(participants, total) {
  document.querySelector("#participant-list").innerHTML = participants.slice(0, 6).map((person) => {
    const percentage = Math.round((person.count / total) * 100);
    return `<div class="participant-row">
      <div class="participant-meta">
        <span>${escapeHtml(person.name)}</span>
        <span>${person.count.toLocaleString("en-IN")} · ${percentage}%</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${percentage}%"></div></div>
    </div>`;
  }).join("");
}

function renderWords(topWords) {
  const container = document.querySelector("#word-cloud");
  if (!topWords.length) {
    container.innerHTML = "<span>No repeated words yet</span>";
    return;
  }
  const max = topWords[0][1];
  container.innerHTML = topWords.map(([word, count], index) => {
    const size = 16 + (count / max) * 25;
    const opacity = Math.max(0.55, 1 - index * 0.035);
    return `<span style="font-size:${size}px;opacity:${opacity}" title="${count} times">${escapeHtml(word)}</span>`;
  }).join("");
}

function renderEmojis(topEmojis) {
  const container = document.querySelector("#emoji-list");
  if (!topEmojis.length) {
    container.innerHTML = `<div class="emoji-item"><strong>—</strong><span>No emojis</span></div>`;
    return;
  }
  container.innerHTML = topEmojis.map(([emoji, count]) =>
    `<div class="emoji-item"><strong>${emoji}</strong><span>${count} times</span></div>`
  ).join("");
}

function renderDays(days) {
  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const max = Math.max(...days);
  document.querySelector("#day-chart").innerHTML = days.map((count, index) => {
    const height = max ? Math.max(3, (count / max) * 165) : 3;
    return `<div class="day-column" title="${count} messages">
      <div class="day-bar" style="height:${height}px"></div>
      <span>${labels[index]}</span>
    </div>`;
  }).join("");
}

function renderShareCard() {
  if (!currentAnalysis) return;
  const canvas = elements.canvas;
  const ctx = canvas.getContext("2d");
  const theme = elements.themeSelect.value;
  const themes = {
    midnight: { bg: "#14121c", accent: "#d8ff63", secondary: "#7655ff", text: "#ffffff", muted: "#aaa7b4" },
    lime: { bg: "#d8ff63", accent: "#14121c", secondary: "#7655ff", text: "#14121c", muted: "#4b5039" },
    sunset: { bg: "#ff6b4a", accent: "#ffe66d", secondary: "#8b3dff", text: "#ffffff", muted: "#ffe3dc" }
  };
  const colors = themes[theme];
  const data = currentAnalysis;
  const topNames = data.participants.slice(0, 2).map((item) => firstName(item.name));

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.18;
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(940, 100, 280, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(70, 1240, 330, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  drawPill(ctx, 70, 64, 300, 60, colors.accent, colors.bg, "CHAT WRAPPED 2026");

  ctx.fillStyle = colors.text;
  ctx.font = "800 76px system-ui, sans-serif";
  ctx.fillText(topNames.length === 2 ? `${topNames[0]} + ${topNames[1]}` : "The group chat", 70, 220);

  ctx.fillStyle = colors.muted;
  ctx.font = "500 28px system-ui, sans-serif";
  ctx.fillText(`${formatDate(data.firstDate)} - ${formatDate(data.lastDate)}`, 72, 270);

  drawCardMetric(ctx, 70, 350, 940, 260, colors, data.total.toLocaleString("en-IN"), "messages exchanged");
  drawCardMetric(ctx, 70, 640, 450, 250, colors, firstName(data.starter.name), "starts the chat most");
  drawCardMetric(ctx, 560, 640, 450, 250, colors, formatHour(data.peakHour), "peak chat hour");

  ctx.fillStyle = colors.text;
  ctx.font = "800 42px system-ui, sans-serif";
  ctx.fillText("The scoreboard", 70, 980);

  data.participants.slice(0, 3).forEach((person, index) => {
    const y = 1045 + index * 72;
    const percent = Math.round((person.count / data.total) * 100);
    ctx.fillStyle = colors.muted;
    ctx.font = "700 26px system-ui, sans-serif";
    ctx.fillText(firstName(person.name), 70, y);
    ctx.fillStyle = colors.text;
    ctx.fillText(`${percent}%`, 930, y);
    ctx.fillStyle = colorWithAlpha(colors.text, 0.15);
    roundRect(ctx, 250, y - 24, 640, 22, 11);
    ctx.fill();
    ctx.fillStyle = colors.accent;
    roundRect(ctx, 250, y - 24, 640 * (percent / 100), 22, 11);
    ctx.fill();
  });

  ctx.fillStyle = colors.muted;
  ctx.font = "600 22px system-ui, sans-serif";
  ctx.fillText("Made privately on your device", 70, 1290);
  ctx.fillStyle = colors.accent;
  ctx.font = "800 22px system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Make yours free", 1010, 1260);
  ctx.font = "700 18px system-ui, sans-serif";
  ctx.fillText(PRODUCT_URL.replace("https://", ""), 1010, 1292);
  ctx.textAlign = "left";
}

function drawCardMetric(ctx, x, y, width, height, colors, value, label) {
  ctx.fillStyle = colorWithAlpha(colors.text, 0.08);
  roundRect(ctx, x, y, width, height, 34);
  ctx.fill();
  ctx.fillStyle = colors.text;
  const size = value.length > 14 ? 54 : width > 500 ? 104 : 58;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.fillText(value, x + 36, y + 115);
  ctx.fillStyle = colors.muted;
  ctx.font = "600 25px system-ui, sans-serif";
  ctx.fillText(label, x + 38, y + height - 45);
}

function drawPill(ctx, x, y, width, height, fill, textColor, text) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
  ctx.fillStyle = textColor;
  ctx.font = "800 20px system-ui, sans-serif";
  ctx.fillText(text, x + 25, y + 39);
}

function roundRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

async function shareCard() {
  if (!currentAnalysis) return;
  const blob = await canvasToBlob(elements.canvas);
  const file = new File([blob], "chat-wrapped.png", { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "My Chat Wrapped",
      text: `The group chat receipts are in. Make yours free: ${PRODUCT_URL}`,
      files: [file]
    });
  } else {
    downloadCard();
  }
}

function downloadCard() {
  const link = document.createElement("a");
  link.download = "chat-wrapped.png";
  link.href = elements.canvas.toDataURL("image/png");
  link.click();
}

function canvasToBlob(canvas) {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

function resetApp() {
  currentAnalysis = null;
  selectedFile = null;
  elements.fileInput.value = "";
  elements.chatInput.value = "";
  elements.fileName.textContent = "Maximum 25 MB";
  elements.results.classList.add("hidden");
  elements.hero.classList.remove("hidden");
  hideError();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function firstName(name) {
  const clean = String(name).replace(/^\+?\d[\d\s-]{7,}$/, "Contact");
  return clean.split(/\s+/)[0].slice(0, 18);
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function formatDuration(minutes) {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${Math.round(minutes)} min`;
  return `${(minutes / 60).toFixed(1)} hr`;
}

function formatHour(hour) {
  const suffix = hour >= 12 ? "PM" : "AM";
  const display = hour % 12 || 12;
  return `${display}:00 ${suffix}`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function daysBetween(a, b) {
  return Math.max(1, Math.round((b - a) / 86400000) + 1);
}

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function setText(id, value) {
  document.querySelector(`#${id}`).textContent = value;
}

function colorWithAlpha(hex, alpha) {
  const clean = hex.replace("#", "");
  const value = parseInt(clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function escapeHtml(value) {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function setLoading(loading) {
  elements.analyseButton.disabled = loading;
  elements.analyseButton.firstChild.textContent = loading ? "Reading your chat... " : "Create my Wrapped ";
}

function showError(message) {
  elements.error.textContent = message;
  elements.error.classList.add("visible");
}

function hideError() {
  elements.error.classList.remove("visible");
  elements.error.textContent = "";
}

window.ChatWrapped = { parseWhatsAppChat, analyseChat };
