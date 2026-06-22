const {
  joinVoiceChannel,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState
} = require("@discordjs/voice");

const { ChannelType, PermissionFlagsBits } = require("discord.js");

const OWNER_ID = "1450656951385067591";
const MAIN_GUILD_ID = "1504495052217651343";

const DEFAULT_AFK_VOICE_CONFIG = {
  enabled: false,
  guildId: MAIN_GUILD_ID,
  channelId: "",
  selfMute: true,
  selfDeaf: true,
  autoReconnect: true,
  reconnectDelayMs: 5000,
  maxReconnectDelayMs: 60000,
  reconnectAttempts: 0,
  lastConnectedAt: null,
  lastDisconnectedAt: null,
  lastError: null,
  updatedAt: null,
  updatedBy: null
};

const STATUS_TEXT = {
  CONNECTED: "Sedang Berjaga",
  CONNECTING: "Sedang Menghubungkan",
  RECONNECTING: "Menghubungkan Ulang",
  DISCONNECTED: "Tidak Terhubung",
  DISABLED: "Penjagaan Dinonaktifkan",
  CHANNEL_NOT_FOUND: "Channel Tidak Ditemukan",
  MISSING_PERMISSION: "Izin Tidak Cukup",
  ERROR: "Gagal Terhubung"
};

function createAfkVoiceManager(options) {
  const client = options.client;
  const getConfig = options.getConfig;
  const saveConfig = options.saveConfig;
  const logger = options.logger || console;

  let reconnectTimer = null;
  let connectingLock = false;
  let manualDisconnect = false;
  let shuttingDown = false;
  let internalStatus = "DISCONNECTED";

  function nowIso() {
    return new Date().toISOString();
  }

  function getAfkVoiceConfig() {
    const config = getConfig();
    config.afkVoice = {
      ...DEFAULT_AFK_VOICE_CONFIG,
      ...(config.afkVoice || {})
    };

    if (config.afkVoice.selfMute === undefined || config.afkVoice.selfMute === null) {
      config.afkVoice.selfMute = true;
    }

    if (config.afkVoice.selfDeaf === undefined || config.afkVoice.selfDeaf === null) {
      config.afkVoice.selfDeaf = true;
    }

    config.afkVoice.guildId = config.afkVoice.guildId || MAIN_GUILD_ID;
    config.afkVoice.reconnectDelayMs = Number(config.afkVoice.reconnectDelayMs || 5000);
    config.afkVoice.maxReconnectDelayMs = Number(config.afkVoice.maxReconnectDelayMs || 60000);

    return config.afkVoice;
  }

  async function saveAfkVoiceConfig(patch = {}) {
    const config = getConfig();
    config.afkVoice = {
      ...DEFAULT_AFK_VOICE_CONFIG,
      ...(config.afkVoice || {}),
      ...patch,
      updatedAt: nowIso()
    };

    await saveConfig(config);
    return config.afkVoice;
  }

  async function validateVoiceChannel(guild, channelId) {
    if (!guild) {
      return { ok: false, status: "CHANNEL_NOT_FOUND", message: "Voice channel tidak ditemukan di server DESA TULUS." };
    }

    let channel = guild.channels.cache.get(channelId) || null;

    if (!channel) {
      try {
        channel = await guild.channels.fetch(channelId);
      } catch (_) {
        channel = null;
      }
    }

    if (!channel || channel.guildId !== guild.id) {
      return { ok: false, status: "CHANNEL_NOT_FOUND", message: "Voice channel tidak ditemukan di server DESA TULUS." };
    }

    if (channel.type !== ChannelType.GuildVoice) {
      return { ok: false, status: "ERROR", message: "Channel yang dipilih bukan voice channel." };
    }

    const me = guild.members.me;
    const permissions = channel.permissionsFor(me);

    if (!permissions?.has(PermissionFlagsBits.ViewChannel) || !permissions?.has(PermissionFlagsBits.Connect)) {
      return {
        ok: false,
        status: "MISSING_PERMISSION",
        message: "Pak Hansip membutuhkan izin View Channel dan Connect di channel tersebut."
      };
    }

    return { ok: true, channel };
  }

  function clearReconnectTimer() {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function getConnection(guildId) {
    return getVoiceConnection(guildId);
  }

  function destroyExistingConnection(guildId) {
    const connection = getConnection(guildId);

    if (connection) {
      try {
        connection.removeAllListeners();
        connection.destroy();
      } catch (_) {}
    }
  }

  function bindConnectionEvents(connection, guildId) {
    connection.on(VoiceConnectionStatus.Ready, async () => {
      internalStatus = "CONNECTED";
      connectingLock = false;
      logger.log("[AFK VOICE] Pak Hansip berhasil berjaga.");

      await saveAfkVoiceConfig({
        reconnectAttempts: 0,
        reconnectDelayMs: 5000,
        lastConnectedAt: nowIso(),
        lastError: null
      }).catch(error => {
        logger.error("[AFK VOICE] Gagal menyimpan status connected:", error?.message || error);
      });
    });

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
      internalStatus = "DISCONNECTED";

      await saveAfkVoiceConfig({
        lastDisconnectedAt: nowIso()
      }).catch(() => {});

      if (!manualDisconnect && !shuttingDown) {
        logger.warn("[AFK VOICE] Koneksi terputus, reconnect dijadwalkan.");
        scheduleReconnect("voice disconnected");
      }
    });

    connection.on(VoiceConnectionStatus.Destroyed, async () => {
      if (!manualDisconnect && !shuttingDown) {
        logger.warn("[AFK VOICE] Koneksi destroyed, reconnect dijadwalkan.");
        scheduleReconnect("voice destroyed");
      }
    });

    connection.on("error", async error => {
      internalStatus = "ERROR";
      logger.error("[AFK VOICE] Gagal terhubung:", error?.message || error);
      await saveAfkVoiceConfig({
        lastError: error?.message || String(error)
      }).catch(() => {});

      if (!manualDisconnect && !shuttingDown) {
        scheduleReconnect("voice error");
      }
    });
  }

  async function connectAfkVoice({ reason = "manual", force = false } = {}) {
    const afkVoice = getAfkVoiceConfig();

    if (!afkVoice.enabled && reason !== "switch" && reason !== "owner-command") {
      internalStatus = "DISABLED";
      return { ok: false, status: "DISABLED", message: "Penjagaan AFK Voice Pak Hansip sedang nonaktif. Gunakan h24/7 on terlebih dahulu." };
    }

    if (!afkVoice.channelId) {
      internalStatus = "CHANNEL_NOT_FOUND";
      return { ok: false, status: "CHANNEL_NOT_FOUND", message: "Belum ada voice channel tersimpan. Gunakan h24/7 #channel-voice terlebih dahulu." };
    }

    const guild = client.guilds.cache.get(afkVoice.guildId) || client.guilds.cache.get(MAIN_GUILD_ID);

    if (!guild) {
      internalStatus = "CHANNEL_NOT_FOUND";
      await saveAfkVoiceConfig({ lastError: "Guild DESA TULUS tidak ditemukan." });
      return { ok: false, status: "CHANNEL_NOT_FOUND", message: "Voice channel tidak ditemukan di server DESA TULUS." };
    }

    const validation = await validateVoiceChannel(guild, afkVoice.channelId);

    if (!validation.ok) {
      internalStatus = validation.status;
      await saveAfkVoiceConfig({ lastError: validation.message });
      return { ok: false, status: validation.status, message: validation.message };
    }

    const channel = validation.channel;
    const existingConnection = getConnection(guild.id);

    if (
      existingConnection &&
      !force &&
      existingConnection.joinConfig?.channelId === channel.id &&
      existingConnection.state.status !== VoiceConnectionStatus.Destroyed
    ) {
      return { ok: true, status: "CONNECTED", channel, already: true, connection: existingConnection };
    }

    if (connectingLock) {
      return { ok: false, status: "CONNECTING", message: "Pak Hansip sedang menghubungkan. Coba lagi sebentar." };
    }

    connectingLock = true;
    internalStatus = reason === "reconnect" ? "RECONNECTING" : "CONNECTING";
    manualDisconnect = false;

    clearReconnectTimer();

    logger.log("[AFK VOICE] Pak Hansip mulai menghubungkan.");

    if (existingConnection) {
      destroyExistingConnection(guild.id);
    }

    try {
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: guild.id,
        adapterCreator: guild.voiceAdapterCreator,
        selfMute: Boolean(afkVoice.selfMute),
        selfDeaf: Boolean(afkVoice.selfDeaf)
      });

      bindConnectionEvents(connection, guild.id);

      await entersState(connection, VoiceConnectionStatus.Ready, 30_000);

      internalStatus = "CONNECTED";
      connectingLock = false;

      await saveAfkVoiceConfig({
        guildId: guild.id,
        channelId: channel.id,
        reconnectAttempts: 0,
        reconnectDelayMs: 5000,
        lastConnectedAt: nowIso(),
        lastError: null
      });

      return { ok: true, status: "CONNECTED", channel, connection };
    } catch (error) {
      connectingLock = false;
      internalStatus = "ERROR";
      logger.error("[AFK VOICE] Gagal terhubung:", error?.message || error);

      await saveAfkVoiceConfig({
        lastError: error?.message || String(error)
      });

      if (!manualDisconnect && !shuttingDown && afkVoice.autoReconnect) {
        scheduleReconnect(error?.message || "connect error");
      }

      return {
        ok: false,
        status: "ERROR",
        message: "Pak Hansip gagal bergabung ke voice channel. Periksa permission dan coba kembali."
      };
    }
  }

  async function reconnectAfkVoice() {
    const afkVoice = getAfkVoiceConfig();

    if (!afkVoice.enabled) {
      return { ok: false, status: "DISABLED", message: "Penjagaan AFK Voice Pak Hansip sedang nonaktif. Gunakan h24/7 on terlebih dahulu." };
    }

    if (!afkVoice.channelId) {
      return { ok: false, status: "CHANNEL_NOT_FOUND", message: "Belum ada voice channel tersimpan. Gunakan h24/7 #channel-voice terlebih dahulu." };
    }

    clearReconnectTimer();
    manualDisconnect = false;
    destroyExistingConnection(afkVoice.guildId || MAIN_GUILD_ID);

    return connectAfkVoice({ reason: "reconnect", force: true });
  }

  async function switchAfkVoiceChannel(channel, updatedBy) {
    const afkVoice = getAfkVoiceConfig();
    const previousChannelId = afkVoice.channelId;

    clearReconnectTimer();

    await saveAfkVoiceConfig({
      enabled: true,
      guildId: channel.guild.id,
      channelId: channel.id,
      updatedBy,
      lastError: null
    });

    if (previousChannelId && previousChannelId !== channel.id) {
      logger.log("[AFK VOICE] Lokasi penjagaan dipindahkan.");
    } else {
      logger.log(`[AFK VOICE] Channel penjagaan disimpan: ${channel.name} (${channel.id}).`);
    }

    const result = await connectAfkVoice({ reason: "switch", force: previousChannelId !== channel.id });

    return {
      ...result,
      moved: Boolean(previousChannelId && previousChannelId !== channel.id),
      same: previousChannelId === channel.id
    };
  }

  async function disconnectAfkVoice() {
    const afkVoice = getAfkVoiceConfig();

    manualDisconnect = true;
    clearReconnectTimer();
    internalStatus = "DISABLED";

    destroyExistingConnection(afkVoice.guildId || MAIN_GUILD_ID);

    await saveAfkVoiceConfig({
      enabled: false,
      lastDisconnectedAt: nowIso()
    });

    logger.log("[AFK VOICE] Penjagaan dinonaktifkan.");
    return { ok: true };
  }

  async function setSelfMute(selfMute) {
    const afkVoice = getAfkVoiceConfig();

    if (!afkVoice.channelId) {
      return { ok: false, message: "Pak Hansip sedang tidak berjaga di voice channel. Gunakan h24/7 #channel-voice terlebih dahulu." };
    }

    const connection = getConnection(afkVoice.guildId || MAIN_GUILD_ID);

    if (!connection || connection.state.status === VoiceConnectionStatus.Destroyed) {
      await saveAfkVoiceConfig({ selfMute: Boolean(selfMute) });
      return { ok: false, message: "Pak Hansip sedang tidak berjaga di voice channel. Gunakan h24/7 #channel-voice terlebih dahulu." };
    }

    if (Boolean(afkVoice.selfMute) === Boolean(selfMute)) {
      return { ok: true, already: true };
    }

    try {
      await saveAfkVoiceConfig({ selfMute: Boolean(selfMute) });

      connection.rejoin({
        channelId: afkVoice.channelId,
        selfMute: Boolean(selfMute),
        selfDeaf: Boolean(afkVoice.selfDeaf)
      });

      await entersState(connection, VoiceConnectionStatus.Ready, 15_000);

      if (selfMute) {
        logger.log("[AFK VOICE] Self mute Pak Hansip diaktifkan.");
      } else {
        logger.log("[AFK VOICE] Self mute Pak Hansip dinonaktifkan.");
      }

      return { ok: true };
    } catch (error) {
      logger.error("[AFK VOICE] Gagal mengubah mute:", error?.message || error);
      await saveAfkVoiceConfig({ lastError: error?.message || String(error) }).catch(() => {});
      return { ok: false, message: "Status mute Pak Hansip gagal diperbarui. Gunakan h24/7 reconnect, lalu coba kembali." };
    }
  }

  function scheduleReconnect(reason = "unknown") {
    const afkVoice = getAfkVoiceConfig();

    if (!afkVoice.enabled || !afkVoice.autoReconnect || manualDisconnect || shuttingDown) {
      return;
    }

    clearReconnectTimer();

    const attempts = Number(afkVoice.reconnectAttempts || 0) + 1;
    const delay = Math.min(
      Number(afkVoice.maxReconnectDelayMs || 60000),
      Number(afkVoice.reconnectDelayMs || 5000) * Math.pow(2, Math.max(0, attempts - 1))
    );

    saveAfkVoiceConfig({
      reconnectAttempts: attempts,
      lastDisconnectedAt: nowIso(),
      lastError: reason
    }).catch(() => {});

    reconnectTimer = setTimeout(async () => {
      reconnectTimer = null;

      if (manualDisconnect || shuttingDown) return;

      await connectAfkVoice({ reason: "reconnect", force: true });
    }, delay);

    if (typeof reconnectTimer.unref === "function") {
      reconnectTimer.unref();
    }

    logger.warn("[AFK VOICE] Koneksi terputus, reconnect dijadwalkan.");
  }

  function translateStatus(status) {
    return STATUS_TEXT[status] || STATUS_TEXT.ERROR;
  }

  function getAfkVoiceStatus() {
    const afkVoice = getAfkVoiceConfig();
    const guild = client.guilds.cache.get(afkVoice.guildId || MAIN_GUILD_ID);
    const connection = afkVoice.guildId ? getConnection(afkVoice.guildId) : null;
    const storedChannel = guild && afkVoice.channelId ? guild.channels.cache.get(afkVoice.channelId) : null;
    const activeChannelId = connection?.joinConfig?.channelId || null;
    const activeChannel = guild && activeChannelId ? guild.channels.cache.get(activeChannelId) : null;

    let status = internalStatus;

    if (!afkVoice.enabled) status = "DISABLED";
    else if (afkVoice.channelId && !storedChannel) status = "CHANNEL_NOT_FOUND";
    else if (connection?.state?.status === VoiceConnectionStatus.Ready) status = "CONNECTED";
    else if (connectingLock) status = "CONNECTING";
    else if (reconnectTimer) status = "RECONNECTING";
    else if (!connection) status = "DISCONNECTED";

    return {
      status,
      statusText: translateStatus(status),
      enabled: Boolean(afkVoice.enabled),
      guild,
      guildId: afkVoice.guildId,
      storedChannel,
      activeChannel,
      storedChannelId: afkVoice.channelId || "",
      activeChannelId,
      selfMute: Boolean(afkVoice.selfMute),
      selfDeaf: Boolean(afkVoice.selfDeaf),
      autoReconnect: Boolean(afkVoice.autoReconnect),
      lastConnectedAt: afkVoice.lastConnectedAt,
      lastDisconnectedAt: afkVoice.lastDisconnectedAt,
      reconnectAttempts: Number(afkVoice.reconnectAttempts || 0),
      lastError: afkVoice.lastError || null
    };
  }

  async function initializeAfkVoice() {
    logger.log("[AFK VOICE] Konfigurasi Pak Hansip dimuat.");

    const afkVoice = getAfkVoiceConfig();

    if (!afkVoice.enabled) {
      internalStatus = "DISABLED";
      return;
    }

    const result = await connectAfkVoice({ reason: "startup", force: false });

    if (!result.ok) {
      logger.warn("[AFK VOICE] Gagal terhubung:", result.message || result.status);
    }
  }

  async function shutdownAfkVoice() {
    shuttingDown = true;
    clearReconnectTimer();

    const afkVoice = getAfkVoiceConfig();
    destroyExistingConnection(afkVoice.guildId || MAIN_GUILD_ID);
  }

  return {
    initializeAfkVoice,
    connectAfkVoice,
    disconnectAfkVoice,
    reconnectAfkVoice,
    switchAfkVoiceChannel,
    setSelfMute,
    getAfkVoiceStatus,
    validateVoiceChannel,
    scheduleReconnect,
    clearReconnectTimer,
    destroyExistingConnection,
    saveAfkVoiceConfig,
    shutdownAfkVoice,
    isOwner(userId) {
      return String(userId) === OWNER_ID;
    }
  };
}

module.exports = {
  createAfkVoiceManager,
  DEFAULT_AFK_VOICE_CONFIG,
  OWNER_ID,
  MAIN_GUILD_ID
};
