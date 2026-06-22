require("dotenv").config();

const fs = require("fs");
const path = require("path");
const http = require("http");
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActivityType
} = require("discord.js");

const {
  createAfkVoiceManager,
  DEFAULT_AFK_VOICE_CONFIG,
  OWNER_ID: PAK_HANSIP_OWNER_ID
} = require("./services/afkVoiceManager");

const PREFIX = "h";
const SERVER_NAME = "DESA TULUS";
const COLOR = 0x7DBD77;
const DESA_TULUS_EMOJI = "<a:Desa_Tulus2:1518502350363430932>";
const DESA_TULUS_FOOTER = `${DESA_TULUS_EMOJI}  DESA TULUS |`;
const DATA_DIR = path.join(__dirname, "data");
const CONFIG_FILE = path.join(__dirname, "config.json");
const AFK_FILE = path.join(DATA_DIR, "hansip-afk.json");
const MABAR_FILE = path.join(DATA_DIR, "hansip-mabar.json");
const WORD_FILE = path.join(DATA_DIR, "hansip-sambung-kata.json");
const NOTES_FILE = path.join(DATA_DIR, "hansip-notes.json");
const WARN_FILE = path.join(DATA_DIR, "hansip-warnings.json");

const REMOVED_OLD_FEATURE_COMMANDS = new Set([
  "hstart", "hmap", "hh", "hhunt", "hb", "hbattle", "hdungeon", "hraid",
  "hpet", "hcraft", "hupgrade", "hseason", "hcollection", "hguild",
  "hstory", "hbasecamp", "hfarm", "hfish", "hcook", "hrace", "hrisk",
  "hlucky", "hchaos", "hrest", "hweather", "hzoo", "hnpc", "hcard",
  "hinv", "hinventory", "hprofil", "hprofile", "hteam", "hluck",
  "hopen", "hevolve", "hequip", "hweapon", "hlock", "hunlock",
  "hrelease", "hkerja", "hwork", "hslots", "hgive", "hcash", "hbal",
  "hcoin", "hbj", "hblackjack", "hhoki", "hcf", "hroyale", "hkartu",
  "hdaily", "hquest", "hshop", "hbuy", "htop", "hlb", "hrank",
  "hchannel", "hsetup", "hregenimage", "himage", "hgivecoin", "hgivexp",
  "hgivecrate", "hgiveweapon", "hgivenpc", "hresetplayer", "hsetevent",
  "hsetmaxbet", "hassetcheck", "hnpcimagecheck", "hflow", "hgame", "hgames"
]);

const CUSTOM_STATUSES = [
  `${DESA_TULUS_EMOJI} Memantau Gerak-Gerik Warga`,
  `${DESA_TULUS_EMOJI} Siaga Menjaga Lingkungan`,
  `${DESA_TULUS_EMOJI} Ronda Dulu, Ngopi Nanti`,
  `${DESA_TULUS_EMOJI} Tertib Sebelum Ditegur`
];

const DEFAULT_CONFIG = {
  serverName: SERVER_NAME,
  botName: "Pak Hansip",
  prefix: PREFIX,
  embedColor: "#7DBD77",
  staffRoleId: "",
  reportChannelId: "",
  suggestionChannelId: "",
  logChannelId: "",
  mabarChannelId: "",
  sambungKataChannelId: "",
  welcomeChannelId: "",
  dashboardEnabled: true,
  dashboardPort: process.env.PORT || 3000,
  afkVoice: DEFAULT_AFK_VOICE_CONFIG,
  hansipAuditRole: {
    enabled: true,
    channelId: "",
    autoCreateChannel: true,
    channelName: "audit-role-hansip",
    allowAutoAudit: true,
    autoAuditSchedule: "weekly",
    timezone: "Asia/Jakarta",
    lastAuditAt: null,
    mentionOwnerOnDanger: true,
    dangerThreshold: "high",
    lastAuditSummary: null
  }
};

let customStatusIndex = 0;
let customStatusInterval = null;

function ensureDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  try {
    ensureDir();
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonAtomic(file, data) {
  ensureDir();
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2), "utf8");
  JSON.parse(fs.readFileSync(temp, "utf8"));
  fs.renameSync(temp, file);
}

function loadConfig() {
  const old = readJson(CONFIG_FILE, {});
  return {
    ...DEFAULT_CONFIG,
    ...old,
    serverName: SERVER_NAME,
    botName: "Pak Hansip",
    prefix: PREFIX,
    embedColor: "#7DBD77",
    afkVoice: { ...DEFAULT_CONFIG.afkVoice, ...(old.afkVoice || {}) },
    hansipAuditRole: { ...DEFAULT_CONFIG.hansipAuditRole, ...(old.hansipAuditRole || {}) },
    features: {
      ...(old.features || {}),
      security: true,
      afk: true,
      mabar: true,
      sambungKata: true,
      voice: true,
      roleAudit: true,
      removedOldFeatures: true
    }
  };
}

let config = loadConfig();

function saveConfig(nextConfig = config) {
  config = {
    ...nextConfig,
    serverName: SERVER_NAME,
    botName: "Pak Hansip",
    prefix: PREFIX,
    embedColor: "#7DBD77"
  };
  writeJsonAtomic(CONFIG_FILE, config);
}

function cleanText(text = "") {
  return String(text).replace(/ORANG[\s_-]*TULUS/gi, SERVER_NAME).trim();
}

function baseEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(cleanText(String(title).startsWith(DESA_TULUS_EMOJI) ? title : `${DESA_TULUS_EMOJI} ${title}`))
    .setDescription(cleanText(description))
    .setFooter({ text: DESA_TULUS_FOOTER })
    .setTimestamp();
}

function firstCommand(content) {
  return String(content || "").trim().split(/\s+/)[0].toLowerCase();
}

function isOwner(message) {
  return message.author?.id === PAK_HANSIP_OWNER_ID;
}

function isStaff(message) {
  if (!message.member) return false;
  if (isOwner(message)) return true;
  if (message.guild?.ownerId === message.author.id) return true;
  if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return true;
  return Boolean(config.staffRoleId && message.member.roles.cache.has(config.staffRoleId));
}

function startCustomStatus(client) {
  if (customStatusInterval) clearInterval(customStatusInterval);
  customStatusIndex = 0;

  const update = () => {
    const state = CUSTOM_STATUSES[customStatusIndex % CUSTOM_STATUSES.length];
    client.user.setPresence({
      status: "online",
      activities: [{ type: ActivityType.Custom, name: "Custom Status", state }]
    });
    customStatusIndex = (customStatusIndex + 1) % CUSTOM_STATUSES.length;
  };

  update();
  customStatusInterval = setInterval(update, 15_000);
  if (typeof customStatusInterval.unref === "function") customStatusInterval.unref();
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates
  ]
});

const afkVoice = createAfkVoiceManager({
  client,
  getConfig: () => config,
  saveConfig: async next => saveConfig(next),
  logger: console
});

function afkVoiceHelp() {
  return baseEmbed(
    "AFK Voice 24/7 Pak Hansip",
    "`h24/7 #channel-voice` — Pilih lokasi penjagaan.\n" +
      "`h24/7 status` — Lihat status penjagaan.\n" +
      "`h24/7 reconnect` — Hubungkan ulang.\n" +
      "`h24/7 on` — Aktifkan kembali.\n" +
      "`h24/7 off` — Berhenti berjaga dan keluar.\n" +
      "`hmute` — Mute Pak Hansip di voice.\n" +
      "`hunmute` — Unmute Pak Hansip di voice."
  );
}

function afkVoiceStatusEmbed(status) {
  return new EmbedBuilder()
    .setColor(COLOR)
    .setTitle(`${DESA_TULUS_EMOJI} AFK Voice 24/7 Pak Hansip`)
    .setDescription("Pak Hansip akan tetap berjaga di voice channel selama proses bot dan hosting aktif.")
    .addFields(
      { name: "Status", value: status.statusText || "-", inline: true },
      { name: "Voice Channel", value: status.storedChannel ? `${status.storedChannel}` : "Belum disetting", inline: true },
      { name: "Channel ID", value: status.storedChannelId ? `\`${status.storedChannelId}\`` : "-", inline: true },
      { name: "Voice Saat Ini", value: status.activeChannel ? `${status.activeChannel}` : "-", inline: true },
      { name: "Self Mute", value: status.selfMute ? "Aktif" : "Nonaktif", inline: true },
      { name: "Self Deaf", value: status.selfDeaf ? "Aktif" : "Nonaktif", inline: true },
      { name: "Auto Reconnect", value: status.autoReconnect ? "Aktif" : "Nonaktif", inline: true },
      { name: "Reconnect", value: `${status.reconnectAttempts || 0} percobaan`, inline: true },
      { name: "Last Error", value: status.lastError ? String(status.lastError).slice(0, 900) : "-", inline: false }
    )
    .setFooter({ text: DESA_TULUS_FOOTER })
    .setTimestamp();
}

async function handleVoiceCommands(message) {
  const cmd = firstCommand(message.content);
  if (!["h24/7", "hmute", "hunmute"].includes(cmd)) return false;

  if (!isOwner(message)) {
    await message.reply("Command ini hanya dapat digunakan oleh owner Pak Hansip.");
    return true;
  }

  if (cmd === "hmute" || cmd === "hunmute") {
    const status = afkVoice.getAfkVoiceStatus();
    if (!status.activeChannel) {
      await message.reply("Pak Hansip sedang tidak berjaga di voice channel. Gunakan h24/7 #channel-voice terlebih dahulu.");
      return true;
    }

    const targetMute = cmd === "hmute";
    if (status.selfMute === targetMute) {
      await message.reply(targetMute ? "Pak Hansip sudah dalam keadaan mute." : "Pak Hansip sudah dalam keadaan unmute.");
      return true;
    }

    const result = await afkVoice.setSelfMute(targetMute);
    await message.reply(result.ok
      ? (targetMute ? "Pak Hansip berhasil dimute dan tetap berjaga di voice channel." : "Pak Hansip berhasil di-unmute dan tetap berjaga di voice channel.")
      : (result.message || "Status mute Pak Hansip gagal diperbarui. Gunakan h24/7 reconnect, lalu coba kembali.")
    );
    return true;
  }

  const parts = String(message.content).trim().split(/\s+/);
  const sub = (parts[1] || "").toLowerCase();

  if (!sub || sub === "help") {
    await message.reply({ embeds: [afkVoiceHelp()] });
    return true;
  }

  if (sub === "status") {
    await message.reply({ embeds: [afkVoiceStatusEmbed(afkVoice.getAfkVoiceStatus())] });
    return true;
  }

  if (sub === "off") {
    await afkVoice.disconnectAfkVoice();
    await message.reply("Penjagaan AFK Voice 24/7 Pak Hansip telah dinonaktifkan.");
    return true;
  }

  if (sub === "on") {
    if (!config.afkVoice?.channelId) {
      await message.reply("Belum ada voice channel tersimpan. Gunakan h24/7 #channel-voice terlebih dahulu.");
      return true;
    }
    config.afkVoice.enabled = true;
    saveConfig(config);
    const result = await afkVoice.connectAfkVoice({ reason: "owner-command", force: true });
    await message.reply(result.ok ? (result.softReady ? `Pak Hansip sudah diarahkan berjaga 24/7 di voice channel ${result.channel}. Jika belum terlihat, gunakan h24/7 status lalu h24/7 reconnect.` : `Pak Hansip sekarang berjaga 24/7 di voice channel ${result.channel}.`) : result.message);
    return true;
  }

  if (sub === "reconnect") {
    if (!config.afkVoice?.enabled) {
      await message.reply("Penjagaan AFK Voice Pak Hansip sedang nonaktif. Gunakan h24/7 on terlebih dahulu.");
      return true;
    }
    if (!config.afkVoice?.channelId) {
      await message.reply("Belum ada voice channel tersimpan. Gunakan h24/7 #channel-voice terlebih dahulu.");
      return true;
    }
    const result = await afkVoice.reconnectAfkVoice();
    await message.reply(result.ok ? (result.softReady ? `Pak Hansip sudah diarahkan reconnect ke ${result.channel}. Jika belum terlihat, cek permission voice lalu coba lagi.` : `Pak Hansip berhasil dihubungkan ulang ke ${result.channel}.`) : result.message);
    return true;
  }

  const mention = message.content.match(/<#(\d{15,25})>/);
  if (!mention) {
    await message.reply("Mention voice channel yang ingin digunakan. Contoh: h24/7 #pos-ronda.");
    return true;
  }

  let channel = message.guild.channels.cache.get(mention[1]) || null;
  if (!channel) {
    try { channel = await message.guild.channels.fetch(mention[1]); } catch { channel = null; }
  }

  if (!channel || channel.guildId !== message.guild.id) {
    await message.reply("Voice channel tidak ditemukan di server DESA TULUS.");
    return true;
  }

  if (channel.type !== ChannelType.GuildVoice) {
    await message.reply("Channel yang dipilih bukan voice channel.");
    return true;
  }

  const validation = await afkVoice.validateVoiceChannel(message.guild, channel.id);
  if (!validation.ok) {
    await message.reply(validation.message);
    return true;
  }

  const before = afkVoice.getAfkVoiceStatus();
  const result = await afkVoice.switchAfkVoiceChannel(channel, message.author.id);
  if (!result.ok) {
    await message.reply(result.message || "Pak Hansip gagal bergabung ke voice channel. Periksa permission dan coba kembali.");
    return true;
  }

  if (result.already || before.storedChannelId === channel.id) {
    await message.reply(`Pak Hansip sudah berjaga di ${channel}.`);
  } else if (before.storedChannelId) {
    await message.reply(`Lokasi penjagaan Pak Hansip berhasil dipindahkan ke ${channel}.`);
  } else {
    await message.reply(result.softReady ? `Pak Hansip sudah diarahkan berjaga 24/7 di voice channel ${channel}. Jika belum terlihat, cek permission voice dan tunggu sebentar.` : `Pak Hansip sekarang berjaga 24/7 di voice channel ${channel}.`);
  }

  return true;
}

const HIGH_PERMS = ["Administrator", "ManageGuild", "ManageRoles", "BanMembers", "KickMembers"];
const MEDIUM_PERMS = ["ManageChannels", "ManageMessages", "ManageWebhooks", "MentionEveryone", "ModerateMembers", "ViewAuditLog", "ManageNicknames", "ManageEvents", "ManageThreads"];

function prettyPerm(name) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function rolePerms(role) {
  return [...HIGH_PERMS, ...MEDIUM_PERMS].filter(p => role.permissions.has(PermissionFlagsBits[p])).map(prettyPerm);
}

function auditRoles(guild) {
  const high = [];
  const medium = [];
  const safe = [];
  const bots = [];

  guild.roles.cache.filter(r => r.id !== guild.id).forEach(role => {
    const highList = HIGH_PERMS.filter(p => role.permissions.has(PermissionFlagsBits[p]));
    const medList = MEDIUM_PERMS.filter(p => role.permissions.has(PermissionFlagsBits[p]));
    const item = { role, perms: rolePerms(role) };
    if (highList.length) high.push(item);
    else if (medList.length) medium.push(item);
    else safe.push(item);
    if (role.managed) bots.push(item);
  });

  return { total: high.length + medium.length + safe.length, high, medium, safe, bots };
}

function roleList(items, empty) {
  if (!items.length) return empty;
  const lines = items.slice(0, 10).map(i => `${i.role} — ${i.perms.length ? i.perms.join(", ") : "Bot managed role"}`);
  if (items.length > 10) lines.push(`…dan ${items.length - 10} role lainnya.`);
  return lines.join("\n").slice(0, 1000);
}

async function ensureAuditChannel(guild) {
  const cfg = config.hansipAuditRole;
  let ch = cfg.channelId ? guild.channels.cache.get(cfg.channelId) : null;
  if (ch?.isTextBased()) return ch;

  ch = guild.channels.cache.find(c => c.name === (cfg.channelName || "audit-role-hansip") && c.isTextBased()) || null;
  if (ch) {
    cfg.channelId = ch.id;
    saveConfig(config);
    return ch;
  }

  if (!cfg.autoCreateChannel) return null;
  if (!guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
    throw new Error("Pak Hansip belum punya izin Manage Channels untuk membuat channel audit otomatis. Buat channel manual lalu jalankan hsetauditrole #channel.");
  }

  ch = await guild.channels.create({
    name: cfg.channelName || "audit-role-hansip",
    type: ChannelType.GuildText,
    reason: "Channel khusus Audit Role Cepat Pak Hansip.",
    permissionOverwrites: [
      { id: guild.roles.everyone.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: guild.members.me.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.ReadMessageHistory] }
    ]
  });
  cfg.channelId = ch.id;
  saveConfig(config);
  return ch;
}

async function runRoleAudit(guild, triggeredBy = null) {
  if (!config.hansipAuditRole.enabled) throw new Error("Fitur audit role sedang nonaktif. Aktifkan dengan hauditrole on.");
  const channel = await ensureAuditChannel(guild);
  if (!channel) throw new Error("Channel audit role belum disetting. Gunakan hauditrole setup atau hsetauditrole #channel.");

  const data = auditRoles(guild);
  const color = data.high.length ? 0xEF4444 : data.medium.length ? 0xFACC15 : 0x22C55E;

  const summary = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${DESA_TULUS_EMOJI} 🛡️ Audit Role Cepat Hansip`)
    .setDescription("Pemeriksaan permission sensitif pada role server telah selesai.")
    .addFields(
      { name: "📌 Ringkasan", value: `Total role dicek: **${data.total}**\nRole aman: **${data.safe.length}**\nRole perlu dicek: **${data.medium.length}**\nRole berisiko tinggi: **${data.high.length}**\nRole bot/integrasi: **${data.bots.length}**` },
      { name: "🚨 Risiko Tinggi", value: roleList(data.high, "Tidak ada role berisiko tinggi.") },
      { name: "⚠️ Perlu Dicek", value: roleList(data.medium, "Tidak ada role yang perlu dicek.") }
    )
    .setFooter({ text: DESA_TULUS_FOOTER })
    .setTimestamp();

  const detail = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${DESA_TULUS_EMOJI} 📋 Detail Audit Role`)
    .addFields(
      { name: "🤖 Role Bot / Integrasi", value: roleList(data.bots, "Tidak ada role bot/integrasi yang terdeteksi.") },
      { name: "✅ Catatan Hansip", value: "Pastikan role member biasa tidak punya permission sensitif.\nPastikan role bot hanya punya izin sesuai kebutuhan.\nPastikan role Pak Hansip berada di atas role yang perlu dikelola.\nHindari memberikan Administrator ke role yang tidak wajib." }
    )
    .setFooter({ text: DESA_TULUS_FOOTER })
    .setTimestamp();

  await channel.send({ embeds: [summary, detail] });
  config.hansipAuditRole.lastAuditAt = new Date().toISOString();
  config.hansipAuditRole.lastAuditSummary = { totalRoles: data.total, warningRoles: data.medium.length, dangerRoles: data.high.length, botRoles: data.bots.length, triggeredBy: triggeredBy?.id || null };
  saveConfig(config);
  return { channel, data };
}

async function handleAuditCommands(message) {
  const cmd = firstCommand(message.content);
  if (!["hauditrole", "hsetauditrole"].includes(cmd)) return false;
  if (!isStaff(message)) {
    await message.reply("Fitur ini hanya untuk owner/staff keamanan.");
    return true;
  }

  if (cmd === "hsetauditrole") {
    const ch = message.mentions.channels.first();
    if (!ch || !ch.isTextBased()) {
      await message.reply("Channel audit role tidak valid. Gunakan `hsetauditrole #channel`.");
      return true;
    }
    config.hansipAuditRole.channelId = ch.id;
    config.hansipAuditRole.enabled = true;
    saveConfig(config);
    await message.reply(`✅ Channel audit role berhasil disetel ke ${ch}.`);
    return true;
  }

  const sub = String(message.content.trim().split(/\s+/)[1] || "now").toLowerCase();

  if (sub === "setup") {
    const ch = await ensureAuditChannel(message.guild);
    await message.reply({ embeds: [baseEmbed("✅ Channel Audit Role Siap", `Channel audit role berhasil disiapkan di ${ch}.`)] });
    return true;
  }

  if (sub === "status") {
    const cfg = config.hansipAuditRole;
    await message.reply({ embeds: [baseEmbed("🛡️ Status Audit Role Cepat", `Fitur: **${cfg.enabled ? "Aktif" : "Nonaktif"}**\nChannel: ${cfg.channelId ? `<#${cfg.channelId}>` : "Belum disetting"}\nAuto audit: **${cfg.allowAutoAudit ? "Aktif" : "Nonaktif"}**\nJadwal: **${cfg.autoAuditSchedule || "weekly"}**\nAudit terakhir: ${cfg.lastAuditAt ? `<t:${Math.floor(new Date(cfg.lastAuditAt).getTime() / 1000)}:R>` : "-"}`)] });
    return true;
  }

  if (sub === "off") {
    config.hansipAuditRole.enabled = false;
    saveConfig(config);
    await message.reply("✅ Fitur audit role dimatikan. Channel dan data tidak dihapus.");
    return true;
  }

  if (sub === "on") {
    config.hansipAuditRole.enabled = true;
    saveConfig(config);
    await message.reply(config.hansipAuditRole.channelId ? "✅ Fitur audit role aktif kembali." : "Fitur audit role sudah aktif, tapi channel belum disetting. Gunakan `hauditrole setup` atau `hsetauditrole #channel`.");
    return true;
  }

  const result = await runRoleAudit(message.guild, message.author);
  await message.reply(`Audit role selesai. Laporan dikirim ke ${result.channel}.`);
  return true;
}

async function handleAfk(message) {
  if (firstCommand(message.content) !== "hafk") return false;
  const reason = message.content.split(/\s+/).slice(1).join(" ") || "AFK";
  const data = readJson(AFK_FILE, {});
  data[message.author.id] = { reason, since: Date.now() };
  writeJsonAtomic(AFK_FILE, data);
  await message.reply({ embeds: [baseEmbed("DESA TULUS | Status AFK", `😴 ${message.member} sekarang AFK...\n📝 Alasan: ${reason}`)] });
  return true;
}

async function handleMabar(message) {
  if (firstCommand(message.content) !== "hmabar") return false;
  const data = readJson(MABAR_FILE, []);
  data.push({ userId: message.author.id, at: Date.now() });
  writeJsonAtomic(MABAR_FILE, data.slice(-200));
  await message.reply({ embeds: [baseEmbed("🌾 Cari Mabar DESA TULUS", "Cari teman main di desa dengan rapi. Sebutkan permainan, mode, slot, dan waktu di channel yang sesuai.")] });
  return true;
}

async function handleSambungKata(message) {
  if (firstCommand(message.content) !== "hsambungkata") return false;
  const data = readJson(WORD_FILE, { active: true, lastWord: null });
  data.active = true;
  writeJsonAtomic(WORD_FILE, data);
  await message.reply({ embeds: [baseEmbed("🔤 Sambung Kata DESA TULUS", "Sambung kata aktif. Kirim kata berikutnya sesuai akhiran kata sebelumnya.")] });
  return true;
}

async function handleCore(message) {
  const cmd = firstCommand(message.content);

  if (REMOVED_OLD_FEATURE_COMMANDS.has(cmd)) {
    await message.reply({ embeds: [baseEmbed("Fitur lama sudah dihapus", "Fitur lama tersebut sudah tidak tersedia di Pak Hansip. Pak Hansip sekarang fokus ke keamanan server, AFK Voice, Audit Role, AFK, Cari Mabar, dan Sambung Kata.")] });
    return true;
  }

  if (cmd === "hhelp" || cmd === "hmenu") {
    await message.reply({ embeds: [baseEmbed("Pusat Bantuan Pak Hansip", "`hping` — cek bot\n`hafk alasan` — set AFK\n`hmabar` — cari mabar\n`hsambungkata` — sambung kata\n`hauditrole setup/status/now` — audit role\n`h24/7 help` — AFK Voice 24/7\n`hmute` / `hunmute` — mute voice bot\n`hlapor` / `hsaran` — kirim laporan/saran\n`hclear`, `hlock`, `hunlock`, `hslowmode` — alat staff")] });
    return true;
  }

  if (cmd === "hping") {
    await message.reply({ embeds: [baseEmbed("Pong", `Respon Pak Hansip aktif. WS: ${Math.round(client.ws.ping)}ms`)] });
    return true;
  }

  if (cmd === "hstatus") {
    await message.reply({ embeds: [baseEmbed("Status Pak Hansip", `Server: **${SERVER_NAME}**\nPrefix: **h**\nMode: **Keamanan Desa**\nAFK Voice: **${config.afkVoice.enabled ? "Aktif" : "Nonaktif"}**`)] });
    return true;
  }

  return false;
}


function configChannelValue(channel) {
  return channel ? `${channel}` : "Belum disetting";
}

function saveNamedChannel(key, channel) {
  config[key] = channel.id;
  saveConfig(config);
}

function getMentionedChannel(message) {
  return message.mentions.channels.first() || null;
}

async function handleSetupCommands(message) {
  const cmd = firstCommand(message.content);
  const allowed = new Set([
    "hsetlog",
    "hsetreport",
    "hsetsaran",
    "hsetmabar",
    "hsetsambung",
    "hsetstaff",
    "hconfig"
  ]);

  if (!allowed.has(cmd)) return false;

  if (!isStaff(message)) {
    await message.reply("Command ini hanya untuk owner/staff keamanan.");
    return true;
  }

  if (cmd === "hconfig") {
    await message.reply({
      embeds: [
        baseEmbed(
          "Konfigurasi Pak Hansip",
          `Log: ${configChannelValue(config.logChannelId ? message.guild.channels.cache.get(config.logChannelId) : null)}\n` +
          `Report: ${configChannelValue(config.reportChannelId ? message.guild.channels.cache.get(config.reportChannelId) : null)}\n` +
          `Saran: ${configChannelValue(config.suggestionChannelId ? message.guild.channels.cache.get(config.suggestionChannelId) : null)}\n` +
          `Mabar: ${configChannelValue(config.mabarChannelId ? message.guild.channels.cache.get(config.mabarChannelId) : null)}\n` +
          `Sambung Kata: ${configChannelValue(config.sambungKataChannelId ? message.guild.channels.cache.get(config.sambungKataChannelId) : null)}\n` +
          `Staff Role: ${config.staffRoleId ? `<@&${config.staffRoleId}>` : "Belum disetting"}`
        )
      ]
    });
    return true;
  }

  if (cmd === "hsetstaff") {
    const role = message.mentions.roles.first();
    if (!role) {
      await message.reply("Mention role staff yang ingin dipakai. Contoh: `hsetstaff @Staff`.");
      return true;
    }

    config.staffRoleId = role.id;
    saveConfig(config);
    await message.reply(`✅ Role staff berhasil disetel ke ${role}.`);
    return true;
  }

  const channel = getMentionedChannel(message);
  if (!channel || !channel.isTextBased()) {
    await message.reply("Mention channel text yang valid.");
    return true;
  }

  const map = {
    hsetlog: ["logChannelId", "log"],
    hsetreport: ["reportChannelId", "laporan"],
    hsetsaran: ["suggestionChannelId", "saran"],
    hsetmabar: ["mabarChannelId", "mabar"],
    hsetsambung: ["sambungKataChannelId", "sambung kata"]
  };

  const [key, label] = map[cmd];
  saveNamedChannel(key, channel);
  await message.reply(`✅ Channel ${label} berhasil disetel ke ${channel}.`);
  return true;
}

async function handleSecurityCommands(message) {
  const cmd = firstCommand(message.content);
  const adminCommands = new Set(["hclear", "hslowmode", "hlock", "hunlock", "hsay", "hnote", "hnotes", "hwarn", "hwarnings"]);

  if (!adminCommands.has(cmd)) return false;

  if (!isStaff(message)) {
    await message.reply("Command ini hanya untuk owner/staff keamanan.");
    return true;
  }

  if (cmd === "hclear") {
    const amount = Math.max(1, Math.min(100, Number(message.content.split(/\s+/)[1]) || 0));
    if (!amount) {
      await message.reply("Format: `hclear 1-100`.");
      return true;
    }
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    const reply = await message.channel.send(`✅ ${deleted?.size || 0} pesan berhasil dibersihkan.`);
    setTimeout(() => reply.delete().catch(() => {}), 4000);
    return true;
  }

  if (cmd === "hslowmode") {
    const seconds = Math.max(0, Math.min(21600, Number(message.content.split(/\s+/)[1]) || 0));
    await message.channel.setRateLimitPerUser(seconds, "Slowmode Pak Hansip").catch(async () => {
      await message.reply("Pak Hansip belum punya izin mengatur slowmode channel ini.");
    });
    await message.reply(`✅ Slowmode channel disetel ke **${seconds} detik**.`);
    return true;
  }

  if (cmd === "hlock" || cmd === "hunlock") {
    const locked = cmd === "hlock";
    await message.channel.permissionOverwrites.edit(message.guild.roles.everyone, {
      SendMessages: locked ? false : null
    }).catch(async () => {
      await message.reply("Pak Hansip belum punya izin mengatur channel ini.");
    });
    await message.reply(locked ? "🔒 Channel dikunci." : "🔓 Channel dibuka kembali.");
    return true;
  }

  if (cmd === "hsay") {
    const text = message.content.split(/\s+/).slice(1).join(" ").trim();
    if (!text) {
      await message.reply("Format: `hsay isi pesan`.");
      return true;
    }
    await message.delete().catch(() => {});
    await message.channel.send(cleanText(text));
    return true;
  }

  if (cmd === "hnote") {
    const target = message.mentions.users.first();
    const noteText = message.content.split(/\s+/).slice(2).join(" ").trim();
    if (!target || !noteText) {
      await message.reply("Format: `hnote @user catatan`.");
      return true;
    }
    const notes = readJson(NOTES_FILE, {});
    notes[target.id] = notes[target.id] || [];
    notes[target.id].push({ by: message.author.id, text: noteText, at: Date.now() });
    writeJsonAtomic(NOTES_FILE, notes);
    await message.reply(`✅ Catatan untuk ${target} tersimpan.`);
    return true;
  }

  if (cmd === "hnotes") {
    const target = message.mentions.users.first() || message.author;
    const notes = readJson(NOTES_FILE, {});
    const list = (notes[target.id] || []).slice(-10).map((item, index) => `${index + 1}. ${item.text}`).join("\n") || "Belum ada catatan.";
    await message.reply({ embeds: [baseEmbed(`Catatan ${target.username}`, list)] });
    return true;
  }

  if (cmd === "hwarn") {
    const target = message.mentions.users.first();
    const reason = message.content.split(/\s+/).slice(2).join(" ").trim() || "Tidak ada alasan.";
    if (!target) {
      await message.reply("Format: `hwarn @user alasan`.");
      return true;
    }
    const warns = readJson(WARN_FILE, {});
    warns[target.id] = warns[target.id] || [];
    warns[target.id].push({ by: message.author.id, reason, at: Date.now() });
    writeJsonAtomic(WARN_FILE, warns);
    await message.reply(`✅ Warning untuk ${target} tersimpan.`);
    return true;
  }

  if (cmd === "hwarnings") {
    const target = message.mentions.users.first() || message.author;
    const warns = readJson(WARN_FILE, {});
    const list = (warns[target.id] || []).slice(-10).map((item, index) => `${index + 1}. ${item.reason}`).join("\n") || "Belum ada warning.";
    await message.reply({ embeds: [baseEmbed(`Warning ${target.username}`, list)] });
    return true;
  }

  return false;
}

async function handleReportSuggestion(message) {
  const cmd = firstCommand(message.content);
  if (!["hlapor", "hsaran"].includes(cmd)) return false;

  const text = message.content.split(/\s+/).slice(1).join(" ").trim();
  if (!text) {
    await message.reply(cmd === "hlapor" ? "Format: `hlapor isi laporan`." : "Format: `hsaran isi saran`.");
    return true;
  }

  const channelId = cmd === "hlapor" ? config.reportChannelId : config.suggestionChannelId;
  const channel = channelId ? message.guild.channels.cache.get(channelId) : null;
  const title = cmd === "hlapor" ? "📮 Laporan Warga" : "💡 Saran Warga";

  if (!channel?.isTextBased()) {
    await message.reply(cmd === "hlapor" ? "Channel laporan belum disetting. Staff bisa memakai `hsetreport #channel`." : "Channel saran belum disetting. Staff bisa memakai `hsetsaran #channel`.");
    return true;
  }

  await channel.send({
    embeds: [
      baseEmbed(title, `Pengirim: ${message.author}\nChannel: ${message.channel}\n\n${text}`)
    ]
  });
  await message.reply(cmd === "hlapor" ? "✅ Laporan kamu sudah dikirim ke staff." : "✅ Saran kamu sudah dikirim.");
  return true;
}

function dashboardPage() {
  const cfg = config || {};
  const lastAudit = cfg.hansipAuditRole?.lastAuditSummary;
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Pak Hansip — DESA TULUS</title>
<style>
body{margin:0;background:#0d1710;color:#eaf7e8;font-family:Arial,sans-serif}
.wrap{max-width:980px;margin:0 auto;padding:28px}
.card{background:#132017;border:1px solid #2f4d34;border-radius:18px;padding:18px;margin:14px 0;box-shadow:0 10px 30px #0005}
h1{margin:0 0 6px;color:#baf0b7}
h2{margin:0 0 10px;color:#dff8dc;font-size:20px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.k{opacity:.75}.v{font-weight:700}
.badge{display:inline-block;background:#244e2b;border:1px solid #5aa35c;border-radius:999px;padding:6px 10px;margin:4px 6px 4px 0}
</style>
</head>
<body>
<div class="wrap">
<h1>Pak Hansip — DESA TULUS</h1>
<p>Security Center read-only. Lokasi AFK Voice diatur lewat command owner <b>h24/7 #channel-voice</b>.</p>
<div class="card"><h2>Status</h2><div class="grid">
<div><div class="k">Prefix</div><div class="v">h</div></div>
<div><div class="k">AFK Voice</div><div class="v">${cfg.afkVoice?.enabled ? "Aktif" : "Nonaktif"}</div></div>
<div><div class="k">Voice Channel</div><div class="v">${cfg.afkVoice?.channelId || "-"}</div></div>
<div><div class="k">Audit Role</div><div class="v">${cfg.hansipAuditRole?.enabled ? "Aktif" : "Nonaktif"}</div></div>
</div></div>
<div class="card"><h2>Command Aktif</h2>
<span class="badge">hhelp</span><span class="badge">hafk</span><span class="badge">hmabar</span><span class="badge">hsambungkata</span>
<span class="badge">hauditrole</span><span class="badge">h24/7</span><span class="badge">hmute</span><span class="badge">hunmute</span>
<span class="badge">hlapor</span><span class="badge">hsaran</span>
</div>
<div class="card"><h2>Audit Terakhir</h2>
<p>Total role: ${lastAudit?.totalRoles ?? "-"} • Risiko tinggi: ${lastAudit?.dangerRoles ?? "-"} • Warning: ${lastAudit?.warningRoles ?? "-"}</p>
</div>
</div>
</body></html>`;
}

function startDashboard() {
  if (config.dashboardEnabled === false) return;
  const port = Number(process.env.PORT || config.dashboardPort || 3000);
  const server = http.createServer((req, res) => {
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(dashboardPage());
  });
  server.listen(port, () => console.log(`Dashboard Pak Hansip aktif di port ${port}`));
}


client.once("clientReady", async () => {
  console.log(`${client.user.tag} ONLINE sebagai Pak Hansip`);
  startCustomStatus(client);
  try { await afkVoice.initializeAfkVoice(); } catch (error) { console.error("[AFK VOICE]", error?.message || error); }
  startDashboard();
});

client.on("messageCreate", async message => {
  try {
    if (!message.guild || message.author.bot) return;
    if (await handleVoiceCommands(message)) return;
    if (await handleSetupCommands(message)) return;
    if (await handleSecurityCommands(message)) return;
    if (await handleReportSuggestion(message)) return;
    if (await handleAuditCommands(message)) return;
    if (await handleAfk(message)) return;
    if (await handleMabar(message)) return;
    if (await handleSambungKata(message)) return;
    if (await handleCore(message)) return;
  } catch (error) {
    console.error("[PAK HANSIP ERROR]", error);
    await message.reply("Pak Hansip gagal memproses command itu. Coba lagi sebentar.").catch(() => {});
  }
});

async function shutdown() {
  try { await afkVoice.shutdownAfkVoice(); } catch {}
  process.exit(0);
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
process.on("unhandledRejection", error => console.error("[UNHANDLED]", error));
process.on("uncaughtException", error => console.error("[UNCAUGHT]", error));

if (!process.env.DISCORD_TOKEN) {
  console.error("DISCORD_TOKEN belum diisi.");
  process.exit(1);
}

client.login(process.env.DISCORD_TOKEN);
