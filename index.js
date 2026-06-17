require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");

let createCanvas = null;
let loadImage = null;
let GIFEncoder = null;
let quantize = null;
let applyPalette = null;
try {
  ({ createCanvas, loadImage } = require("@napi-rs/canvas"));
} catch (error) {
  console.warn("⚠️ @napi-rs/canvas belum tersedia. Hansip akan pakai fallback SVG/embed sampai dependency terpasang.");
}
try {
  ({ GIFEncoder, quantize, applyPalette } = require("gifenc"));
} catch (error) {
  console.warn("⚠️ gifenc opsional belum tersedia. Hansip animated visual akan fallback ke PNG premium.");
}
const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
  ChannelType,
  AttachmentBuilder,
  ActivityType
} = require("discord.js");





/* =========================
   PAK HANSIP CUSTOM STATUS ROTATION V6.4.0
========================= */
const PAK_HANSIP_CUSTOM_STATUSES = [
  "👀 Memantau Gerak-Gerik Warga",
  "🛡️ Siaga Menjaga Lingkungan",
  "🔦 Ronda Dulu, Ngopi Nanti",
  "📢 Tertib Sebelum Ditegur"
];

let pakHansipCustomStatusInterval = null;
let pakHansipCustomStatusIndex = 0;

function startPakHansipCustomStatusRotation(client) {
  if (
    !client?.user ||
    PAK_HANSIP_CUSTOM_STATUSES.length === 0
  ) {
    return;
  }

  if (pakHansipCustomStatusInterval) {
    clearInterval(pakHansipCustomStatusInterval);
    pakHansipCustomStatusInterval = null;
  }

  // Setiap bot benar-benar online, mulai dari status pertama.
  pakHansipCustomStatusIndex = 0;

  const updatePakHansipCustomStatus = () => {
    if (!client?.user) {
      return;
    }

    const currentStatus =
      PAK_HANSIP_CUSTOM_STATUSES[
        pakHansipCustomStatusIndex %
          PAK_HANSIP_CUSTOM_STATUSES.length
      ];

    try {
      client.user.setPresence({
        status: "online",
        activities: [
          {
            type: ActivityType.Custom,
            name: "Custom Status",
            state: currentStatus
          }
        ]
      });

      pakHansipCustomStatusIndex =
        (pakHansipCustomStatusIndex + 1) %
        PAK_HANSIP_CUSTOM_STATUSES.length;
    } catch (error) {
      console.error(
        "[PAK HANSIP CUSTOM STATUS] Gagal mengganti status:",
        error
      );
    }
  };

  // Status pertama langsung tampil saat bot online.
  updatePakHansipCustomStatus();

  pakHansipCustomStatusInterval = setInterval(
    updatePakHansipCustomStatus,
    15_000
  );

  if (
    typeof pakHansipCustomStatusInterval.unref ===
    "function"
  ) {
    pakHansipCustomStatusInterval.unref();
  }
}
/* END PAK HANSIP CUSTOM STATUS ROTATION V6.4.0 */


const CONFIG_FILE = path.join(__dirname, "config.json");
const DATA_DIR = path.join(__dirname, "data");
const DATA_FILE = path.join(DATA_DIR, "mabar.json");
const AFK_DATA_FILE = path.join(DATA_DIR, "afk.json");
const SAMBUNG_DATA_FILE = path.join(DATA_DIR, "sambung-kata.json");
const PANEL_STATE_FILE = path.join(DATA_DIR, "panel-state.json");
const GAME_DATA_FILE = path.join(DATA_DIR, "game-data.json");
const GAME_PLAYERS_FILE = path.join(DATA_DIR, "game-players.json");
const GAME_ITEMS_FILE = path.join(DATA_DIR, "game-items.json");
const GAME_SHOP_FILE = path.join(DATA_DIR, "game-shop.json");
const GAME_EVENTS_FILE = path.join(DATA_DIR, "game-events.json");
const GAME_QUESTS_FILE = path.join(DATA_DIR, "game-quests.json");
const GAME_ACHIEVEMENTS_FILE = path.join(DATA_DIR, "game-achievements.json");
const GAME_LEADERBOARD_FILE = path.join(DATA_DIR, "game-leaderboard.json");
const GAME_BACKUP_FILE = path.join(DATA_DIR, "game-backup.json");
const GAME_SEASONS_FILE = path.join(DATA_DIR, "game-seasons.json");
const GAME_WORLD_FILE = path.join(DATA_DIR, "game-world.json");
const GAME_BATTLE_FILE = path.join(DATA_DIR, "game-battle.json");
const GAME_DUNGEONS_FILE = path.join(DATA_DIR, "game-dungeons.json");
const GAME_RAID_FILE = path.join(DATA_DIR, "game-raid.json");
const GAME_GUILDS_FILE = path.join(DATA_DIR, "game-guilds.json");
const GAME_STORY_FILE = path.join(DATA_DIR, "game-story.json");
const GAME_RISK_FILE = path.join(DATA_DIR, "game-risk.json");
const GAME_HUMOR_FILE = path.join(DATA_DIR, "game-humor.json");
const GAME_CHAOS_FILE = path.join(DATA_DIR, "game-chaos.json");
const GAME_MARKET_FILE = path.join(DATA_DIR, "game-market.json");
const GAME_BANK_FILE = path.join(DATA_DIR, "game-bank.json");

// Hansip — HANSIP DESA TULUS Royale data is separated from old Hansip / Hansip data.
// Never overwrite .env, active config.json, AFK, Mabar, Sambung Kata, Anti-Scam, or old game files.
const OTO_PLAYERS_FILE = path.join(DATA_DIR, "oto-players.json");
const OTO_BACKUP_FILE = path.join(DATA_DIR, "oto-backup.json");
const OTO_ITEMS_FILE = path.join(DATA_DIR, "oto-items.json");
const OTO_NPCS_FILE = path.join(DATA_DIR, "oto-npcs.json");
const OTO_ASSETS_FILE = path.join(DATA_DIR, "oto-assets.json");
const OTO_BATTLES_FILE = path.join(DATA_DIR, "oto-battles.json");
const OTO_ARCADE_FILE = path.join(DATA_DIR, "oto-arcade.json");
const ASSETS_DIR = path.join(__dirname, "assets");
const OTO_BANNERS_DIR = path.join(ASSETS_DIR, "banners");
const OTO_GENERATED_DIR = path.join(ASSETS_DIR, "generated");
const OTO_GENERATED_NPC_DIR = path.join(OTO_GENERATED_DIR, "npc");
const OTO_GENERATED_CARD_DIR = path.join(OTO_GENERATED_DIR, "card");
const OTO_GENERATED_ITEM_DIR = path.join(OTO_GENERATED_DIR, "item");
const OTO_GENERATED_BANNER_DIR = path.join(OTO_GENERATED_DIR, "banners");
const OTO_GENERATED_BATTLE_DIR = path.join(OTO_GENERATED_DIR, "battle");
const OTO_GENERATED_PROFILE_DIR = path.join(OTO_GENERATED_DIR, "profile");
const OTO_GENERATED_HUNT_DIR = path.join(OTO_GENERATED_DIR, "hunt");
const OTO_GENERATED_NPC_CARD_DIR = path.join(OTO_GENERATED_DIR, "npc-card");
const OTO_GENERATED_ZOO_DIR = path.join(OTO_GENERATED_DIR, "zoo");
const OTO_GENERATED_INVENTORY_DIR = path.join(OTO_GENERATED_DIR, "inventory");
const OTO_GENERATED_CRATE_DIR = path.join(OTO_GENERATED_DIR, "crate");
const OTO_GENERATED_ARCADE_DIR = path.join(OTO_GENERATED_DIR, "arcade");
const OTO_GENERATED_LEADERBOARD_DIR = path.join(OTO_GENERATED_DIR, "leaderboard");
const OTO_GENERATED_CACHE_DIR = path.join(OTO_GENERATED_DIR, "cache");
const OTO_GENERATED_ANIMATION_DIR = path.join(OTO_GENERATED_DIR, "animation");
const OTO_GENERATED_ANIM_BLACKJACK_DIR = path.join(OTO_GENERATED_ANIMATION_DIR, "blackjack");
const OTO_GENERATED_ANIM_COINFLIP_DIR = path.join(OTO_GENERATED_ANIMATION_DIR, "coinflip");
const OTO_GENERATED_ANIM_HUNT_DIR = path.join(OTO_GENERATED_ANIMATION_DIR, "hunt");
const OTO_GENERATED_ANIM_BATTLE_DIR = path.join(OTO_GENERATED_ANIMATION_DIR, "battle");
const OTO_GENERATED_ANIM_CRATE_DIR = path.join(OTO_GENERATED_ANIMATION_DIR, "crate");
const OTO_GENERATED_IMAGE_DIR = path.join(OTO_GENERATED_DIR, "image");
const OTO_TEMPLATES_DIR = path.join(ASSETS_DIR, "templates");
const OTO_NPC_DEFAULT_DIR = path.join(ASSETS_DIR, "npc-default");
const OTO_ITEM_ASSET_DIR = path.join(ASSETS_DIR, "item");
const BACKUP_DIR = path.join(__dirname, "backups");

const DEFAULT_CONFIG = {
  serverName: "DESA TULUS",
  embedColor: "#0B5CFF",
  mabarChannelId: "ISI_ID_CHANNEL_CARI_MABAR",
  truthOrDareChannelId: "ISI_ID_CHANNEL_TRUTH_OR_DARE",
  afkChannelId: "ISI_ID_CHANNEL_STATUS_AFK",
  sambungKataChannelId: "ISI_ID_CHANNEL_SAMBUNG_KATA",
  sambungKataTargetWords: 30,
  sambungKataMaxWordsPerMessage: 3,
  sambungKataShowProgress: true,
  ownerUserId: "",
  ownerLogChannelId: "",
  suggestionChannelId: "",
  panelChannelId: "",
  staffChannelId: "",
  commandPrefix: "h",
  botVersion: "1.29.0-oto-no-image-emoji-hard-fix",
  afkNicknamePrefix: "[AFK]",
  afkRemoveOnMessage: true,
  staffRoleIds: [],
  gameRoleIds: {
    "Mobile Legends": "",
    "PUBG Mobile": "",
    "Free Fire": "",
    "Honor of Kings": "",
    "Call of Duty Mobile": "",
    "Arena of Valor": "",
    "Wild Rift": "",
    "eFootball Mobile": "",
    "FC Mobile": "",
    "Roblox": "",
    "Minecraft Bedrock": "",
    "Genshin Impact": "",
    "Honkai: Star Rail": "",
    "Wuthering Waves": "",
    "Stumble Guys": "",
    "Among Us": "",
    "Brawl Stars": "",
    "Clash Royale": "",
    "Clash of Clans": "",
    "Pokémon Unite": "",
    "Identity V": "",
    "Sausage Man": "",
    "Blood Strike": "",
    "Delta Force Mobile": "",
    "Valorant": "",
    "Counter-Strike 2": "",
    "Dota 2": "",
    "League of Legends": "",
    "Minecraft Java": "",
    "GTA V": "",
    "FiveM": "",
    "Fortnite": "",
    "Apex Legends": "",
    "Overwatch 2": "",
    "Rainbow Six Siege": "",
    "PUBG: Battlegrounds": "",
    "Call of Duty: Warzone": "",
    "Marvel Rivals": "",
    "Dead by Daylight": "",
    "Phasmophobia": "",
    "Lethal Company": "",
    "The Forest": "",
    "Sons of the Forest": "",
    "Rust": "",
    "ARK: Survival Ascended": "",
    "eFootball": ""
  },
  features: {
    afk: true,
    mabar: true,
    saran: false,
    panel: true,
    dashboard: true,
    truthOrDare: true,
    sambungKata: true,
    gameHub: true
  },
  permissionCenter: {
    ownerUserId: "",
    staffRoleIds: [],
    adminRoleIds: [],
    panelRoleIds: [],
    logRoleIds: [],
    allowStaffSendPanel: false,
    allowStaffViewLogs: true,
    allowStaffManageMabar: true,
    allowStaffAnnouncement: false
  },
  commandCenter: {
    prefix: "h",
    showLegacyAliases: true,
    panelAntiSpamMs: 60000,
    suggestionCooldownMs: 60000,
    maintenanceMode: false,
    disabledCommands: [],
    lastBackupAt: "",
    lastRestoreAt: "",
    lastError: "",
    restoreRequiresConfirm: true
  },
  gameName: "Hansip",
  gameEnabled: true,
  gameChannelId: "",
  gameLogChannelId: "",
  gamePrefixName: "Hansip",
  gamePanelMessageId: "",
  gameCooldownMs: 5000,
  gameCommandPrefix: "ot",
  gameCommandMainMode: true,
  gameButtonsForConfirmationOnly: true,
  gameRiskModeEnabled: true,
  gameRealMoneyDisabled: true,
  gameHumorEnabled: true,
  gameChaosEnabled: true,
  gameEmbedColor: "#0B5CFF",
  gameEmbedAccent: "#38D5FF",
  gameEmbedDarkBlue: "#07111F",
  gameEmbedSoftBlue: "#2F6BFF",
  gamePerformanceMode: "balanced",
  gameHeavyFeaturesEnabled: true,
  gameAutoCleanupEnabled: true,
  gameSocialSafeMode: true,
  gameTradeEnabled: true,
  gameGiftEnabled: true,
  gameMarketEnabled: true,
  gameAuctionEnabled: true,
  gameBankEnabled: true,
  gameRiskDailyLimit: 5,
  gameLuckyDailyLimit: 1,
  gameAutoEventEnabled: true,
  gameAutoManagerEnabled: true,
  gameAutoEventTimes: ["08:00", "12:00", "19:00"],
  gameAutoEventDurationMinutes: 120,
  gameWeeklyEventDay: "SATURDAY",
  gameBossAutoSpawn: true,
  gameBossAutoSpawnHour: "20:00",
  gameAutoAnnouncement: true,
  gameAutoPanelRefreshOnEvent: true,
  gameAutoEnergyRegen: true,
  gameEnergyRegenMinutes: 15,
  gameEnergyRegenAmount: 5,
  gameAutoDailyReset: true,
  gameDailyResetHour: "00:00",
  gameAutoWeeklyReset: true,
  gameWeeklyResetDay: "MONDAY",
  gameAutoShopRefresh: true,
  gameShopRefreshHour: "06:00",
  gameAutoBackup: true,
  gameAutoBackupEveryHours: 6,
  gameAutoPanelUpdate: true,
  gameAutoLeaderboardUpdate: true,
  gameAutoCleanupSessions: true,
  gameBannerEnabled: true,
  gameMainBannerUrl: "",
  gameEventBannerUrl: "",
  gameDisabledModes: [],
  gameDisabledModules: [],
  gameModuleToggles: {
    guild: true, market: true, auction: true, risk: true, lucky: true, humor: true, chaos: true,
    farming: true, fishing: true, race: true, cooking: true, story: true, tournament: true,
    communityProject: true, trade: true, gift: true, mentor: true, bank: true, pets: true,
    dungeon: true, raid: true, collection: true, weather: true, npc: true
  },

  // Hansip — HANSIP DESA TULUS Royale
  otoName: "Hansip",
  otoFullName: "HANSIP DESA TULUS",
  otoEnabled: true,
  otoChannelId: "",
  otoLogChannelId: "",
  otoOnlyOneChannel: true,
  otoPrefix: "h",
  otoPanelMessageId: "",
  otoEmbedColor: "#0B5CFF",
  otoEmbedAccent: "#00E5FF",
  otoEmbedDark: "#07111F",
  otoDefaultChannelName: "💠・oto-game",
  otoCooldownMs: 5000,
  otoHuntCooldownMs: 15000,
  otoBattleCooldownMs: 30000,
  otoOpenCooldownMs: 3000,
  otoWorkCooldownMs: 300000,
  otoRoyaleCooldownMs: 10000,
  otoDailyCooldownMs: 86400000,
  otoAutoImageEnabled: true,
  otoAutoImageMode: "canvas",
  otoExternalAiImageEnabled: false,
  otoGeneratedImageFolder: "assets/generated",
  otoImageFallbackEnabled: true,
  otoRoyaleEnabled: true,
  otoMaxBet: 50000,
  otoAllInEnabled: true,
  otoRealMoneyDisabled: true,
  otoCashoutDisabled: true,
  otoSafeGamblingNotice: "Coin Hansip hanya coin game virtual, bukan uang asli, tidak bisa cashout, tidak bisa ditukar saldo/pulsa/hadiah uang.",
  otoBannerEnabled: true,
  otoManualBanners: {},
  otoManualNpcImages: {},
  otoDashboardImageStudioEnabled: true,
  otoWeaponDropOnlyFromCrate: true,
  otoBackupEveryHours: 6,
  otoAutoBackupEnabled: true,
  otoDropRates: { common: 55, uncommon: 25, rare: 12, epic: 5, legendary: 2, mythic: 0.8, secret: 0.2, limited: 0 },
  otoVariantEnabled: true,
  otoShinyEnabled: true,
  otoDuplicateToFragment: true,
  otoTeamSynergyEnabled: true,
  otoReleaseRequireConfirmEpic: true,
  otoPremiumCardLayout: true,
  otoVisualPngEnabled: true,
  otoVisualStyle: "ultra_premium",
  otoVisualMode: "emoji_only",
  otoAnimatedVisualEnabled: true,
  otoStaticImageEnabled: false,
  otoAnimationFallbackToImage: false,
  otoAnimationMaxSeconds: 4,
  otoAnimationFps: 12,
  otoAnimationMaxSizeMb: 8,
  otoBlackjackAnimated: true,
  otoCoinFlipAnimated: true,
  otoHuntAnimated: true,
  otoCrateAnimated: true,
  otoBattleAnimated: true,
  otoProfileAnimated: false,
  otoNpcCardAnimated: false,
  otoNPCAnimated: false,
  otoInventoryAnimated: false,
  otoLeaderboardAnimated: false,
  otoImageCacheEnabled: true,
  otoImageCacheMaxAgeHours: 24,
  otoImageAutoCleanup: true,
  otoArcadeEnabled: true,
  otoBlackjackEnabled: true,
  otoCoinFlipEnabled: true,
  otoCoinTransferEnabled: true,
  otoMinBet: 10,
  otoBlackjackMaxBet: 50000,
  otoCoinFlipMaxBet: 50000,
  dashboard: {
    title: "Hansip Control Center",
    subtitle: "Dashboard DESA TULUS yang rapi, nyaman, dan mudah diedit.",
    accent: "#0B5CFF"
  }
};












/* =========================
   Hansip GLOBAL RARITY EMOJI SYNC v1.40.0
   - Semua embed yang menampilkan common/uncommon/rare/epic/mythic/secret/luck wajib pakai emoji style otnpc.
   - Tidak pakai kotak warna rarity lagi.
   - Luck selalu pakai <a:clover:1513671524949823639>.
   - Tetap tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_LUCK_EMOJI_V140 = "<a:clover:1513671524949823639>";

function otoLuckEmojiV140() {
  return config.otoLuckEmoji || config.otoNpcCollectionLuckEmoji || OTO_LUCK_EMOJI_V140;
}

function otoRarityLetterV140(rarity = "common") {
  const key = String(rarity || "common").toLowerCase();
  const custom = config.otoRarityLetterEmojis || {};
  const map = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    legendary: "<a:LetterM:1513668125638398262>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>",
    limited: "<:glowing_dot_blue:1513670991056736408>"
  };
  return custom[key] || map[key] || ":grey_question:";
}

function otoRarityNpcEmojiV140(rarity = "common") {
  const key = String(rarity || "common").toLowerCase();
  const custom = config.otoRarityNpcEmojis || {};
  const map = {
    common: ":slight_smile:",
    uncommon: ":sunglasses:",
    rare: ":nerd:",
    epic: ":disguised_face:",
    legendary: ":crown:",
    mythic: ":mage:",
    secret: ":bust_in_silhouette:",
    limited: "<:glowing_dot_blue:1513670991056736408>"
  };
  return custom[key] || map[key] || ":grey_question:";
}

function otoRarityDisplayV140(rarity = "common", includeName = true) {
  const r = typeof otoRarity === "function" ? otoRarity(rarity) : { key: rarity, name: rarity };
  const letter = otoRarityLetterV140(r.key || rarity);
  const npc = otoRarityNpcEmojiV140(r.key || rarity);
  return includeName ? `${letter} ${npc} **${r.name || rarity}**` : `${letter} ${npc}`;
}

// Override legacy rarity icon helper so old embeds stop using colored square emojis.
function otoRarityIcon(rarity = "common") {
  return otoRarityLetterV140(rarity);
}

function otoLuckLineV140(level = 1) {
  const luck = typeof otoCalcLuck === "function" ? otoCalcLuck(level) : Math.max(1, Math.min(100, 1 + Math.floor(Number(level || 1) * 2) + Math.floor(Math.random() * 10)));
  const tier = luck >= 90 ? "God" : luck >= 75 ? "Mythic" : luck >= 60 ? "High" : luck >= 40 ? "Good" : "Normal";
  return `${otoLuckEmojiV140()} Luck: ${luck} • ${tier}`;
}

function otoNormalizeRarityTextV140(text = "") {
  return String(text || "")
    .replace(/<:LetterC:1513669277759176704>/g, "<:LetterC:1513669277759176704>")
    .replace(/<:PastelGreenU:1513669101640482907>/g, "<:PastelGreenU:1513669101640482907>")
    .replace(/<:PurpleR:1513668875189878785>/g, "<:PurpleR:1513668875189878785>")
    .replace(/<:letter_E:1513668672609189888>/g, "<:letter_E:1513668672609189888>")
    .replace(/<a:LetterM:1513668125638398262>/g, "<a:LetterM:1513668125638398262>")
    .replace(/<a:Alphabet_S:1513667784519712769>/g, "<a:Alphabet_S:1513667784519712769>")
    .replace(/🍀|:clover:/g, otoLuckEmojiV140());
}

function otoEmbedNoBoxV140(embed) {
  try {
    const raw = embed?.data?.description;
    if (raw && typeof embed.setDescription === "function") embed.setDescription(otoNormalizeRarityTextV140(raw));
    if (typeof embed.setImage === "function") embed.setImage(null);
    if (typeof embed.setThumbnail === "function") embed.setThumbnail(null);
  } catch (_) {}
  return embed;
}


/* =========================
   Hansip NPC EXACT DISCORD EMOJI v1.41.0
   otnpc/otzoo/otcollection wajib pakai custom emoji ID persis:
   <:glowing_dot_blue:1513670991056736408>
   <:LetterC:1513669277759176704>
   <:PastelGreenU:1513669101640482907>
   <:PurpleR:1513668875189878785>
   <:letter_E:1513668672609189888>
   <a:LetterM:1513668125638398262>
   <a:Alphabet_S:1513667784519712769>
   <a:clover:1513671524949823639>Luck
========================= */

const OTO_NPC_EMOJI_V141 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>"
};

function otoSupCountV141(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoLuckTierV141(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoNpcCollectionExactDescriptionV141({ username = "Player", counts = {}, luck = 14, perNpc = {} } = {}) {
  const c = Number(counts.common || 0);
  const u = Number(counts.uncommon || 0);
  const r = Number(counts.rare || 0);
  const e = Number(counts.epic || 0);
  const m = Number(counts.mythic || 0);
  const s = Number(counts.secret || 0);

  const points = c * 1 + u * 3 + r * 10 + e * 25 + m * 75 + s * 250;

  const row = (letter, faces, amounts) => {
    const arr = Array.isArray(amounts) ? amounts : [];
    return `${letter} : ${faces.map((emoji, i) => `${emoji}${otoSupCountV141(arr[i] || 0)}`).join(" ")}`;
  };

  return [
    `${OTO_NPC_EMOJI_V141.title} ${username}'s Hansip NPC Collection!`,
    "",
    row(OTO_NPC_EMOJI_V141.common, [":slight_smile:", ":upside_down:", ":smile:", ":grey_question:", ":grey_question:"], perNpc.common || [c > 0 ? 1 : 0, c > 1 ? 1 : 0, c > 2 ? 1 : 0, 0, 0]),
    row(OTO_NPC_EMOJI_V141.uncommon, [":sunglasses:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.uncommon || [u > 0 ? 1 : 0, 0, 0, 0, 0]),
    row(OTO_NPC_EMOJI_V141.rare, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.rare || [0, 0, 0, 0, 0]),
    row(OTO_NPC_EMOJI_V141.epic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.epic || [0, 0, 0, 0, 0]),
    row(OTO_NPC_EMOJI_V141.mythic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.mythic || [0, 0, 0, 0, 0]),
    row(OTO_NPC_EMOJI_V141.secret, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.secret || [0, 0, 0, 0, 0]),
    "",
    `NPC Points: ${points.toLocaleString("id-ID")}`,
    `M-${m}, E-${e}, R-${r}, U-${u}, C-${c}, S-${s}`,
    "",
    `${OTO_NPC_EMOJI_V141.luck}Luck: ${luck} • ${otoLuckTierV141(luck)}`,
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

function otoNpcCollectionExactEmbedV141(payload = {}) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoNpcCollectionExactDescriptionV141(payload))
    .setFooter({ text: "DESA TULUS • Hansip" });
}

/* =========================
   Hansip NPC EXACT STYLE + ANIMATED CLOVER v1.39.0
   - otnpc/otzoo/otcollection format mengikuti contoh user.
   - Luck emoji wajib memakai <a:clover:1513671524949823639>.
   - Tidak pakai image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_LUCK_EMOJI_V139 = "<a:clover:1513671524949823639>";

function otoLuckEmojiV139() {
  return config.otoNpcCollectionLuckEmoji || config.otoLuckEmoji || OTO_LUCK_EMOJI_V139;
}

function otoLuckTierV139(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoNpcCollectionExactDescriptionV139({ username = "Player", counts = {}, luck = 14, perNpc = {} } = {}) {
  const c = Number(counts.common || 0);
  const u = Number(counts.uncommon || 0);
  const r = Number(counts.rare || 0);
  const e = Number(counts.epic || 0);
  const m = Number(counts.mythic || 0);
  const s = Number(counts.secret || 0);

  const points =
    c * 1 +
    u * 3 +
    r * 10 +
    e * 25 +
    m * 75 +
    s * 250;

  const sup = (n = 0) => {
    const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
    return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
  };

  const row = (letter, faces, amounts) => {
    const arr = Array.isArray(amounts) ? amounts : [];
    return `${letter} : ${faces.map((emoji, i) => `${emoji}${sup(arr[i] || 0)}`).join(" ")}`;
  };

  return [
    `<:glowing_dot_blue:1513670991056736408> ${username}'s Hansip NPC Collection!`,
    "",
    row("<:LetterC:1513669277759176704>", [":slight_smile:", ":upside_down:", ":smile:", ":grey_question:", ":grey_question:"], perNpc.common || [c > 0 ? 1 : 0, c > 1 ? 1 : 0, c > 2 ? 1 : 0, 0, 0]),
    row("<:PastelGreenU:1513669101640482907>", [":sunglasses:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.uncommon || [u > 0 ? 1 : 0, 0, 0, 0, 0]),
    row("<:PurpleR:1513668875189878785>", [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.rare || [0, 0, 0, 0, 0]),
    row("<:letter_E:1513668672609189888>", [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.epic || [0, 0, 0, 0, 0]),
    row("<a:LetterM:1513668125638398262>", [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.mythic || [0, 0, 0, 0, 0]),
    row("<a:Alphabet_S:1513667784519712769>", [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], perNpc.secret || [0, 0, 0, 0, 0]),
    "",
    `NPC Points: ${points.toLocaleString("id-ID")}`,
    `M-${m}, E-${e}, R-${r}, U-${u}, C-${c}, S-${s}`,
    "",
    `${otoLuckEmojiV139()} Luck: ${luck} • ${otoLuckTierV139(luck)}`,
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

function otoNpcCollectionExactEmbedV139(payload = {}) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoNpcCollectionExactDescriptionV139(payload))
    .setFooter({ text: "DESA TULUS • Hansip" });
}

/*
Integrasi handler:
- otnpc/otzoo/otcollection harus memakai otoNpcCollectionExactEmbedV139.
- Semua luck line harus memakai otoLuckEmojiV139().
- Jangan menambahkan title terpisah agar format tetap persis.
*/

/* =========================
   Hansip NPC COLLECTION EXACT STYLE v1.38.0
   Format otnpc harus sama seperti request:
   <:glowing_dot_blue:1513670991056736408> username's Hansip NPC Collection!

   <:LetterC:1513669277759176704> : :slight_smile:⁰¹ ...
   ...
   NPC Points: 6
   M-0, E-0, R-0, U-1, C-3, S-0

   <a:clover:1513671524949823639>Luck: 14 • Normal
   Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1
   DESA TULUS • Hansip
========================= */

const OTO_SUPERSCRIPT_DIGITS_V138 = {
  "0": "⁰",
  "1": "¹",
  "2": "²",
  "3": "³",
  "4": "⁴",
  "5": "⁵",
  "6": "⁶",
  "7": "⁷",
  "8": "⁸",
  "9": "⁹"
};

function otoSupCountV138(n = 0) {
  const s = String(Math.max(0, Number(n || 0)).toString().padStart(2, "0"));
  return s.split("").map(ch => OTO_SUPERSCRIPT_DIGITS_V138[ch] || ch).join("");
}

function otoLuckTierV138(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  if (n >= 20) return "Normal";
  return "Normal";
}

function otoNpcLetterEmojiV138(rarity) {
  const custom = config.otoNpcCollectionLetterEmojis || {};
  const fallback = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>"
  };
  return custom[rarity] || fallback[rarity] || ":grey_question:";
}

function otoNpcFaceListV138(rarity) {
  const custom = config.otoNpcCollectionFaceEmojis || {};
  const fallback = {
    common: [":slight_smile:", ":upside_down:", ":smile:", ":grey_question:", ":grey_question:"],
    uncommon: [":sunglasses:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"],
    rare: [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"],
    epic: [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"],
    mythic: [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"],
    secret: [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"]
  };
  const arr = custom[rarity] || fallback[rarity] || fallback.common;
  return Array.isArray(arr) ? arr.slice(0, 5) : fallback[rarity];
}

function otoNpcRowExactV138(rarity, ownedCount = 0, perNpcCounts = []) {
  const letter = otoNpcLetterEmojiV138(rarity);
  const faces = otoNpcFaceListV138(rarity);
  const total = Number(ownedCount || 0);
  const cells = faces.map((emoji, index) => {
    const count = Number(perNpcCounts[index] ?? (index < total ? 1 : 0));
    const showEmoji = count > 0 ? emoji : (emoji.includes("grey_question") ? emoji : (config.otoNpcCollectionUnknownEmoji || ":grey_question:"));
    return `${showEmoji}${otoSupCountV138(count)}`;
  });
  return `${letter} : ${cells.join(" ")}`;
}

function otoNpcPointsExactV138(counts = {}) {
  return (
    Number(counts.common || 0) * 1 +
    Number(counts.uncommon || 0) * 3 +
    Number(counts.rare || 0) * 10 +
    Number(counts.epic || 0) * 25 +
    Number(counts.mythic || 0) * 75 +
    Number(counts.secret || 0) * 250
  );
}

function otoNpcCollectionExactDescriptionV138({ username = "Player", counts = {}, luck = 14, perNpc = {} } = {}) {
  const c = Number(counts.common || 0);
  const u = Number(counts.uncommon || 0);
  const r = Number(counts.rare || 0);
  const e = Number(counts.epic || 0);
  const m = Number(counts.mythic || 0);
  const s = Number(counts.secret || 0);
  const points = otoNpcPointsExactV138({ common: c, uncommon: u, rare: r, epic: e, mythic: m, secret: s });
  const luckText = `${luck} • ${otoLuckTierV138(luck)}`;

  return [
    `${config.otoNpcCollectionTitleEmoji || "<:glowing_dot_blue:1513670991056736408>"} ${username}'s Hansip NPC Collection!`,
    "",
    otoNpcRowExactV138("common", c, perNpc.common),
    otoNpcRowExactV138("uncommon", u, perNpc.uncommon),
    otoNpcRowExactV138("rare", r, perNpc.rare),
    otoNpcRowExactV138("epic", e, perNpc.epic),
    otoNpcRowExactV138("mythic", m, perNpc.mythic),
    otoNpcRowExactV138("secret", s, perNpc.secret),
    "",
    `NPC Points: ${points.toLocaleString("id-ID")}`,
    `M-${m}, E-${e}, R-${r}, U-${u}, C-${c}, S-${s}`,
    "",
    `<a:clover:1513671524949823639>Luck: ${luckText}`,
    config.otoNpcCollectionCommandLine || "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

function otoNpcCollectionExactEmbedV138({ username = "Player", counts = {}, luck = 14, perNpc = {} } = {}) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoNpcCollectionExactDescriptionV138({ username, counts, luck, perNpc }))
    .setFooter({ text: "DESA TULUS • Hansip" });
}

/*
Integrasi:
- Handler otnpc/otzoo/otcollection harus memakai otoNpcCollectionExactEmbedV138.
- Jangan pakai title terpisah jika ingin persis, karena baris pertama sudah ada di description.
- Jangan pakai image, thumbnail, Canvas, AttachmentBuilder, atau .setImage().
*/

/* =========================
   Hansip ALL-IN-ONE GAME DASHBOARD v1.37.0
   - Semua setting game Hansip dikumpulkan dalam satu dashboard rapi.
   - Mode visual tetap emoji-only: tanpa image, tanpa Canvas, tanpa AttachmentBuilder, tanpa .setImage().
   - Dashboard server-rendered supaya tetap bisa dipakai walau JS browser error.
   - Tidak menghapus fitur lama Hansip: AFK, Mabar, Truth or Dare, Sambung Kata, dan MongoDB.
========================= */

function otoDashboardModuleListV137() {
  return [
    { key: "overview", name: "Overview", emoji: "💠", desc: "Status Hansip, storage, mode visual, dan ringkasan data." },
    { key: "channelPanel", name: "Channel & Panel", emoji: "📌", desc: "Set channel Hansip, log channel, panel, dan one-channel mode." },
    { key: "emojiVisual", name: "Emoji Visual", emoji: "✨", desc: "Atur emoji biasa / emoji GIF Discord. No image mode tetap aktif." },
    { key: "hunt", name: "Hunt", emoji: "🌱", desc: "Biaya hunt, jumlah NPC, fragment, EXP, duplicate, dan cooldown." },
    { key: "npcCollection", name: "NPC Collection", emoji: "🧑", desc: "Tema NPC, emoji wajah/orang, rarity, NPC Points, dan filter collection." },
    { key: "luckLevel", name: "Luck & Level", emoji: "<a:clover:1513671524949823639>", desc: "Luck 1–100 berdasarkan level, XP, level-up reward, dan notifikasi." },
    { key: "teamBattle", name: "Team & Battle", emoji: "⚔️", desc: "Team slot 1–3, battle, power, reward, dan musuh." },
    { key: "crateInventory", name: "Crate & Inventory", emoji: "📦", desc: "Crate, open all, weapon, fragment, dust, dan item." },
    { key: "blackjack", name: "Blackjack", emoji: "🃏", desc: "otbj all, tombol emoji, dealer auto draw, dan delay 2 detik." },
    { key: "coinFlip", name: "Coin Flip", emoji: "🪙", desc: "otcf <amount> / otcf all, max 9999, dan all-in." },
    { key: "economyTransfer", name: "Economy & Transfer", emoji: "💰", desc: "otcash, otgive confirm/cancel, max transfer, dan safety virtual coin." },
    { key: "dailyQuest", name: "Daily & Quest", emoji: "🎁", desc: "Daily reward, quest harian, fragment, coin, dan XP." },
    { key: "leaderboard", name: "Leaderboard", emoji: "🏆", desc: "Ranking level, coin, NPC Points, battle, dan luck." },
    { key: "safetyBackup", name: "Safety & Backup", emoji: "🛡️", desc: "Backup data, anti reset, no secret exposure, dan fallback JSON/MongoDB." },
    { key: "logs", name: "Logs", emoji: "📜", desc: "Log Hansip penting tanpa menampilkan token atau secret." }
  ];
}

function otoAllInOneDashboardSummaryV137() {
  return {
    enabled: config.otoDashboardAllInOneEnabled !== false,
    mode: config.otoDashboardMode || "all_in_one",
    theme: config.otoDashboardTheme || "soft_dark_blue_premium",
    visual: "emoji_only",
    noImages: true,
    modules: otoDashboardModuleListV137().map(x => x.key),
    importantDefaults: {
      prefix: config.otoPrefix || "ot",
      currency: "Hansip Coin",
      footer: config.otoFooter || "DESA TULUS • Hansip",
      revealDelayMs: Number(config.otoRevealDelayMs || 2000),
      teamMaxSlot: Number(config.otoTeamMaxSlot || 3),
      otcf: "otcf <amount> / otcf all",
      otbjAllIn: config.otoBlackjackAllInEnabled !== false
    }
  };
}

function otoAllInOneDashboardEmbedV137() {
  const modules = otoDashboardModuleListV137()
    .map(m => `${m.emoji} **${m.name}** — ${m.desc}`)
    .join("\n");

  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("💠 Hansip Control Center — All-in-One Dashboard")
    .setDescription([
      "**HANSIP DESA TULUS** sekarang memakai dashboard game all-in-one.",
      "",
      "Mode visual: **Emoji Only**",
      "Image/Canvas/Attachment: **OFF**",
      "Delay action: **2 detik**",
      "Team slot: **1–3**",
      "Coin flip: `otcf <amount>` / `otcf all`",
      "",
      "━━━━━━━━━━━━━━━━━━━━",
      modules,
      "",
      "Command owner:",
      "`otstatus` • `otupdatepanel oto` • `otbackup`"
    ].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip Dashboard" });
}

function otoDashboardNoSecretV137(value = "") {
  return String(value || "")
    .replace(/mongodb(\+srv)?:\/\/[^\s"']+/gi, "[MONGODB_URI_HIDDEN]")
    .replace(/Bot\s+[A-Za-z0-9._-]+/gi, "Bot [TOKEN_HIDDEN]")
    .replace(/DISCORD_TOKEN\s*=\s*[^\s]+/gi, "DISCORD_TOKEN=[HIDDEN]")
    .replace(/CLIENT_ID\s*=\s*[^\s]+/gi, "CLIENT_ID=[HIDDEN]")
    .replace(/GUILD_ID\s*=\s*[^\s]+/gi, "GUILD_ID=[HIDDEN]");
}

/* =========================
   Hansip NPC THEME + LUCK + LEVEL UP v1.35.0
   - otnpc/otzoo/otcollection memakai tema NPC, bukan NPC.
   - Grid memakai emoji orang/wajah, bukan kotak warna.
   - Luck otomatis berdasarkan level, angka 1–100, tetap ada random kecil.
   - Level up memakai embed khusus: ✨ Hansip LEVEL UP!
========================= */

function otoNpcFaceEmoji(rarity = "common") {
  const custom = config.otoNpcRarityEmojis || {};
  const fallback = {
    common: "🙂",
    uncommon: "😎",
    rare: "🤓",
    epic: "🥸",
    mythic: "🤠",
    secret: "🧙",
    limited: "👑"
  };
  return custom[String(rarity || "common").toLowerCase()] || fallback[String(rarity || "common").toLowerCase()] || "🙂";
}

function otoNpcUnknownEmoji() {
  return config.otoNpcUnknownEmoji || "?";
}

function otoCalcLuck(level = 1) {
  const lv = Math.max(1, Number(level || 1));
  const min = Number(config.otoLuckMin || 1);
  const max = Number(config.otoLuckMax || 100);
  const basePerLevel = Number(config.otoLuckBasePerLevel || 2);
  const randomBonus = Number(config.otoLuckRandomBonus || 10);

  const base = Math.min(max, min + Math.floor(lv * basePerLevel));
  const bonus = Math.floor(Math.random() * (randomBonus + 1));
  return Math.max(min, Math.min(max, base + bonus));
}

function otoLuckLine(level = 1) {
  const luck = otoCalcLuck(level);
  return `<a:clover:1513671524949823639>Luck: ${luck}`;
}

function otoNpcPointsFromCounts(counts = {}) {
  return (
    Number(counts.common || 0) * 1 +
    Number(counts.uncommon || 0) * 3 +
    Number(counts.rare || 0) * 10 +
    Number(counts.epic || 0) * 25 +
    Number(counts.mythic || 0) * 75 +
    Number(counts.secret || 0) * 250 +
    Number(counts.limited || 0) * 500
  );
}

function otoNpcGridRow(label, rarity, amount = 0) {
  const icon = otoNpcFaceEmoji(rarity);
  const unknown = otoNpcUnknownEmoji();
  const shown = Math.min(5, Number(amount || 0));
  const icons = [];
  for (let i = 0; i < 5; i++) icons.push(i < shown ? icon : unknown);
  const extra = amount > 5 ? ` +${amount - 5}` : "";
  return `${label} ${icons.join(" ")}${extra}`;
}

function otoNpcCollectionEmbedV135({ username = "Player", counts = {}, level = 1, limitedActive = false } = {}) {
  const points = otoNpcPointsFromCounts(counts);
  const rows = [
    otoNpcGridRow("C", "common", counts.common),
    otoNpcGridRow("U", "uncommon", counts.uncommon),
    otoNpcGridRow("R", "rare", counts.rare),
    otoNpcGridRow("E", "epic", counts.epic),
    otoNpcGridRow("M", "mythic", counts.mythic),
    otoNpcGridRow("S", "secret", counts.secret)
  ];
  if (limitedActive) rows.push(otoNpcGridRow("L", "limited", counts.limited));

  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle(`🧑 ${username}'s Hansip NPC Collection!`)
    .setDescription([
      `🧑 🙂 😎 🤓 💠 **${username}'s Hansip NPC Collection!** 💠 🤓 😎 🙂`,
      "",
      ...rows,
      "",
      `${config.otoNpcCollectionPointsName || "NPC Points"}: **${points}**`,
      `M-${counts.mythic || 0}, E-${counts.epic || 0}, R-${counts.rare || 0}, U-${counts.uncommon || 0}, C-${counts.common || 0}, S-${counts.secret || 0}`,
      "",
      otoLuckLine(level),
      "",
      "Command: `otcard <npcId>` • `otteam add <npcId> <slot>`"
    ].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip" });
}

function otoChooseLevelReward(level = 1) {
  const lv = Number(level || 1);
  if (lv % 25 === 0) return "💠 Limited Fragment x1";
  if (lv % 10 === 0) return "📦 Royale Crate x1";
  if (lv % 5 === 0) return "📦 Neon Crate x1";
  if (lv % 3 === 0) return "<:PurpleR:1513668875189878785> Fragment x5";
  return "🎁 Basic Crate x1";
}

function otoLevelUpCoin(level = 1) {
  return Number(config.otoLevelUpCoinBase || 100) + (Number(level || 1) * Number(config.otoLevelUpCoinPerLevel || 25));
}

function otoLevelUpEmbed({ user, level = 1, xp = 0, nextXp = 100, coin = null, reward = null } = {}) {
  const gainCoin = coin == null ? otoLevelUpCoin(level) : coin;
  const gift = reward || otoChooseLevelReward(level);
  return new EmbedBuilder()
    .setColor(config.otoEmbedAccent || "#00E5FF")
    .setTitle(config.otoLevelUpTitle || "✨ Hansip LEVEL UP!")
    .setDescription([
      `🎉 Selamat ${user}!`,
      `Kamu berhasil naik ke **Level ${level}**.`,
      "",
      `⚡ XP: **${xp}/${nextXp}**`,
      `💰 Coin didapat: **+${gainCoin}**`,
      `🎁 Hadiah: **${gift}**`,
      "",
      otoLuckLine(level)
    ].join("\n"))
    .setFooter({ text: config.otoLevelUpFooter || "DESA TULUS • Hansip Level System" });
}

/*
Integrasi yang disiapkan:
- Gunakan otoNpcCollectionEmbedV135 untuk otnpc/otzoo/otcollection.
- Gunakan otoCalcLuck(player.level) untuk luck otomatis di hunt/battle/card/profile.
- Saat XP melewati nextXp, kirim otoLevelUpEmbed({ user, level, xp, nextXp, coin, reward }).
*/

/* =========================
   Hansip FULL BRANDING CLEANUP + SMART IMPORTANT EMBEDS v1.34.0
   - Branding game lama "Hansip Desa Tulus" dibersihkan dari Hansip.
   - Nama game utama: Hansip — HANSIP DESA TULUS.
   - Embed penting dibuat otomatis, compact, emoji-only, dan tidak memakai image.
   - Tetap tidak menghapus fitur lama Hansip.
========================= */

function otoSmartColor(type = "default") {
  const colors = {
    win: "#0B5CFF",
    success: "#0B5CFF",
    lose: "#FF4D6D",
    error: "#FF4D6D",
    draw: "#F6C85F",
    warning: "#F6C85F",
    premium: "#00E5FF",
    default: config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF"
  };
  return colors[type] || colors.default;
}

function otoSmartFooter(extra = "") {
  if (extra) return `DESA TULUS • Hansip ${extra}`;
  return config.otoFooter || "DESA TULUS • Hansip";
}

function otoSmartEmbed({ title = "💠 Hansip", description = "", type = "default", footer = "", hint = "", fields = [] } = {}) {
  const finalDescription = hint
    ? `${description}\n\n━━━━━━━━━━━━━━━━━━━━\n${hint}`
    : description;

  const embed = new EmbedBuilder()
    .setColor(otoSmartColor(type))
    .setTitle(String(title || "💠 Hansip").replace(/Hansip Desa Tulus/gi, "Hansip"))
    .setDescription(String(finalDescription || "").replace(/Hansip Desa Tulus/gi, "Hansip"))
    .setFooter({ text: otoSmartFooter(footer) });

  for (const f of fields || []) {
    if (f && f.name && f.value) embed.addFields({ name: f.name, value: f.value, inline: Boolean(f.inline) });
  }

  // v1.34 rule: Hansip important embeds do not use images.
  try {
    if (typeof embed.setImage === "function") embed.setImage(null);
    if (typeof embed.setThumbnail === "function") embed.setThumbnail(null);
  } catch (_) {}

  return embed;
}

function otoImportantCommand(command = "") {
  const list = config.otoSmartEmbedImportantCommands || [];
  return list.includes(String(command || "").toLowerCase());
}

function otoSmartHint(command = "") {
  const templates = config.otoSmartEmbedTemplates || {};
  const keyMap = {
    otcash: "cash",
    otbal: "cash",
    otcoin: "cash",
    oth: "hunt",
    othunt: "hunt",
    otnpc: "collection",
    otzoo: "collection",
    otcollection: "collection",
    otbj: "blackjack",
    otblackjack: "blackjack",
    otcf: "coinflip",
    otb: "battle",
    otbattle: "battle",
    otinv: "inventory",
    otopen: "crate",
    otgive: "transfer"
  };
  const t = templates[keyMap[String(command || "").toLowerCase()]] || {};
  return t.hint || "";
}

function otoBrandText(text = "") {
  return String(text || "")
    .replace(/Hansip Desa Tulus/gi, "Hansip")
    .replace(/OT Game Hub/gi, "Hansip")
    .replace(/DESA TULUS • Adventure/gi, "DESA TULUS • Hansip");
}

/* =========================
   Hansip BLACKJACK DEALER AUTO DRAW v1.30.0
   - Setelah user klik ➕ / 🛑, bot edit embed ke animasi emoji 2 detik.
   - Setelah 2 detik, kartu player/dealer dihitung.
   - Kalau player klik ➕, player dapat kartu tambahan; jika belum bust, meja lanjut.
   - Kalau player klik 🛑, dealer/musuh otomatis draw sampai minimal 17.
   - Dealer/musuh punya total angka yang naik otomatis.
   - Semua tetap embed compact + emoji, tanpa image/Canvas/AttachmentBuilder/setImage.
========================= */

function otoBjDeck() {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const deck = [];
  for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
  return deck.sort(() => Math.random() - 0.5);
}

function otoBjCardValue(card) {
  if (!card) return 0;
  if (["J", "Q", "K"].includes(card.rank)) return 10;
  if (card.rank === "A") return 11;
  return Number(card.rank || 0);
}

function otoBjTotal(cards = []) {
  let total = 0, aces = 0;
  for (const c of cards) {
    total += otoBjCardValue(c);
    if (c && c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function otoBjFormat(cards = [], hideSecond = false) {
  if (!cards.length) return "`?`";
  return cards.map((c, i) => {
    if (hideSecond && i === 1) return "`Hansip`";
    return `\`${c.rank}${c.suit}\``;
  }).join(" ");
}

function otoBjDraw(deck) {
  if (!Array.isArray(deck) || deck.length === 0) deck = otoBjDeck();
  return deck.pop();
}

function otoBjDealerAutoDraw(state) {
  const standOn = Number(config.otoBlackjackDealerStandOn || 17);
  if (!state.dealerCards) state.dealerCards = [];
  if (!state.deck || !state.deck.length) state.deck = otoBjDeck();
  while (otoBjTotal(state.dealerCards) < standOn) {
    state.dealerCards.push(otoBjDraw(state.deck));
  }
  return state;
}

function otoBjResult(playerTotal, dealerTotal, playerCards = []) {
  const natural = playerCards.length === 2 && playerTotal === 21;
  if (natural && dealerTotal !== 21) return "BLACKJACK";
  if (playerTotal > 21 && dealerTotal > 21) return "DRAW";
  if (playerTotal > 21) return "LOSE";
  if (dealerTotal > 21) return "WIN";
  if (playerTotal > dealerTotal) return "WIN";
  if (dealerTotal > playerTotal) return "LOSE";
  return "DRAW";
}

function otoBjStatusText(result, bet) {
  const profit = result === "BLACKJACK" ? Math.floor(Number(bet || 0) * 1.5) : Number(bet || 0);
  if (result === "WIN") return `🎲 Kamu menang **${profit} Hansip Coin**!`;
  if (result === "LOSE") return `🎲 Kamu kalah **${bet} Hansip Coin**!`;
  if (result === "DRAW") return `⚖️ Seri! Bet **${bet} Hansip Coin** dikembalikan.`;
  if (result === "BLACKJACK") return `🃏 BLACKJACK! Kamu menang **${profit} Hansip Coin**!`;
  return "Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.";
}

function otoBjEmbedState({ user, username, bet, dealerCards, playerCards, status = "PLAYING", hideDealer = false, statusText = "" }) {
  const dealerTotal = hideDealer ? "?" : otoBjTotal(dealerCards);
  const playerTotal = otoBjTotal(playerCards);
  const colorMap = { PLAYING: "#0B5CFF", WIN: "#0B5CFF", LOSE: "#FF4D6D", DRAW: "#F6C85F", BLACKJACK: "#00E5FF" };
  return new EmbedBuilder()
    .setColor(colorMap[status] || "#0B5CFF")
    .setTitle(`🃏 Hansip Blackjack — ${status}`)
    .setDescription(`${user}, kamu bet **${bet} Hansip Coin** buat main blackjack\n\n**Dealer Hansip** \`[${dealerTotal}]\`\n${otoBjFormat(dealerCards, hideDealer)}\n\n**${username}** \`[${playerTotal}]\`\n${otoBjFormat(playerCards)}\n\n${statusText || otoBjStatusText(status, bet)}`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoBjLoadingEmbed(user, text = "Kartu sedang dikocok...") {
  const spin = typeof otoE === "function" ? otoE("blackjackSpin", "🃏") : "🃏";
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("🃏 Hansip Blackjack")
    .setDescription(`${user}\n\n${spin} ${text}\nTunggu **2 detik**.`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

/*
Integrasi handler:
- Start: state.deck = otoBjDeck(); dealer 2 kartu, player 2 kartu.
- Klik ➕: edit otoBjLoadingEmbed(user, "Kartu tambahan sedang dibuka..."), tunggu 2 detik, playerCards.push(otoBjDraw(deck)).
- Jika playerTotal > 21: dealer auto draw sampai 17, result final.
- Klik 🛑: edit otoBjLoadingEmbed(user, "Dealer Hansip sedang membuka kartu..."), tunggu 2 detik, otoBjDealerAutoDraw(state), result final.
- Setelah result final, disable tombol.
*/

/* =========================
   Hansip EMOJI / EMOJI GIF DISCORD ONLY v1.28.0
   - Tidak pakai image, Canvas, AttachmentBuilder, PNG/JPG/GIF attachment, atau .setImage().
   - Semua visual memakai compact embed + emoji biasa / animated emoji Discord.
   - Command action pakai embed awal, delay 2 detik, lalu edit embed yang sama.
   - otbj support all-in, otcf tetap aktif, otcash ditambahkan.
========================= */
const OTO_NO_IMAGE_MODE_V128 = true;

function otoE(key, fallback) {
  const animated = config.otoAnimatedEmojiIds || {};
  const map = {
    coin: config.otoEmojiCoin || "🪙",
    coinSpin: config.otoEmojiCoinSpin || animated.coinSpin || animated.coin || "🪙",
    blackjackSpin: config.otoEmojiBlackjackSpin || animated.blackjackSpin || "🃏",
    diceSpin: config.otoEmojiDiceSpin || animated.diceSpin || "🎲",
    core: config.otoEmojiCore || "💠",
    fragment: config.otoEmojiFragment || "<:PurpleR:1513668875189878785>",
    xp: config.otoEmojiXp || "✨",
    win: config.otoEmojiWin || "💎",
    lose: config.otoEmojiLose || "💨",
    draw: config.otoEmojiDraw || "⚖️",
    loading: config.otoEmojiLoading || animated.loading || "🔄"
  };
  if (config.otoAnimatedEmojiEnabled !== false && animated[key]) return animated[key];
  return map[key] || fallback || "💠";
}

function otoDelayMs(type = "default") {
  const byType = {
    hunt: config.otoHuntRevealDelayMs,
    bj: config.otoBlackjackDelayMs,
    cf: config.otoCoinFlipDelayMs,
    slots: config.otoSlotsDelayMs
  };
  return Number(byType[type] || config.otoRevealDelayMs || 4000);
}

function otoSleep(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function otoStripImages(embed) {
  try {
    if (embed && typeof embed.setImage === "function") embed.setImage(null);
    if (embed && typeof embed.setThumbnail === "function") embed.setThumbnail(null);
  } catch (_) {}
  return embed;
}

function otoFooter(extra = "") {
  return extra || "DESA TULUS • Hansip";
}

function otoCashEmbed(userLabel, balance, targetMode = false) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`${otoE("coin", "🪙")} | ${userLabel}, ${targetMode ? "sekarang punya" : "kamu sekarang punya"} **${Number(balance || 0).toLocaleString("id-ID")} Hansip Coin**!`)
    .setFooter({ text: "DESA TULUS • Hansip Coin virtual" });
}

function otoCoinFlipStartEmbed(user, choice, bet) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("🪙 Hansip Coin Flip")
    .setDescription(`${user}, kamu memasang **${bet} Hansip Coin** di **${choice}**.\n\n${otoE("coinSpin", "🪙")} Koin sedang berputar...\nHasil akan muncul dalam **2 detik**.`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoCoinFlipResultEmbed(user, choice, coinResult, bet, win, balance) {
  return new EmbedBuilder()
    .setColor(win ? (config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF") : "#FF4D6D")
    .setTitle(`🪙 Hansip Coin Flip — ${win ? "WIN" : "LOSE"}`)
    .setDescription(`${user}, hasil koin adalah **${coinResult}**!\n\nPilihan kamu: **${choice}**\nBet: **${bet} Hansip Coin**\n\n${win ? `${otoE("win", "💎")} Kamu menang **${bet} Hansip Coin**!` : `${otoE("lose", "💨")} Kamu kalah **${bet} Hansip Coin**!`}\nSaldo sekarang: **${Number(balance || 0).toLocaleString("id-ID")} Hansip Coin**`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoHuntStartEmbed(username, cost = 5) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`🌱 | ${username} memakai **${cost} Hansip Coin** untuk hunt...\n\n${otoE("loading", "🔄")} NPC sedang dicari...\nTunggu **2 detik**.`)
    .setFooter({ text: "DESA TULUS • Hansip" });
}

function otoHuntResultEmbed({ username, cost = 5, count = 1, npcLine = "<:LetterC:1513669277759176704> Bang Jaga Sendal", npcIconLine = "🙂 😎 🤓", xp = 1, fragmentReward = 0, duplicateText = "" }) {
  const multi = count > 1;
  const desc = multi
    ? `🌱 | ${username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!\n▫️ | ${npcIconLine} mendapat **${xp} XP**!${fragmentReward ? `\n<:PurpleR:1513668875189878785> | Fragment bonus: **+${fragmentReward} Fragment**` : ""}${duplicateText ? `\n${duplicateText}` : ""}`
    : `🌱 | ${username} memakai **${cost} Hansip Coin** dan menangkap ${npcLine}!\n▫️ | ${npcIconLine} mendapat **${xp} XP**!${fragmentReward ? `\n<:PurpleR:1513668875189878785> | Fragment bonus: **+${fragmentReward} Fragment**` : ""}${duplicateText ? `\n${duplicateText}` : ""}`;
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(desc)
    .setFooter({ text: "DESA TULUS • Hansip" });
}

function otoBlackjackStartEmbed(user, bet) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("🃏 Hansip Blackjack")
    .setDescription(`${user}, kamu bet **${bet} Hansip Coin** buat main blackjack.\n\n${otoE("blackjackSpin", "🃏")} Kartu sedang dikocok...\nTunggu **2 detik** sebelum kartu dibuka.`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoCardCode(card) {
  if (!card) return "`??`";
  if (typeof card === "string") return `\`${card}\``;
  return `\`${card.rank || "?"}${card.suit || "♠"}\``;
}

function otoCardList(cards = []) {
  return (Array.isArray(cards) && cards.length ? cards : ["??"]).map(otoCardCode).join(" ");
}

function otoBlackjackEmbedCompact({ user, username, bet, dealerTotal, dealerCards, playerTotal, playerCards, status = "PLAYING", statusText = "" }) {
  const colorMap = { PLAYING: "#0B5CFF", WIN: "#0B5CFF", LOSE: "#FF4D6D", DRAW: "#F6C85F", BLACKJACK: "#00E5FF" };
  return new EmbedBuilder()
    .setColor(colorMap[status] || "#0B5CFF")
    .setTitle(`🃏 Hansip Blackjack — ${status}`)
    .setDescription(`${user}, kamu bet **${bet} Hansip Coin** buat main blackjack\n\n**Dealer** \`[${dealerTotal}]\`\n${otoCardList(dealerCards)}\n\n**${username}** \`[${playerTotal}]\`\n${otoCardList(playerCards)}\n\n${statusText}`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoSlotsStartEmbed(username, bet) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`🎰 | ${username} memutar slot dengan bet **${bet} Hansip Coin**...\n${otoE("diceSpin", "🎲")} ${otoE("diceSpin", "🎲")} ${otoE("diceSpin", "🎲")}\n\nHasil akan muncul dalam **2 detik**.`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoSlotsResultEmbed(resultLine, resultText) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`🎰 | Hasil: ${resultLine}\n${resultText}`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoNoImageAttachmentRule() {
  return true;
}

/* =========================
   Hansip EMOJI ANIMATION MODE v1.26.0
   - Tidak pakai image/PNG/GIF attachment sebagai tampilan game.
   - Tidak pakai .setImage() untuk command Hansip.
   - Tampilan utama pakai compact embed + emoji/animated custom emoji Discord.
   - Jika emoji GIF belum diisi, fallback ke emoji biasa.
========================= */
const OTO_IMAGE_DISABLED_COMMANDS = new Set([
  "oth", "othunt", "otbj", "otblackjack", "otnpc", "otzoo", "otcollection",
  "otgive", "otinv", "otopen", "otb", "otbattle", "ottop", "otlb", "otrank",
  "otprofile", "otcard", "otteam", "otshop", "otdaily", "otquest"
]);

function otoEmoji(key, fallback) {
  const animated = config.otoAnimatedEmojiIds || {};
  const staticSet = config.otoEmojiSet || {};
  if (config.otoAnimatedEmojiEnabled !== false && animated[key]) return animated[key];
  return staticSet[key] || fallback || "💠";
}

function otoNoImageEmbed(baseEmbed) {
  try {
    if (baseEmbed && typeof baseEmbed.setImage === "function") baseEmbed.setImage(null);
    if (baseEmbed && typeof baseEmbed.setThumbnail === "function") baseEmbed.setThumbnail(null);
  } catch (_) {}
  return baseEmbed;
}

function otoVisualsDisabled() {
  return config.otoVisualMode === "emoji_only" || config.otoUseImageAttachments === false || config.otoUseGeneratedImages === false;
}

function otoCanSendImageForCommand(commandName = "") {
  if (otoVisualsDisabled()) return false;
  return !OTO_IMAGE_DISABLED_COMMANDS.has(String(commandName || "").toLowerCase());
}

function otoCompactActionLine(type, text) {
  const icons = {
    hunt: otoEmoji("hunt", "🌱"),
    battle: otoEmoji("battle", "⚔️"),
    crate: otoEmoji("crate", "📦"),
    coin: otoEmoji("coin", "🪙"),
    fragment: otoEmoji("fragment", "<:PurpleR:1513668875189878785>"),
    win: otoEmoji("win", "💠"),
    lose: otoEmoji("lose", "💨"),
    draw: otoEmoji("draw", "⚖️"),
    npc: otoEmoji("npc", "🎴"),
    quest: otoEmoji("quest", "🎯"),
    top: otoEmoji("top", "🏆"),
    daily: otoEmoji("daily", "🎁"),
    blackjack: otoEmoji("blackjack", "🃏")
  };
  return `${icons[type] || "💠"} ${text}`;
}

function otoEmojiOnlyNotice() {
  return "Mode visual Hansip: compact embed + emoji animasi Discord. Tidak memakai image attachment.";
}

// Safety wrapper: command Hansip v1.26.0 should reply embeds only unless owner changes mode.
async function otoReplyCompact(message, embed, components = []) {
  return message.reply({ embeds: [otoNoImageEmbed(embed)], components });
}

/* =========================
   Hansip COMPACT EMBED + GIF VISUAL SYSTEM v1.25.0
   Prompt priority:
   - otbj/otblackjack: compact embed text only, no image/GIF/Canvas.
   - otnpc/otzoo/otcollection: compact rarity grid embed only, no image/GIF/Canvas.
   - otgive: compact transfer confirmation embed + buttons only, no image/GIF/Canvas.
   - oth/othunt: compact hunt embed only, no image/GIF/Canvas.
   - Other Hansip commands may use GIF/visual, but never placeholder/empty visual.
========================= */
const OTO_COMPACT_EMBED_COMMANDS = new Set(["otbj", "otblackjack", "otnpc", "otzoo", "otcollection", "otgive", "oth", "othunt"]);

function otoIsCompactEmbedOnlyCommand(commandName = "") {
  return OTO_COMPACT_EMBED_COMMANDS.has(String(commandName || "").toLowerCase());
}

function otoCompactFooter(extra = "") {
  return extra ? `DESA TULUS • Hansip ${extra}` : "DESA TULUS • Hansip";
}

function otoCardText(card) {
  if (!card) return "`??`";
  if (typeof card === "string") return `\`${card}\``;
  return `\`${card.rank || "?"}${card.suit || "♠"}\``;
}

function otoCardsText(cards = []) {
  const list = Array.isArray(cards) ? cards : [];
  return list.length ? list.map(otoCardText).join(" ") : "`?`";
}

function otoBlackjackValue(cards = []) {
  let total = 0;
  let aces = 0;
  for (const card of cards || []) {
    const rank = typeof card === "string" ? card.replace(/[♠♥♦♣]/g, "") : card.rank;
    if (rank === "A") { total += 11; aces += 1; }
    else if (["J", "Q", "K"].includes(rank)) total += 10;
    else total += Number(rank || 0);
  }
  while (total > 21 && aces > 0) { total -= 10; aces -= 1; }
  return total;
}

function otoBlackjackResult(playerTotal, dealerTotal, playerCards = []) {
  const natural = playerCards.length === 2 && playerTotal === 21;
  if (natural && dealerTotal !== 21) return "BLACKJACK";
  if (playerTotal > 21 && dealerTotal > 21) return "DRAW";
  if (playerTotal > 21) return "LOSE";
  if (dealerTotal > 21) return "WIN";
  if (playerTotal > dealerTotal) return "WIN";
  if (dealerTotal > playerTotal) return "LOSE";
  return "DRAW";
}

function otoBlackjackEmbed({ user, username, bet, dealerCards, playerCards, result }) {
  const dealerTotal = otoBlackjackValue(dealerCards);
  const playerTotal = otoBlackjackValue(playerCards);
  const finalResult = result || otoBlackjackResult(playerTotal, dealerTotal, playerCards);
  const colorMap = { WIN: "#0B5CFF", LOSE: "#FF4D6D", DRAW: "#F6C85F", BLACKJACK: "#00E5FF" };
  const profit = finalResult === "BLACKJACK" ? Math.floor(Number(bet || 0) * 1.5) : Number(bet || 0);
  const resultText = finalResult === "WIN"
    ? `💎 Kamu menang **${profit} Hansip Coin**!`
    : finalResult === "BLACKJACK"
      ? `🃏 BLACKJACK! Kamu menang **${profit} Hansip Coin**!`
      : finalResult === "DRAW"
        ? `⚖️ Seri! Bet **${bet} Hansip Coin** dikembalikan.`
        : `💨 Kamu kalah **${bet} Hansip Coin**!`;

  return new EmbedBuilder()
    .setColor(colorMap[finalResult] || "#0B5CFF")
    .setTitle(`🃏 Hansip Blackjack — ${finalResult}`)
    .setDescription(`${user || username}, kamu bet **${bet} Hansip Coin** buat main blackjack\n\n**Dealer** \`[${dealerTotal}]\`\n${otoCardsText(dealerCards)}\n\n**${username || "Player"}** \`[${playerTotal}]\`\n${otoCardsText(playerCards)}\n\n${resultText}`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
}

function otoRarityIcon(rarity = "common") { return otoRarityLetterV140(rarity); }

function otoCollectionGridEmbed({ username = "Player", counts = {}, points = 0, limitedActive = false }) {
  const row = (label, icon, amount = 0) => {
    const shown = Math.min(5, Number(amount || 0));
    const icons = shown ? Array(shown).fill(icon).join(" ") : "? ? ? ? ?";
    const extra = amount > 5 ? ` +${amount - 5}` : "";
    return `${label} ${icons}${extra}`;
  };

  const desc = [
    `🌱 🌿 🐾 💠 **${username}'s Hansip NPC Collection!** 💠 🐾 🌿 🌱`,
    "",
    row("C", "<:LetterC:1513669277759176704>", counts.common),
    row("U", "<:PastelGreenU:1513669101640482907>", counts.uncommon),
    row("R", "<:PurpleR:1513668875189878785>", counts.rare),
    row("E", "<:letter_E:1513668672609189888>", counts.epic),
    row("M", "<a:LetterM:1513668125638398262>", counts.mythic),
    row("S", "✨", counts.secret),
    limitedActive ? row("L", "💠", counts.limited) : "",
    "",
    `NPC Points: **${points}**`,
    `M-${counts.mythic || 0}, E-${counts.epic || 0}, R-${counts.rare || 0}, U-${counts.uncommon || 0}, C-${counts.common || 0}, S-${counts.secret || 0}`
  ].filter(Boolean).join("\n");

  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle(`🌿 ${username}'s Hansip NPC Collection!`)
    .setDescription(desc)
    .setFooter({ text: "DESA TULUS • Hansip" });
}

function otoGiveConfirmEmbed({ sender, receiver, amount }) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("🪙 Hansip Coin Transfer")
    .setDescription(`${sender} mau memberi Hansip Coin ke ${receiver}.\n\nUntuk menerima transfer ini, klik ✅ Confirm.\nUntuk membatalkan transaksi ini, klik ❌ Cancel.\n\n⚠️ **Aturan penting:**\nHansip Coin hanya currency virtual game. Dilarang dipakai untuk jual beli uang asli, saldo, pulsa, crypto, item real, atau transaksi dunia nyata.\n\n**${sender} akan memberi ${receiver}:**\n\n${amount} Hansip Coin`)
    .setFooter({ text: "DESA TULUS • Hansip Transfer" });
}

function otoHuntCompactEmbed({ username = "Player", coreNow = 364, coreMax = 450, fragNow = 386, fragMax = 450, npcLines = [], fragmentLines = [], xp = 35, bonusLine = "-", humor = "" }) {
  const npcText = npcLines.length ? npcLines.join(" • ") : "Belum menemukan NPC kali ini.";
  const fragText = fragmentLines.length ? fragmentLines.join("\n") : "Tidak ada fragment tambahan.";
  return new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("🌱 Hansip Hunt")
    .setDescription(`🌱 **${username}**, hunt kamu diperkuat oleh 💠 \`[${coreNow}/${coreMax}]\` <:PurpleR:1513668875189878785> \`[${fragNow}/${fragMax}]\`!\n\nKamu menemukan:\n${npcText}\n\nFragment:\n${fragText}\n\nEXP:\n**+${xp} XP**\n\nBonus:\n${bonusLine}${humor ? `\n\nKomentar:\n${humor}` : ""}`)
    .setFooter({ text: "DESA TULUS • Hansip" });
}

function otoCommandAllowsVisual(commandName = "") {
  return !otoIsCompactEmbedOnlyCommand(commandName);
}

/* =========================
   Hansip GIF-ONLY VISUAL PIPELINE v1.24.0
   Default semua visual utama adalah GIF pendek.
   PNG bukan default dan hanya boleh sebagai emergency fallback jika owner mengaktifkan otoEmergencyPngFallback.
   Kalau GIF gagal/invalid, bot mengirim embed text fallback agar tidak pernah mengirim gambar kosong.
========================= */
const OTO_GIF_ONLY_VISUAL_DEFAULTS = {
  otoVisualMode: "emoji_only",
  otoAnimatedVisualEnabled: true,
  otoStaticImageEnabled: false,
  otoAnimationFallbackToImage: false,
  otoAnimationFallbackToEmbed: true,
  otoEmergencyPngFallback: false,
  otoAnimationMaxSeconds: 4,
  otoAnimationFps: 12,
  otoAnimationMaxSizeMb: 8
};

function otoShouldUseGifVisual(commandName = "") {
  if (config.otoEnabled === false) return false;
  if (config.otoAnimatedVisualEnabled === false) return false;
  const mode = config.otoVisualMode || "gif_only";
  return mode === "gif_only" || mode === "auto" || mode === "animation_only_safe";
}

function otoCanEmergencyPngFallback() {
  return Boolean(config.otoEmergencyPngFallback);
}

function otoGifFailedFallbackEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(config.otoEmbedDark || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle(title || "💠 Hansip Visual")
    .setDescription(`${description || "Visual GIF gagal dibuat, jadi Hansip menampilkan fallback text agar bot tetap aman."}\n\nGenerated Hansip GIF failed, using text fallback embed.`)
    .setFooter({ text: config.otoFooter || "DESA TULUS • Hansip" });
}

function otoValidateGifBuffer(buffer, context = "visual") {
  if (!buffer || !Buffer.isBuffer(buffer)) return { ok: false, reason: `${context}: buffer kosong` };
  if (buffer.length < 1024) return { ok: false, reason: `${context}: GIF terlalu kecil / kemungkinan kosong` };
  const maxMb = Number(config.otoAnimationMaxSizeMb || 8);
  if (buffer.length > maxMb * 1024 * 1024) return { ok: false, reason: `${context}: GIF melebihi ${maxMb}MB` };
  const header = buffer.subarray(0, 6).toString("ascii");
  if (!header.startsWith("GIF")) return { ok: false, reason: `${context}: bukan GIF valid` };
  return { ok: true, reason: "valid" };
}

// Function target v1.24.0. Semua function harus menggambar isi sesuai command, bukan background kosong.
async function generateBlackjackGif(payload) { return typeof generateBlackjackAnimation === "function" ? generateBlackjackAnimation(payload) : null; }
async function generateCoinFlipGif(payload) { return typeof generateCoinFlipAnimation === "function" ? generateCoinFlipAnimation(payload) : null; }
async function generateHuntGif(payload) { return typeof generateHuntAnimation === "function" ? generateHuntAnimation(payload) : null; }
async function generateNpcCardGif(payload) { return typeof generateNpcCardImage === "function" ? generateNpcCardImage(payload) : null; }
async function generateProfileGif(payload) { return typeof generateProfileImage === "function" ? generateProfileImage(payload) : null; }
async function generateNPCGif(payload) { return typeof generateNPCImage === "function" ? generateNPCImage(payload) : null; }
async function generateInventoryGif(payload) { return typeof generateInventoryImage === "function" ? generateInventoryImage(payload) : null; }
async function generateCrateGif(payload) { return typeof generateCrateAnimation === "function" ? generateCrateAnimation(payload) : null; }
async function generateCrateMassOpenGif(payload) { return typeof generateCrateImage === "function" ? generateCrateImage(payload) : null; }
async function generateBattleGif(payload) { return typeof generateBattleAnimation === "function" ? generateBattleAnimation(payload) : null; }
async function generateLeaderboardGif(payload) { return typeof generateLeaderboardImage === "function" ? generateLeaderboardImage(payload) : null; }
async function generateTeamGif(payload) { return typeof generateBattleImage === "function" ? generateBattleImage(payload) : null; }
async function generateShopGif(payload) { return typeof generateCrateImage === "function" ? generateCrateImage(payload) : null; }

function isObject(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function deepMerge(base, extra) {
  const output = { ...base };
  for (const [key, value] of Object.entries(extra || {})) {
    if (isObject(value) && isObject(output[key])) output[key] = deepMerge(output[key], value);
    else output[key] = value;
  }
  return output;
}

function readJsonFile(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
}

function writeJsonFile(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  persistFileToMongo(file, data);
}

function loadConfig() {
  const loaded = readJsonFile(CONFIG_FILE, {});
  return deepMerge(DEFAULT_CONFIG, loaded);
}

function saveConfig(nextConfig) {
  config = deepMerge(DEFAULT_CONFIG, nextConfig || {});
  writeJsonFile(CONFIG_FILE, config);
  return config;
}

/* =========================
   MONGODB ANTI RESET STORAGE
   - Discord tetap jadi sumber data member/channel/role.
   - MongoDB menyimpan data bot: config dashboard, AFK, sambung kata, dan mabar.
   - Kalau MONGODB_URI kosong/error, bot tetap jalan pakai JSON lokal sebagai fallback.
========================= */
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGO_URL || "";
const PERSISTENCE_FILES = [
  { key: "config", file: CONFIG_FILE, fallback: DEFAULT_CONFIG },
  { key: "mabar", file: DATA_FILE, fallback: [] },
  { key: "afk", file: AFK_DATA_FILE, fallback: {} },
  { key: "sambungKata", file: SAMBUNG_DATA_FILE, fallback: { round: 1, words: [], contributions: [], contributors: [], startedAt: Date.now(), updatedAt: Date.now() } },
  { key: "panelState", file: PANEL_STATE_FILE, fallback: {} },
  { key: "gameData", file: GAME_DATA_FILE, fallback: {} },
  { key: "gamePlayers", file: GAME_PLAYERS_FILE, fallback: {} },
  { key: "gameItems", file: GAME_ITEMS_FILE, fallback: [] },
  { key: "gameShop", file: GAME_SHOP_FILE, fallback: {} },
  { key: "gameEvents", file: GAME_EVENTS_FILE, fallback: [] },
  { key: "gameQuests", file: GAME_QUESTS_FILE, fallback: [] },
  { key: "gameAchievements", file: GAME_ACHIEVEMENTS_FILE, fallback: [] },
  { key: "gameLeaderboard", file: GAME_LEADERBOARD_FILE, fallback: [] },
  { key: "gameBackup", file: GAME_BACKUP_FILE, fallback: {} },
  { key: "gameSeasons", file: GAME_SEASONS_FILE, fallback: {} },
  { key: "gameWorld", file: GAME_WORLD_FILE, fallback: {} },
  { key: "gameBattle", file: GAME_BATTLE_FILE, fallback: {} },
  { key: "gameDungeons", file: GAME_DUNGEONS_FILE, fallback: {} },
  { key: "gameRaid", file: GAME_RAID_FILE, fallback: {} },
  { key: "gameGuilds", file: GAME_GUILDS_FILE, fallback: {} },
  { key: "gameStory", file: GAME_STORY_FILE, fallback: {} },
  { key: "gameRisk", file: GAME_RISK_FILE, fallback: {} },
  { key: "gameHumor", file: GAME_HUMOR_FILE, fallback: {} },
  { key: "gameChaos", file: GAME_CHAOS_FILE, fallback: {} },
  { key: "gameMarket", file: GAME_MARKET_FILE, fallback: {} },
  { key: "gameBank", file: GAME_BANK_FILE, fallback: {} },
  { key: "otoPlayers", file: OTO_PLAYERS_FILE, fallback: {} },
  { key: "otoBackup", file: OTO_BACKUP_FILE, fallback: {} },
  { key: "otoItems", file: OTO_ITEMS_FILE, fallback: [] },
  { key: "otoNpcs", file: OTO_NPCS_FILE, fallback: [] },
  { key: "otoAssets", file: OTO_ASSETS_FILE, fallback: {} },
  { key: "otoBattles", file: OTO_BATTLES_FILE, fallback: {} },
  { key: "otoArcade", file: OTO_ARCADE_FILE, fallback: {} },
];

let mongoStore = null;
let mongoReady = false;
let mongoBooted = false;
let mongoLastError = "";

function getStorageMode() {
  if (mongoReady) return "MongoDB Anti Reset";
  if (MONGODB_URI) return `JSON fallback${mongoLastError ? ` (${mongoLastError})` : ""}`;
  return "JSON lokal (MONGODB_URI belum diisi)";
}

function findPersistenceByFile(file) {
  const target = path.resolve(file);
  return PERSISTENCE_FILES.find(item => path.resolve(item.file) === target);
}

function persistFileToMongo(file, data) {
  const item = findPersistenceByFile(file);
  if (!item) return;
  persistJsonKey(item.key, data);
}

function persistJsonKey(key, data) {
  if (!mongoReady || !mongoStore) return;
  mongoStore.updateOne(
    { key },
    { $set: { key, value: data, updatedAt: new Date() } },
    { upsert: true }
  ).catch(error => {
    mongoLastError = error.message || String(error);
    console.error(`⚠️ MongoDB gagal simpan ${key}:`, mongoLastError);
  });
}

async function seedMongoFromLocalFiles() {
  for (const item of PERSISTENCE_FILES) {
    const existing = await mongoStore.findOne({ key: item.key }).lean().catch(() => null);

    if (existing && existing.value !== undefined) {
      fs.mkdirSync(path.dirname(item.file), { recursive: true });
      fs.writeFileSync(item.file, JSON.stringify(existing.value, null, 2));
      continue;
    }

    const localValue = readJsonFile(item.file, item.fallback);
    await mongoStore.updateOne(
      { key: item.key },
      { $set: { key: item.key, value: localValue, updatedAt: new Date() } },
      { upsert: true }
    ).catch(error => {
      mongoLastError = error.message || String(error);
      console.error(`⚠️ MongoDB gagal seed ${item.key}:`, mongoLastError);
    });
  }
}

async function initPersistentStorage() {
  if (mongoBooted) return mongoReady;
  mongoBooted = true;

  fs.mkdirSync(DATA_DIR, { recursive: true });

  if (!MONGODB_URI) {
    console.log("💾 Storage: JSON lokal. Isi MONGODB_URI untuk anti reset permanen.");
    return false;
  }

  try {
    mongoose.set("strictQuery", false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000
    });

    const kvSchema = new mongoose.Schema({
      key: { type: String, required: true, unique: true, index: true },
      value: { type: mongoose.Schema.Types.Mixed, default: {} },
      updatedAt: { type: Date, default: Date.now }
    }, { collection: "ot_bot_storage", minimize: false });

    mongoStore = mongoose.models.OTBotStorage || mongoose.model("OTBotStorage", kvSchema);
    mongoReady = true;
    mongoLastError = "";

    await seedMongoFromLocalFiles();
    config = loadConfig();

    console.log("✅ MongoDB Anti Reset connected. Data Hansip aman disimpan permanen.");
    return true;
  } catch (error) {
    mongoReady = false;
    mongoLastError = error.message || String(error);
    console.error("⚠️ MongoDB belum tersambung. Hansip tetap jalan pakai JSON fallback:", mongoLastError);
    return false;
  }
}

let config = loadConfig();

/* =========================
   WEB SERVER UNTUK RAILWAY
========================= */
const app = express();
const PORT = Number(process.env.OT_PORT || process.env.PORT || 3000);
const DASHBOARD_BUILD_VERSION = "OT_AFK_AUTOCLEAN_FIX_2026_06_07";

app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.json({ limit: "2mb" }));

const DASHBOARD_COOKIE = "ot_dashboard";
const PLACEHOLDERS = [
  "{server}", "{owner}", "{ownerId}", "{user}", "{username}", "{userId}", "{displayName}",
  "{channel}", "{channelId}", "{messageId}", "{jumpUrl}", "{content}", "{reason}", "{link}", "{domain}",
  "{time}", "{date}", "{feature}", "{game}", "{mode}", "{slot}", "{waktu}", "{voice}",
  "{host}", "{hostId}", "{round}", "{words}", "{contributors}", "{afkReason}", "{afkDuration}",
  "{deletedCount}", "{scamType}", "{attachmentName}", "{platform}", "{status}", "{prefix}", "{bot}", "{botId}"
];

function htmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseCookies(req) {
  const header = req.headers.cookie || "";
  return Object.fromEntries(
    header.split(";").map(v => v.trim()).filter(Boolean).map(v => {
      const i = v.indexOf("=");
      return i === -1 ? [v, ""] : [v.slice(0, i), decodeURIComponent(v.slice(i + 1))];
    })
  );
}

function dashboardPassword() {
  // Default ini sengaja dibuat supaya dashboard langsung bisa dipakai.
  // Untuk keamanan, tetap disarankan ganti lewat Railway Variables: DASHBOARD_PASSWORD.
  return process.env.DASHBOARD_PASSWORD || process.env.ADMIN_PASSWORD || "otpanel";
}

function usingDefaultDashboardPassword() {
  return !(process.env.DASHBOARD_PASSWORD || process.env.ADMIN_PASSWORD);
}

function dashboardSecret() {
  return process.env.DASHBOARD_SECRET || crypto.createHash("sha256").update(`${dashboardPassword()}|${process.env.DISCORD_TOKEN || "ot-bot"}`).digest("hex");
}

function signDashboard(value) {
  return crypto.createHmac("sha256", dashboardSecret()).update(value).digest("hex");
}

function makeDashboardToken() {
  const base = crypto.createHash("sha256").update(dashboardPassword()).digest("hex");
  return `${base}.${signDashboard(base)}`;
}

function isDashboardAuthed(req) {
  const pass = dashboardPassword();
  if (!pass) return false;
  const token = parseCookies(req)[DASHBOARD_COOKIE];
  if (!token) return false;
  const expected = makeDashboardToken();
  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}

function requireDashboard(req, res, next) {
  if (isDashboardAuthed(req)) return next();
  return res.status(401).json({ ok: false, error: "Belum login dashboard." });
}

function loginPage(error = "") {
  const passwordReady = Boolean(dashboardPassword());
  const defaultPassword = usingDefaultDashboardPassword();
  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Hansip Dashboard Login</title>
<style>
:root{--bg:#060813;--panel:rgba(13,18,35,.86);--line:rgba(255,255,255,.14);--text:#f8fbff;--muted:rgba(248,251,255,.66);--danger:#ff5d7a;--cyan:#35d8ff;--purple:#8b5cf6;--pink:#ff6bd6;--green:#43f0a3}
*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Inter,system-ui,Segoe UI,Arial;background:radial-gradient(circle at 18% -10%,rgba(139,92,246,.34),transparent 35%),radial-gradient(circle at 90% 8%,rgba(53,216,255,.22),transparent 34%),radial-gradient(circle at 50% 110%,rgba(67,240,163,.13),transparent 42%),linear-gradient(180deg,#050711,#091020 48%,#050711);color:var(--text);padding:20px;overflow:hidden}body:before{content:"";position:fixed;inset:0;background-image:linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px);background-size:44px 44px;mask-image:linear-gradient(180deg,rgba(0,0,0,.55),transparent 80%);pointer-events:none}.card{position:relative;width:min(480px,94vw);background:linear-gradient(180deg,rgba(255,255,255,.11),rgba(255,255,255,.055));border:1px solid var(--line);border-radius:32px;padding:32px;box-shadow:0 34px 110px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.12);backdrop-filter:blur(20px)}.card:after{content:"";position:absolute;right:-80px;top:-80px;width:180px;height:180px;border-radius:999px;background:radial-gradient(circle,rgba(255,255,255,.20),transparent 63%)}.logo{width:76px;height:76px;border-radius:26px;display:grid;place-items:center;background:linear-gradient(135deg,var(--purple),var(--cyan));border:1px solid rgba(255,255,255,.18);margin-bottom:18px;font-size:36px;box-shadow:0 20px 60px rgba(139,92,246,.35)}.title{font-size:30px;font-weight:1000;letter-spacing:-1px;margin:0}.sub{color:var(--muted);line-height:1.65;font-weight:650}input{width:100%;padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.14);background:rgba(4,8,20,.58);color:var(--text);outline:none}input:focus{border-color:rgba(53,216,255,.65);box-shadow:0 0 0 4px rgba(53,216,255,.14)}button{width:100%;margin-top:14px;padding:16px;border:0;border-radius:18px;color:white;background:linear-gradient(135deg,var(--purple),var(--cyan));font-weight:1000;cursor:pointer;box-shadow:0 16px 45px rgba(53,216,255,.22)}button:hover{filter:brightness(1.05);transform:translateY(-1px)}.warn{background:rgba(255,93,122,.10);color:#ffd1dc;border:1px solid rgba(255,93,122,.25);padding:12px;border-radius:18px}.err{color:#ffd1dc;font-weight:800}.small{font-size:13px;color:var(--muted);line-height:1.6}code{background:rgba(0,0,0,.28);padding:2px 6px;border-radius:7px;color:#b8f4ff}
</style></head><body><main class="card"><div class="logo">🤖</div><h1 class="title">Hansip Dashboard</h1><p class="sub">Login untuk mengatur fitur DESA TULUS, channel, role, dan placeholder.</p>${defaultPassword ? `<p class="warn">Dashboard memakai password default: <b>otpanel</b>. Nanti ganti lewat Railway Variables: <code>DASHBOARD_PASSWORD</code> supaya lebih aman.</p>` : (!passwordReady ? `<p class="warn">DASHBOARD_PASSWORD belum diisi di Railway Variables.</p>` : "")}${error ? `<p class="err">${htmlEscape(error)}</p>` : ""}<form method="post" action="/dashboard/login"><input type="password" name="password" placeholder="Masukkan password dashboard" ${passwordReady ? "" : "disabled"} /><button ${passwordReady ? "" : "disabled"}>Masuk Dashboard</button></form><p class="small">Railway Variables yang disarankan: <code>DASHBOARD_PASSWORD</code>, <code>DISCORD_TOKEN</code>, <code>GUILD_ID</code>.</p></main></body></html>`;
}

const SENSITIVE_DASHBOARD_KEY = /(token|secret|password|pass|api[_-]?key|apikey|authorization|cookie|session|mongodb|mongo_uri|mongoUrl|databaseUrl|uri)$/i;

function isSensitiveConfigKey(key = "") {
  return SENSITIVE_DASHBOARD_KEY.test(String(key));
}

function makePublicConfig(value) {
  if (Array.isArray(value)) return value.map(makePublicConfig);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveConfigKey(key)) {
        out[key] = "***DISENSOR***";
        continue;
      }
      out[key] = makePublicConfig(val);
    }
    return out;
  }
  return value;
}

function stripSensitiveConfigInput(value) {
  if (Array.isArray(value)) return value.map(stripSensitiveConfigInput);
  if (value && typeof value === "object") {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (isSensitiveConfigKey(key)) continue;
      out[key] = stripSensitiveConfigInput(val);
    }
    return out;
  }
  return value;
}

function isPlaceholderValue(value = "") {
  return String(value || "").trim() === "" || String(value || "").includes("ISI_") || String(value || "").includes("ID_");
}

function validateSnowflakeLike(value, label) {
  const text = String(value || "").trim();
  if (isPlaceholderValue(text)) return;
  if (!/^\d{15,25}$/.test(text)) {
    throw new Error(`${label} harus berupa ID Discord angka 15-25 digit atau dikosongkan.`);
  }
}

function walkConfigForValidation(value, pathName = "config") {
  if (Array.isArray(value)) {
    value.forEach((item, i) => walkConfigForValidation(item, `${pathName}[${i}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  for (const [key, val] of Object.entries(value)) {
    const full = `${pathName}.${key}`;
    if (typeof val === "string") {
      if (/color$/i.test(key) || key === "embedColor" || key === "accent") {
        const text = val.trim();
        if (text && !/^#?[0-9a-fA-F]{6}$/.test(text)) throw new Error(`${full} harus warna HEX, contoh #0B5CFF.`);
      }
      if (/(channelId|roleId|ownerUserId|clientId|guildId)$/i.test(key)) validateSnowflakeLike(val, full);
    }
    walkConfigForValidation(val, full);
  }
}

function normalizeDashboardConfig(input = {}) {
  const clean = stripSensitiveConfigInput(input);
  if (clean.embedColor && /^[0-9a-fA-F]{6}$/.test(clean.embedColor)) clean.embedColor = `#${clean.embedColor}`;
  if (clean.dashboard?.accent && /^[0-9a-fA-F]{6}$/.test(clean.dashboard.accent)) clean.dashboard.accent = `#${clean.dashboard.accent}`;
  walkConfigForValidation(clean);
  return clean;
}


function dashboardArrayText(value) {
  if (Array.isArray(value)) return value.join("\n");
  if (value === undefined || value === null) return "";
  return String(value);
}

function dashboardParseList(value) {
  return String(value || "")
    .split(/[\n,]/)
    .map(item => item.trim())
    .filter(Boolean);
}

function dashboardSetPath(target, pathName, value) {
  const keys = String(pathName).split(".");
  let cur = target;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!cur[keys[i]] || typeof cur[keys[i]] !== "object" || Array.isArray(cur[keys[i]])) cur[keys[i]] = {};
    cur = cur[keys[i]];
  }
  cur[keys[keys.length - 1]] = value;
}

function dashboardGetPath(target, pathName) {
  return String(pathName).split(".").reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), target);
}

function dashboardToBool(value) {
  return value === true || value === "true" || value === "on" || value === "1";
}

function dashboardFormToConfig(body = {}) {
  const next = deepMerge(DEFAULT_CONFIG, config);
  const arrayFields = new Set([
    "staffRoleIds",
    "permissionCenter.staffRoleIds",
    "permissionCenter.adminRoleIds",
    "permissionCenter.panelRoleIds",
    "permissionCenter.logRoleIds",
    "commandCenter.disabledCommands",
    "gameAutoEventTimes",
    "gameDisabledModes",
    "gameDisabledModules",
  ]);
  const boolFields = new Set([
    "afkRemoveOnMessage",
    "sambungKataShowProgress",
    "features.afk",
    "features.mabar",
    "features.saran",
    "features.panel",
    "features.dashboard",
    "features.truthOrDare",
    "features.sambungKata",
    "permissionCenter.allowStaffSendPanel",
    "permissionCenter.allowStaffViewLogs",
    "permissionCenter.allowStaffManageMabar",
    "permissionCenter.allowStaffAnnouncement",
    "commandCenter.showLegacyAliases",
    "commandCenter.maintenanceMode",
    "commandCenter.restoreRequiresConfirm",
    "gameEnabled",
    "gameAutoEventEnabled",
    "gameAutoManagerEnabled",
    "gameBossAutoSpawn",
    "gameAutoAnnouncement",
    "gameAutoPanelRefreshOnEvent",
    "gameAutoEnergyRegen",
    "gameAutoDailyReset",
    "gameAutoWeeklyReset",
    "gameAutoShopRefresh",
    "gameAutoBackup",
    "gameAutoPanelUpdate",
    "gameAutoLeaderboardUpdate",
    "gameAutoCleanupSessions",
    "gameBannerEnabled",
    "gameCommandMainMode",
    "gameButtonsForConfirmationOnly",
    "gameRiskModeEnabled",
    "gameRealMoneyDisabled",
    "gameHumorEnabled",
    "gameChaosEnabled",
    "gameHeavyFeaturesEnabled",
    "gameAutoCleanupEnabled",
    "gameSocialSafeMode",
    "gameTradeEnabled",
    "gameGiftEnabled",
    "gameMarketEnabled",
    "gameAuctionEnabled",
    "gameBankEnabled",
    "gameModuleToggles.guild",
    "gameModuleToggles.market",
    "gameModuleToggles.auction",
    "gameModuleToggles.risk",
    "gameModuleToggles.lucky",
    "gameModuleToggles.humor",
    "gameModuleToggles.chaos",
    "gameModuleToggles.farming",
    "gameModuleToggles.fishing",
    "gameModuleToggles.race",
    "gameModuleToggles.cooking",
    "gameModuleToggles.story",
    "gameModuleToggles.tournament",
    "gameModuleToggles.communityProject",
    "otoEnabled",
    "otoOnlyOneChannel",
    "otoAutoImageEnabled",
    "otoExternalAiImageEnabled",
    "otoImageFallbackEnabled",
    "otoRoyaleEnabled",
    "otoAllInEnabled",
    "otoRealMoneyDisabled",
    "otoCashoutDisabled",
    "otoBannerEnabled",
    "otoDashboardImageStudioEnabled",
    "otoWeaponDropOnlyFromCrate",
    "otoAutoBackupEnabled",
    "otoVariantEnabled",
    "otoShinyEnabled",
    "otoDuplicateToFragment",
    "otoTeamSynergyEnabled",
    "otoReleaseRequireConfirmEpic",
    "otoPremiumCardLayout",
    "otoVisualPngEnabled",
    "otoImageCacheEnabled",
    "otoImageAutoCleanup",
    "otoArcadeEnabled",
    "otoBlackjackEnabled",
    "otoCoinFlipEnabled",
    "otoCoinTransferEnabled"
  ]);
  const numberFields = new Set([
    "sambungKataTargetWords",
    "sambungKataMaxWordsPerMessage",
    "commandCenter.panelAntiSpamMs",
    "commandCenter.suggestionCooldownMs",
    "gameCooldownMs",
    "gameAutoEventDurationMinutes",
    "gameEnergyRegenMinutes",
    "gameEnergyRegenAmount",
    "gameAutoBackupEveryHours",
    "gameRiskDailyLimit",
    "gameLuckyDailyLimit",
    "otoCooldownMs",
    "otoHuntCooldownMs",
    "otoBattleCooldownMs",
    "otoOpenCooldownMs",
    "otoWorkCooldownMs",
    "otoRoyaleCooldownMs",
    "otoDailyCooldownMs",
    "otoMaxBet",
    "otoBackupEveryHours",
    "otoMinBet",
    "otoBlackjackMaxBet",
    "otoCoinFlipMaxBet"
  ]);

  for (const [key, raw] of Object.entries(body)) {
    if (!key.startsWith("cfg_")) continue;
    const pathName = key.slice(4);
    if (isSensitiveConfigKey(pathName)) continue;
    let value = raw;
    if (Array.isArray(value)) value = value[value.length - 1];
    if (arrayFields.has(pathName)) value = dashboardParseList(value);
    else if (boolFields.has(pathName)) value = dashboardToBool(value);
    else if (numberFields.has(pathName)) value = Number(value || 0);
    dashboardSetPath(next, pathName, value);
  }
  return normalizeDashboardConfig(next);
}

function dashboardTabFromReq(req) {
  const allowed = new Set(["home", "oto", "game", "commands", "permissions", "mabar", "truth", "afk", "sambung", "channels", "roles", "dashboard", "json", "logs", "status", "actions"]);
  const tab = String(req.query.tab || "home").toLowerCase();
  return allowed.has(tab) ? tab : "home";
}

function dashboardInput(pathName, label, options = {}) {
  const value = dashboardGetPath(config, pathName);
  const type = options.type || "text";
  const wide = options.wide ? " wide" : "";
  const hint = options.hint || pathName;
  if (type === "checkbox") {
    return `<label class="switch${wide}"><input type="hidden" name="cfg_${htmlEscape(pathName)}" value="false"><input type="checkbox" name="cfg_${htmlEscape(pathName)}" value="true" ${value ? "checked" : ""}> <b>${htmlEscape(label)}</b><span>${htmlEscape(hint)}</span></label>`;
  }
  if (type === "textarea") {
    return `<div class="field${wide}"><label>${htmlEscape(label)}<span>${htmlEscape(hint)}</span></label><textarea name="cfg_${htmlEscape(pathName)}" placeholder="${htmlEscape(options.placeholder || label)}">${htmlEscape(dashboardArrayText(value))}</textarea></div>`;
  }
  return `<div class="field${wide}"><label>${htmlEscape(label)}<span>${htmlEscape(hint)}</span></label><input type="${htmlEscape(type)}" name="cfg_${htmlEscape(pathName)}" value="${htmlEscape(value ?? "")}" placeholder="${htmlEscape(options.placeholder || label)}"></div>`;
}

function dashboardSaveForm(tab, inner, title = "Edit Config") {
  return `<form method="post" action="/dashboard/save?tab=${encodeURIComponent(tab)}" class="panel save-panel"><div class="panel-title"><div><h3>${title}</h3><p>Ubah setting, lalu klik simpan. Tidak menyentuh data member Discord.</p></div><span class="chip ok">Bisa diedit</span></div><div class="form-grid">${inner}</div><div class="sticky-actions"><button class="btn primary" type="submit">💾 Simpan Perubahan</button><button class="btn ghost" type="reset">↩️ Reset Form</button><a class="btn ghost" href="/dashboard?tab=${encodeURIComponent(tab)}&reload=${Date.now()}">🔄 Reload Config</a><a class="btn ghost" href="/dashboard?tab=json">🧾 Buka JSON Config</a></div></form>`;
}

function dashboardDiscordDataSync() {
  if (!dashboardDiscordCache) startDashboardCacheRefresh().catch(() => null);
  return dashboardDiscordCache || emptyDiscordDashboardData({ loading: true, error: "Data Discord sedang dimuat di background." });
}

function dashboardFeatureItems() {
  return [
    { key: "commands", icon: "⌨️", title: "Command Center", desc: "Command othelp, otpanel, otstatus, backup, dan permission.", active: true, tab: "commands" },
    { key: "permissions", icon: "🔐", title: "Permission Center", desc: "Owner ID, role staff, akses panel, dan akses log.", active: true, tab: "permissions" },
    { key: "oto", icon: "💠", title: "Hansip Royale", desc: "HANSIP DESA TULUS: NPC card, crate, battle, auto image, dan coin game virtual.", active: Boolean(config.otoEnabled !== false), tab: "oto" },
    { key: "gameHub", icon: "🎮", title: "Hansip", desc: "Game satu channel, auto event, shop, quest, item, dan leaderboard.", active: Boolean(config.gameEnabled !== false), tab: "game" },
    { key: "mabar", icon: "⚔️", title: "Cari Mabar", desc: "Panel cari teman main, role game, dan channel mabar.", active: Boolean(config.mabarChannelId), tab: "mabar" },
    { key: "truth", icon: "🎭", title: "Truth or Dare", desc: "Panel Truth/Dare bahasa Indonesia.", active: Boolean(config.truthOrDareChannelId), tab: "truth" },
    { key: "afk", icon: "😴", title: "AFK / otafk", desc: "Status AFK, prefix nickname, dan auto remove saat chat.", active: Boolean(config.afkChannelId), tab: "afk" },
    { key: "sambung", icon: "📖", title: "Sambung Kata", desc: "Game sambung kata otomatis sampai target kata.", active: Boolean(config.sambungKataChannelId), tab: "sambung" },
    { key: "mongo", icon: "💾", title: "MongoDB Anti Reset", desc: "Data bot disimpan permanen agar aman dari reset.", active: Boolean(mongoReady), tab: "status" },
    { key: "discord", icon: "🗺️", title: "Discord Map", desc: "Channel dan role server masuk dashboard.", active: true, tab: "channels" },
    { key: "dashboard", icon: "🎨", title: "Dashboard", desc: "Tema, judul, preview, dan config aman.", active: true, tab: "dashboard" }
  ];
}

function dashboardMenu(activeTab) {
  const menu = [
    ["home", "🏠", "Home"],
    ["oto", "💠", "Hansip Royale"],
    ["game", "🎮", "Hansip"],
    ["commands", "⌨️", "Command Center"],
    ["permissions", "🔐", "Permission Center"],
    ["mabar", "⚔️", "Cari Mabar"],
    ["truth", "🎭", "Truth/Dare"],
    ["afk", "😴", "AFK"],
    ["sambung", "📖", "Sambung Kata"],
    ["channels", "🗺️", "Channel Settings"],
    ["roles", "🎭", "Role Settings"],
    ["dashboard", "🎨", "Dashboard Theme"],
    ["json", "🧾", "JSON Config"],
    ["logs", "📜", "Logs"],
    ["actions", "⚡", "Quick Actions"]
  ];
  return menu.map(([tab, icon, label]) => `<a class="nav-item ${tab === activeTab ? "active" : ""}" href="/dashboard?tab=${tab}"><span>${icon}</span>${label}</a>`).join("");
}

function dashboardChannelTable(discord) {
  const channels = discord.channels || [];
  if (!channels.length) return `<div class="empty">Channel belum kebaca. Klik tombol Refresh Discord, tapi form tetap bisa diedit manual.</div>`;
  const options = ["mabarChannelId", "truthOrDareChannelId", "afkChannelId", "sambungKataChannelId", "ownerLogChannelId"];
  return `<div class="table-wrap"><table><thead><tr><th>Channel</th><th>Type</th><th>ID</th><th>Copy</th></tr></thead><tbody>${channels.map(ch => `<tr><td>#${htmlEscape(ch.name)}</td><td>${htmlEscape(ch.typeName || ch.type)}</td><td class="mono">${htmlEscape(ch.id)}</td><td><button class="mini" type="button" onclick="copyText('${htmlEscape(ch.id)}')">Copy ID</button></td></tr>`).join("")}</tbody></table></div><p class="note">Pakai ID di atas ke form channel. Tombol copy memakai JavaScript kecil, tapi navigasi dan simpan tetap jalan tanpa JavaScript.</p>`;
}

function dashboardRoleTable(discord) {
  const roles = discord.roles || [];
  if (!roles.length) return `<div class="empty">Role belum kebaca. Klik Refresh Discord, atau isi ID role manual.</div>`;
  return `<div class="table-wrap"><table><thead><tr><th>Role</th><th>Posisi</th><th>ID</th><th>Copy</th></tr></thead><tbody>${roles.map(role => `<tr><td>@${htmlEscape(role.name)}</td><td>${htmlEscape(role.position)}</td><td class="mono">${htmlEscape(role.id)}</td><td><button class="mini" type="button" onclick="copyText('${htmlEscape(role.id)}')">Copy ID</button></td></tr>`).join("")}</tbody></table></div>`;
}

function dashboardJsonSafe() {
  return JSON.stringify(makePublicConfig(config), null, 2);
}

function dashboardContent(tab, notice = "") {
  const discord = dashboardDiscordDataSync();
  const stats = getDashboardStats();
  const features = dashboardFeatureItems();
  const noticeBox = notice ? `<div class="notice">${htmlEscape(notice)}</div>` : "";

  if (tab === "commands") return noticeBox + dashboardCommandCenterHtml();

  if (tab === "permissions") return noticeBox + dashboardPermissionCenterHtml();

  if (tab === "oto") return noticeBox + dashboardOtoCenterHtml();
  if (tab === "game") return noticeBox + dashboardGameHubHtml();

  if (tab === "mabar") return noticeBox + dashboardSaveForm("mabar", [
    dashboardInput("mabarChannelId", "Channel Cari Mabar"),
    ...MABAR_ALL_GAMES.map(game =>
      dashboardInput(`gameRoleIds.${game}`, `Role ${game}`)
    )
  ].join(""), "🌾 Cari Mabar DESA TULUS") +
  `<div class="panel"><h3>Daftar Game</h3><p class="note">Mobile: ${GAME_OPTIONS.Mobile.length} pilihan • PC: ${GAME_OPTIONS.PC.length} pilihan. Isi role hanya untuk game yang memiliki role khusus.</p></div>` +
  `<div class="panel"><h3>Channel Discord</h3>${dashboardChannelTable(discord)}</div>`;

  if (tab === "truth") return noticeBox + dashboardSaveForm("truth", [
    dashboardInput("truthOrDareChannelId", "Channel Truth or Dare")
  ].join(""), "🎭 Truth or Dare Settings") + `<div class="panel"><h3>Channel Discord</h3>${dashboardChannelTable(discord)}</div>`;

  if (tab === "afk") return noticeBox + dashboardSaveForm("afk", [
    dashboardInput("afkChannelId", "Channel Status AFK"),
    dashboardInput("afkNicknamePrefix", "Prefix Nickname AFK"),
    dashboardInput("afkRemoveOnMessage", "AFK hilang otomatis saat user chat", { type: "checkbox", wide: true }),
    dashboardInput("ownerLogChannelId", "Owner Log Channel ID")
  ].join(""), "😴 AFK / otafk Settings") + `<div class="panel hint-panel"><b>Catatan AFK:</b> Bot akan menghapus prefix ${htmlEscape(config.afkNicknamePrefix || "[AFK]")} saat user chat lagi, selama role bot cukup tinggi dan punya Manage Nicknames.</div>`;

  if (tab === "sambung") return noticeBox + dashboardSaveForm("sambung", [
    dashboardInput("sambungKataChannelId", "Channel Sambung Kata"),
    dashboardInput("sambungKataTargetWords", "Target Kata", { type: "number" }),
    dashboardInput("sambungKataMaxWordsPerMessage", "Maks kata per pesan", { type: "number" }),
    dashboardInput("sambungKataShowProgress", "Tampilkan Progress", { type: "checkbox", wide: true })
  ].join(""), "📖 Sambung Kata Settings") + `<div class="panel"><h3>Data Sambung Kata</h3><pre class="codebox">${htmlEscape(JSON.stringify(readJsonFile(SAMBUNG_DATA_FILE, {}), null, 2))}</pre></div>`;

  if (tab === "channels") return noticeBox + dashboardSaveForm("channels", [
    dashboardInput("gameChannelId", "Channel Hansip"),
    dashboardInput("gameLogChannelId", "Channel Log Game"),
    dashboardInput("mabarChannelId", "Channel Cari Mabar"),
    dashboardInput("truthOrDareChannelId", "Channel Truth or Dare"),
    dashboardInput("afkChannelId", "Channel AFK"),
    dashboardInput("sambungKataChannelId", "Channel Sambung Kata"),
    dashboardInput("antiScamLogChannelId", "Channel Log Anti-Scam"),
    dashboardInput("suggestionChannelId", "Channel Saran"),
    dashboardInput("panelChannelId", "Channel Panel"),
    dashboardInput("staffChannelId", "Channel Staff"),
    dashboardInput("ownerLogChannelId", "Owner Log Channel")
  ].join(""), "🗺️ Channel Settings") + `<div class="panel"><div class="panel-title"><h3>Discord Channels</h3><a class="btn ghost" href="/dashboard?tab=channels&refresh=1">🔄 Refresh Discord</a></div>${dashboardChannelTable(discord)}</div>`;

  if (tab === "roles") return noticeBox + dashboardSaveForm("roles", [
    dashboardInput("staffRoleIds", "Staff Role IDs", { type: "textarea", wide: true }),
    dashboardInput("antiScam.exemptRoleIds", "Role Bebas Anti-Scam", { type: "textarea", wide: true }),
    dashboardInput("gameRoleIds.Mobile Legends", "Role Mobile Legends"),
    dashboardInput("gameRoleIds.PUBG Mobile", "Role PUBG Mobile"),
    dashboardInput("gameRoleIds.Free Fire", "Role Free Fire"),
    dashboardInput("gameRoleIds.Roblox", "Role Roblox"),
    dashboardInput("gameRoleIds.Valorant", "Role Valorant"),
    dashboardInput("gameRoleIds.Minecraft", "Role Minecraft")
  ].join(""), "🎭 Role Settings") + `<div class="panel"><h3>Discord Roles</h3>${dashboardRoleTable(discord)}</div>`;

  if (tab === "dashboard") return noticeBox + dashboardSaveForm("dashboard", [
    dashboardInput("serverName", "Nama Server"),
    dashboardInput("embedColor", "Warna Embed", { type: "color" }),
    dashboardInput("dashboard.title", "Judul Dashboard"),
    dashboardInput("dashboard.accent", "Accent Dashboard", { type: "color" }),
    dashboardInput("dashboard.subtitle", "Subtitle Dashboard", { type: "textarea", wide: true })
  ].join(""), "🎨 Dashboard Theme") + `<div class="panel"><h3>Preview Embed</h3><div class="preview" style="border-left-color:${htmlEscape(config.embedColor || "#0B5CFF")}"><h4>${htmlEscape(config.serverName || "DESA TULUS")} • Preview</h4><p>Dashboard: ${htmlEscape(config.dashboard?.title || "Hansip Desa Tulus")}\nCari Mabar: ${htmlEscape(config.mabarChannelId || "-")}\nAFK auto remove: ${config.afkRemoveOnMessage ? "Ya" : "Tidak"}</p></div></div>`;

  if (tab === "json") return noticeBox + `<form method="post" action="/dashboard/save-json?tab=json" class="panel"><div class="panel-title"><div><h3>🧾 Safe JSON Config</h3><p>Secret tidak ditampilkan. Jangan masukkan token/API key/MongoDB URI ke sini.</p></div><button class="btn primary" type="submit">💾 Simpan JSON</button></div><textarea class="raw" name="jsonConfig">${htmlEscape(dashboardJsonSafe())}</textarea><div class="sticky-actions"><button class="btn primary" type="submit">💾 Simpan JSON</button><button class="btn ghost" type="button" onclick="copyText(document.querySelector('[name=jsonConfig]').value)">📋 Salin Config Aman</button><a class="btn ghost" href="/dashboard?tab=json">↩️ Reset JSON</a></div></form>`;

  if (tab === "logs") return noticeBox + `<div class="panel"><h3>📜 Logs Dashboard & Anti-Scam</h3>${[...dashboardDiscordActivity, ...readScamLogs().slice(-20).reverse()].length ? `<div class="list">${[...dashboardDiscordActivity, ...readScamLogs().slice(-20).reverse()].slice(0, 30).map(item => `<div class="log-item"><b>${htmlEscape(item.title || item.type || "Log")}</b><span>${htmlEscape(item.message || item.reason || "-")}</span><small>${htmlEscape(item.time || item.createdAt || "")}</small></div>`).join("")}</div>` : `<div class="empty">Belum ada log.</div>`}</div>`;

  if (tab === "status") return noticeBox + `<div class="panel"><h3>📡 Status Bot & Server</h3><div class="status-grid"><div><b>Bot</b><span>${htmlEscape(discord.botTag || "Hansip")}</span></div><div><b>Server</b><span>${htmlEscape(discord.guildName || config.serverName)}</span></div><div><b>Channel</b><span>${(discord.channels || []).length}</span></div><div><b>Role</b><span>${(discord.roles || []).length}</span></div><div><b>Storage</b><span>${htmlEscape(getStorageMode())}</span></div><div><b>Uptime</b><span>${Math.floor(process.uptime())} detik</span></div><div><b>Fitur Aktif</b><span>${stats.activeFeatures}</span></div><div><b>Anti-Scam Logs</b><span>${stats.deletedScam}</span></div></div></div>`;

  if (tab === "actions") return noticeBox + `<div class="panel"><h3>⚡ Quick Actions</h3><div class="quick-grid"><a class="quick" href="/dashboard?tab=game"><b>🎮 Hansip</b><span>Atur game, event, shop, item, dan auto manager.</span></a><a class="quick" href="/dashboard?tab=status&refresh=1"><b>📡 Cek Status Bot</b><span>Refresh status Discord dan storage.</span></a><a class="quick" href="/dashboard?tab=channels&refresh=1"><b>🗺️ Refresh Discord</b><span>Ambil ulang channel dan role.</span></a><a class="quick" href="/dashboard?tab=json"><b>🧾 Buka JSON Config</b><span>Edit raw config aman.</span></a><button class="quick" type="button" onclick="copyText(document.getElementById('safeConfig').textContent)"><b>📋 Salin Config Aman</b><span>Copy config tanpa secret.</span></button><a class="quick" href="/dashboard?tab=dashboard"><b>🎨 Preview Embed</b><span>Lihat dan edit tampilan.</span></a><a class="quick" href="/dashboard?tab=home&reload=${Date.now()}"><b>🔄 Reload Config</b><span>Muat ulang dashboard.</span></a></div><pre id="safeConfig" class="hidden">${htmlEscape(dashboardJsonSafe())}</pre></div><div class="panel"><h3>Placeholder</h3><div class="placeholder-row">${PLACEHOLDERS.map(ph => `<button class="placeholder" type="button" onclick="copyText('${htmlEscape(ph)}')">${htmlEscape(ph)}</button>`).join("")}</div></div>`;

  return noticeBox + `<div class="panel hero"><div><h3>🏠 Studio Home</h3><p>Pilih fitur, edit setting, preview, lalu simpan. Dashboard tidak menghapus data member dan tidak menampilkan secret.</p></div><a class="btn ghost" href="/dashboard?tab=actions">Quick Actions</a></div><div class="feature-grid">${features.map(item => `<a class="feature-card" href="/dashboard?tab=${item.tab}"><div class="feature-icon">${item.icon}</div><b>${htmlEscape(item.title)}</b><p>${htmlEscape(item.desc)}</p><span class="chip ${item.active ? "ok" : "warn"}">${item.active ? "Aktif" : "Belum aktif"}</span></a>`).join("")}</div><div class="panel"><h3>✅ Fitur yang terdeteksi di codingan</h3><div class="list">${features.map(item => `<a class="list-row" href="/dashboard?tab=${item.tab}"><b>${item.icon} ${htmlEscape(item.title)}</b><span class="chip ${item.active ? "ok" : "warn"}">${item.active ? "Aktif" : "Belum aktif"}</span></a>`).join("")}</div></div>`;
}

function dashboardPage(req) {
  const tab = dashboardTabFromReq(req);
  const notice = req.query.notice || "";
  if (req.query.refresh === "1") startDashboardCacheRefresh().catch(() => null);
  const discord = dashboardDiscordDataSync();
  const stats = getDashboardStats();
  const activeFeatures = stats.activeFeatures || dashboardFeatureItems().filter(f => f.active).length;
  const title = config.dashboard?.title || "Hansip Desa Tulus";
  const subtitle = config.dashboard?.subtitle || "Dashboard Hansip versi DESA TULUS yang rapi, cepat, clickable, dan fokus fitur Hansip.";
  const accent = config.dashboard?.accent || config.embedColor || "#38D5FF";

  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-store"><title>${htmlEscape(title)}</title><style>
:root{--bg:#070A13;--side:#0A1020;--panel:#11182B;--panel2:#151F35;--line:rgba(255,255,255,.12);--text:#F7FAFF;--muted:#AAB6D3;--muted2:#7886A5;--accent:${htmlEscape(accent)};--cyan:#38D5FF;--green:#39E58C;--warn:#FFD166;--red:#FF5F7A;--purple:#8B5CF6;--shadow:0 26px 90px rgba(0,0,0,.34)}*{box-sizing:border-box}body{margin:0;min-height:100vh;background:radial-gradient(circle at 15% -12%,rgba(139,92,246,.28),transparent 34%),radial-gradient(circle at 90% 2%,rgba(56,213,255,.17),transparent 32%),linear-gradient(180deg,#070A13,#080D1A 55%,#050711);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,Segoe UI,Arial,sans-serif}a{text-decoration:none;color:inherit}button,input,textarea,select{font:inherit}.layout{display:grid;grid-template-columns:306px 1fr;min-height:100vh}.sidebar{position:sticky;top:0;height:100vh;overflow:auto;padding:18px;background:rgba(8,12,25,.88);border-right:1px solid var(--line);backdrop-filter:blur(18px)}.brand{display:flex;gap:13px;align-items:center;padding:14px;border-radius:24px;border:1px solid var(--line);background:linear-gradient(135deg,rgba(139,92,246,.20),rgba(56,213,255,.10)),rgba(255,255,255,.05);margin-bottom:14px}.logo{width:52px;height:52px;border-radius:19px;display:grid;place-items:center;background:linear-gradient(135deg,var(--purple),var(--cyan));font-weight:1000}.brand h1{font-size:19px;margin:0;font-weight:1000}.brand p{font-size:12px;margin:4px 0 0;color:var(--muted);font-weight:800}.nav{display:grid;gap:8px}.nav-item{display:flex;gap:10px;align-items:center;border:1px solid transparent;border-radius:16px;padding:12px 13px;color:var(--muted);font-weight:900}.nav-item:hover,.nav-item.active{color:var(--text);background:linear-gradient(90deg,rgba(139,92,246,.20),rgba(56,213,255,.08));border-color:var(--line)}.note{color:var(--muted);font-size:13px;line-height:1.6}.side-note{padding:12px 4px;border-top:1px solid var(--line);margin-top:12px}.main{padding:26px;max-width:1580px;width:100%;margin:0 auto}.top{display:flex;justify-content:space-between;gap:14px;align-items:center;padding:18px 20px;border-radius:28px;border:1px solid var(--line);background:rgba(17,24,43,.78);box-shadow:var(--shadow);margin-bottom:18px}.title h2{font-size:31px;margin:0;letter-spacing:-1px;font-weight:1000}.title p{margin:6px 0 0;color:var(--muted);line-height:1.55}.actions{display:flex;gap:9px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;justify-content:center;border:0;border-radius:15px;background:linear-gradient(135deg,var(--purple),var(--cyan));color:white;padding:11px 14px;font-weight:1000;cursor:pointer}.btn:hover,.feature-card:hover,.quick:hover{filter:brightness(1.08);transform:translateY(-2px)}.btn.ghost{background:rgba(255,255,255,.07);border:1px solid var(--line)}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:18px}.metric,.panel,.feature-card,.quick{border:1px solid var(--line);background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(255,255,255,.045));border-radius:24px;padding:18px;box-shadow:var(--shadow);transition:.15s}.metric{position:relative;overflow:hidden}.metric:before{content:"";position:absolute;left:0;top:0;height:3px;width:100%;background:linear-gradient(90deg,var(--purple),var(--cyan),var(--green))}.metric h3{margin:0 0 8px;color:var(--muted2);font-size:11px;text-transform:uppercase;letter-spacing:.9px}.big{font-size:26px;font-weight:1000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.panel{margin-bottom:16px}.panel-title{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:14px}.panel h3{margin:0;font-size:21px;font-weight:1000}.panel p{color:var(--muted);line-height:1.6}.hero{display:flex;justify-content:space-between;gap:12px;align-items:center}.feature-grid,.quick-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px}.feature-card{position:relative;min-height:152px;color:var(--text)}.feature-icon{font-size:30px;margin-bottom:10px}.feature-card b,.quick b{display:block;margin-bottom:7px;font-size:16px}.feature-card p,.quick span{display:block;color:var(--muted);font-size:13px;line-height:1.45}.chip{display:inline-flex;border-radius:999px;padding:6px 10px;font-size:12px;font-weight:1000;border:1px solid var(--line)}.ok{color:#9AFBD0;background:rgba(57,229,140,.12);border-color:rgba(57,229,140,.25)}.warn{color:#FFE19C;background:rgba(255,209,102,.12);border-color:rgba(255,209,102,.25)}.list{display:grid;gap:10px}.list-row,.log-item{display:flex;justify-content:space-between;align-items:center;gap:12px;border:1px solid var(--line);background:rgba(4,9,20,.55);border-radius:16px;padding:12px}.list-row:hover{border-color:rgba(56,213,255,.35)}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.field label{display:flex;justify-content:space-between;gap:8px;margin-bottom:7px;color:#E8EEFF;font-weight:900;font-size:13px}.field label span{font-size:10px;color:var(--muted2);border:1px solid var(--line);border-radius:999px;padding:2px 7px}.field input,.field textarea,.field select{width:100%;border:1px solid var(--line);border-radius:15px;background:rgba(4,9,20,.65);color:var(--text);padding:12px;outline:none}.field textarea{min-height:124px;resize:vertical;line-height:1.6}.field input:focus,.field textarea:focus{border-color:rgba(56,213,255,.7);box-shadow:0 0 0 4px rgba(56,213,255,.12)}.wide{grid-column:1/-1}.switch{border:1px solid var(--line);border-radius:15px;background:rgba(4,9,20,.65);padding:12px;display:flex;gap:10px;align-items:center;font-weight:900}.switch input{accent-color:var(--cyan)}.sticky-actions{position:sticky;bottom:12px;display:flex;gap:9px;flex-wrap:wrap;margin-top:16px;padding:12px;border:1px solid var(--line);border-radius:20px;background:rgba(8,13,26,.90);backdrop-filter:blur(16px)}.table-wrap{overflow:auto;border:1px solid var(--line);border-radius:18px;background:rgba(4,9,20,.45)}table{width:100%;border-collapse:collapse;min-width:760px}th,td{padding:12px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left;font-size:13px}th{color:var(--muted2);font-size:11px;text-transform:uppercase;letter-spacing:.8px}.mini,.placeholder{border:1px solid var(--line);background:rgba(255,255,255,.07);color:var(--text);border-radius:12px;padding:7px 10px;font-weight:900;font-size:12px;cursor:pointer}.mono{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}.empty{border:1px dashed var(--line);background:rgba(4,9,20,.45);border-radius:16px;color:var(--muted);padding:18px;text-align:center}.raw,.codebox{width:100%;min-height:430px;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;background:rgba(4,9,20,.65);color:var(--text);border:1px solid var(--line);border-radius:16px;padding:14px}.preview{border-left:5px solid var(--accent);border-radius:18px;background:rgba(4,9,20,.58);padding:16px;border-top:1px solid var(--line);border-right:1px solid var(--line);border-bottom:1px solid var(--line)}.placeholder-row{display:flex;flex-wrap:wrap;gap:9px}.hidden{display:none}.notice{padding:13px 15px;border-radius:18px;background:rgba(57,229,140,.12);border:1px solid rgba(57,229,140,.25);color:#9AFBD0;font-weight:900;margin-bottom:16px}.status-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.status-grid div{border:1px solid var(--line);border-radius:18px;background:rgba(4,9,20,.52);padding:14px}.status-grid b{display:block;color:var(--muted2);font-size:11px;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}.log-item{align-items:flex-start}.log-item span{color:var(--muted);font-size:13px}.log-item small{color:var(--muted2)}@media(max-width:1100px){.layout{grid-template-columns:1fr}.sidebar{position:relative;height:auto}.metrics,.feature-grid,.quick-grid,.status-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.form-grid{grid-template-columns:1fr}.wide{grid-column:auto}.top{align-items:flex-start;flex-direction:column}}@media(max-width:650px){.main{padding:14px}.metrics,.feature-grid,.quick-grid,.status-grid{grid-template-columns:1fr}.title h2{font-size:24px}.actions,.sticky-actions{width:100%}.btn{flex:1}}
</style></head><body><div class="layout"><aside class="sidebar"><div class="brand"><div class="logo">OT</div><div><h1>Hansip Desa Tulus</h1><p>DESA TULUS Dashboard</p></div></div><nav class="nav">${dashboardMenu(tab)}</nav><div class="side-note note">Dashboard ini khusus fitur Hansip. Secret Railway, token, API key, MongoDB URI, dan .env tidak ditampilkan.</div></aside><main class="main"><div class="top"><div class="title"><h2>${htmlEscape(title)}</h2><p>${htmlEscape(subtitle)}</p></div><div class="actions"><a class="btn ghost" href="/dashboard?tab=status&refresh=1">📡 Cek Status</a><a class="btn ghost" href="/dashboard?tab=${tab}&reload=${Date.now()}">🔄 Reload</a><a class="btn" href="/dashboard?tab=actions">⚡ Quick Actions</a><a class="btn ghost" href="/dashboard/logout">Logout</a></div></div><div class="metrics"><div class="metric"><h3>Status Bot</h3><div class="big">${htmlEscape(discord.botTag ? "Online" : "Dashboard")}</div><div class="note">${htmlEscape(discord.botTag || "Hansip")}</div></div><div class="metric"><h3>Server</h3><div class="big">${htmlEscape(discord.guildName || config.serverName || "DESA TULUS")}</div><div class="note">Channel ${(discord.channels || []).length} • Role ${(discord.roles || []).length}</div></div><div class="metric"><h3>Storage</h3><div class="big">${mongoReady ? "MongoDB" : "JSON"}</div><div class="note">${htmlEscape(getStorageMode())}</div></div><div class="metric"><h3>Fitur Aktif</h3><div class="big">${activeFeatures}</div><div class="note">${Math.floor(process.uptime() / 60)} menit uptime</div></div></div>${dashboardContent(tab, notice)}</main></div><script>function copyText(t){if(navigator.clipboard){navigator.clipboard.writeText(t).then(function(){alert('Disalin')}).catch(function(){prompt('Copy manual',t)})}else{prompt('Copy manual',t)}}console.log('✅ Hansip Desa Tulus server-render dashboard aktif. Semua menu pakai link asli.');</script></body></html>`;
}


const DASHBOARD_DISCORD_CACHE_TTL = 5 * 60 * 1000;
let dashboardDiscordCache = null;
let dashboardDiscordCacheAt = 0;
let dashboardDiscordRefreshing = null;
let dashboardDiscordActivity = [];

function pushDashboardActivity(title, message) {
  const item = {
    title,
    message,
    time: new Date().toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })
  };
  dashboardDiscordActivity.unshift(item);
  dashboardDiscordActivity = dashboardDiscordActivity.slice(0, 20);
  console.log(`🧭 Dashboard OT: ${title} - ${message}`);
}

function emptyDiscordDashboardData(extra = {}) {
  return {
    ready: Boolean(client?.isReady?.()),
    botTag: client?.user?.tag || "Hansip",
    guildName: null,
    channels: [],
    roles: [],
    cached: false,
    loading: false,
    ...extra
  };
}

async function fetchDiscordDashboardDataFresh() {
  const out = emptyDiscordDashboardData();
  try {
    // FIX DASHBOARD LAMA CONNECT:
    // Jangan tunggu fetch API Discord setiap dashboard dibuka.
    // Ambil dari cache client saja supaya tombol dashboard langsung bisa dipakai.
    if (!client?.isReady?.()) {
      out.loading = true;
      out.error = "Bot Discord belum ready. Dashboard tetap bisa dibuka, tunggu beberapa detik lalu Refresh Discord.";
      return out;
    }

    const guild = (process.env.GUILD_ID ? client.guilds.cache.get(process.env.GUILD_ID) : null) || client.guilds.cache.first();
    if (!guild) {
      out.error = "Guild belum masuk cache. Pastikan GUILD_ID benar dan bot ada di server.";
      return out;
    }

    out.ready = true;
    out.botTag = client.user?.tag || "Hansip";
    out.guildName = guild.name;

    const typeNameMap = {
      [ChannelType.GuildText]: "Text",
      [ChannelType.GuildAnnouncement]: "Announcement",
      [ChannelType.GuildForum]: "Forum",
      [ChannelType.GuildVoice]: "Voice",
      [ChannelType.GuildStageVoice]: "Stage",
      [ChannelType.GuildCategory]: "Category"
    };

    out.channels = guild.channels.cache
      .filter(ch => [
        ChannelType.GuildText,
        ChannelType.GuildAnnouncement,
        ChannelType.GuildForum,
        ChannelType.GuildVoice,
        ChannelType.GuildStageVoice,
        ChannelType.GuildCategory
      ].includes(ch.type))
      .sort((a, b) => (a.rawPosition || 0) - (b.rawPosition || 0))
      .map(ch => ({
        id: ch.id,
        name: ch.name,
        type: ch.type,
        typeName: typeNameMap[ch.type] || "Channel",
        parentId: ch.parentId || null,
        parentName: ch.parent?.name || null,
        isText: [ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum].includes(ch.type),
        isVoice: [ChannelType.GuildVoice, ChannelType.GuildStageVoice].includes(ch.type),
        isCategory: ch.type === ChannelType.GuildCategory
      }));

    out.roles = guild.roles.cache
      .filter(role => role.name !== "@everyone")
      .sort((a, b) => b.position - a.position)
      .map(role => ({ id: role.id, name: role.name, position: role.position }));

    out.cached = true;
    out.loading = false;
    out.cachedAt = new Date().toISOString();
  } catch (error) {
    out.error = error.message;
  }
  return out;
}

function withTimeout(promise, ms, fallback) {
  return Promise.race([
    promise,
    new Promise(resolve => setTimeout(() => resolve(fallback), ms))
  ]);
}

function startDashboardCacheRefresh() {
  // Jangan biarkan promise refresh nyangkut selamanya.
  if (dashboardDiscordRefreshing) return dashboardDiscordRefreshing;
  dashboardDiscordRefreshing = withTimeout(
    fetchDiscordDashboardDataFresh(),
    1200,
    dashboardDiscordCache || emptyDiscordDashboardData({ loading: true, error: "Refresh Discord timeout, coba klik Refresh Discord lagi." })
  )
    .then(data => {
      dashboardDiscordCache = data;
      dashboardDiscordCacheAt = Date.now();
      return data;
    })
    .catch(error => {
      const fallback = dashboardDiscordCache || emptyDiscordDashboardData({ error: error.message });
      fallback.error = error.message;
      return fallback;
    })
    .finally(() => {
      dashboardDiscordRefreshing = null;
    });
  return dashboardDiscordRefreshing;
}

async function getDiscordDashboardData(options = {}) {
  const refresh = Boolean(options.refresh);
  const expired = !dashboardDiscordCache || (Date.now() - dashboardDiscordCacheAt > DASHBOARD_DISCORD_CACHE_TTL);

  // FIX LOADING DASHBOARD:
  // Initial dashboard tidak boleh menunggu Discord cache/fetch.
  // Browser langsung dapat data config, sementara refresh Discord jalan di background.
  if (refresh) {
    return await withTimeout(
      startDashboardCacheRefresh(),
      900,
      dashboardDiscordCache || emptyDiscordDashboardData({ loading: true, error: "Refresh masih diproses di background." })
    );
  }

  if (expired) startDashboardCacheRefresh().catch(() => null);

  return dashboardDiscordCache || emptyDiscordDashboardData({
    loading: true,
    error: "Data Discord sedang disiapkan. Dashboard tetap bisa diedit dan diklik."
  });
}


function getDashboardStats() {
  const featureStatus = {
    commands: true,
    mabar: Boolean(config.mabarChannelId),
    saran: Boolean(config.suggestionChannelId),
    truthOrDare: Boolean(config.truthOrDareChannelId),
    afk: Boolean(config.afkChannelId),
    sambungKata: Boolean(config.sambungKataChannelId),
    dashboard: true,
    mongoDb: Boolean(mongoReady)
  };
  return {
    activity: dashboardDiscordActivity.slice(0, 12),
    uptimeSec: Math.floor(process.uptime()),
    featureStatus,
    activeFeatures: Object.values(featureStatus).filter(Boolean).length
  };
}

app.get("/", (req, res) => {
  return res.redirect("/dashboard");
});

app.get("/dashboard/version", (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  return res.json({ ok: true, version: DASHBOARD_BUILD_VERSION, title: "Hansip Desa Tulus", clickable: true, mode: "server-render-links" });
});

app.get("/dashboard", (req, res) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  if (!isDashboardAuthed(req)) {
    pushDashboardActivity("Login dibuka", "Halaman login dashboard OT dibuka.");
    return res.send(loginPage());
  }
  pushDashboardActivity("Dashboard dibuka", "Hansip Desa Tulus server-render aktif. Menu memakai link asli dan form bisa submit.");
  return res.send(dashboardPage(req));
});

app.post("/dashboard/login", (req, res) => {
  const pass = dashboardPassword();
  if ((req.body.password || "") !== pass) return res.send(loginPage("Password dashboard salah."));
  res.setHeader("Set-Cookie", `${DASHBOARD_COOKIE}=${encodeURIComponent(makeDashboardToken())}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
  return res.redirect("/dashboard");
});

app.post("/dashboard/save", (req, res) => {
  if (!isDashboardAuthed(req)) return res.redirect("/dashboard");
  const tab = dashboardTabFromReq(req);
  try {
    const next = dashboardFormToConfig(req.body || {});
    saveConfig(next);
    pushDashboardActivity("Config disimpan", `Dashboard tab ${tab} berhasil disimpan.`);
    return res.redirect(`/dashboard?tab=${encodeURIComponent(tab)}&notice=${encodeURIComponent("Perubahan berhasil disimpan.")}`);
  } catch (error) {
    pushDashboardActivity("Config gagal", error.message);
    return res.redirect(`/dashboard?tab=${encodeURIComponent(tab)}&notice=${encodeURIComponent("Gagal simpan: " + error.message)}`);
  }
});

app.post("/dashboard/save-json", (req, res) => {
  if (!isDashboardAuthed(req)) return res.redirect("/dashboard");
  try {
    const raw = String(req.body.jsonConfig || "{}");
    const parsed = JSON.parse(raw);
    const safeInput = normalizeDashboardConfig(parsed);
    const next = saveConfig(deepMerge(config, safeInput));
    pushDashboardActivity("JSON config disimpan", "Safe JSON config berhasil disimpan.");
    return res.redirect(`/dashboard?tab=json&notice=${encodeURIComponent("JSON config berhasil disimpan.")}`);
  } catch (error) {
    pushDashboardActivity("JSON config gagal", error.message);
    return res.redirect(`/dashboard?tab=json&notice=${encodeURIComponent("Gagal simpan JSON: " + error.message)}`);
  }
});

app.get("/dashboard/logout", (req, res) => {
  res.setHeader("Set-Cookie", `${DASHBOARD_COOKIE}=; Path=/; Max-Age=0`);
  return res.redirect("/dashboard");
});

app.get("/api/dashboard-data", requireDashboard, async (req, res) => {
  const refresh = req.query.refresh === "1";
  if (refresh) pushDashboardActivity("Refresh Discord", "Dashboard mengambil ulang channel dan role dari cache Discord.");
  else pushDashboardActivity("Data dashboard", "API dashboard OT diminta oleh browser.");
  const discord = await getDiscordDashboardData({ refresh });
  return res.json({ ok: true, data: { config: makePublicConfig(config), discord, stats: getDashboardStats(), storage: { mode: getStorageMode(), mongoReady, hasMongoUri: Boolean(MONGODB_URI), lastError: mongoLastError }, placeholders: PLACEHOLDERS } });
});

app.post("/api/config", requireDashboard, (req, res) => {
  try {
    const safeInput = normalizeDashboardConfig(req.body.config || {});
    const merged = deepMerge(config, safeInput);
    const next = saveConfig(merged);
    pushDashboardActivity("Config disimpan", "Perubahan dashboard berhasil disimpan ke Hansip.");
    return res.json({ ok: true, config: makePublicConfig(next) });
  } catch (error) {
    pushDashboardActivity("Config gagal", error.message);
    return res.status(400).json({ ok: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🌐 Railway Web Server + Dashboard Hansip aktif di port ${PORT}`);
  console.log(`🧭 Dashboard Hansip aktif di /dashboard • Target port ${PORT}`);
  console.log(`✅ Dashboard Build: ${DASHBOARD_BUILD_VERSION}`);
});

/* =========================
   VALIDASI ENV
========================= */
if (!process.env.DISCORD_TOKEN) {
  console.error("❌ DISCORD_TOKEN belum diisi di .env / Railway Variables");
  process.exit(1);
}

/* =========================
   CLIENT DISCORD
========================= */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

/* =========================
   MENU PILIHAN CARI MABAR
========================= */
const mabarSessions = new Map();
const SESSION_TTL = 10 * 60 * 1000;

const PLATFORM_OPTIONS = [
  { label: "Mobile", value: "Mobile", emoji: "📱", description: "Pilihan game mobile populer untuk warga desa." },
  { label: "PC", value: "PC", emoji: "💻", description: "Pilihan game PC populer untuk warga desa." }
];

const GAME_OPTIONS = {
  Mobile: [
    { label: "Mobile Legends", value: "Mobile Legends", emoji: "⚔️" },
    { label: "PUBG Mobile", value: "PUBG Mobile", emoji: "🔫" },
    { label: "Free Fire", value: "Free Fire", emoji: "🔥" },
    { label: "Honor of Kings", value: "Honor of Kings", emoji: "👑" },
    { label: "Call of Duty Mobile", value: "Call of Duty Mobile", emoji: "🎯" },
    { label: "Arena of Valor", value: "Arena of Valor", emoji: "🛡️" },
    { label: "Wild Rift", value: "Wild Rift", emoji: "🐉" },
    { label: "eFootball Mobile", value: "eFootball Mobile", emoji: "⚽" },
    { label: "FC Mobile", value: "FC Mobile", emoji: "🥅" },
    { label: "Roblox", value: "Roblox", emoji: "🧱" },
    { label: "Minecraft Bedrock", value: "Minecraft Bedrock", emoji: "⛏️" },
    { label: "Genshin Impact", value: "Genshin Impact", emoji: "✨" },
    { label: "Honkai: Star Rail", value: "Honkai: Star Rail", emoji: "🚂" },
    { label: "Wuthering Waves", value: "Wuthering Waves", emoji: "🌊" },
    { label: "Stumble Guys", value: "Stumble Guys", emoji: "🏃" },
    { label: "Among Us", value: "Among Us", emoji: "🚀" },
    { label: "Brawl Stars", value: "Brawl Stars", emoji: "⭐" },
    { label: "Clash Royale", value: "Clash Royale", emoji: "🏰" },
    { label: "Clash of Clans", value: "Clash of Clans", emoji: "🛖" },
    { label: "Pokémon Unite", value: "Pokémon Unite", emoji: "⚡" },
    { label: "Identity V", value: "Identity V", emoji: "🎭" },
    { label: "Sausage Man", value: "Sausage Man", emoji: "🌭" },
    { label: "Blood Strike", value: "Blood Strike", emoji: "🩸" },
    { label: "Delta Force Mobile", value: "Delta Force Mobile", emoji: "🪖" },
    { label: "Lainnya", value: "Lainnya", emoji: "🎮" }
  ],
  PC: [
    { label: "Valorant", value: "Valorant", emoji: "🎯" },
    { label: "Counter-Strike 2", value: "Counter-Strike 2", emoji: "💣" },
    { label: "Dota 2", value: "Dota 2", emoji: "🛡️" },
    { label: "League of Legends", value: "League of Legends", emoji: "🐉" },
    { label: "Minecraft Java", value: "Minecraft Java", emoji: "⛏️" },
    { label: "Roblox", value: "Roblox", emoji: "🧱" },
    { label: "GTA V", value: "GTA V", emoji: "🚗" },
    { label: "FiveM", value: "FiveM", emoji: "🚓" },
    { label: "Fortnite", value: "Fortnite", emoji: "🏝️" },
    { label: "Apex Legends", value: "Apex Legends", emoji: "🔺" },
    { label: "Overwatch 2", value: "Overwatch 2", emoji: "🦸" },
    { label: "Rainbow Six Siege", value: "Rainbow Six Siege", emoji: "🚪" },
    { label: "PUBG: Battlegrounds", value: "PUBG: Battlegrounds", emoji: "🪂" },
    { label: "Call of Duty: Warzone", value: "Call of Duty: Warzone", emoji: "🪖" },
    { label: "Marvel Rivals", value: "Marvel Rivals", emoji: "🦸" },
    { label: "Dead by Daylight", value: "Dead by Daylight", emoji: "🔦" },
    { label: "Phasmophobia", value: "Phasmophobia", emoji: "👻" },
    { label: "Lethal Company", value: "Lethal Company", emoji: "📦" },
    { label: "The Forest", value: "The Forest", emoji: "🌲" },
    { label: "Sons of the Forest", value: "Sons of the Forest", emoji: "🏕️" },
    { label: "Rust", value: "Rust", emoji: "⚙️" },
    { label: "ARK: Survival Ascended", value: "ARK: Survival Ascended", emoji: "🦖" },
    { label: "Genshin Impact", value: "Genshin Impact", emoji: "✨" },
    { label: "eFootball", value: "eFootball", emoji: "⚽" },
    { label: "Lainnya", value: "Lainnya", emoji: "🎮" }
  ]
};

const MABAR_ALL_GAMES = [
  ...new Set([
    ...GAME_OPTIONS.Mobile.map(item => item.value),
    ...GAME_OPTIONS.PC.map(item => item.value)
  ])
].filter(game => game !== "Lainnya");

const MODE_OPTIONS = [
  { label: "Rank", value: "Rank", emoji: "🏆" },
  { label: "Classic", value: "Classic", emoji: "🎮" },
  { label: "Custom", value: "Custom", emoji: "🛠️" },
  { label: "Mabar Santai", value: "Mabar Santai", emoji: "☕" },
  { label: "Turnamen", value: "Turnamen", emoji: "🏅" },
  { label: "Roleplay", value: "Roleplay", emoji: "🎭" },
  { label: "Survival", value: "Survival", emoji: "🏕️" },
  { label: "Duo", value: "Duo", emoji: "👥" },
  { label: "Squad", value: "Squad", emoji: "🛡️" },
  { label: "Party", value: "Party", emoji: "🎉" },
  { label: "Lainnya", value: "Lainnya", emoji: "🧩" }
];

const SLOT_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  label: `${i + 1} slot`,
  value: String(i + 1),
  emoji: "👥"
}));

const WAKTU_OPTIONS = [
  { label: "Sekarang", value: "Sekarang", emoji: "⚡" },
  { label: "5 Menit Lagi", value: "5 Menit Lagi", emoji: "🕒" },
  { label: "10 Menit Lagi", value: "10 Menit Lagi", emoji: "🕒" },
  { label: "15 Menit Lagi", value: "15 Menit Lagi", emoji: "🕒" },
  { label: "30 Menit Lagi", value: "30 Menit Lagi", emoji: "🕒" },
  { label: "1 Jam Lagi", value: "1 Jam Lagi", emoji: "⏰" },
  { label: "Jam Tertentu", value: "Jam Tertentu", emoji: "🗓️" }
];

const VOICE_OPTIONS = [
  { label: "Ya, pakai voice", value: "Ya", emoji: "🔊", description: "Host sedang atau akan masuk voice." },
  { label: "Tidak pakai voice", value: "Tidak", emoji: "🔇", description: "Mabar tanpa voice." }
];

/* =========================
   TRUTH OR DARE INDONESIA
   Aman, sopan, dan cocok untuk komunitas
========================= */
const TRUTH_QUESTIONS = [
  "Apa momen paling lucu yang pernah kamu alami di Discord?",
  "Game apa yang paling sering bikin kamu emosi, tapi tetap kamu mainkan?",
  "Kalau punya role custom di DESA TULUS, kamu mau namanya apa?",
  "Siapa warga server yang menurut kamu paling sering bikin suasana rame?",
  "Apa kebiasaan paling random kamu saat lagi mabar?",
  "Pernah pura-pura AFK padahal masih mantau chat? Ceritain sedikit.",
  "Nickname paling aneh atau paling lucu yang pernah kamu pakai apa?",
  "Kalau DESA TULUS bikin event besar, kamu paling pengen event apa?",
  "Apa hal kecil yang bikin kamu betah di sebuah server Discord?",
  "Kalau kamu jadi admin sehari, fitur apa yang mau kamu rapihin dulu?",
  "Mabar paling seru menurut kamu itu yang serius atau yang banyak bercandanya?",
  "Apa game yang dulu kamu suka banget tapi sekarang jarang dimainkan?",
  "Kalau harus pilih satu emoji buat menggambarkan diri kamu, emoji apa?",
  "Apa chat paling random yang pernah kamu kirim ke server?",
  "Kalau bisa bikin channel baru di server, channel apa yang mau kamu buat?",
  "Apa hal paling receh yang bisa bikin kamu ketawa?",
  "Siapa teman mabar yang paling sabar menurut kamu?",
  "Apa role impian kamu di server DESA TULUS?",
  "Apa lagu yang sering kamu dengerin saat main game?",
  "Kalau kamu harus kasih slogan untuk DESA TULUS, slogannya apa?",
  "Apa hal paling sederhana yang bisa bikin hari kamu jadi lebih baik?",
  "Kalau sedang gabut, biasanya kamu ngapain duluan?",
  "Apa makanan favorit kamu saat lagi main game lama-lama?",
  "Apa minuman yang paling cocok nemenin malam Discord-an?",
  "Kalau bisa punya satu skill instan, kamu pilih skill apa?",
  "Apa game pertama yang bikin kamu betah main berjam-jam?",
  "Pernah salah kirim chat ke channel? Ceritain versi amannya.",
  "Apa kata yang paling sering kamu ketik di Discord?",
  "Siapa orang yang menurut kamu paling sering bantu warga lain?",
  "Apa hal yang paling kamu suka dari suasana server DESA TULUS?",
  "Kalau server ini jadi kota, kamu mau jadi apa di kota itu?",
  "Apa event Discord yang menurut kamu paling seru: kuis, mabar, giveaway, atau cerita?",
  "Apa kebiasaan kamu sebelum masuk voice channel?",
  "Kalau disuruh pilih satu game untuk dimainkan sebulan penuh, kamu pilih apa?",
  "Apa map, mode, atau karakter game yang paling kamu kuasai?",
  "Apa alasan paling lucu kamu kalah saat mabar?",
  "Apa ucapan yang paling sering kamu dengar di voice channel?",
  "Kalau kamu bisa rename satu channel jadi apa saja, channel mana dan namanya apa?",
  "Apa fitur bot yang paling kamu pengen ada di Hansip?",
  "Apa satu hal yang bikin kamu langsung respect sama seseorang di server?",
  "Apa satu hal yang bikin kamu males ikut mabar?",
  "Kalau kamu jadi panitia event, hadiah apa yang menurut kamu seru tapi simpel?",
  "Apa warna yang paling cocok buat tema DESA TULUS selain biru putih?",
  "Apa emoji yang menurut kamu paling wajib ada di server ini?",
  "Apa sticker/GIF yang paling sering kamu pakai?",
  "Kalau kamu bisa bikin title buat diri sendiri, title-nya apa?",
  "Apa hal paling random yang pernah kamu lihat di server Discord?",
  "Pernah lupa mute mic? Ceritain versi singkat dan aman.",
  "Apa kebiasaan lucu teman mabar kamu?",
  "Apa game yang kamu pengen belajar tapi belum sempat?",
  "Apa mode game yang paling bikin kamu deg-degan?",
  "Apa kata-kata penyemangat favorit kamu?",
  "Kalau kamu harus memilih satu: menang tapi tegang, atau kalah tapi ngakak?",
  "Apa hal paling penting biar komunitas tetap nyaman?",
  "Kalau kamu punya bot pribadi, fitur pertamanya apa?",
  "Apa nama tim/squad paling keren versi kamu?",
  "Apa nama tim/squad paling kocak versi kamu?",
  "Siapa warga yang paling cocok jadi komentator event?",
  "Siapa warga yang paling cocok jadi pembawa acara?",
  "Apa satu hal yang pengen kamu pelajari tahun ini?",
  "Kalau lagi bad mood, hal kecil apa yang biasanya bantu?",
  "Apa quote pendek yang paling kamu suka?",
  "Apa kata yang menurut kamu paling menggambarkan DESA TULUS?",
  "Kalau DESA TULUS punya maskot, bentuknya apa?",
  "Apa hal yang bikin kamu nyaman ngobrol sama orang baru?",
  "Apa topik obrolan yang paling gampang bikin chat rame?",
  "Apa game santai yang cocok buat ngobrol bareng?",
  "Apa tantangan paling seru yang pernah kamu coba di game?",
  "Kalau kamu bisa bikin turnamen, game apa yang kamu pilih?",
  "Apa hal paling absurd yang pernah terjadi saat voice call?",
  "Kalau kamu jadi moderator sehari, aturan apa yang paling kamu jaga?",
  "Apa channel yang paling sering kamu buka duluan?",
  "Apa menu makanan yang menurut kamu cocok buat nama role?",
  "Apa benda di sekitar kamu yang paling random sekarang?",
  "Kalau mood kamu hari ini jadi judul lagu, judulnya apa?",
  "Kalau avatar Discord kamu bisa ngomong, kira-kira dia bilang apa?",
  "Apa satu kebiasaan online yang mau kamu kurangin?",
  "Apa satu kebiasaan baik yang mau kamu tambah?",
  "Apa hal yang bikin kamu merasa dihargai di komunitas?",
  "Pilih satu: jadi jago aim, jago strategi, atau jago bikin tim ketawa?",
  "Kalau bisa invite satu karakter game ke server, siapa?",
  "Apa panggilan paling lucu yang pernah kamu dengar di server?",
  "Apa alasan kamu biasanya join voice?",
  "Apa alasan kamu biasanya cuma baca chat tanpa ikut nimbrung?",
  "Apa momen paling rame yang kamu ingat di server?",
  "Kalau ada channel rahasia, menurut kamu isinya apa?",
  "Apa game yang cocok buat warga baru biar cepat akrab?",
  "Apa hal yang pengen kamu ucapin ke warga DESA TULUS hari ini?",
  "Kalau kamu punya badge server sendiri, desainnya seperti apa?",
  "Apa hal paling susah saat ngajak orang mabar?",
  "Apa momen paling memalukan versi aman yang pernah terjadi saat main game?",
  "Apa alasan paling receh kamu pernah ketawa sendiri?",
  "Apa hal yang paling kamu tunggu saat buka Discord?",
  "Kalau chat server jadi film, genrenya apa?",
  "Kalau DESA TULUS jadi sekolah, kamu jadi murid tipe apa?",
  "Apa kebiasaan paling khas kamu saat mengetik?",
  "Apa singkatan lucu untuk OT menurut kamu?",
  "Kalau harus kasih rating mood kamu hari ini dari 1 sampai 10, berapa?",
  "Apa hal yang kamu harap lebih banyak terjadi di server ini?",
  "Apa hal yang harus dikurangi supaya server makin nyaman?",
  "Apa game yang menurut kamu underrated?",
  "Apa game yang menurut kamu overrated tapi tetap seru?",
  "Apa momen paling wholesome yang pernah kamu lihat di komunitas?",
  "Apa satu hal yang bisa bikin kamu langsung semangat mabar?",
  "Kalau kamu bisa punya sound effect saat join voice, suaranya apa?",
  "Apa kata-kata yang paling sering muncul saat tim hampir kalah?",
  "Apa kemenangan paling berkesan yang pernah kamu alami?",
  "Apa kekalahan paling lucu yang pernah kamu alami?",
  "Kalau kamu harus pilih nickname baru 1 hari, nickname apa?",
  "Apa satu kalimat yang menggambarkan gaya main kamu?",
  "Apa satu kelemahan lucu kamu saat main game?",
  "Apa satu kelebihan kamu saat mabar?",
  "Kalau kamu jadi NPC di game, dialog kamu apa?",
  "Apa item game yang paling kamu suka?",
  "Apa map game yang paling kamu hindari?",
  "Apa suara notifikasi yang paling bikin kamu panik?",
  "Kalau punya rumah virtual di game, temanya apa?",
  "Apa alasan paling lucu buat izin AFK?",
  "Apa hal kecil yang bikin voice channel jadi rame?",
  "Apa hal yang bikin kamu nyaman ngobrol di malam hari?",
  "Kalau kamu bisa buat satu command baru di Hansip, namanya apa?",
  "Apa fitur Discord yang paling kamu suka?",
  "Apa fitur Discord yang paling membingungkan buat kamu dulu?",
  "Apa pelajaran paling berharga dari bermain bareng orang lain?",
  "Kalau harus mengucapkan terima kasih ke satu orang di server, untuk apa?",
  "Apa satu hal random yang kamu pelajari dari internet?",
  "Apa meme yang paling menggambarkan hari kamu?",
  "Apa satu kata yang sering kamu salah ketik?",
  "Apa channel yang menurut kamu perlu event mingguan?",
  "Apa topik kuis yang paling kamu kuasai?",
  "Apa game yang cocok untuk pemula menurut kamu?",
  "Apa hal yang bikin kamu betah jadi bagian komunitas?",
  "Apa sapaan khas yang cocok buat warga DESA TULUS?",
  "Kalau hari ini jadi warna, warna apa?",
  "Kalau mood kamu jadi cuaca, cuacanya apa?",
  "Apa hal yang kamu paling hargai dari teman mabar?",
  "Apa hal yang menurut kamu bikin chat jadi adem?",
  "Kalau bisa bikin peraturan lucu tapi sopan, peraturannya apa?",
  "Apa satu kata buat orang yang baru join server ini?",
  "Apa satu hal yang ingin kamu coba di Discord minggu ini?",
  "Apa kombinasi emoji yang menggambarkan server ini?",
  "Kalau bisa bikin nama event 17-an versi DESA TULUS, namanya apa?",
  "Apa game nostalgia yang ingin kamu mainkan lagi?",
  "Apa momen kecil yang pernah bikin kamu merasa diterima di komunitas?",
  "Apa satu alasan kamu bangga jadi warga DESA TULUS?"
];

const DARE_CHALLENGES = [
  "Kirim satu emoji yang paling menggambarkan mood kamu sekarang.",
  "Tulis satu kalimat pujian tulus untuk orang di chat ini.",
  "Buat pantun pendek tentang game atau DESA TULUS.",
  "Ketik kalimat ini: `DESA TULUS gas seru-seruan, tapi tetap sopan.`",
  "Tag satu teman yang menurut kamu cocok diajak mabar hari ini.",
  "Kirim GIF lucu yang aman dan sopan.",
  "Bikin tebak-tebakan singkat di chat ini.",
  "Tulis 3 kata yang menggambarkan server DESA TULUS.",
  "Ganti nickname 10 menit jadi `warga DESA TULUS Mode Santai` kalau kamu mau.",
  "Ceritakan satu tips mabar biar tim tidak gampang panik.",
  "Kirim satu stiker atau emoji hati untuk menyemangati warga server.",
  "Buat caption lucu untuk avatar Discord kamu.",
  "Tulis satu rekomendasi game yang cocok buat dimainkan bareng.",
  "Sebutkan satu channel favorit kamu di server ini dan alasannya.",
  "Ketik satu kata random, lalu biarkan orang lain bikin sambungannya.",
  "Buat nama squad paling kocak versi kamu.",
  "Kirim pesan singkat: `Semangat buat yang lagi scroll Discord malam ini.`",
  "Pilih satu orang dan ajak dia mabar dengan cara paling sopan.",
  "Buat mini review 1 kalimat tentang game terakhir yang kamu mainkan.",
  "Tulis quote versi kamu sendiri tentang pertemanan.",
  "Kirim kombinasi 3 emoji yang menggambarkan DESA TULUS.",
  "Buat salam khas warga DESA TULUS dalam 1 kalimat.",
  "Tulis satu kata random lalu tambahkan `mode tulus` di belakangnya.",
  "Buat mini pantun 2 baris tentang mabar.",
  "Kirim pesan: `Yang baca ini semoga harinya lancar.`",
  "Tag orang terakhir yang chat sebelum kamu dan kasih ucapan semangat singkat.",
  "Tulis nama role lucu yang cocok buat kamu hari ini.",
  "Buat slogan event mabar dalam 1 kalimat.",
  "Ketik 5 emoji tanpa menjelaskan artinya, biar yang lain menebak.",
  "Buat teka-teki ringan dan minta orang lain jawab.",
  "Tulis rekomendasi lagu yang cocok buat santai.",
  "Buat nama tim mabar dengan tema makanan.",
  "Buat nama tim mabar dengan tema hewan.",
  "Buat nama tim mabar dengan tema malam hari.",
  "Kirim satu kalimat motivasi untuk warga yang lagi belajar.",
  "Kirim satu kalimat motivasi untuk warga yang lagi push rank.",
  "Ketik: `Aku warga DESA TULUS, bukan warga panik.`",
  "Buat singkatan lucu dari OT.",
  "Buat singkatan keren dari OT.",
  "Tulis satu hal baik yang bisa dilakukan di server hari ini.",
  "Kirim satu emoji hati, lalu tag satu warga secara sopan.",
  "Buat status pendek: `Mode hari ini: ...` dan isi titik-titiknya.",
  "Tulis satu kalimat seolah kamu jadi bot OT.",
  "Buat nama command bot yang belum ada tapi kamu inginkan.",
  "Kirim satu fakta random yang aman dan lucu.",
  "Tulis satu pesan selamat malam untuk chat.",
  "Tulis satu pesan selamat pagi untuk chat.",
  "Buat kalimat promosi server DESA TULUS dalam 1 baris.",
  "Buat puisi 2 baris tentang pertemanan.",
  "Tulis satu alasan kenapa mabar harus tetap santai.",
  "Ketik satu kalimat tanpa huruf `a`.",
  "Ketik satu kalimat tanpa huruf `e`.",
  "Buat kalimat 5 kata tentang server ini.",
  "Buat kalimat 7 kata tentang game favoritmu.",
  "Tulis satu warna yang cocok buat mood kamu hari ini.",
  "Tulis satu makanan yang cocok jadi nama role.",
  "Tulis satu minuman yang cocok jadi nama channel.",
  "Buat pengumuman lucu 1 kalimat seperti staff server.",
  "Buat komentar caster 1 kalimat untuk mabar imajinasi.",
  "Tulis satu tips supaya chat tetap sopan.",
  "Kirim emoji yang menurut kamu paling underrated.",
  "Kirim emoji yang menurut kamu paling sering dipakai.",
  "Buat nama event mingguan versi kamu.",
  "Buat nama event malam minggu versi kamu.",
  "Tulis 3 game yang ingin kamu mainkan bareng warga.",
  "Tulis 3 kata yang menggambarkan gaya main kamu.",
  "Tulis 3 kata yang menggambarkan mood chat sekarang.",
  "Buat mini dialog antara kamu dan Hansip, 2 baris saja.",
  "Buat cerita 1 kalimat yang dimulai dengan `Di DESA TULUS...`",
  "Kirim satu pertanyaan ringan untuk menghidupkan chat.",
  "Ajak semua orang jaga suasana server tetap nyaman dalam 1 kalimat.",
  "Tulis satu ucapan terima kasih untuk warga server.",
  "Buat nickname lucu untuk diri sendiri, tanpa perlu menggantinya.",
  "Buat judul film kalau server ini jadi film.",
  "Buat judul lagu kalau mood kamu jadi lagu.",
  "Buat nama kota kalau DESA TULUS jadi kota.",
  "Tulis satu kalimat dengan gaya sangat formal.",
  "Tulis satu kalimat dengan gaya sangat santai tapi sopan.",
  "Kirim pesan: `Aku hadir sebagai warga DESA TULUS.`",
  "Buat mini review 1 kalimat tentang server ini.",
  "Tulis satu ide channel baru yang aman dan seru.",
  "Tulis satu ide event yang bisa dimainkan tanpa hadiah mahal.",
  "Buat satu kata baru dan jelaskan artinya dalam 1 kalimat.",
  "Tulis satu hal random yang kamu lihat di sekitarmu.",
  "Buat kalimat semangat untuk yang lagi capek.",
  "Buat kalimat semangat untuk yang lagi kalah mabar.",
  "Ketik satu kalimat yang berakhiran kata `tulus`.",
  "Ketik satu kalimat yang berakhiran kata `mabar`.",
  "Tulis satu pesan untuk member baru.",
  "Tulis satu pesan untuk member lama.",
  "Buat nama squad memakai kata `Tulus`.",
  "Buat nama squad memakai kata `Santai`.",
  "Buat nama squad memakai kata `Gas`.",
  "Kirim satu emoji lalu biarkan orang lain menebak maksudnya.",
  "Tulis satu tebakan: `Aku adalah..., siapa aku?`",
  "Buat polling manual: pilih A atau B tentang game.",
  "Buat pertanyaan `pilih mana` yang ringan dan aman.",
  "Tulis satu kebiasaan baik saat voice channel.",
  "Tulis satu kebiasaan baik saat chat server.",
  "Buat aturan lucu: `Dilarang...` tapi tetap sopan.",
  "Tulis satu kalimat menggunakan kata `biru`, `hati`, dan `tulus`.",
  "Tulis satu kalimat menggunakan kata `mabar`, `teman`, dan `malam`.",
  "Buat caption untuk banner DESA TULUS.",
  "Buat caption untuk logo DESA TULUS.",
  "Kirim satu pesan ramah untuk orang yang sedang diam di chat.",
  "Buat satu rekomendasi aktivitas seru di voice channel.",
  "Buat satu rekomendasi aktivitas seru di text channel.",
  "Buat satu kalimat tentang pentingnya saling menghargai.",
  "Tulis satu pujian untuk komunitas tanpa menyebut nama orang.",
  "Buat nama panggilan lucu untuk warga DESA TULUS.",
  "Tulis satu kata bahasa Indonesia yang menurut kamu indah.",
  "Tulis satu kata bahasa Inggris yang sering kamu pakai di game.",
  "Buat combo emoji untuk `mabar malam`.",
  "Buat combo emoji untuk `hari santai`.",
  "Buat combo emoji untuk `warga DESA TULUS`.",
  "Tulis satu kalimat yang hanya terdiri dari 4 kata.",
  "Tulis satu kalimat yang hanya terdiri dari 6 kata.",
  "Buat mini cerita 2 kalimat tentang bot OT.",
  "Buat mini cerita 2 kalimat tentang mabar gagal tapi lucu.",
  "Tulis satu pesan yang bikin orang lain tersenyum.",
  "Tulis satu hal yang bisa bikin server makin kompak.",
  "Kirim satu kalimat ajakan ikut Truth or Dare.",
  "Kirim satu kalimat ajakan ikut sambung kata.",
  "Kirim satu kalimat ajakan ikut cari mabar.",
  "Buat nama role khusus untuk orang yang sering AFK.",
  "Buat nama role khusus untuk orang yang sering mabar.",
  "Buat nama role khusus untuk orang yang sering bantu.",
  "Tulis satu kalimat seolah kamu jadi NPC penjaga server.",
  "Tulis satu kalimat seolah kamu jadi penyiar radio DESA TULUS.",
  "Tulis satu kalimat seolah kamu sedang membuka event.",
  "Kirim satu salam pembuka yang cocok untuk server.",
  "Kirim satu salam penutup yang cocok untuk server.",
  "Buat satu challenge ringan untuk chat berikutnya.",
  "Buat satu pertanyaan truth versi kamu sendiri.",
  "Buat satu dare versi kamu sendiri yang aman dan sopan.",
  "Tulis satu kata, lalu minta orang berikutnya menyambung kata itu.",
  "Ketik: `Aku siap main, tapi tetap santun.`",
  "Ketik: `Tulus bukan cuma nama, tapi cara kita ngobrol.`",
  "Ketik: `Yang penting seru, yang penting sopan.`",
  "Ketik: `warga DESA TULUS hadir membawa vibes baik.`",
  "Buat satu kalimat dengan awalan `Hari ini aku...`",
  "Buat satu kalimat dengan awalan `Kalau aku jadi admin...`",
  "Buat satu kalimat dengan awalan `Mabar terbaik adalah...`",
  "Buat satu kalimat dengan awalan `Server nyaman itu...`",
  "Kirim satu emoji bintang untuk orang yang sedang semangat.",
  "Kirim satu emoji kopi untuk warga yang begadang.",
  "Kirim satu emoji game untuk warga yang mau mabar.",
  "Buat satu kalimat yang mengandung kata `GG` secara sopan.",
  "Buat satu kalimat yang mengandung kata `AFK` secara lucu.",
  "Buat satu kalimat yang mengandung kata `rank` secara lucu.",
  "Tulis satu pesan singkat untuk menjaga chat tetap adem.",
  "Tulis satu pesan singkat agar warga baru tidak malu ngobrol.",
  "Tulis satu pesan singkat untuk menghargai teman mabar.",
  "Buat satu kalimat penutup event Truth or Dare."
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function makeTodId(type) {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `OT-${type}-${random}`;
}

function buildTruthDareButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("tod_truth")
      .setLabel("Truth")
      .setEmoji("🟢")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId("tod_dare")
      .setLabel("Dare")
      .setEmoji("🔴")
      .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
      .setCustomId("tod_random")
      .setLabel("Random")
      .setEmoji("🎲")
      .setStyle(ButtonStyle.Primary)
  );
}

function buildTruthDarePanel(interaction) {
  const serverName = config.serverName || "DESA TULUS";

  return new EmbedBuilder()
    .setColor(config.gameEmbedColor || config.embedColor || "#0B5CFF")
    .setAuthor({
      name: `${serverName} • Truth or Dare`,
      iconURL: interaction.client.user.displayAvatarURL({ size: 128 })
    })
    .setTitle("🎭 TRUTH OR DARE")
    .setDescription(
      "> Main truth or dare versi **Indonesia**, aman, sopan, dan cocok buat seru-seruan di server.\n" +
      "> Tinggal klik tombol di bawah, nanti Hansip kasih pertanyaan atau tantangan otomatis.\n\n" +
      "**Pilih mode:**\n" +
      "🟢 **Truth** — jawab pertanyaan jujur\n" +
      "🔴 **Dare** — lakukan tantangan ringan\n" +
      "🎲 **Random** — bot pilihkan acak\n\n" +
      "`Jaga suasana tetap asik, sopan, dan jangan maksa orang lain ya.`"
    )
    .setFooter({ text: `${serverName} • Seru-seruan tetap tulus` })
    .setTimestamp();
}

function resolveTodType(type) {
  if (type === "random") return Math.random() < 0.5 ? "truth" : "dare";
  return type === "dare" ? "dare" : "truth";
}

function buildTruthDareResult(interaction, requestedType) {
  const type = resolveTodType(requestedType);
  const isTruth = type === "truth";
  const question = isTruth ? pickRandom(TRUTH_QUESTIONS) : pickRandom(DARE_CHALLENGES);
  const typeLabel = isTruth ? "TRUTH" : "DARE";
  const title = isTruth ? "🟢 Truth" : "🔴 Dare";
  const id = makeTodId(typeLabel);
  const serverName = config.serverName || "DESA TULUS";

  return new EmbedBuilder()
    .setColor(isTruth ? "#22C55E" : "#EF4444")
    .setAuthor({
      name: `${serverName} • Truth or Dare`,
      iconURL: interaction.user.displayAvatarURL({ size: 128 })
    })
    .setTitle(title)
    .setDescription(
      `👤 **Diminta oleh:** ${interaction.user}\n\n` +
      `**${question}**\n\n` +
      `Type: **${typeLabel}** | Rating: **AMAN** | ID: ${id}`
    )
    .setFooter({ text: `${serverName} • Klik tombol lagi untuk lanjut main` })
    .setTimestamp();
}

async function sendTruthDarePanel(interaction) {
  const channelId = config.truthOrDareChannelId;
  const targetChannel = channelId && channelId !== "ISI_ID_CHANNEL_TRUTH_OR_DARE"
    ? await client.channels.fetch(channelId).catch(() => null)
    : interaction.channel;

  if (!targetChannel || !targetChannel.isTextBased()) {
    return interaction.reply({
      content: "❌ Channel truth or dare belum benar. Isi `truthOrDareChannelId` di config.json atau jalankan command di channel yang benar.",
      flags: MessageFlags.Ephemeral
    });
  }

  const embed = buildTruthDarePanel(interaction);
  const row = buildTruthDareButtons();

  await targetChannel.send({ embeds: [embed], components: [row] });

  return interaction.reply({
    content: `✅ Panel Truth or Dare sudah dikirim ke ${targetChannel}.`,
    flags: MessageFlags.Ephemeral
  });
}

async function sendTruthDareResult(interaction, type) {
  const embed = buildTruthDareResult(interaction, type);
  const row = buildTruthDareButtons();

  if (interaction.isButton()) {
    return interaction.reply({ embeds: [embed], components: [row] });
  }

  return interaction.reply({ embeds: [embed], components: [row] });
}


/* =========================
   STATUS AFK INDONESIA
   Contoh: otafk mandi
========================= */
const AFK_PLACEHOLDER = "ISI_ID_CHANNEL_STATUS_AFK";
const AFK_TRIGGERS = ["otafk", "rwafk", "afk", "!afk", ".afk"];

function readAfkData() {
  try {
    if (!fs.existsSync(AFK_DATA_FILE)) return {};
    return JSON.parse(fs.readFileSync(AFK_DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveAfkData(data) {
  fs.mkdirSync(path.dirname(AFK_DATA_FILE), { recursive: true });
  fs.writeFileSync(AFK_DATA_FILE, JSON.stringify(data, null, 2));
  persistJsonKey("afk", data);
}

function getConfiguredAfkChannelId() {
  const channelId = config.afkChannelId;
  if (!channelId || channelId === AFK_PLACEHOLDER || channelId.trim() === "") return null;
  return channelId;
}

async function getAfkChannel(fallbackChannel) {
  const channelId = getConfiguredAfkChannelId();
  if (!channelId) return fallbackChannel;

  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || !channel.isTextBased()) return fallbackChannel;
  return channel;
}

function makeAfkReason(reason) {
  const clean = String(reason || "").trim();
  return clean.length ? clean.slice(0, 180) : "Tidak ada alasan";
}

function escapeRegexText(text = "") {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getAfkPrefixes() {
  const current = String(config.afkNicknamePrefix || "[AFK]").trim() || "[AFK]";
  return Array.from(new Set([current, "[AFK]", "[afk]"]));
}

function stripAfkPrefixFromName(name = "") {
  let output = String(name || "").trim();
  for (const prefix of getAfkPrefixes()) {
    const rx = new RegExp(`^${escapeRegexText(prefix)}\\s*`, "i");
    output = output.replace(rx, "").trim();
  }
  return output;
}

function memberLooksAfkByNickname(member) {
  const current = member?.nickname || "";
  if (!current) return false;
  return getAfkPrefixes().some(prefix => current.toLowerCase().startsWith(prefix.toLowerCase()));
}

function makeSafeNickname(name) {
  const prefix = String(config.afkNicknamePrefix || "[AFK]").trim() || "[AFK]";
  const cleanName = stripAfkPrefixFromName(name || "warga DESA TULUS") || "warga DESA TULUS";
  return `${prefix} ${cleanName}`.slice(0, 32);
}

function formatAfkDuration(sinceMs) {
  const diff = Math.max(0, Date.now() - Number(sinceMs || Date.now()));
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} hari ${hours % 24} jam`;
  if (hours > 0) return `${hours} jam ${minutes % 60} menit`;
  if (minutes > 0) return `${minutes} menit`;
  return "baru saja";
}

function buildAfkEmbed(member, reason, nicknameChanged = true) {
  const serverName = config.serverName || "DESA TULUS";
  const embed = new EmbedBuilder()
    .setColor("#FACC15")
    .setAuthor({
      name: `${serverName} | Status AFK`,
      iconURL: member.user.displayAvatarURL({ size: 128 })
    })
    .setDescription(
      `😴 ${member} sekarang **AFK...**
` +
      `📝 **Alasan:** ${reason}`
    )
    .setFooter({ text: `${serverName} • Status AFK` })
    .setTimestamp();

  if (!nicknameChanged) {
    embed.addFields({
      name: "⚠️ Nickname belum berubah",
      value: "Role Hansip belum cukup tinggi atau belum punya izin **Manage Nicknames**. Status AFK tetap aktif, tapi prefix `[AFK]` tidak bisa dipasang otomatis.",
      inline: false
    });
  }

  return embed;
}

function buildAfkSetupEmbed(interaction) {
  const serverName = config.serverName || "DESA TULUS";
  return new EmbedBuilder()
    .setColor(config.gameEmbedColor || config.embedColor || "#0B5CFF")
    .setAuthor({
      name: `${serverName} • Status AFK`,
      iconURL: interaction.client.user.displayAvatarURL({ size: 128 })
    })
    .setTitle("😴 PANEL STATUS AFK")
    .setDescription(
      "> Tempat warga memberi tahu kalau sedang AFK, istirahat, mandi, belajar, atau lagi tidak bisa balas chat.\n\n" +
      "**Cara pakai cepat:**\n" +
      "`otafk alasan` atau `rwafk alasan` atau `afk alasan`\n" +
      "Contoh: `otafk mandi dulu`\n\n" +
      "**Bisa juga pakai slash command:**\n" +
      "`/afk alasan: mandi dulu`\n\n" +
      "Kalau user AFK chat lagi, Hansip akan otomatis menghapus status AFK-nya."
    )
    .addFields(
      { name: "✅ Otomatis", value: "Nickname bisa jadi `[AFK] Nama` kalau bot punya izin Manage Nicknames.", inline: false },
      { name: "💬 Mention AFK", value: "Kalau orang yang AFK di-mention, Hansip akan kasih tahu alasannya.", inline: false }
    )
    .setFooter({ text: `${serverName} • AFK dengan rapi dan jelas` })
    .setTimestamp();
}

async function applyAfkNickname(member) {
  try {
    if (!member.manageable) {
      console.log(`⚠️ AFK nickname gagal: role Hansip tidak bisa mengubah nickname ${member.user.tag}.`);
      return false;
    }
    const current = member.nickname || member.user.username;
    if (memberLooksAfkByNickname(member)) return true;
    await member.setNickname(makeSafeNickname(current), "Hansip status AFK");
    return true;
  } catch (error) {
    console.log("⚠️ AFK nickname gagal:", error.message);
    return false;
  }
}

async function restoreAfkNickname(member, saved = null) {
  try {
    if (!member.manageable) {
      console.log(`⚠️ AFK restore gagal: role Hansip tidak bisa mengubah nickname ${member.user.tag}.`);
      return false;
    }

    const currentNickname = member.nickname || "";
    const savedOldNickname = saved?.oldNickname ?? null;
    let nextNickname = savedOldNickname === null ? null : stripAfkPrefixFromName(savedOldNickname);

    // Kalau data lama sempat menyimpan oldNickname yang masih ada prefix [AFK], paksa bersihkan.
    if (nextNickname && nextNickname.toLowerCase() === member.user.username.toLowerCase()) nextNickname = null;

    // Kalau data AFK tidak ada tapi nickname masih nyangkut [AFK], bersihkan juga.
    if (!saved && memberLooksAfkByNickname(member)) {
      const cleaned = stripAfkPrefixFromName(currentNickname);
      nextNickname = cleaned && cleaned.toLowerCase() !== member.user.username.toLowerCase() ? cleaned : null;
    }

    await member.setNickname(nextNickname, "Hansip hapus status AFK");
    return true;
  } catch (error) {
    console.log("⚠️ AFK restore nickname gagal:", error.message);
    return false;
  }
}

async function setAfkStatus(member, outputChannel, reasonInput) {
  const reason = makeAfkReason(reasonInput);
  const data = readAfkData();

  data[member.id] = {
    userId: member.id,
    guildId: member.guild.id,
    username: member.user.username,
    oldNickname: member.nickname ? stripAfkPrefixFromName(member.nickname) : null,
    reason,
    since: Date.now()
  };

  saveAfkData(data);
  const nicknameChanged = await applyAfkNickname(member);

  const embed = buildAfkEmbed(member, reason, nicknameChanged);
  await outputChannel.send({ embeds: [embed] });
}

async function removeAfkStatus(member, outputChannel, options = {}) {
  const data = readAfkData();
  const saved = data[member.id];
  const nicknameStillAfk = memberLooksAfkByNickname(member);
  if (!saved && !nicknameStillAfk) return false;

  if (saved) {
    delete data[member.id];
    saveAfkData(data);
  }

  const nicknameRestored = await restoreAfkNickname(member, saved || null);

  const serverName = config.serverName || "DESA TULUS";
  const durationText = saved?.since
    ? `\n⏱️ Durasi AFK: **${formatAfkDuration(saved.since)}**`
    : "\n🧹 Nickname `[AFK]` yang nyangkut sudah dibersihkan.";

  const embed = new EmbedBuilder()
    .setColor("#22C55E")
    .setAuthor({ name: `${serverName} | Status AFK`, iconURL: member.user.displayAvatarURL({ size: 128 }) })
    .setDescription(`✅ ${member} sudah **kembali** dari AFK.${durationText}`)
    .setFooter({ text: `${serverName} • Selamat datang kembali` })
    .setTimestamp();

  if (!nicknameRestored) {
    embed.addFields({
      name: "⚠️ Nickname belum bisa dibalikin otomatis",
      value: "Role Hansip belum cukup tinggi atau belum punya izin **Manage Nicknames**. Hapus `[AFK]` manual atau naikkan role Hansip di atas role member.",
      inline: false
    });
  }

  if (!options.silent) await outputChannel.send({ embeds: [embed] }).catch(() => null);
  return true;
}

function parseAfkTrigger(content) {
  const text = String(content || "").trim();
  const firstSpace = text.indexOf(" ");
  const command = (firstSpace === -1 ? text : text.slice(0, firstSpace)).toLowerCase();
  const reason = firstSpace === -1 ? "" : text.slice(firstSpace + 1).trim();

  if (!AFK_TRIGGERS.includes(command)) return null;
  return { command, reason };
}

async function sendAfkPanel(interaction) {
  const targetChannel = await getAfkChannel(interaction.channel);
  const embed = buildAfkSetupEmbed(interaction);

  await targetChannel.send({ embeds: [embed] });

  return interaction.reply({
    content: `✅ Panel Status AFK sudah dikirim ke ${targetChannel}.`,
    flags: MessageFlags.Ephemeral
  });
}

async function slashSetAfk(interaction) {
  const reason = interaction.options.getString("alasan") || "Tidak ada alasan";
  const targetChannel = await getAfkChannel(interaction.channel);
  await setAfkStatus(interaction.member, targetChannel, reason);

  return interaction.reply({
    content: `✅ Status AFK kamu sudah dibuat di ${targetChannel}.`,
    flags: MessageFlags.Ephemeral
  });
}


/* =========================
   SAMBUNG KATA WARGA
   Khusus 1 channel, otomatis embed saat 30 kata
========================= */
const SAMBUNG_PLACEHOLDER = "ISI_ID_CHANNEL_SAMBUNG_KATA";
const SAMBUNG_TARGET_WORDS_DEFAULT = 30;
const SAMBUNG_MAX_WORDS_PER_MESSAGE_DEFAULT = 3;

function getSambungTargetWords() {
  const n = Number(config.sambungKataTargetWords || SAMBUNG_TARGET_WORDS_DEFAULT);
  return Number.isFinite(n) && n >= 5 && n <= 100 ? Math.floor(n) : SAMBUNG_TARGET_WORDS_DEFAULT;
}

function getSambungMaxWordsPerMessage() {
  const n = Number(config.sambungKataMaxWordsPerMessage || SAMBUNG_MAX_WORDS_PER_MESSAGE_DEFAULT);
  return Number.isFinite(n) && n >= 1 && n <= 10 ? Math.floor(n) : SAMBUNG_MAX_WORDS_PER_MESSAGE_DEFAULT;
}

function getConfiguredSambungChannelId() {
  const channelId = config.sambungKataChannelId;
  if (!channelId || channelId === SAMBUNG_PLACEHOLDER || String(channelId).trim() === "") return null;
  return String(channelId).trim();
}

function readSambungData() {
  try {
    if (!fs.existsSync(SAMBUNG_DATA_FILE)) {
      return {
        round: 1,
        words: [],
        contributions: [],
        contributors: [],
        startedAt: Date.now(),
        updatedAt: Date.now()
      };
    }

    const data = JSON.parse(fs.readFileSync(SAMBUNG_DATA_FILE, "utf8"));
    return {
      round: Number(data.round || 1),
      words: Array.isArray(data.words) ? data.words : [],
      contributions: Array.isArray(data.contributions) ? data.contributions : [],
      contributors: Array.isArray(data.contributors) ? data.contributors : [],
      startedAt: data.startedAt || Date.now(),
      updatedAt: data.updatedAt || Date.now()
    };
  } catch {
    return {
      round: 1,
      words: [],
      contributions: [],
      contributors: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }
}

function saveSambungData(data) {
  fs.mkdirSync(path.dirname(SAMBUNG_DATA_FILE), { recursive: true });
  fs.writeFileSync(SAMBUNG_DATA_FILE, JSON.stringify(data, null, 2));
  persistJsonKey("sambungKata", data);
}

function cleanSambungWords(content) {
  const text = String(content || "")
    .replace(/https?:\/\/\S+/gi, " ")
    .replace(/<a?:\w+:\d+>/g, " ")
    .replace(/<@!?(\d+)>/g, " ")
    .replace(/<#(\d+)>/g, " ")
    .replace(/<@&(\d+)>/g, " ")
    .replace(/[\n\r\t]+/g, " ")
    .trim();

  if (!text) return [];

  return text
    .split(/\s+/)
    .map(word => word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ""))
    .filter(Boolean)
    .slice(0, getSambungMaxWordsPerMessage());
}

function makeSambungTitle(words, round) {
  const titleWords = words.slice(0, 4).join(" ").trim();
  if (!titleWords) return `SAMBUNG KATA #${round}`;
  return titleWords.toUpperCase().slice(0, 80);
}

function makeSambungStory(words) {
  const story = words.join(" ").replace(/\s+/g, " ").trim();
  return story.length > 3900 ? `${story.slice(0, 3890)}...` : story;
}

function buildSambungPanelEmbed(interaction) {
  const serverName = config.serverName || "DESA TULUS";
  return new EmbedBuilder()
    .setColor(config.gameEmbedColor || config.embedColor || "#0B5CFF")
    .setAuthor({
      name: `${serverName} • Sambung Kata`,
      iconURL: interaction.client.user.displayAvatarURL({ size: 128 })
    })
    .setTitle("📖✨ CERITA SAMBUNG KATA WARGA")
    .setDescription(
      "> Channel ini khusus buat warga bikin cerita bareng-bareng dari kata yang disambung satu sama lain.\n\n" +
      `**Cara main:**\n` +
      `1. Ketik 1 kata atau beberapa kata pendek.\n` +
      `2. Hansip akan menyimpan kata dari warga.\n` +
      `3. Saat terkumpul **${getSambungTargetWords()} kata**, bot otomatis mengirim embed cerita.\n` +
      `4. Setelah embed terkirim, cerita baru dimulai lagi dari awal.\n\n` +
      "`Jaga kata-katanya tetap sopan dan seru ya.`"
    )
    .addFields(
      { name: "🎯 Target", value: `${getSambungTargetWords()} kata`, inline: true },
      { name: "💬 Mode", value: "Otomatis dari chat", inline: true },
      { name: "📌 Channel", value: "Hanya di channel ini", inline: true }
    )
    .setFooter({ text: `${serverName} • Sambung kata bareng warga` })
    .setTimestamp();
}

function buildSambungCompleteEmbed(data, completedWords) {
  const serverName = config.serverName || "DESA TULUS";
  const uniqueContributors = [...new Set(data.contributors || [])];
  const totalContributors = uniqueContributors.length || data.contributions.length || 1;
  const title = makeSambungTitle(completedWords, data.round);
  const story = makeSambungStory(completedWords);

  return new EmbedBuilder()
    .setColor("#FACC15")
    .setTitle("📖✨ CERITA SAMBUNG KATA WARGA")
    .setDescription(
      `📝 **JUDUL**\n${title}\n\n` +
      `📚 **CERITA**\n${story}\n\n` +
      `👥 **Total ${totalContributors} Warga Berkontribusi**`
    )
    .setFooter({ text: `${serverName} | Sambung Kata • Round ${data.round}` })
    .setTimestamp();
}

async function sendSambungPanel(interaction) {
  const channelId = getConfiguredSambungChannelId();
  const targetChannel = channelId
    ? await client.channels.fetch(channelId).catch(() => null)
    : interaction.channel;

  if (!targetChannel || !targetChannel.isTextBased()) {
    return interaction.reply({
      content: "❌ Channel sambung kata belum benar. Isi `sambungKataChannelId` di `config.json` atau jalankan command di channel yang benar.",
      flags: MessageFlags.Ephemeral
    });
  }

  await targetChannel.send({ embeds: [buildSambungPanelEmbed(interaction)] });
  return interaction.reply({
    content: `✅ Panel Sambung Kata sudah dikirim ke ${targetChannel}.`,
    flags: MessageFlags.Ephemeral
  });
}

async function sendSambungStatus(interaction) {
  const data = readSambungData();
  const remaining = Math.max(0, getSambungTargetWords() - data.words.length);
  const storyPreview = data.words.length ? makeSambungStory(data.words).slice(0, 900) : "Belum ada kata.";

  const embed = new EmbedBuilder()
    .setColor(config.gameEmbedColor || config.embedColor || "#0B5CFF")
    .setTitle("📖 Status Sambung Kata")
    .setDescription(
      `Round: **${data.round}**\n` +
      `Kata terkumpul: **${data.words.length}/${getSambungTargetWords()}**\n` +
      `Sisa: **${remaining} kata**\n\n` +
      `📚 **Cerita sementara**\n${storyPreview}`
    )
    .setTimestamp();

  return interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}

async function resetSambungStory(interaction) {
  const data = readSambungData();
  const nextData = {
    round: Number(data.round || 1) + 1,
    words: [],
    contributions: [],
    contributors: [],
    startedAt: Date.now(),
    updatedAt: Date.now()
  };

  saveSambungData(nextData);

  return interaction.reply({
    content: "✅ Cerita Sambung Kata sudah direset. Round baru dimulai.",
    flags: MessageFlags.Ephemeral
  });
}

let sambungQueue = Promise.resolve();

async function processSambungKataMessage(message) {
  const sambungChannelId = getConfiguredSambungChannelId();
  if (!sambungChannelId || message.channel.id !== sambungChannelId) return false;

  // Jangan proses command/prefix atau pesan kosong sebagai kata cerita.
  const raw = String(message.content || "").trim();
  if (!raw || raw.startsWith("/") || raw.startsWith("!") || raw.toLowerCase().startsWith("otafk")) return true;

  const words = cleanSambungWords(raw);
  if (words.length === 0) return true;

  // Queue supaya beberapa member yang chat bersamaan tidak bikin data sambung kata ketimpa.
  sambungQueue = sambungQueue.then(async () => {
    const targetWords = getSambungTargetWords();
    const data = readSambungData();

    for (const word of words) {
      if (data.words.length >= targetWords) break;
      data.words.push(word);
    }

    data.contributions.push({
      userId: message.author.id,
      username: message.author.username,
      words,
      at: Date.now()
    });

    if (!data.contributors.includes(message.author.id)) data.contributors.push(message.author.id);
    data.updatedAt = Date.now();

    if (data.words.length >= targetWords) {
      const completedWords = data.words.slice(0, targetWords);
      const embed = buildSambungCompleteEmbed(data, completedWords);
      await message.channel.send({ embeds: [embed] }).catch(() => null);

      const nextData = {
        round: Number(data.round || 1) + 1,
        words: [],
        contributions: [],
        contributors: [],
        startedAt: Date.now(),
        updatedAt: Date.now()
      };
      saveSambungData(nextData);
      return;
    }

    saveSambungData(data);

    if (config.sambungKataShowProgress !== false) {
      const count = data.words.length;
      if (count % 5 === 0 || count >= targetWords - 3) {
        await message.react("📖").catch(() => null);
      }
    }
  }).catch(error => {
    console.error("❌ Error Sambung Kata queue:", error);
  });

  await sambungQueue;
  return true;
}

/* =========================
   SLASH COMMANDS
========================= */
const commands = [
  new SlashCommandBuilder()
    .setName("cari-mabar")
    .setDescription("Buka menu Cari Mabar tanpa mengetik, tinggal klik pilihan.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setup-mabar")
    .setDescription("Kirim panel tombol Cari Mabar di channel ini.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setup-truth-dare")
    .setDescription("Kirim panel Truth or Dare bahasa Indonesia di channel ini.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setup-afk")
    .setDescription("Kirim panel panduan Status AFK di channel AFK.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("setup-sambung-kata")
    .setDescription("Kirim panel panduan Sambung Kata di channel sambung kata.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("sambung-status")
    .setDescription("Lihat progress Sambung Kata yang sedang berjalan.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("sambung-reset")
    .setDescription("Reset cerita Sambung Kata yang sedang berjalan.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .toJSON(),

  new SlashCommandBuilder()
    .setName("afk")
    .setDescription("Pasang status AFK dengan alasan.")
    .addStringOption(option =>
      option
        .setName("alasan")
        .setDescription("Alasan AFK, contoh: mandi dulu")
        .setRequired(false)
    )
    .toJSON(),

  new SlashCommandBuilder()
    .setName("truth-dare")
    .setDescription("Main Truth or Dare versi Indonesia.")
    .addStringOption(option =>
      option
        .setName("jenis")
        .setDescription("Pilih Truth, Dare, atau Random.")
        .setRequired(true)
        .addChoices(
          { name: "Truth", value: "truth" },
          { name: "Dare", value: "dare" },
          { name: "Random", value: "random" }
        )
    )
    .toJSON()
];

async function registerCommands() {
  try {
    if (process.env.GUILD_ID) {
      await client.application.commands.set(commands, process.env.GUILD_ID);
      console.log("✅ Slash command Hansip terdaftar khusus server.");
    } else {
      await client.application.commands.set(commands);
      console.log("✅ Slash command Hansip terdaftar global. Isi GUILD_ID agar lebih cepat.");
    }
  } catch (error) {
    console.error("❌ Gagal daftar slash command:", error);
  }
}

/* =========================
   DATA JSON SEDERHANA
========================= */
function readMabarData() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return [];
  }
}

function saveMabarData(data) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  persistJsonKey("mabar", data);
}

function pushMabarData(item) {
  const data = readMabarData();
  data.push(item);
  saveMabarData(data.slice(-300));
}

/* =========================
   HELPER UMUM
========================= */
function getGameMention(game) {
  const roleId = config.gameRoleIds?.[game];
  if (roleId && roleId.trim() !== "") return `<@&${roleId}>`;
  return `**${game}**`;
}

function yesNo(value) {
  return value ? "Ya" : "Tidak";
}

function cleanupOldSessions() {
  const now = Date.now();
  for (const [userId, session] of mabarSessions.entries()) {
    if (now - session.updatedAt > SESSION_TTL) {
      mabarSessions.delete(userId);
    }
  }
}

function startSession(userId) {
  cleanupOldSessions();
  const session = {
    userId,
    platform: null,
    game: null,
    mode: null,
    slot: null,
    waktu: null,
    voice: null,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  mabarSessions.set(userId, session);
  return session;
}

function getSession(userId) {
  cleanupOldSessions();
  const session = mabarSessions.get(userId);
  if (!session) return startSession(userId);
  session.updatedAt = Date.now();
  return session;
}

async function getMabarChannel(interaction) {
  const channelId = config.mabarChannelId;

  if (channelId && channelId !== "ISI_ID_CHANNEL_CARI_MABAR") {
    const channel = await client.channels.fetch(channelId).catch(() => null);
    if (channel) return channel;
  }

  return interaction.channel;
}

function buildMabarEmbed({ host, game, mode, slot, waktu, voice }) {
  const gameMention = getGameMention(game);
  const voiceText = voice ? "Ya" : "Tidak";

  return new EmbedBuilder()
    .setColor("#7DBD77")
    .setDescription(`${host} **sedang mencari mabar** ${gameMention} ⚔️`)
    .addFields(
      {
        name: "🎮 Game",
        value: String(game),
        inline: true
      },
      {
        name: "🍀 Mode",
        value: String(mode),
        inline: true
      },
      {
        name: "👥 Slot",
        value: String(slot),
        inline: true
      },
      {
        name: "🕘 Waktu",
        value: String(waktu),
        inline: true
      },
      {
        name: "🗣️ Voice",
        value: voiceText,
        inline: true
      }
    )
    .setFooter({
      text: "DESA TULUS • Cari Mabar",
      iconURL: "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless"
    })
    .setTimestamp();
}

function buildMabarButtons({ hostId, voiceChannelId }) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mabar_join_${voiceChannelId || "none"}`)
      .setLabel("Join Voice")
      .setEmoji("🔊")
      .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
      .setCustomId(`mabar_dm_${hostId}`)
      .setLabel("DM Host")
      .setEmoji("📩")
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId("mabar_open_menu")
      .setLabel("Cari Mabar")
      .setEmoji("🔎")
      .setStyle(ButtonStyle.Primary)
  );
}

async function createMabarPost(interaction, payload) {
  const channel = await getMabarChannel(interaction);

  if (!channel || !channel.isTextBased()) {
    throw new Error("Channel cari mabar belum benar. Isi mabarChannelId di config.json.");
  }

  const host = interaction.user;
  const memberVoiceChannel = interaction.member?.voice?.channel || null;
  const voiceChannelId = memberVoiceChannel?.id || null;
  const gameMention = getGameMention(payload.game);

  const embed = buildMabarEmbed({ host, ...payload });
  const row = buildMabarButtons({ hostId: host.id, voiceChannelId });

  const message = await channel.send({
    content: `${host} sedang mencari mabar ${gameMention} ⚔️`,
    embeds: [embed],
    components: [row],
    allowedMentions: {
      users: [host.id],
      roles: config.gameRoleIds?.[payload.game] ? [config.gameRoleIds[payload.game]] : []
    }
  });

  let thread = null;
  try {
    const safeGameName = String(payload.game).slice(0, 24);
    const safeUsername = String(host.username).slice(0, 20);

    thread = await message.startThread({
      name: `Tanya mabar ${safeGameName} ke ${safeUsername}`,
      autoArchiveDuration: 60,
      reason: "Thread diskusi Cari Mabar DESA TULUS."
    });

    await thread.send(
      `🌾 **Pos Mabar DESA TULUS**
` +
      `Host: ${host}
` +
      `Game: **${payload.game}**
` +
      `Mode: **${payload.mode}** • Slot: **${payload.slot}** • Waktu: **${payload.waktu}**
` +
      `Voice: **${payload.voice ? "Ya" : "Tidak"}**

` +
      "Gunakan thread ini untuk bertanya ID, room, role, atau pembagian tim supaya channel utama tetap rapi."
    );
  } catch (error) {
    console.log("⚠️ Thread Cari Mabar gagal dibuat. Pastikan izin Create Public Threads aktif.");
  }

  pushMabarData({
    messageId: message.id,
    channelId: channel.id,
    threadId: thread?.id || null,
    hostId: host.id,
    game: payload.game,
    mode: payload.mode,
    slot: payload.slot,
    waktu: payload.waktu,
    voice: payload.voice,
    createdAt: new Date().toISOString()
  });

  return { channel, thread, message };
}

/* =========================
   UI KLIK MENU MABAR
========================= */
function selectedText(value) {
  return value ? `**${value}**` : "Belum dipilih";
}

function buildClickMabarEmbed(session, stepTitle) {
  return new EmbedBuilder()
    .setColor("#7DBD77")
    .setTitle("🌾 Form Cari Mabar Desa")
    .setDescription(
      `${stepTitle}

` +
      "Pilih tahapnya satu per satu. Pak Hansip akan membuat post mabar yang ringkas dan rapi."
    )
    .addFields(
      { name: "📱 Platform", value: selectedText(session.platform), inline: true },
      { name: "🎮 Game", value: selectedText(session.game), inline: true },
      { name: "🍀 Mode", value: selectedText(session.mode), inline: true },
      { name: "👥 Slot", value: session.slot ? `**${session.slot}**` : "Belum dipilih", inline: true },
      { name: "🕘 Waktu", value: selectedText(session.waktu), inline: true },
      { name: "🗣️ Voice", value: session.voice === null ? "Belum dipilih" : `**${yesNo(session.voice)}**`, inline: true }
    )
    .setFooter({
      text: "DESA TULUS • Form Cari Mabar",
      iconURL: "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless"
    })
    .setTimestamp();
}

function buildSelectRow(customId, placeholder, options) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(customId)
      .setPlaceholder(placeholder)
      .addOptions(options)
  );
}

function buildCancelRow() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("mabar_cancel")
      .setLabel("Batal")
      .setEmoji("❌")
      .setStyle(ButtonStyle.Secondary)
  );
}

function getStepPayload(session, step) {
  if (step === "platform") {
    return {
      embeds: [buildClickMabarEmbed(session, "🎮 **Pilih platform game dulu:**")],
      components: [
        buildSelectRow("mabar_select_platform", "🎮 Pilih platform game", PLATFORM_OPTIONS),
        buildCancelRow()
      ]
    };
  }

  if (step === "game") {
    const gameOptions = GAME_OPTIONS[session.platform] || GAME_OPTIONS.Mobile;
    return {
      embeds: [buildClickMabarEmbed(session, "🕹️ **Pilih game yang mau dimainkan:**")],
      components: [
        buildSelectRow("mabar_select_game", "🕹️ Pilih game", gameOptions),
        buildCancelRow()
      ]
    };
  }

  if (step === "mode") {
    return {
      embeds: [buildClickMabarEmbed(session, "🧩 **Pilih mode mabar:**")],
      components: [
        buildSelectRow("mabar_select_mode", "🧩 Pilih mode", MODE_OPTIONS),
        buildCancelRow()
      ]
    };
  }

  if (step === "slot") {
    return {
      embeds: [buildClickMabarEmbed(session, "👥 **Pilih butuh berapa slot:**")],
      components: [
        buildSelectRow("mabar_select_slot", "👥 Pilih jumlah slot", SLOT_OPTIONS),
        buildCancelRow()
      ]
    };
  }

  if (step === "waktu") {
    return {
      embeds: [buildClickMabarEmbed(session, "🕒 **Pilih waktu mulai mabar:**")],
      components: [
        buildSelectRow("mabar_select_waktu", "🕒 Pilih waktu", WAKTU_OPTIONS),
        buildCancelRow()
      ]
    };
  }

  return {
    embeds: [buildClickMabarEmbed(session, "🎙️ **Pilih pakai voice atau tidak:**")],
    components: [
      buildSelectRow("mabar_select_voice", "🎙️ Pilih voice", VOICE_OPTIONS),
      buildCancelRow()
    ]
  };
}

async function showClickMabarMenu(interaction, step = "platform") {
  const session = getSession(interaction.user.id);
  const payload = getStepPayload(session, step);

  if (interaction.isStringSelectMenu()) {
    return interaction.update(payload);
  }

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(payload);
  }

  return interaction.reply({
    ...payload,
    flags: MessageFlags.Ephemeral
  });
}

async function finishClickMabar(interaction) {
  const session = getSession(interaction.user.id);

  if (!session.game || !session.mode || !session.slot || !session.waktu || session.voice === null) {
    return showClickMabarMenu(interaction, "platform");
  }

  await interaction.update({
    content: "⏳ Hansip sedang bikin post cari mabar...",
    embeds: [],
    components: []
  });

  const payload = {
    game: session.game,
    mode: session.mode,
    slot: Number(session.slot),
    waktu: session.waktu,
    voice: Boolean(session.voice)
  };

  const { channel, thread } = await createMabarPost(interaction, payload);
  mabarSessions.delete(interaction.user.id);

  const infoThread = thread ? `\n🧵 Thread diskusi juga sudah dibuat: ${thread}` : "";
  return interaction.editReply({
    content: `✅ Post cari mabar sudah dikirim ke ${channel}.${infoThread}`,
    embeds: [],
    components: []
  });
}

async function sendMabarPanel(interaction) {
  const row = buildSelectRow(
    "mabar_panel_platform",
    "🎮 Pilih platform untuk mulai cari mabar",
    PLATFORM_OPTIONS
  );

  await interaction.reply({
    embeds: [buildTextMabarPanelEmbed()],
    components: [row]
  });
}

/* =========================
   Hansip ULTIMATE PREMIUM v1.18.0
   Game besar satu channel: auto event, auto manager, item catalog, shop, quest, achievement.
   Data aktif dibuat di file baru dan tidak menimpa data lama Hansip.
========================= */
const OT_GAME_BUILD_VERSION = "ADVENTURE_HUB_ULTIMATE_PREMIUM_100_CATEGORY_2026_06_08";
const OT_GAME_MODES = [
  { id: "city", emoji: "🏙️", name: "OT City Rush", desc: "Misi kota lucu, cepat, dan ringan." },
  { id: "pet", emoji: "🐾", name: "Pet Hansip OT", desc: "Rawat pet dan ajak pet ikut misi." },
  { id: "race", emoji: "🚗", name: "OT Street Race", desc: "Balapan lucu tanpa taruhan." },
  { id: "cooking", emoji: "🍳", name: "Dapur Chaos OT", desc: "Masak, rating pelanggan, upgrade dapur." },
  { id: "island", emoji: "🏝️", name: "Pulau Tulus Hansip", desc: "Explore pulau, cuaca, dan harta." },
  { id: "cards", emoji: "🃏", name: "Kartu Warga OT", desc: "Koleksi kartu dan battle ringan." },
  { id: "warung", emoji: "🏪", name: "Warung Tycoon OT", desc: "Bangun warung dan upgrade rame-rame." },
  { id: "mystery", emoji: "👻", name: "Rumah Misteri OT", desc: "Mystery ringan, tidak gore." },
  { id: "raid", emoji: "⚔️", name: "Raid Boss Meme", desc: "Co-op lawan boss lucu." },
  { id: "party", emoji: "🎭", name: "Party Mode OT", desc: "Mode multiplayer cepat." },
  { id: "basecamp", emoji: "🏕️", name: "Basecamp OT", desc: "Dekorasi dan visit basecamp." },
  { id: "courier", emoji: "🚚", name: "Kurir Chaos OT", desc: "Antar order lucu, aman, dan santai." },
  { id: "fishing", emoji: "🎣", name: "Santai Fishing OT", desc: "Fishing kecil di Hansip." },
  { id: "craft", emoji: "🧰", name: "Workshop Craft OT", desc: "Craft dan upgrade item." },
  { id: "dungeon", emoji: "🏰", name: "Dungeon OT", desc: "Dungeon room/level dengan reward." },
  { id: "expedition", emoji: "🧭", name: "Expedition OT", desc: "Ekspedisi otomatis berdurasi." },
  { id: "farm", emoji: "🧑‍🌾", name: "Farm OT", desc: "Tanam, siram, panen." },
  { id: "bank", emoji: "🏦", name: "Bank OT", desc: "Bank coin game, bukan uang asli." },
  { id: "carnival", emoji: "🎪", name: "Carnival OT", desc: "Festival event dan tiket." },
  { id: "tournament", emoji: "🏆", name: "Tournament OT", desc: "Turnamen mingguan otomatis." },
  { id: "story", emoji: "📖", name: "Story Mode OT", desc: "Chapter cerita panjang." },
  { id: "team", emoji: "🧑‍🤝‍🧑", name: "Team/Guild OT", desc: "Tim kecil antar player." }
];

const OT_GAME_EVENTS = [
  ["daily", "☀️ Daily Event", "Reward harian naik untuk semua mode.", { xp: 1.2, coin: 1.2, drop: 1.05 }],
  ["weekly", "📅 Weekly Festival", "Quest mingguan dan leaderboard lebih ngebut.", { xp: 1.25, coin: 1.25, drop: 1.1 }],
  ["weekend", "🎉 Weekend OT", "Weekend santai, reward lebih rame.", { xp: 1.35, coin: 1.35, drop: 1.15 }],
  ["double_xp", "⚡ Double XP", "XP digandakan selama event.", { xp: 2, coin: 1, drop: 1 }],
  ["double_coin", "🪙 Double Coin", "Coin game digandakan selama event.", { xp: 1, coin: 2, drop: 1 }],
  ["drop_up", "🎁 Drop Rate Up", "Peluang item naik.", { xp: 1, coin: 1, drop: 1.8 }],
  ["pet_festival", "🐾 Pet Festival", "Mode pet lebih banyak bonus.", { xp: 1.2, coin: 1.2, drop: 1.3, mode: "pet" }],
  ["race_night", "🚗 Race Night", "Track race otomatis dirotasi.", { xp: 1.2, coin: 1.4, mode: "race" }],
  ["warung_rame", "🏪 Warung Rame", "Pelanggan warung rame banget.", { xp: 1.15, coin: 1.5, mode: "warung" }],
  ["cooking_rush", "🍳 Cooking Rush", "Order dapur datang terus.", { xp: 1.3, coin: 1.25, mode: "cooking" }],
  ["pulau_harta", "🏝️ Pulau Harta", "Material pulau lebih gampang ketemu.", { xp: 1.2, coin: 1.2, drop: 1.6, mode: "island" }],
  ["rare_card", "🃏 Kartu Langka Naik", "Card pack lebih menarik.", { xp: 1, coin: 1.1, drop: 1.7, mode: "cards" }],
  ["basecamp", "🏕️ Basecamp Festival", "Dekorasi dan material basecamp naik.", { xp: 1.15, coin: 1.15, drop: 1.5, mode: "basecamp" }],
  ["courier_bonus", "🚚 Kurir Bonus", "Order kurir kasih bonus ekstra.", { xp: 1.2, coin: 1.45, mode: "courier" }],
  ["mystery_night", "👻 Mystery Night", "Clue mystery lebih sering muncul.", { xp: 1.3, coin: 1.1, drop: 1.5, mode: "mystery" }],
  ["party_hour", "🎭 Party Hour", "Party mode lebih ringan cooldownnya.", { xp: 1.25, coin: 1.25, mode: "party" }],
  ["material_up", "🧰 Material Drop Up", "Material craft lebih banyak.", { xp: 1, coin: 1, drop: 1.7, mode: "craft" }],
  ["energy_save", "🔋 Energy Hemat", "Aksi game lebih hemat energy.", { xp: 1, coin: 1, energyDiscount: 0.5 }],
  ["shop_discount", "🛒 Shop Discount", "Shop harian dapat diskon event.", { xp: 1, coin: 1, shopDiscount: 0.25 }],
  ["treasure_rain", "💎 Treasure Rain", "Item random lebih sering jatuh.", { xp: 1.1, coin: 1.2, drop: 2 }],
  ["cozy", "☕ Cozy Bonus", "Bonus saat server lagi sepi.", { xp: 1.15, coin: 1.15 }],
  ["prime", "🔥 Prime Time Bonus", "Bonus prime time saat ramai.", { xp: 1.25, coin: 1.25 }]
].map(([id, name, description, reward]) => ({ id, name, description, reward, enabled: true }));


const ADVENTURE_100_CATEGORIES = [
  ["start", "🚀 Start & Tutorial", "otstart", "Profile awal, starter reward, dan alur pemain baru."],
  ["profile", "👤 Profile Premium", "otprofile", "Level, XP, coin game, energy, rank, title, pet, streak, win/lose."],
  ["daily", "🎁 Daily Reward", "otdaily", "Reward harian, streak, dan Streak Shield."],
  ["routine", "📋 Smart Daily Routine", "otroutine", "Rekomendasi aktivitas harian yang rapi."],
  ["progress", "📈 Progress Tracker", "otprogress", "Progress level, quest, season, collection, achievement."],
  ["hunt", "🧭 Hansip Hunt", "othunt", "Explore area, encounter NPC, item, battle, dan humor random."],
  ["battle", "⚔️ Combat System", "otbattle", "Win/lose/draw/escape, HP, skill, pet assist, funny failure."],
  ["dungeon", "🏰 Dungeon", "otdungeon", "Room, trap lucu, treasure, mini boss, final boss."],
  ["raid", "🐲 Raid Boss", "otraid", "Co-op boss, contribution, top damage, support point."],
  ["party", "🎭 Party", "otparty", "Party 2-5 orang, quest bareng, gagal lucu tetap dapat hiburan."],
  ["risk", "🎲 Risk Challenge Aman", "otrisk", "Risk pakai energy/ticket, bukan uang asli, limit dan cooldown."],
  ["lucky", "<a:clover:1513671524949823639> Lucky Challenge Aman", "otlucky", "Daily lucky gratis/ticket event, no cashout."],
  ["chaos", "🌪️ Chaos Meter", "otchaos", "Chaos 0-100, dialog makin random, bonus kecil."],
  ["humor", "😂 Humor Engine", "otchaos", "Teks lucu natural khas DESA TULUS."],
  ["npc", "🧑 NPC Lucu", "otnpc", "Pak RW, Bang Warung, Kurir Nyasar, Kucing Pajak, dll."],
  ["map", "🗺️ World Map", "otmap", "Kampung Tulus, Gua Kopi, Pulau Juragan, Dungeon 404."],
  ["weather", "🌦️ Weather", "otweather", "Cuaca lucu dengan efek kecil."],
  ["quest", "🎯 Quest", "otquest", "Daily/weekly/season/story/funny quest."],
  ["achievement", "🏅 Achievement", "otachievement", "200+ achievement seed termasuk funny achievement."],
  ["collection", "📚 Collection Book", "otcollection", "Item/pet/card/trophy/secret/fish/season/funny collection."],
  ["shop", "🛒 Shop Besar", "otshop", "Daily/weekly/event/season/secret/shop kategori banyak."],
  ["buy", "💳 Buy", "otbuy", "Beli item game pakai coin game fiktif."],
  ["sell", "💰 Sell", "otsell", "Jual item game yang aman dan stackable."],
  ["inventory", "🎒 Inventory", "otinventory", "Item milik player, rarity, dan jumlah."],
  ["craft", "🧰 Crafting", "otcraft", "Craft item, meme item, pet food, dungeon key."],
  ["recipe", "📖 Recipe Book", "otrecipe", "Cari resep dan bahan craft."],
  ["upgrade", "⬆️ Upgrade", "otupgrade", "Upgrade gear/pet/basecamp/vehicle."],
  ["gear", "🛡️ Gear", "otgear", "Gear bonus, durability, repair aman."],
  ["repair", "🧱 Repair", "otrepair", "Perbaiki durability, item tidak hilang otomatis."],
  ["set", "🧩 Gear Set", "otset", "Set bonus kecil dan balance."],
  ["skill", "✨ Skill", "otskill", "Skill command-based dengan cooldown."],
  ["class", "🧬 Class", "otclass", "Class ringan: Fighter, Treasure Hunter, Pet Handler, dll."],
  ["rank", "🏆 Rank", "otrank", "Rank Hansip dari Warga Baru sampai Legenda OT."],
  ["title", "🏷️ Title", "ottitle", "Title list/equip dan random title harian."],
  ["titleme", "🎲 Random Title", "ottitleme", "Title lucu harian."],
  ["frame", "🖼️ Profile Frame", "otframe", "Equip frame premium biru."],
  ["energy", "🔋 Energy", "otenergy", "Energy regen dan pemakaian."],
  ["hp", "❤️ HP", "othp", "HP turun ringan saat kalah."],
  ["rest", "🛌 Rest", "otrest", "Pulihkan HP/energy dengan cooldown."],
  ["pet", "🐾 Pet System", "otpet", "Adopt/feed/play/train/evolve/pet humor."],
  ["pet_adventure", "🐾 Pet Hansip", "otpet adventure", "Pet ikut misi dan gagal lucu tanpa hilang."],
  ["story", "📜 Story Mode", "otstory", "12 chapter cerita DESA TULUS."],
  ["season", "🎟️ Season", "otseason", "Season quest/shop/boss/leaderboard/badge."],
  ["guild", "🛡️ Guild", "otguild", "Guild/team, mission, raid, shop, leaderboard."],
  ["guild_basecamp", "🏕️ Guild Basecamp", "otguild basecamp", "Upgrade dan donate material."],
  ["guild_event", "⚔️ Guild Event Aman", "otguild event", "Kompetisi kontribusi tanpa toxic."],
  ["project", "🏗️ Community Project", "otproject", "Project server-wide seperti Museum Sendal."],
  ["leaderboard", "🏆 Leaderboard", "ottop", "Top player, level, XP, coin, activity."],
  ["funny_top", "😂 Funny Leaderboard", "ottop funny", "Top kalah terhormat, kabur elegan, chaos player."],
  ["surprise", "🎉 Daily Surprise", "otsurprise", "Hadiah kecil, meme item, title harian."],
  ["comeback", "🔄 Comeback Player", "otcomeback", "Bonus balik main dan comeback quest."],
  ["training", "🥋 Training", "ottraining", "Latihan aman buat XP kecil."],
  ["farm", "🌾 Farm", "otfarm", "Tanam, siram, panen, failure lucu."],
  ["fish", "🎣 Fishing", "otfish", "Fishing side activity dan fish collection."],
  ["cook", "🍳 Cooking", "otcook", "Resep, bahan, rating, review pelanggan."],
  ["race", "🏁 Racing", "otrace", "Vehicle, track, weather, rival NPC."],
  ["expedition", "🧭 Expedition", "otexpedition", "Ekspedisi otomatis ringan."],
  ["basecamp", "🏠 Basecamp", "otbasecamp", "Visit, like, trophy, passive bonus kecil."],
  ["market", "🏪 Market", "otmarket", "Listing item game, tidak ada uang asli."],
  ["auction", "🔨 Auction", "otauction", "Bid pakai coin game, bisa disable."],
  ["bank", "🏦 Bank Coin Game", "otbank", "Deposit/withdraw coin game, no cashout."],
  ["insurance", "🛟 Insurance", "otinsurance", "Reduce penalty kalah dan durability loss."],
  ["trade", "🤝 Trade", "ottrade", "Trade item dengan konfirmasi dua pihak."],
  ["gift", "🎁 Gift", "otgift", "Gift item/coin game dengan limit harian."],
  ["mentor", "🧑‍🏫 Mentor", "otmentor", "Player lama bantu newbie, anti abuse."],
  ["compliment", "💙 Compliment", "otcompliment", "Pujian lucu aman."],
  ["roast", "🌶️ Roast Ringan", "otroast", "Roast ringan non-toxic, bisa disable."],
  ["vibe", "✨ Vibe Check", "otvibe", "Vibe lucu harian."],
  ["challenge", "📌 Challenge Board", "otchallenge", "Challenge mudah/sedang/sulit/lucu."],
  ["milestone", "🎊 Server Milestone", "otmilestone", "Reward kecil saat milestone server."],
  ["event", "📣 Event", "otevent", "Mini season, event besar, auto event."],
  ["tournament", "🏟️ Tournament", "ottournament", "Tournament mingguan otomatis."],
  ["routine_social", "🤍 Social Safety", "othelp", "Anti toxic, no real money, no secret exposure."],
  ["module_toggle", "🧩 Module Toggle", "dashboard", "ON/OFF fitur besar dari dashboard."],
  ["performance", "⚙️ Performance Mode", "dashboard", "Light/Balanced/Full Premium."],
  ["backup", "💾 Backup", "otbackup", "Backup aman tanpa .env/token."],
  ["logs", "📜 Game Logs", "otgamelog", "Error/event/trade/owner command log aman."],
  ["antispam", "🛡️ Anti Abuse", "auto", "Cooldown, double reward protection, limit risk/lucky."],
  ["data_protection", "🛡️ Data Protection", "auto", "Atomic JSON, backup corrupt, fallback MongoDB/JSON."],
  ["panel", "📌 Panel Guide", "otpanel", "Panel sebagai papan info, bukan semua tombol."],
  ["dashboard", "🖥️ Dashboard 100 Category", "dashboard", "Search/filter/status kategori dan quick edit."],
  ["blue_theme", "🔵 Blue Theme", "global", "Embed #0B5CFF + #38D5FF."],
  ["banner", "🖼️ Banner Premium", "dashboard", "Banner hanya untuk event besar/panel/season."],
  ["no_real_money", "🚫 No Real Money", "global", "Coin hanya fiktif, no cashout."],
  ["owner_tools", "👑 Owner Tools", "otowner", "Event, boss, season, reset, debug, logs."],
  ["auto_manager", "🤖 Auto Manager", "auto", "Regen, reset, shop refresh, backup, cleanup."],
  ["auto_event", "⚡ Auto Event Engine", "auto", "Event berdasar jadwal/random/aktivitas."],
  ["boss_spawn", "🐉 Boss Spawn", "otspawnboss", "Boss auto/manual dengan quote lucu."],
  ["season_owner", "🎬 Season Owner", "otseasonstart", "Start/end season owner only."],
  ["debug", "🧪 Debug Game", "otdebuggame", "Debug aman tanpa secret."],
  ["cleanup", "🧹 Cleanup Session", "otcleansession", "Bersihkan session lama."],
  ["disable_module", "⛔ Disable Module", "otdisablemodule", "Matikan module berat."],
  ["enable_module", "✅ Enable Module", "otenablemodule", "Aktifkan module."],
  ["world_state", "🌍 World State", "otmap", "Cuaca, area, chaos, event world."],
  ["npc_relation", "💬 NPC Relationship", "otnpc relation", "Relation NPC dan quest unik."],
  ["bank_history", "🏦 Bank History", "otbank", "Riwayat transaksi coin game."],
  ["collection_milestone", "📚 Collection Milestone", "otcollection", "Reward 10/25/50/75%."],
  ["final_polish", "💎 Premium Polish", "global", "Embed clean, command lanjutan, no menu buntu."]
].map((row, index) => ({ number: index + 1, id: row[0], title: row[1], command: row[2], description: row[3], enabled: true }));

const ADVENTURE_HUMOR_LINES = [
  "Kamu nemu coin di bawah bangku. Entah punya siapa, tapi game bilang itu rezeki.",
  "Pet kamu niat bantu battle, tapi malah pose dulu biar kelihatan keren.",
  "Monster Lag menyerang. Damage-nya kecil, tapi mental kamu yang kena.",
  "Kamu berhasil kabur dari dungeon. Bukan takut, cuma strateginya mundur elegan.",
  "NPC Pak RW ngasih quest, tapi lupa quest-nya apa. Classic.",
  "Kamu dikejar ayam 3 detik. Tidak sakit, cuma harga diri turun sedikit.",
  "Chest rare kebuka, tapi kuncinya minta dihargai dulu.",
  "Warung kamu rame banget sampai kursi plastik naik kasta.",
  "Pet kamu menatap musuh. Musuh merasa dihakimi secara spiritual.",
  "Kamu menemukan Map Kebalik. Akurasinya 0%, vibes-nya 100%."
];

const ADVENTURE_NPCS = ["Pak RW Mode Serius", "Bang Warung", "Kurir Nyasar", "Kucing Pajak", "Ayam Kabur", "Bebek Sigma", "NPC Sok Bijak", "Petugas Dungeon Ngantuk", "Penjual Item Misterius", "Tukang Parkir Pulau Juragan", "Admin AFK", "Chef Chaos", "Mechanic Becak Turbo", "Penjaga Secret Shop", "Dukun Upgrade Gear", "Kolektor Sendal Sakti"];
const ADVENTURE_MONSTERS = ["Slime Gabut", "Monster Lag", "Raja AFK", "Ayam Ngamuk", "Bot Error 404", "Naga WiFi Lemot", "Kucing Pajak", "Titan Ping Merah", "Pak RW Mode Serius", "Monster Spam Chat", "Bebek Turbo", "Kipas Angin Rusuh"];

const OT_ITEM_TYPES = ["consumable","material","equipment","weapon","armor","charm","ring","vehicle_part","pet_food","pet_toy","pet_accessory","card_pack","card_dust","cooking_ingredient","recipe","warung_decor","basecamp_decor","farm_seed","fishing_bait","fish","mystery_clue","raid_item","dungeon_key","event_token","cosmetic_title","profile_frame","badge_fragment","crafting_tool","booster_item","story_item","tournament_token","carnival_ticket","relic","trophy","season_item","guild_item","risk_ticket","lucky_ticket","party_item","mentor_badge","meme_item","useless_but_funny","npc_gift","chaos_item","secret_joke_item"];
const OT_RARITIES = ["Common","Uncommon","Rare","Epic","Legendary","Mythic","Ancient","Divine","Secret OT","Limited Season","Founder","Event Exclusive","Relic","Boss Drop"];
const gameCooldowns = new Map();
const gameRedirectCooldowns = new Map();
const gameModuleErrors = new Map();
let gameManagerStarted = false;
let gameLastAutoSaveAt = 0;

function gameConfig() {
  return {
    gameEnabled: config.gameEnabled !== false,
    gameChannelId: String(config.gameChannelId || "").trim(),
    gameLogChannelId: String(config.gameLogChannelId || config.ownerLogChannelId || "").trim(),
    gamePrefixName: config.gamePrefixName || config.gameName || "Hansip",
    gameCooldownMs: Number(config.gameCooldownMs || 5000),
    gameEmbedColor: config.gameEmbedColor || "#0B5CFF",
    gameEmbedAccent: config.gameEmbedAccent || "#38D5FF",
    gameRiskModeEnabled: config.gameRiskModeEnabled !== false,
    gameRealMoneyDisabled: config.gameRealMoneyDisabled !== false,
    gameHumorEnabled: config.gameHumorEnabled !== false,
    gameChaosEnabled: config.gameChaosEnabled !== false,
    gameAutoEventEnabled: config.gameAutoEventEnabled !== false,
    gameAutoManagerEnabled: config.gameAutoManagerEnabled !== false
  };
}

function gameJsonBackupCorrupt(file, raw) {
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    const name = `${path.basename(file)}.corrupt-${Date.now()}.backup`;
    fs.writeFileSync(path.join(BACKUP_DIR, name), raw || "");
  } catch (error) {
    console.error("⚠️ Gagal backup file game rusak:", error.message);
  }
}

function readGameJson(file, fallback) {
  try {
    if (!fs.existsSync(file)) return fallback;
    const raw = fs.readFileSync(file, "utf8");
    return JSON.parse(raw || JSON.stringify(fallback));
  } catch (error) {
    let raw = "";
    try { raw = fs.readFileSync(file, "utf8"); } catch {}
    gameJsonBackupCorrupt(file, raw);
    return fallback;
  }
}

function writeGameJson(file, data) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && Date.now() - gameLastAutoSaveAt > 60000) {
    try {
      const backupName = `${path.basename(file)}.${Date.now()}.tmp-backup`;
      fs.copyFileSync(file, path.join(BACKUP_DIR, backupName));
    } catch {}
    gameLastAutoSaveAt = Date.now();
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  persistFileToMongo(file, data);
}

function slugText(text) {
  return String(text || "item").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 48) || "item";
}

function generateItemCatalog() {
  const namesA = ["Energy Drink", "Kopi", "Roti", "Snack", "Potion", "Es Teh", "Kayu", "Batu", "Gear", "Kristal", "Sendal", "Hoodie", "Amulet", "Ban", "Mesin", "Nitro", "Pet Food", "Bola", "Bumbu", "Mie", "Sofa", "Poster", "Tiket", "Token", "Kunci", "Kartu", "Mahkota", "Trophy", "Scroll", "Lampu", "Bibit", "Umpan", "Ikan", "Clue", "Lencana", "Frame", "Palu", "Baterai", "Kompas", "Peta"];
  const namesB = ["Tulus", "Semangat", "Anti Lapar", "Lucky", "Kopi", "Damai", "DESA TULUS", "AFK", "Sakti", "Seblak", "Curhat", "Festival", "Dungeon", "Mythic OT", "Raja Gabut", "Boss AFK", "Pulau", "Warung", "Basecamp", "Pet", "Race", "Dapur", "Misteri", "Carnival"];
  const catalog = [];
  let i = 0;
  for (const type of OT_ITEM_TYPES) {
    for (let n = 0; n < 22; n++) {
      const rarity = OT_RARITIES[(i + n) % OT_RARITIES.length];
      const name = `${namesA[(i + n) % namesA.length]} ${namesB[(i * 3 + n) % namesB.length]}`;
      const id = `${slugText(type)}_${slugText(name)}_${String(i).padStart(3, "0")}`;
      const rarityIndex = OT_RARITIES.indexOf(rarity) + 1;
      catalog.push({
        id,
        name,
        type,
        rarity,
        description: `${name} untuk progres Hansip. Bisa dipakai untuk reward, shop, quest, craft, atau event.`,
        effect: type === "consumable" ? { energy: 10 + rarityIndex * 3 } : { power: rarityIndex, luck: Math.max(1, Math.floor(rarityIndex / 2)) },
        sellPrice: 25 * rarityIndex + n * 5,
        buyPrice: 70 * rarityIndex + n * 15,
        tradeable: !["story_item", "badge_fragment"].includes(type),
        stackable: !["equipment", "weapon", "armor", "profile_frame"].includes(type),
        enabled: true,
        source: ["daily", "shop", "event", type.includes("pet") ? "pet" : "game"]
      });
      i += 1;
    }
  }
  return catalog.slice(0, 900);
}

function generateQuestCatalog() {
  const categories = ["Daily", "Weekly", "Monthly", "Event", "Story", "Team", "Pet", "Race", "Cooking", "Warung", "Farm", "Dungeon", "Raid", "Island", "Mystery", "Crafting", "Basecamp", "Fishing", "Tournament", "Carnival"];
  const quests = [];
  let idx = 1;
  for (const cat of categories) {
    for (let i = 1; i <= 5; i++) {
      quests.push({
        id: `${slugText(cat)}_${i}`,
        type: cat.toLowerCase(),
        name: `${cat} Quest ${i}`,
        description: `Selesaikan ${i * 2} aksi ${cat.toLowerCase()} di Hansip.`,
        target: i * 2,
        progressKey: cat.toLowerCase(),
        reward: { coin: 120 * i, xp: 70 * i },
        enabled: true
      });
      idx += 1;
    }
  }
  return quests;
}

function generateAchievementCatalog() {
  const cats = ["Level", "Coin", "Explore", "Battle", "Dungeon", "Raid", "Pet", "Shop", "Crafting", "Collection", "Story", "Season", "Guild", "Secret", "Lose Recovery", "Win Streak", "Risk Challenge", "Lucky Challenge", "Party", "Trade", "Mentor", "Funny", "Chaos", "Race", "Cooking", "Farm", "Fishing", "Basecamp", "Market", "NPC"];
  const achievements = [];
  let id = 1;
  for (const cat of cats) {
    for (let i = 1; i <= 5; i++) {
      achievements.push({
        id: `ach_${String(id).padStart(3, "0")}`,
        name: `${cat} Badge ${i}`,
        description: `Capai milestone ${cat.toLowerCase()} tahap ${i}.`,
        category: cat,
        requirement: { key: slugText(cat), value: i * 5 },
        reward: { coin: 150 * i, xp: 100 * i },
        badgeEmoji: i >= 5 ? "🏆" : i >= 3 ? "⭐" : "✨",
        hidden: cat === "Secret",
        enabled: true
      });
      id += 1;
    }
  }
  return achievements.slice(0, 240);
}

function defaultGameData() {
  return {
    version: "1.18.0",
    activeEvent: null,
    nextEventAt: 0,
    lastDailyReset: "",
    lastWeeklyReset: "",
    lastShopRefresh: "",
    lastBackupAt: "",
    boss: { id: "raja_afk", name: "Boss Raja AFK", hp: 2500, maxHp: 2500, endsAt: 0, active: false },
    rotations: { dungeon: "Gerbang Tulus", raceTrack: "Gang Seblak", weather: "Cerah Tulus", cookingOrder: "Es Teh Pak RW", mysteryCase: "Kursi Hilang", npc: "Pak RW Mode Serius" },
    chaos: { meter: 10, label: "Santai", history: [] },
    season: { name: "Blue Tulus Week", progress: 0, active: true },
    sessions: {},
    activity: []
  };
}

function defaultPlayer(user) {
  return {
    userId: user?.id || "unknown",
    username: user?.username || user?.tag || "Warga OT",
    coin: 250,
    xp: 0,
    level: 1,
    energy: 100,
    maxEnergy: 100,
    inventory: {},
    rank: "Warga Baru",
    title: "Warga Baru Datang",
    frame: "Blue Tulus Frame",
    className: "Warga Fighter",
    hp: 100,
    maxHp: 100,
    pet: { name: "Belum punya pet", level: 1, mood: 70, hunger: 20, bond: 0 },
    stats: { actions: 0, wins: 0, losses: 0, draws: 0, escapes: 0, risk: 0, lucky: 0, chaos: 0, city: 0, pet: 0, race: 0, cooking: 0, warung: 0, raid: 0, dungeon: 0, farm: 0, fishing: 0, event: 0, daily: 0 },
    quests: {},
    achievements: [],
    daily: { lastClaim: "", streak: 0 },
    boosts: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function defaultGameSeasons() {
  return { active: { name: "Blue Tulus Week", theme: "Biru DESA TULUS", startedAt: new Date().toISOString(), progress: 0 }, rewards: [], shop: [] };
}
function defaultGameWorld() {
  return { areas: ["Kampung Tulus", "Hutan Santai", "Gua Kopi", "Pulau Juragan", "Pasar Malam OT", "Menara Pak RW", "Dungeon 404", "Warung Tulus", "Arena Boss", "Taman Pet"], weather: "Cerah Tulus", npc: ADVENTURE_NPCS[0], updatedAt: new Date().toISOString() };
}
function defaultGameStory() {
  return { chapters: ["Warga Baru Datang", "Misteri Warung Hilang", "Pulau Tulus Terbuka", "Pak RW Mode Serius", "Boss AFK Bangkit", "Festival DESA TULUS", "Rahasia Pulau Juragan", "Kota Event Terbuka", "Dungeon Error 404", "Legenda warga DESA TULUS", "Kunci Secret OT", "Season Para Warga"], progress: {} };
}
function defaultGameRisk() {
  return { history: [], daily: {}, reminder: "Coin Hansip hanya coin game fiktif dan tidak bisa dicairkan menjadi uang asli." };
}
function ensureGameFiles() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const seeds = [
    [GAME_DATA_FILE, defaultGameData()],
    [GAME_PLAYERS_FILE, {}],
    [GAME_ITEMS_FILE, generateItemCatalog()],
    [GAME_SHOP_FILE, defaultShopData(generateItemCatalog())],
    [GAME_EVENTS_FILE, OT_GAME_EVENTS],
    [GAME_QUESTS_FILE, generateQuestCatalog()],
    [GAME_ACHIEVEMENTS_FILE, generateAchievementCatalog()],
    [GAME_LEADERBOARD_FILE, []],
    [GAME_BACKUP_FILE, {}],
    [GAME_SEASONS_FILE, defaultGameSeasons()],
    [GAME_WORLD_FILE, defaultGameWorld()],
    [GAME_BATTLE_FILE, {}],
    [GAME_DUNGEONS_FILE, {}],
    [GAME_RAID_FILE, {}],
    [GAME_GUILDS_FILE, {}],
    [GAME_STORY_FILE, defaultGameStory()],
    [GAME_RISK_FILE, defaultGameRisk()],
    [GAME_HUMOR_FILE, { lines: ADVENTURE_HUMOR_LINES, npcs: ADVENTURE_NPCS, monsters: ADVENTURE_MONSTERS }],
    [GAME_CHAOS_FILE, { meter: 10, label: "Santai", history: [] }],
    [GAME_MARKET_FILE, { listings: [], history: [] }],
    [GAME_BANK_FILE, { accounts: {}, history: [] }]
  ];
  for (const [file, fallback] of seeds) {
    if (!fs.existsSync(file)) writeGameJson(file, fallback);
    else readGameJson(file, fallback);
  }
}

function readGameData() { return readGameJson(GAME_DATA_FILE, defaultGameData()); }
function writeGameData(data) { return writeGameJson(GAME_DATA_FILE, data); }
function readGamePlayers() { return readGameJson(GAME_PLAYERS_FILE, {}); }
function writeGamePlayers(data) { return writeGameJson(GAME_PLAYERS_FILE, data); }
function readGameItems() { const items = readGameJson(GAME_ITEMS_FILE, []); return Array.isArray(items) && items.length ? items : generateItemCatalog(); }
function writeGameItems(data) { return writeGameJson(GAME_ITEMS_FILE, data); }
function readGameShop() { return readGameJson(GAME_SHOP_FILE, defaultShopData(readGameItems())); }
function writeGameShop(data) { return writeGameJson(GAME_SHOP_FILE, data); }
function readGameEvents() { const events = readGameJson(GAME_EVENTS_FILE, OT_GAME_EVENTS); return Array.isArray(events) && events.length ? events : OT_GAME_EVENTS; }
function readGameQuests() { const q = readGameJson(GAME_QUESTS_FILE, generateQuestCatalog()); return Array.isArray(q) && q.length ? q : generateQuestCatalog(); }
function readGameAchievements() { const a = readGameJson(GAME_ACHIEVEMENTS_FILE, generateAchievementCatalog()); return Array.isArray(a) && a.length ? a : generateAchievementCatalog(); }

function defaultShopData(items) {
  const enabled = (items || []).filter(item => item.enabled !== false);
  const pick = (source, count) => enabled.filter(item => !source || item.source?.includes(source) || item.type?.includes(source)).slice(0, count);
  return {
    daily: pick("shop", 12),
    weekly: enabled.slice(12, 30),
    event: enabled.filter(item => item.source?.includes("event")).slice(0, 12),
    secret: enabled.filter(item => ["Mythic", "Ancient", "Divine", "Secret OT"].includes(item.rarity)).slice(0, 8),
    refreshedAt: new Date().toISOString(),
    discount: 0
  };
}

function getGamePlayer(user) {
  const players = readGamePlayers();
  const id = user.id;
  if (!players[id]) players[id] = defaultPlayer(user);
  players[id].username = user.username || players[id].username;
  players[id].updatedAt = new Date().toISOString();
  return { players, player: players[id] };
}

function saveGamePlayer(user, player) {
  const players = readGamePlayers();
  players[user.id] = { ...player, userId: user.id, username: user.username || player.username, updatedAt: new Date().toISOString() };
  writeGamePlayers(players);
  refreshGameLeaderboard(players);
  return players[user.id];
}

function calcGameLevel(xp) {
  return Math.max(1, Math.floor(Math.sqrt(Math.max(0, xp) / 120)) + 1);
}

function todayKey() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
}

function gameBaseEmbed(title, description = "") {
  const embed = new EmbedBuilder()
    .setColor(config.gameEmbedColor || config.embedColor || "#0B5CFF")
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: "DESA TULUS • Hansip" })
    .setTimestamp();
  if (config.gameBannerEnabled !== false && config.gameMainBannerUrl && title.includes("Hansip")) embed.setImage(config.gameMainBannerUrl);
  return embed;
}

function activeGameEvent() {
  const data = readGameData();
  if (data.activeEvent && data.activeEvent.endsAt && data.activeEvent.endsAt > Date.now()) return data.activeEvent;
  if (data.activeEvent && data.activeEvent.endsAt <= Date.now()) {
    data.activity = [{ title: "Event selesai", message: `${data.activeEvent.name} selesai otomatis.`, time: new Date().toISOString() }, ...(data.activity || [])].slice(0, 40);
    data.activeEvent = null;
    writeGameData(data);
  }
  return null;
}

function rewardMultiplier(modeId) {
  const ev = activeGameEvent();
  if (!ev) return { xp: 1, coin: 1, drop: 1, energyDiscount: 1, name: "Normal" };
  const rw = ev.reward || {};
  const modeBonus = !rw.mode || rw.mode === modeId ? 1 : 0.75;
  return {
    xp: Number(rw.xp || 1) * modeBonus,
    coin: Number(rw.coin || 1) * modeBonus,
    drop: Number(rw.drop || 1),
    energyDiscount: rw.energyDiscount ? Number(rw.energyDiscount) : 1,
    name: ev.name || "Event Aktif"
  };
}

function checkGameCooldown(userId, key, ms = null) {
  const wait = Number(ms || gameConfig().gameCooldownMs || 5000);
  const now = Date.now();
  const mapKey = `${userId}:${key}`;
  const last = gameCooldowns.get(mapKey) || 0;
  if (now - last < wait) return Math.ceil((wait - (now - last)) / 1000);
  gameCooldowns.set(mapKey, now);
  return 0;
}

async function ensureGameChannelForMessage(message) {
  const gc = gameConfig();
  if (!gc.gameEnabled) {
    await replyOt(message, { content: "🎮 Hansip sedang dinonaktifkan owner." });
    return false;
  }
  if (!gc.gameChannelId || message.channelId === gc.gameChannelId || isHansipwner(message.member, message.guild)) return true;
  const key = `${message.author.id}:${message.channelId}`;
  const now = Date.now();
  if (now - (gameRedirectCooldowns.get(key) || 0) > 20000) {
    gameRedirectCooldowns.set(key, now);
    await message.reply({ content: `🎮 Hansip hanya bisa dimainkan di <#${gc.gameChannelId}>. Yuk main di sana biar channel lain tetap rapi.` }).then(msg => setTimeout(() => msg.delete().catch(() => null), 10000)).catch(() => null);
  }
  return false;
}

async function ensureGameChannelForInteraction(interaction) {
  const gc = gameConfig();
  if (!gc.gameEnabled) {
    await interaction.reply({ content: "🎮 Hansip sedang dinonaktifkan owner.", flags: MessageFlags.Ephemeral }).catch(() => null);
    return false;
  }
  if (!gc.gameChannelId || interaction.channelId === gc.gameChannelId || isHansipwner(interaction.member, interaction.guild)) return true;
  await interaction.reply({ content: `🎮 Hansip hanya bisa dimainkan di <#${gc.gameChannelId}>. Yuk main di sana biar channel lain tetap rapi.`, flags: MessageFlags.Ephemeral }).catch(() => null);
  return false;
}

function gamePanelComponents() {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_main").setStyle(ButtonStyle.Primary).setEmoji("🎮").setLabel("Main Game"),
      new ButtonBuilder().setCustomId("game_profile").setStyle(ButtonStyle.Secondary).setEmoji("👤").setLabel("Profil"),
      new ButtonBuilder().setCustomId("game_inventory").setStyle(ButtonStyle.Secondary).setEmoji("🎒").setLabel("Inventory"),
      new ButtonBuilder().setCustomId("game_shop").setStyle(ButtonStyle.Success).setEmoji("🛒").setLabel("Shop"),
      new ButtonBuilder().setCustomId("game_daily").setStyle(ButtonStyle.Success).setEmoji("🎁").setLabel("Daily")
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_mission").setStyle(ButtonStyle.Secondary).setEmoji("🎯").setLabel("Misi"),
      new ButtonBuilder().setCustomId("game_top").setStyle(ButtonStyle.Secondary).setEmoji("🏆").setLabel("Leaderboard"),
      new ButtonBuilder().setCustomId("game_event").setStyle(ButtonStyle.Secondary).setEmoji("📣").setLabel("Event"),
      new ButtonBuilder().setCustomId("game_map").setStyle(ButtonStyle.Secondary).setEmoji("🗺️").setLabel("Map"),
      new ButtonBuilder().setCustomId("game_tutorial").setStyle(ButtonStyle.Secondary).setEmoji("⚙️").setLabel("Tutorial")
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("game_pet").setStyle(ButtonStyle.Secondary).setEmoji("🐾").setLabel("Pet"),
      new ButtonBuilder().setCustomId("game_raid").setStyle(ButtonStyle.Danger).setEmoji("⚔️").setLabel("Raid"),
      new ButtonBuilder().setCustomId("game_refresh").setStyle(ButtonStyle.Secondary).setEmoji("🔄").setLabel("Refresh")
    )
  ];
}

function gameModeSelect() {
  const disabled = new Set(config.gameDisabledModes || []);
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId("game_mode_select")
      .setPlaceholder("Pilih mode game OT...")
      .addOptions(OT_GAME_MODES.filter(m => !disabled.has(m.id)).slice(0, 25).map(mode => ({ label: mode.name, value: mode.id, emoji: mode.emoji, description: mode.desc.slice(0, 95) })))
  );
}

function gameActionRows(modeId) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`game_action:${modeId}:play`).setStyle(ButtonStyle.Primary).setEmoji("🎮").setLabel("Mulai Aksi"),
      new ButtonBuilder().setCustomId(`game_action:${modeId}:safe`).setStyle(ButtonStyle.Secondary).setEmoji("🛡️").setLabel("Aksi Aman"),
      new ButtonBuilder().setCustomId(`game_action:${modeId}:lucky`).setStyle(ButtonStyle.Success).setEmoji("✨").setLabel("Aksi Lucky"),
      new ButtonBuilder().setCustomId("game_main").setStyle(ButtonStyle.Secondary).setEmoji("↩️").setLabel("Mode Lain")
    )
  ];
}

async function sendGamePanel(target, editOld = false) {
  ensureGameFiles();
  const ev = activeGameEvent();
  const embed = gameBaseEmbed("🎮 Hansip", `Game besar DESA TULUS yang rapi, otomatis, dan cuma jalan di satu channel.\n\n**Alur:** klik **Main Game** → pilih mode → tekan aksi → dapat XP, coin, item, quest, achievement.\n**Event aktif:** ${ev ? `**${ev.name}** sampai <t:${Math.floor(ev.endsAt / 1000)}:R>` : "Belum ada event aktif."}\n\nGunakan juga: \`otgame\`, \`otprofile\`, \`otdaily\`, \`otshop\`, \`otmission\`, \`ottop\`, \`otevent\`.`);
  embed.addFields(
    { name: "100 Category", value: `${ADVENTURE_100_CATEGORIES.length} kategori fitur`, inline: true },
    { name: "Item Catalog", value: `${readGameItems().length}+ item seed/generator`, inline: true },
    { name: "Auto Manager", value: config.gameAutoManagerEnabled !== false ? "Aktif" : "Nonaktif", inline: true }
  );
  const payload = { embeds: [embed], components: gamePanelComponents() };

  if (target?.reply && !target?.channel?.send) return target.reply(payload);
  if (target?.channel) {
    const channel = config.gameChannelId ? await client.channels.fetch(config.gameChannelId).catch(() => null) : target.channel;
    if (!channel?.send) return replyOt(target, { content: "❌ Channel game belum diatur atau bot tidak bisa mengaksesnya." });
    let sent = null;
    if (editOld && config.gamePanelMessageId) {
      const old = await channel.messages.fetch(config.gamePanelMessageId).catch(() => null);
      if (old) sent = await old.edit(payload).catch(() => null);
    }
    if (!sent) sent = await channel.send(payload);
    config.gamePanelMessageId = sent.id;
    if (!config.gameChannelId) config.gameChannelId = channel.id;
    saveConfig(config);
    return replyOt(target, { content: `✅ Panel Hansip berhasil ${editOld ? "diupdate" : "dikirim"} di ${channel}.` });
  }
  return null;
}

function gameProfileEmbed(user) {
  const { players, player } = getGamePlayer(user);
  const invCount = Object.values(player.inventory || {}).reduce((a, b) => a + Number(b || 0), 0);
  player.level = calcGameLevel(player.xp);
  players[user.id] = player;
  writeGamePlayers(players);
  const embed = gameBaseEmbed("👤 Profil Hansip", `${user}, ini progres game kamu.`);
  embed.addFields(
    { name: "Level", value: `**${player.level}**`, inline: true },
    { name: "XP", value: `**${player.xp}**`, inline: true },
    { name: "Coin", value: `**${player.coin}**`, inline: true },
    { name: "Energy", value: `**${player.energy}/${player.maxEnergy}**`, inline: true },
    { name: "Inventory", value: `**${invCount} item**`, inline: true },
    { name: "Achievement", value: `**${(player.achievements || []).length}**`, inline: true },
    { name: "Rank", value: `**${player.rank || "Warga Baru"}**`, inline: true },
    { name: "Title", value: `**${player.title || "Warga Baru Datang"}**`, inline: true },
    { name: "Win/Lose", value: `**${player.stats?.wins || 0}/${player.stats?.losses || 0}**`, inline: true }
  );
  return embed;
}

function addItemToPlayer(player, itemId, amount = 1) {
  player.inventory = player.inventory || {};
  player.inventory[itemId] = Number(player.inventory[itemId] || 0) + amount;
}

function pickRandomItem(mult = 1) {
  const items = readGameItems().filter(item => item.enabled !== false);
  if (!items.length) return null;
  const chance = Math.min(0.85, 0.22 * Number(mult || 1));
  if (Math.random() > chance) return null;
  const rarityRoll = Math.random();
  const filtered = items.filter(item => {
    if (rarityRoll > 0.985) return ["Divine", "Secret OT"].includes(item.rarity);
    if (rarityRoll > 0.94) return ["Mythic", "Ancient"].includes(item.rarity);
    if (rarityRoll > 0.82) return ["Epic", "Legendary"].includes(item.rarity);
    if (rarityRoll > 0.55) return ["Rare", "Uncommon"].includes(item.rarity);
    return ["Common", "Uncommon"].includes(item.rarity);
  });
  const pool = filtered.length ? filtered : items;
  return pool[Math.floor(Math.random() * pool.length)];
}

function checkAchievements(player) {
  const achievements = readGameAchievements();
  const owned = new Set(player.achievements || []);
  const unlocked = [];
  for (const ach of achievements) {
    if (!ach.enabled || owned.has(ach.id)) continue;
    const key = ach.requirement?.key || "actions";
    const value = Number(ach.requirement?.value || 1);
    let current = 0;
    if (key === "level") current = player.level;
    else if (key === "coin") current = player.coin;
    else current = Number(player.stats?.[key] || player.stats?.actions || 0);
    if (current >= value) {
      owned.add(ach.id);
      player.achievements = Array.from(owned);
      player.coin += Number(ach.reward?.coin || 0);
      player.xp += Number(ach.reward?.xp || 0);
      unlocked.push(ach);
    }
  }
  return unlocked.slice(0, 3);
}

function updateQuestProgress(player, modeId) {
  player.quests = player.quests || {};
  const quests = readGameQuests().filter(q => q.enabled !== false).slice(0, 100);
  const done = [];
  for (const q of quests) {
    const qState = player.quests[q.id] || { progress: 0, claimed: false };
    if (qState.claimed) continue;
    const match = q.progressKey === modeId || q.type === "daily" || q.type === "event";
    if (!match) continue;
    qState.progress += 1;
    if (qState.progress >= Number(q.target || 1)) {
      qState.claimed = true;
      player.coin += Number(q.reward?.coin || 0);
      player.xp += Number(q.reward?.xp || 0);
      done.push(q);
    }
    player.quests[q.id] = qState;
  }
  return done.slice(0, 3);
}

function randomHansipHumor() {
  if (config.gameHumorEnabled === false) return "";
  return ADVENTURE_HUMOR_LINES[Math.floor(Math.random() * ADVENTURE_HUMOR_LINES.length)] || "Hansip tetap jalan rapi.";
}
function rollHansipOutcome(action = "play") {
  const roll = Math.random();
  if (action === "risk") {
    if (roll < 0.18) return { key: "losses", label: "Risk Gagal Lucu", rewardScale: 0.35, hpDelta: -8, text: "Tantangan risk gagal, tapi penalty dibuat ringan. Coin tetap hanya coin game fiktif." };
    if (roll > 0.92) return { key: "wins", label: "Critical Success", rewardScale: 2.1, hpDelta: 0, text: "Critical success! Kamu menang elegan tanpa drama berlebihan." };
    return { key: "wins", label: "Risk Berhasil", rewardScale: 1.35, hpDelta: -2, text: "Risk berhasil. Reminder: tidak ada uang asli, cashout, atau taruhan." };
  }
  if (roll < 0.10) return { key: "losses", label: "Lose Recovery", rewardScale: 0.55, hpDelta: -5, text: "Kamu kalah ringan, tapi tetap dapat XP kecil dan lose recovery bonus." };
  if (roll < 0.16) return { key: "escapes", label: "Escape", rewardScale: 0.7, hpDelta: -2, text: "Kamu mundur elegan. Bukan takut, cuma strategi hemat sandal." };
  if (roll > 0.94) return { key: "wins", label: "Critical Success", rewardScale: 1.8, hpDelta: 0, text: "Critical success! Warga sekitar tepuk tangan pelan tapi mahal." };
  return { key: "wins", label: "Win", rewardScale: 1, hpDelta: 0, text: "Aksi berhasil. Reward masuk aman dan data tersimpan." };
}
function gameActionText(mode, action) {
  const texts = {
    city: "Waduh, kamu ngegas terlalu semangat sampai becaknya belok ke warung seblak 😭",
    pet: "Pet kamu nemu coin di bawah kursi. Entah kursi siapa, yang penting halal game.",
    race: "Kamu drift tipis di tikungan. Penonton kaget, tukang es teh tetap kalem.",
    cooking: "Dapur rame banget sampai Pak RW ikut antre beli es teh.",
    island: "Kamu nemu peti kecil di pinggir pulau. Isinya bukan cicilan, aman.",
    raid: "Boss Raja AFK cuma diem… tapi somehow tetap bikin semua panik.",
    mystery: "Kamu nemu clue misterius. Tidak serem, cuma bikin penasaran.",
    warung: "Warung kamu rame banget sampai kursi plastik naik kasta.",
    farm: "Tanaman kamu tumbuh sehat. Sepertinya disiram pakai niat baik.",
    fishing: "Kail kamu narik sesuatu. Ternyata ikan santai yang ikut healing."
  };
  return texts[mode.id] || `${mode.name} berhasil diselesaikan. Reward masuk dengan aman.`;
}

async function runGameAction(interaction, modeId, action = "play") {
  if (!(await ensureGameChannelForInteraction(interaction))) return true;
  const wait = checkGameCooldown(interaction.user.id, `action:${modeId}`, action === "safe" ? Math.max(2500, gameConfig().gameCooldownMs - 1500) : gameConfig().gameCooldownMs);
  if (wait) {
    await interaction.reply({ content: `⏳ Jangan spam ya. Coba lagi sekitar **${wait} detik**.`, flags: MessageFlags.Ephemeral }).catch(() => null);
    return true;
  }
  await interaction.deferReply({ flags: MessageFlags.Ephemeral }).catch(() => null);
  const mode = OT_GAME_MODES.find(m => m.id === modeId) || OT_GAME_MODES[0];
  const { player } = getGamePlayer(interaction.user);
  const mult = rewardMultiplier(modeId);
  const baseEnergy = action === "lucky" ? 14 : action === "safe" ? 7 : 10;
  const energyCost = Math.max(1, Math.floor(baseEnergy * Number(mult.energyDiscount || 1)));
  if (player.energy < energyCost) {
    await interaction.editReply({ embeds: [gameBaseEmbed("🔋 Energy Kurang", `Energy kamu **${player.energy}/${player.maxEnergy}**. Ambil \`otdaily\`, tunggu auto regen, atau pakai item energy kalau ada.`)], components: [] }).catch(() => null);
    return true;
  }
  player.energy -= energyCost;
  const outcome = rollHansipOutcome(action);
  const xpGain = Math.floor((35 + Math.random() * 35 + (action === "lucky" ? 20 : 0)) * mult.xp * outcome.rewardScale);
  const coinGain = Math.floor((55 + Math.random() * 80 + (action === "lucky" ? 30 : 0)) * mult.coin * outcome.rewardScale);
  player.xp += xpGain;
  player.coin += coinGain;
  player.level = calcGameLevel(player.xp);
  player.stats = player.stats || {};
  player.stats.actions = Number(player.stats.actions || 0) + 1;
  player.stats[modeId] = Number(player.stats[modeId] || 0) + 1;
  player.stats[outcome.key] = Number(player.stats[outcome.key] || 0) + 1;
  if (outcome.hpDelta) player.hp = Math.max(1, Math.min(player.maxHp || 100, Number(player.hp || 100) + outcome.hpDelta));
  if (mult.name !== "Normal") player.stats.event = Number(player.stats.event || 0) + 1;
  const item = pickRandomItem(mult.drop);
  if (item) addItemToPlayer(player, item.id, 1);
  const questDone = updateQuestProgress(player, modeId);
  const unlocked = checkAchievements(player);
  saveGamePlayer(interaction.user, player);
  const embed = gameBaseEmbed(`${mode.emoji} ${mode.name} • ${outcome.label}`, `${gameActionText(mode, action)}\n\n${outcome.text}\n${randomHansipHumor()}`);
  embed.addFields(
    { name: "Reward", value: `+${xpGain} XP\n+${coinGain} coin${item ? `\n🎁 ${item.name} (${item.rarity})` : ""}`, inline: true },
    { name: "Progress", value: `Level **${player.level}**\nHP **${player.hp || 100}/${player.maxHp || 100}**\nEnergy **${player.energy}/${player.maxEnergy}**\nEvent: **${mult.name}**`, inline: true },
    { name: "Bonus", value: `${questDone.length ? `Quest selesai: ${questDone.map(q => q.name).join(", ")}` : "Quest berjalan."}\n${unlocked.length ? `Achievement: ${unlocked.map(a => a.badgeEmoji + " " + a.name).join(", ")}` : "Achievement aman."}`, inline: false }
  );
  embed.addFields({ name: "Lanjut", value: "`othunt` • `otbattle` • `otinventory` • `otshop` • `otquest` • `otprofile`", inline: false });
  await interaction.editReply({ embeds: [embed], components: gameActionRows(modeId) }).catch(() => null);
  return true;
}

function refreshGameLeaderboard(players = readGamePlayers()) {
  const board = Object.values(players).map(p => ({ userId: p.userId, username: p.username, level: calcGameLevel(p.xp || 0), xp: p.xp || 0, coin: p.coin || 0 })).sort((a, b) => (b.xp + b.coin / 10) - (a.xp + a.coin / 10)).slice(0, 20);
  writeGameJson(GAME_LEADERBOARD_FILE, board);
  return board;
}

function leaderboardEmbed() {
  const board = refreshGameLeaderboard();
  const lines = board.slice(0, 10).map((p, i) => `**${i + 1}.** <@${p.userId}> — Lv ${p.level} • ${p.xp} XP • ${p.coin} coin`);
  return gameBaseEmbed("🏆 Leaderboard Hansip", lines.length ? lines.join("\n") : "Belum ada player. Klik panel game dulu buat mulai.");
}

function inventoryEmbed(user) {
  const { player } = getGamePlayer(user);
  const items = readGameItems();
  const lines = Object.entries(player.inventory || {}).slice(0, 15).map(([id, qty]) => {
    const item = items.find(x => x.id === id);
    return `• **${item?.name || id}** x${qty}${item ? ` — ${item.rarity}` : ""}`;
  });
  return gameBaseEmbed("🎒 Inventory Hansip", lines.length ? lines.join("\n") : "Inventory kamu masih kosong. Main game, daily, atau beli item di shop.");
}

function shopEmbed(page = 0) {
  const shop = readGameShop();
  const items = [...(shop.daily || []), ...(shop.weekly || []), ...(activeGameEvent() ? (shop.event || []) : [])].filter(Boolean);
  const start = page * 10;
  const lines = items.slice(start, start + 10).map((item, i) => `**${start + i + 1}.** ${item.name} — ${item.rarity}\n${item.type} • ${Math.max(1, Math.floor(Number(item.buyPrice || 100) * (1 - Number(shop.discount || 0))))} coin`);
  return gameBaseEmbed("🛒 Shop Hansip", `${lines.length ? lines.join("\n") : "Shop kosong, owner bisa refresh dari dashboard/auto manager."}\n\nGunakan tombol shop dari panel. Pembelian detail bisa dikembangkan dari dashboard tanpa reset data.`);
}

function missionEmbed(user) {
  const { player } = getGamePlayer(user);
  const quests = readGameQuests().filter(q => q.enabled !== false).slice(0, 10);
  const lines = quests.map(q => {
    const st = player.quests?.[q.id] || { progress: 0, claimed: false };
    return `• **${q.name}** — ${st.claimed ? "✅ selesai" : `${st.progress || 0}/${q.target}`}`;
  });
  return gameBaseEmbed("🎯 Misi Hansip", lines.join("\n") || "Belum ada misi.");
}

async function cmdGame(message) {
  if (!(await ensureGameChannelForMessage(message))) return;
  const embed = gameBaseEmbed("🎮 Hansip", "Klik tombol di bawah buat pilih mode game. Semua progress tersimpan otomatis dan data lama Hansip tetap aman.");
  return replyOt(message, { embeds: [embed], components: [gameModeSelect()] });
}
async function cmdGameProfile(message) { if (await ensureGameChannelForMessage(message)) return replyOt(message, { embeds: [gameProfileEmbed(message.author)] }); }
async function cmdGameInventory(message) { if (await ensureGameChannelForMessage(message)) return replyOt(message, { embeds: [inventoryEmbed(message.author)] }); }
async function cmdGameShop(message) { if (await ensureGameChannelForMessage(message)) return replyOt(message, { embeds: [shopEmbed(0)] }); }
async function cmdGameMission(message) { if (await ensureGameChannelForMessage(message)) return replyOt(message, { embeds: [missionEmbed(message.author)] }); }
async function cmdGameTop(message) { if (await ensureGameChannelForMessage(message)) return replyOt(message, { embeds: [leaderboardEmbed()] }); }
async function cmdGameEvent(message) { if (await ensureGameChannelForMessage(message)) { const ev = activeGameEvent(); return replyOt(message, { embeds: [gameBaseEmbed("📣 Event Hansip", ev ? `**${ev.name}**\n${ev.description || "Event aktif."}\nBerakhir <t:${Math.floor(ev.endsAt / 1000)}:R>.` : "Belum ada event aktif. Auto Event akan menjalankan event sesuai jadwal/random.")] }); } }

async function cmdGameDaily(message) {
  if (!(await ensureGameChannelForMessage(message))) return;
  const { player } = getGamePlayer(message.author);
  const today = todayKey();
  if (player.daily?.lastClaim === today) return replyOt(message, { content: "🎁 Daily reward hari ini sudah diambil. Besok ambil lagi ya." });
  const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" });
  const streak = player.daily?.lastClaim === yesterday ? Number(player.daily.streak || 0) + 1 : 1;
  const coin = 250 + streak * 25;
  const xp = 120 + streak * 10;
  player.coin += coin;
  player.xp += xp;
  player.energy = player.maxEnergy;
  player.daily = { lastClaim: today, streak };
  player.stats.daily = Number(player.stats?.daily || 0) + 1;
  checkAchievements(player);
  saveGamePlayer(message.author, player);
  return replyOt(message, { embeds: [gameBaseEmbed("🎁 Daily Reward", `✅ Kamu dapat **${coin} coin**, **${xp} XP**, dan energy penuh.\nStreak: **${streak} hari**.`)] });
}

async function cmdGameOwner(message) {
  const data = readGameData();
  const embed = gameBaseEmbed("👑 Owner Hansip", "Menu owner game. Semua command penting owner only dan tidak menampilkan secret.");
  embed.addFields(
    { name: "Channel", value: config.gameChannelId ? `<#${config.gameChannelId}>` : "Belum diatur", inline: true },
    { name: "Auto Event", value: config.gameAutoEventEnabled !== false ? "Aktif" : "Nonaktif", inline: true },
    { name: "Auto Manager", value: config.gameAutoManagerEnabled !== false ? "Aktif" : "Nonaktif", inline: true },
    { name: "Command", value: "`otsendpanel game`, `otupdatepanel game`, `otbackup`, `otcheckdata`, `otfixdata`, `otgivecoin @user 100`, `otgivexp @user 100`, `otgiveitem @user item_id 1`", inline: false },
    { name: "Event aktif", value: data.activeEvent ? data.activeEvent.name : "Tidak ada", inline: false }
  );
  return replyOt(message, { embeds: [embed] });
}

async function cmdGameGive(message, args, type) {
  const member = message.mentions.members.first();
  if (!member) return replyOt(message, { content: `⚠️ Format kurang tepat. Contoh: \`otgive${type} @user 100\`` });
  const amount = Math.max(1, Number(args.find(a => /^\d+$/.test(a)) || 0));
  if (!amount) return replyOt(message, { content: `⚠️ Jumlah harus angka. Contoh: \`otgive${type} @user 100\`` });
  const { player } = getGamePlayer(member.user);
  if (type === "coin") player.coin += amount;
  if (type === "xp") { player.xp += amount; player.level = calcGameLevel(player.xp); }
  saveGamePlayer(member.user, player);
  return replyOt(message, { content: `✅ Berhasil memberi **${amount} ${type}** ke ${member}. Data tersimpan aman.` });
}

async function cmdGameGiveItem(message, args) {
  const member = message.mentions.members.first();
  const itemId = args.find(a => !a.includes("<@") && !/^\d+$/.test(a));
  const amount = Math.max(1, Number(args.find(a => /^\d+$/.test(a)) || 1));
  if (!member || !itemId) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otgiveitem @user energy_drink_tulus 1`" });
  const item = readGameItems().find(x => x.id === itemId || slugText(x.name) === itemId);
  if (!item) return replyOt(message, { content: "❌ Item tidak ditemukan di catalog. Cek dashboard Hansip > Item Catalog." });
  const { player } = getGamePlayer(member.user);
  addItemToPlayer(player, item.id, amount);
  saveGamePlayer(member.user, player);
  return replyOt(message, { content: `✅ ${member} menerima **${item.name} x${amount}**. Data lama tetap aman.` });
}

async function cmdGameResetUser(message) {
  const member = message.mentions.members.first();
  if (!member) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otresetuser @user confirm`" });
  if (!message.content.toLowerCase().includes("confirm")) return replyOt(message, { content: "⚠️ Reset user butuh konfirmasi: `otresetuser @user confirm`. Backup game dibuat dulu." });
  createGameBackup("pre-reset-user");
  const players = readGamePlayers();
  players[member.id] = defaultPlayer(member.user);
  writeGamePlayers(players);
  return replyOt(message, { content: `✅ Data game ${member} direset dengan backup dulu. Data fitur lama Hansip tidak disentuh.` });
}

function gameDataHealth() {
  ensureGameFiles();
  return {
    players: Object.keys(readGamePlayers()).length,
    items: readGameItems().length,
    quests: readGameQuests().length,
    achievements: readGameAchievements().length,
    leaderboard: refreshGameLeaderboard().length,
    activeEvent: activeGameEvent()?.name || "Tidak ada"
  };
}

async function cmdGameCheckData(message) {
  const h = gameDataHealth();
  return replyOt(message, { embeds: [gameBaseEmbed("🧪 Check Data Hansip", `Players: **${h.players}**\nItems: **${h.items}**\nQuests: **${h.quests}**\nAchievements: **${h.achievements}**\nLeaderboard: **${h.leaderboard}**\nEvent: **${h.activeEvent}**\n\n🛡️ Data lama Hansip tidak disentuh.`)] });
}

async function cmdGameFixData(message) {
  ensureGameFiles();
  const players = readGamePlayers();
  for (const [id, p] of Object.entries(players)) {
    players[id] = deepMerge(defaultPlayer({ id, username: p.username || "Warga OT" }), p);
    players[id].level = calcGameLevel(players[id].xp || 0);
    players[id].energy = Math.min(players[id].maxEnergy || 100, Math.max(0, Number(players[id].energy || 0)));
  }
  writeGamePlayers(players);
  if (!readGameItems().length) writeGameItems(generateItemCatalog());
  if (!readGameQuests().length) writeGameJson(GAME_QUESTS_FILE, generateQuestCatalog());
  if (!readGameAchievements().length) writeGameJson(GAME_ACHIEVEMENTS_FILE, generateAchievementCatalog());
  refreshGameLeaderboard(players);
  return replyOt(message, { content: "✅ Hansip data sudah dicek dan diperbaiki aman. Backup rusak otomatis disimpan kalau ada file corrupt." });
}

function createGameBackup(reason = "auto") {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const backup = {
    meta: { app: "Hansip", reason, createdAt: new Date().toISOString(), build: OT_GAME_BUILD_VERSION, note: "Tidak menyertakan .env/token/secret." },
    game: {
      data: readGameData(), players: readGamePlayers(), items: readGameItems(), shop: readGameShop(), events: readGameEvents(), quests: readGameQuests(), achievements: readGameAchievements(), leaderboard: refreshGameLeaderboard()
    }
  };
  const fileName = `ot-game-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
  writeGameJson(GAME_BACKUP_FILE, { lastBackupAt: backup.meta.createdAt, fileName, reason });
  const data = readGameData();
  data.lastBackupAt = backup.meta.createdAt;
  writeGameData(data);
  return { fileName, filePath };
}

function refreshGameShop(reason = "auto") {
  const items = readGameItems();
  const shop = defaultShopData(items.sort(() => Math.random() - 0.5));
  const ev = activeGameEvent();
  shop.discount = ev?.reward?.shopDiscount || 0;
  shop.reason = reason;
  writeGameShop(shop);
  const data = readGameData();
  data.lastShopRefresh = new Date().toISOString();
  writeGameData(data);
  return shop;
}

async function startRandomGameEvent(reason = "auto") {
  if (config.gameAutoEventEnabled === false) return null;
  const data = readGameData();
  const current = activeGameEvent();
  if (current) return current;
  const events = readGameEvents().filter(e => e.enabled !== false);
  const event = events[Math.floor(Math.random() * events.length)] || OT_GAME_EVENTS[0];
  const duration = Number(config.gameAutoEventDurationMinutes || 120) * 60 * 1000;
  data.activeEvent = { ...event, startedAt: Date.now(), endsAt: Date.now() + duration, reason };
  data.activity = [{ title: "Event mulai", message: `${event.name} aktif otomatis.`, time: new Date().toISOString() }, ...(data.activity || [])].slice(0, 40);
  writeGameData(data);
  if (config.gameAutoAnnouncement !== false && config.gameChannelId) {
    const channel = await client.channels.fetch(config.gameChannelId).catch(() => null);
    if (channel?.send) {
      const embed = gameBaseEmbed(`📣 ${event.name}`, `${event.description}\n\nEvent berakhir <t:${Math.floor(data.activeEvent.endsAt / 1000)}:R>.`);
      if (config.gameBannerEnabled !== false && config.gameEventBannerUrl) embed.setImage(config.gameEventBannerUrl);
      await channel.send({ embeds: [embed] }).catch(() => null);
    }
  }
  if (config.gameAutoPanelRefreshOnEvent !== false) await refreshGamePanelSilently().catch(() => null);
  return data.activeEvent;
}

async function refreshGamePanelSilently() {
  if (!config.gameChannelId || !config.gamePanelMessageId) return false;
  const channel = await client.channels.fetch(config.gameChannelId).catch(() => null);
  const msg = await channel?.messages?.fetch(config.gamePanelMessageId).catch(() => null);
  if (!msg) return false;
  const ev = activeGameEvent();
  const embed = gameBaseEmbed("🎮 Hansip", `Panel otomatis diperbarui.\nEvent aktif: ${ev ? `**${ev.name}**` : "Belum ada."}\nKlik tombol buat main, cek profil, shop, misi, daily, pet, raid, dan leaderboard.`);
  await msg.edit({ embeds: [embed], components: gamePanelComponents() }).catch(() => null);
  return true;
}

function autoRegenEnergy() {
  if (config.gameAutoEnergyRegen === false) return;
  const players = readGamePlayers();
  let changed = false;
  for (const p of Object.values(players)) {
    const max = Number(p.maxEnergy || 100);
    const before = Number(p.energy || 0);
    p.energy = Math.min(max, before + Number(config.gameEnergyRegenAmount || 5));
    if (p.energy !== before) changed = true;
  }
  if (changed) writeGamePlayers(players);
}

function cleanupGameSessions() {
  const data = readGameData();
  const now = Date.now();
  for (const [key, val] of Object.entries(data.sessions || {})) {
    if (now - Number(val.updatedAt || 0) > 30 * 60 * 1000) delete data.sessions[key];
  }
  if (data.boss?.active && data.boss.endsAt && data.boss.endsAt < now) data.boss.active = false;
  writeGameData(data);
}

async function startGameAutoManager() {
  ensureGameFiles();
  if (config.gameAutoManagerEnabled === false) {
    console.log("🎮 Hansip Auto Manager nonaktif dari config. Data file tetap disiapkan aman.");
    return;
  }
  if (gameManagerStarted) return;
  gameManagerStarted = true;
  setInterval(() => {
    try { activeGameEvent(); cleanupGameSessions(); if (config.gameAutoLeaderboardUpdate !== false) refreshGameLeaderboard(); } catch (e) { gameModuleErrors.set("loop", e.message); }
  }, 5 * 60 * 1000);
  setInterval(() => { try { autoRegenEnergy(); } catch (e) { gameModuleErrors.set("energy", e.message); } }, Math.max(1, Number(config.gameEnergyRegenMinutes || 15)) * 60 * 1000);
  setInterval(() => { try { if (config.gameAutoShopRefresh !== false) refreshGameShop("auto"); } catch (e) { gameModuleErrors.set("shop", e.message); } }, 60 * 60 * 1000);
  setInterval(() => { try { if (config.gameAutoBackup !== false) createGameBackup("auto"); } catch (e) { gameModuleErrors.set("backup", e.message); } }, Math.max(1, Number(config.gameAutoBackupEveryHours || 6)) * 60 * 60 * 1000);
  setInterval(() => { startRandomGameEvent("random-timer").catch(e => gameModuleErrors.set("event", e.message)); }, 2 * 60 * 60 * 1000);
  console.log("🎮 Hansip Auto Manager aktif. Data game aman dan terpisah dari data lama.");
}

async function handleGameInteraction(interaction) {
  if (!interaction.isButton() && !interaction.isStringSelectMenu()) return false;
  const id = interaction.customId || "";
  if (!id.startsWith("game_")) return false;
  if (!(await ensureGameChannelForInteraction(interaction))) return true;
  if (interaction.isStringSelectMenu() && id === "game_mode_select") {
    const mode = OT_GAME_MODES.find(m => m.id === interaction.values[0]);
    if (!mode) return interaction.reply({ content: "❌ Mode tidak ditemukan.", flags: MessageFlags.Ephemeral }).catch(() => null), true;
    const embed = gameBaseEmbed(`${mode.emoji} ${mode.name}`, `${mode.desc}\n\nPilih aksi. Reward akan otomatis masuk ke XP, coin, item, quest, achievement, dan leaderboard.`);
    await interaction.reply({ embeds: [embed], components: gameActionRows(mode.id), flags: MessageFlags.Ephemeral }).catch(() => null);
    return true;
  }
  if (interaction.isButton()) {
    if (id === "game_main" || id === "game_refresh") {
      await interaction.reply({ embeds: [gameBaseEmbed("🎮 Pilih Mode Game", "Pilih salah satu mode di menu bawah. Semua mode memakai reward, cooldown, quest, item, dan leaderboard yang sama-sama rapi.")], components: [gameModeSelect()], flags: MessageFlags.Ephemeral }).catch(() => null);
      return true;
    }
    if (id === "game_profile") return interaction.reply({ embeds: [gameProfileEmbed(interaction.user)], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_inventory") return interaction.reply({ embeds: [inventoryEmbed(interaction.user)], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_shop") return interaction.reply({ embeds: [shopEmbed(0)], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_daily") { await fakeMessageCommandFromInteraction(interaction, cmdGameDaily); return true; }
    if (id === "game_mission") return interaction.reply({ embeds: [missionEmbed(interaction.user)], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_top") return interaction.reply({ embeds: [leaderboardEmbed()], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_event") { const ev = activeGameEvent(); return interaction.reply({ embeds: [gameBaseEmbed("📣 Event Hansip", ev ? `**${ev.name}**\n${ev.description}\nBerakhir <t:${Math.floor(ev.endsAt / 1000)}:R>.` : "Belum ada event aktif.")], flags: MessageFlags.Ephemeral }).catch(() => null), true; }
    if (id === "game_map") return interaction.reply({ embeds: [gameBaseEmbed("🗺️ Map Hansip", OT_GAME_MODES.map(m => `${m.emoji} **${m.name}**`).slice(0, 15).join("\n"))], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id === "game_pet") return runGameAction(interaction, "pet", "safe");
    if (id === "game_raid") return runGameAction(interaction, "raid", "play");
    if (id === "game_tutorial") return interaction.reply({ embeds: [gameBaseEmbed("⚙️ Tutorial Hansip", "1. Main hanya di channel game.\n2. Klik **Main Game**.\n3. Pilih mode.\n4. Tekan aksi.\n5. Reward otomatis masuk.\n6. Daily, shop, quest, event, dan leaderboard berjalan otomatis.")], flags: MessageFlags.Ephemeral }).catch(() => null), true;
    if (id.startsWith("game_action:")) {
      const [, modeId, action] = id.split(":");
      return runGameAction(interaction, modeId, action);
    }
  }
  return false;
}

async function fakeMessageCommandFromInteraction(interaction, fn) {
  const fake = {
    guild: interaction.guild,
    channel: interaction.channel,
    channelId: interaction.channelId,
    author: interaction.user,
    member: interaction.member,
    content: "",
    reply: (payload) => interaction.reply({ ...(typeof payload === "string" ? { content: payload } : payload), flags: MessageFlags.Ephemeral }).catch(() => null)
  };
  return fn(fake);
}

async function cmdGameBackup(message) {
  ensureGameFiles();
  const backup = { at: new Date().toISOString(), data: readGameData(), playersCount: Object.keys(readGamePlayers()).length, itemsCount: readGameItems().length, safe: true, note: "Tidak menyertakan .env/token/MongoDB URI/password." };
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const file = path.join(BACKUP_DIR, `adventure-hub-backup-${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(backup, null, 2));
  return replyOt(message, { content: `💾 Backup game dibuat aman: ${path.basename(file)}\n🛡️ Tidak menyertakan .env/token/secret.` });
}

function dashboardGameHubHtml() {
  ensureGameFiles();
  const health = gameDataHealth();
  const itemPreview = readGameItems().slice(0, 16).map(item => `<div class="list-row item-row" data-item="${htmlEscape(item.name + ' ' + item.type + ' ' + item.rarity)}"><div><b>${htmlEscape(item.name)}</b><span class="note"><br>${htmlEscape(item.type)} • ${htmlEscape(item.rarity)} • ${htmlEscape(item.id)}</span></div><span class="chip ok">${htmlEscape(String(item.buyPrice || 0))}</span></div>`).join("");
  const catPreview = ADVENTURE_100_CATEGORIES.map(cat => `<div class="list-row category-row" data-category="${htmlEscape(cat.title + ' ' + cat.command + ' ' + cat.description)}"><div><b>${cat.number}. ${htmlEscape(cat.title)}</b><span class="note"><br><code>${htmlEscape(cat.command)}</code> — ${htmlEscape(cat.description)}</span></div><span class="chip ${config.gameDisabledModules?.includes(cat.id) ? "warn" : "ok"}">${config.gameDisabledModules?.includes(cat.id) ? "Off" : "On"}</span></div>`).join("");
  const modePreview = OT_GAME_MODES.map(m => `<div class="list-row"><div><b>${m.emoji} ${htmlEscape(m.name)}</b><span class="note"><br>${htmlEscape(m.desc)}</span></div><span class="chip ${config.gameDisabledModes?.includes(m.id) ? "warn" : "ok"}">${config.gameDisabledModes?.includes(m.id) ? "Off" : "On"}</span></div>`).join("");
  return dashboardSaveForm("game", [
    dashboardInput("gameName", "Nama Game"),
    dashboardInput("gameEnabled", "Hansip Aktif", { type: "checkbox", wide: true }),
    dashboardInput("gameChannelId", "Channel Game"),
    dashboardInput("gameLogChannelId", "Channel Log Game"),
    dashboardInput("gamePrefixName", "Nama Panel Game"),
    dashboardInput("gamePanelMessageId", "Panel Message ID"),
    dashboardInput("gameCooldownMs", "Cooldown Game MS", { type: "number" }),
    dashboardInput("gameCommandPrefix", "Prefix Command"),
    dashboardInput("gameCommandMainMode", "Gameplay utama pakai command", { type: "checkbox" }),
    dashboardInput("gameButtonsForConfirmationOnly", "Tombol hanya konfirmasi", { type: "checkbox" }),
    dashboardInput("gameEmbedColor", "Warna Embed Biru OT", { type: "color" }),
    dashboardInput("gameEmbedAccent", "Accent Embed", { type: "color" }),
    dashboardInput("gameRiskModeEnabled", "Risk Challenge Aktif", { type: "checkbox" }),
    dashboardInput("gameRealMoneyDisabled", "Real Money Disabled", { type: "checkbox" }),
    dashboardInput("gameHumorEnabled", "Humor Engine Aktif", { type: "checkbox" }),
    dashboardInput("gameChaosEnabled", "Chaos Meter Aktif", { type: "checkbox" }),
    dashboardInput("gamePerformanceMode", "Performance Mode"),
    dashboardInput("gameHeavyFeaturesEnabled", "Full Premium Features", { type: "checkbox" }),
    dashboardInput("gameAutoCleanupEnabled", "Auto Cleanup", { type: "checkbox" }),
    dashboardInput("gameAutoEventEnabled", "Auto Event Aktif", { type: "checkbox" }),
    dashboardInput("gameAutoManagerEnabled", "Auto Manager Aktif", { type: "checkbox" }),
    dashboardInput("gameAutoEventTimes", "Jam Auto Event", { type: "textarea", wide: true }),
    dashboardInput("gameAutoEventDurationMinutes", "Durasi Event Menit", { type: "number" }),
    dashboardInput("gameBossAutoSpawn", "Boss Auto Spawn", { type: "checkbox" }),
    dashboardInput("gameAutoAnnouncement", "Auto Announcement Event", { type: "checkbox" }),
    dashboardInput("gameAutoPanelRefreshOnEvent", "Auto Refresh Panel Saat Event", { type: "checkbox" }),
    dashboardInput("gameAutoEnergyRegen", "Auto Regen Energy", { type: "checkbox" }),
    dashboardInput("gameEnergyRegenMinutes", "Menit Regen Energy", { type: "number" }),
    dashboardInput("gameEnergyRegenAmount", "Jumlah Regen Energy", { type: "number" }),
    dashboardInput("gameAutoShopRefresh", "Auto Refresh Shop", { type: "checkbox" }),
    dashboardInput("gameAutoBackup", "Auto Backup Game", { type: "checkbox" }),
    dashboardInput("gameAutoBackupEveryHours", "Auto Backup Tiap Jam", { type: "number" }),
    dashboardInput("gameRiskDailyLimit", "Risk Daily Limit", { type: "number" }),
    dashboardInput("gameLuckyDailyLimit", "Lucky Daily Limit", { type: "number" }),
    dashboardInput("gameBannerEnabled", "Banner Game Aktif", { type: "checkbox" }),
    dashboardInput("gameMainBannerUrl", "URL Banner Panel", { wide: true }),
    dashboardInput("gameEventBannerUrl", "URL Banner Event", { wide: true }),
    dashboardInput("gameDisabledModes", "Mode Dimatikan", { type: "textarea", wide: true }),
    dashboardInput("gameDisabledModules", "Module/Kategori Dimatikan", { type: "textarea", wide: true })
  ].join(""), "🎮 Hansip Ultimate Premium") + `<div class="panel"><h3>📡 Auto System Status</h3><div class="status-grid"><div><b>Players</b><span>${health.players}</span></div><div><b>Items</b><span>${health.items}</span></div><div><b>Quests</b><span>${health.quests}</span></div><div><b>Achievements</b><span>${health.achievements}</span></div><div><b>100 Category</b><span>${ADVENTURE_100_CATEGORIES.length}</span></div><div><b>Event</b><span>${htmlEscape(health.activeEvent)}</span></div><div><b>Build</b><span>${OT_GAME_BUILD_VERSION}</span></div><div><b>No Real Money</b><span>${config.gameRealMoneyDisabled !== false ? "Aktif" : "Cek"}</span></div></div></div><div class="panel"><div class="panel-title"><div><h3>💎 100 Category View</h3><p>Cari kategori, command, module, atau fitur. Ini hanya dashboard view, secret tidak ditampilkan.</p></div><span class="chip ok">Biru DESA TULUS</span></div><input class="raw" style="min-height:auto" placeholder="Cari kategori, contoh: risk / pet / dungeon / market" oninput="document.querySelectorAll('.category-row').forEach(function(row){row.style.display=row.dataset.category.toLowerCase().includes(event.target.value.toLowerCase())?'flex':'none'})"><div class="list" style="margin-top:12px">${catPreview}</div></div><div class="panel"><h3>🎮 Mode Game</h3><div class="list">${modePreview}</div></div><div class="panel"><h3>🎒 Item Catalog Preview</h3><input class="raw" style="min-height:auto" placeholder="Search item" oninput="document.querySelectorAll('.item-row').forEach(function(row){row.style.display=row.dataset.item.toLowerCase().includes(event.target.value.toLowerCase())?'flex':'none'})"><div class="list" style="margin-top:12px">${itemPreview}</div><p class="note">Catalog penuh ada di <code>data/game-items.json</code>. Seed awal generator mendukung ratusan item tanpa hardcode berantakan.</p></div>`;
}


/* =========================
   OT COMMAND CENTER
   Command utama: othelp, otping, otpanel, otstatus, otbackup
   Permission aman: member / staff / owner
========================= */
const OT_COMMAND_BUILD_VERSION = "OT_COMMAND_CENTER_ADVENTURE_ULTIMATE_2026_06_08";
const OT_LEGACY_ALIASES = {
  "!help": "othelp",
  "!ping": "otping",
  "!panel": "otpanel",
  "!status": "otstatus",
  "!backup": "otbackup",
  "!game": "otgame",
  "!daily": "otdaily",
  "!shop": "otshop"
};

const OT_COMMANDS = [
  { name: "othelp", category: "member", permission: "member", usage: "othelp", description: "Melihat bantuan command sesuai permission kamu.", aliases: ["!help"] },
  { name: "otping", category: "member", permission: "member", usage: "otping", description: "Cek ping Hansip.", aliases: ["!ping"] },
  { name: "otinfo", category: "member", permission: "member", usage: "otinfo", description: "Info ringan tentang Hansip dan server." },
  { name: "otafk", category: "member", permission: "member", usage: "otafk lagi makan", description: "Mengatur status AFK sendiri." },
  { name: "otmabar", category: "member", permission: "member", usage: "otmabar", description: "Membuka menu Cari Mabar." },
  { name: "otsaran", category: "member", permission: "member", usage: "otsaran isi saran kamu", description: "Mengirim saran dengan cooldown aman." },
  { name: "otgame", category: "member", permission: "member", usage: "otgame", description: "Membuka menu utama Hansip." },
  { name: "otprofile", category: "member", permission: "member", usage: "otprofile", description: "Melihat profil Hansip sendiri." },
  { name: "otdaily", category: "member", permission: "member", usage: "otdaily", description: "Ambil daily reward Hansip." },
  { name: "otshop", category: "member", permission: "member", usage: "otshop", description: "Melihat shop Hansip." },
  { name: "otinventory", category: "member", permission: "member", usage: "otinventory", description: "Melihat inventory game sendiri." },
  { name: "otmission", category: "member", permission: "member", usage: "otmission", description: "Melihat misi/quest Hansip." },
  { name: "ottop", category: "member", permission: "member", usage: "ottop", description: "Melihat leaderboard Hansip." },
  { name: "otevent", category: "member", permission: "member", usage: "otevent", description: "Melihat event aktif Hansip." },
  { name: "otstaff", category: "staff", permission: "staff", usage: "otstaff", description: "Menu operasional staff Hansip." },
  { name: "otcekfitur", category: "staff", permission: "staff", usage: "otcekfitur", description: "Cek status fitur tanpa mengubah setting." },
  { name: "otcekpanel", category: "staff", permission: "staff", usage: "otcekpanel", description: "Cek status panel dan anti-spam panel." },
  { name: "otkirimpanel", category: "staff", permission: "staffPanel", usage: "otkirimpanel mabar", description: "Kirim ulang panel tertentu jika owner mengizinkan." },
  { name: "otstatus", category: "owner", permission: "owner", usage: "otstatus", description: "Status lengkap bot, dashboard, storage, fitur, dan backup.", aliases: ["!status"] },
  { name: "otreload", category: "owner", permission: "owner", usage: "otreload", description: "Reload config tanpa reset data." },
  { name: "otbackup", category: "owner", permission: "owner", usage: "otbackup", description: "Buat backup aman tanpa .env/token.", aliases: ["!backup"] },
  { name: "otrestore", category: "owner", permission: "owner", usage: "otrestore confirm nama-file-backup.json", description: "Restore backup dengan konfirmasi dan pre-backup." },
  { name: "otpanel", category: "owner", permission: "ownerOrStaffPanel", usage: "otpanel status | otpanel mabar | otpanel help", description: "Mengatur dan mengirim panel Hansip.", aliases: ["!panel"] },
  { name: "otsetchannel", category: "owner", permission: "owner", usage: "otsetchannel mabar #channel", description: "Mengatur channel fitur." },
  { name: "otsetrole", category: "owner", permission: "owner", usage: "otsetrole staff @role", description: "Mengatur role fitur." },
  { name: "otfitur", category: "owner", permission: "owner", usage: "otfitur afk on", description: "Mengaktifkan atau menonaktifkan fitur." },
  { name: "otmaintenance", category: "owner", permission: "owner", usage: "otmaintenance on | off", description: "Mode maintenance tanpa mematikan bot total." },
  { name: "otowner", category: "owner", permission: "owner", usage: "otowner", description: "Menu owner Hansip." },
  { name: "otsendpanel", category: "owner", permission: "owner", usage: "otsendpanel game", description: "Kirim panel Hansip." },
  { name: "otupdatepanel", category: "owner", permission: "owner", usage: "otupdatepanel game", description: "Update panel lama Hansip tanpa spam." },
  { name: "otsetlog", category: "owner", permission: "owner", usage: "otsetlog game #channel", description: "Set channel log Hansip." },
  { name: "otgivecoin", category: "owner", permission: "owner", usage: "otgivecoin @user 100", description: "Memberi coin game ke user." },
  { name: "otgivexp", category: "owner", permission: "owner", usage: "otgivexp @user 100", description: "Memberi XP game ke user." },
  { name: "otgiveitem", category: "owner", permission: "owner", usage: "otgiveitem @user item_id 1", description: "Memberi item catalog ke user." },
  { name: "otresetuser", category: "owner", permission: "owner", usage: "otresetuser @user confirm", description: "Reset data game satu user dengan backup dulu." },
  { name: "otcheckdata", category: "owner", permission: "owner", usage: "otcheckdata", description: "Cek kesehatan data Hansip." },
  { name: "otfixdata", category: "owner", permission: "owner", usage: "otfixdata", description: "Perbaiki data game kosong/corrupt secara aman." }
];

const OT_COMMAND_MAP = new Map(OT_COMMANDS.map(cmd => [cmd.name, cmd]));


const ADVENTURE_ULTIMATE_MEMBER_COMMANDS = [
  ["otstart","otstart","Membuat profile game, starter reward, dan tutorial singkat."],
  ["otmap","otmap","Melihat world map Hansip."],
  ["othunt","othunt forest","Mulai adventure/hunt command-based."],
  ["otbattle","otbattle start","Battle command-based dengan win/lose lucu."],
  ["otdungeon","otdungeon list","Dungeon command-based."],
  ["otraid","otraid join","Raid boss command-based."],
  ["otpet","otpet","Pet system hidup."],
  ["otcraft","otcraft","Crafting ringan."],
  ["otupgrade","otupgrade gear item","Upgrade station."],
  ["otseason","otseason","Season progress dan reward."],
  ["otcollection","otcollection","Collection book premium."],
  ["otguild","otguild","Guild/team system."],
  ["otstory","otstory","Story mode Hansip."],
  ["otbasecamp","otbasecamp","Basecamp pribadi."],
  ["otfarm","otfarm","Farm side activity."],
  ["otfish","otfish","Fishing side activity."],
  ["otcook","otcook","Cooking chaos."],
  ["otrace","otrace","Racing lucu aman."],
  ["otexpedition","otexpedition","Ekspedisi otomatis."],
  ["ottraining","ottraining","Training ringan."],
  ["otmarket","otmarket","Market item game aman."],
  ["otrank","otrank","Cek rank Hansip."],
  ["otrisk","otrisk normal","Risk challenge aman tanpa uang asli."],
  ["otchance","otchance","Chance info aman."],
  ["otlucky","otlucky daily","Lucky challenge aman."],
  ["otchallenge","otchallenge board","Challenge board."],
  ["otchaos","otchaos status","Chaos meter lucu."],
  ["otsurprise","otsurprise","Daily surprise."],
  ["otproject","otproject","Community project."],
  ["otcompliment","otcompliment @user","Pujian lucu aman."],
  ["otroast","otroast @user","Roast ringan non-toxic."],
  ["ottitleme","ottitleme","Random title harian."],
  ["otvibe","otvibe","Vibe check."],
  ["otprogress","otprogress","Progress tracker."],
  ["otroutine","otroutine","Smart daily routine."],
  ["otcomeback","otcomeback","Comeback quest."],
  ["otframe","otframe","Profile frame."],
  ["otclass","otclass","Class system."],
  ["otskill","otskill","Skill system."],
  ["otenergy","otenergy","Cek energy."],
  ["othp","othp","Cek HP."],
  ["otrest","otrest","Istirahat pulihkan HP/energy."],
  ["otrepair","otrepair","Repair gear."],
  ["otgear","otgear","Gear info."],
  ["otrecipe","otrecipe","Recipe book."],
  ["otweather","otweather","Weather system."],
  ["otnpc","otnpc","NPC relationship dan quest."],
  ["otbank","otbank","Bank coin game aman."],
  ["otauction","otauction","Auction coin game aman."],
  ["otmilestone","otmilestone","Server milestone reward."],
  ["otachievement","otachievement list","Achievement progress."],
  ["ottitle","ottitle list","Title system."],
  ["ottournament","ottournament","Tournament mingguan."],
  ["otparty","otparty create","Party system."],
  ["ottrade","ottrade @user","Trade aman dengan konfirmasi."],
  ["otgift","otgift @user item","Gift item aman."],
  ["otgiftcoin","otgiftcoin @user 100","Gift coin game dengan limit."],
  ["otmentor","otmentor @user","Mentor newbie bonus."],
  ["otinsurance","otinsurance","Insurance item ringan."],
  ["otset","otset info","Gear set bonus."],
  ["ottutorial","ottutorial","Tutorial bertahap."],
  ["otbuy","otbuy item_id","Beli item shop dengan coin game."],
  ["otsell","otsell item_id","Jual item game."],
  ["otquest","otquest daily","Alias quest dari otmission."],
  ["otquest claim","otquest claim","Claim quest jika tersedia."],
  ["otroutine","otroutine","Checklist aktivitas harian."],
  ["otpanel","otpanel","Panel panduan Hansip dan Hansip."]
].map(([name, usage, description]) => ({ name, category: "member", permission: "member", usage, description }));

const ADVENTURE_ULTIMATE_OWNER_COMMANDS = [
  ["otstartevent","otstartevent double_xp","Mulai event game manual."],
  ["otstopevent","otstopevent","Stop event game aktif."],
  ["otspawnboss","otspawnboss","Spawn boss Hansip."],
  ["otseasonstart","otseasonstart Blue Tulus Week","Start season."],
  ["otseasonend","otseasonend","End season."],
  ["otforcebackup","otforcebackup","Paksa backup game."],
  ["otcleansession","otcleansession","Cleanup session lama."],
  ["otdisablemodule","otdisablemodule risk","Matikan module game."],
  ["otenablemodule","otenablemodule risk","Aktifkan module game."],
  ["otdebuggame","otdebuggame","Debug aman tanpa secret."],
  ["otgamelog","otgamelog latest","Log game aman."],
  ["otchaos reset","otchaos reset","Reset chaos meter."],
  ["otchaos event","otchaos event","Trigger chaos event."],
  ["otchaos set","otchaos set 50","Set chaos meter."]
].map(([name, usage, description]) => ({ name: name.split(" ")[0], category: "owner", permission: "owner", usage, description }));

for (const cmd of [...ADVENTURE_ULTIMATE_MEMBER_COMMANDS, ...ADVENTURE_ULTIMATE_OWNER_COMMANDS]) {
  if (!OT_COMMAND_MAP.has(cmd.name)) {
    OT_COMMANDS.push(cmd);
    OT_COMMAND_MAP.set(cmd.name, cmd);
  }
}

const ADVENTURE_GENERIC_COMMANDS = new Set(ADVENTURE_ULTIMATE_MEMBER_COMMANDS.map(c => c.name));
const ADVENTURE_GENERIC_OWNER_COMMANDS = new Set(ADVENTURE_ULTIMATE_OWNER_COMMANDS.map(c => c.name));


/* =========================
   Hansip — HANSIP DESA TULUS ROYALE
   Collection game system, one channel only, command-based.
   Data is isolated: oto-players/items/npcs/assets. Old Hansip data is never reset.
========================= */
const OTO_BUILD_VERSION = "OTO_BLACKJACK_ALLIN_OTCF_FIX_V1_27_0_2026_06_08";

const OTO_RARITIES = [
  { key: "common", emoji: "<:LetterC:1513669277759176704>", npcEmoji: ":slight_smile:", name: "Common", weight: 55, color: "#C9D4E6" },
  { key: "uncommon", emoji: "<:PastelGreenU:1513669101640482907>", npcEmoji: ":sunglasses:", name: "Uncommon", weight: 25, color: "#43E58A" },
  { key: "rare", emoji: "<:PurpleR:1513668875189878785>", npcEmoji: ":nerd:", name: "Rare", weight: 12, color: "#38D5FF" },
  { key: "epic", emoji: "<:letter_E:1513668672609189888>", npcEmoji: ":disguised_face:", name: "Epic", weight: 5, color: "#A855F7" },
  { key: "legendary", emoji: "<a:LetterM:1513668125638398262>", npcEmoji: ":crown:", name: "Legendary", weight: 2, color: "#FFD166" },
  { key: "mythic", emoji: "<a:LetterM:1513668125638398262>", npcEmoji: ":mage:", name: "Mythic", weight: 0.8, color: "#FF5F7A" },
  { key: "secret", emoji: "<a:Alphabet_S:1513667784519712769>", npcEmoji: ":bust_in_silhouette:", name: "Secret", weight: 0.2, color: "#00E5FF" },
  { key: "limited", emoji: "<:glowing_dot_blue:1513670991056736408>", npcEmoji: "<:glowing_dot_blue:1513670991056736408>", name: "Hansip Limited", weight: 0, color: "#0B5CFF" }
];
const OTO_RARITY_KEYS = OTO_RARITIES.map(r => r.key);
const OTO_VARIANTS = [
  { key: "normal", emoji: "", name: "Normal", chance: 91.2, bonus: 1 },
  { key: "neon", emoji: "✨", name: "Neon", chance: 5, bonus: 1.04 },
  { key: "shiny_blue", emoji: "💎", name: "Shiny Blue", chance: 2, bonus: 1.07 },
  { key: "glitch", emoji: "🌀", name: "Glitch", chance: 1, bonus: 1.10 },
  { key: "royal", emoji: "👑", name: "Royal", chance: 0.5, bonus: 1.13 },
  { key: "shadow", emoji: "🌑", name: "Shadow", chance: 0.3, bonus: 1.16 },
  { key: "limited_event", emoji: "💠", name: "Limited Event", chance: 0, bonus: 1.20 }
];
const OTO_BANNER_KEYS = ["oto-panel","oto-hunt","oto-battle","oto-crate","oto-shop","oto-top","oto-luck","oto-royale","oto-card","oto-daily","oto-quest","oto-inventory"];
const OTO_SYNERGIES = [
  { key: "blue_core", name: "Blue Core Synergy", elements: ["Blue Core"], need: 3, bonusPower: 0.08, desc: "+8% battle power" },
  { key: "warung", name: "Warung Squad", elements: ["Warung"], need: 3, bonusCoin: 0.10, desc: "+10% coin battle reward" },
  { key: "chaos", name: "Chaos Team", elements: ["Chaos"], need: 3, bonusPower: 0.04, desc: "chance funny critical" },
  { key: "royal", name: "Royal Team", rarities: ["legendary","mythic","secret","limited"], need: 2, bonusExp: 0.05, desc: "+5% EXP NPC" },
  { key: "pet_luck", name: "Pet Luck Team", elements: ["Pet","Luck"], need: 2, bonusCrate: 0.05, desc: "+5% crate chance kecil" }
];
const OTO_ELEMENTS = ["Neon", "Blue Core", "Warung", "Chaos", "Cyber", "Tulus", "Royal", "Secret", "AFK", "Dungeon", "Market", "Pet", "Luck", "Boss", "Event"];
const OTO_SKILLS = ["Tagihan Mendadak", "Royal Neon Strike", "Sendal Counter", "Es Teh Blessing", "Ping Shock", "Cooldown Break", "Gorengan Shield", "AFK Vanish", "Blue Core Burst", "Warung Heal", "Chaos Laugh", "Dungeon Slash", "Market Discount Aura", "Pet Call", "Lucky Flip", "Secret Lock", "Owner Dimension", "Anti Reset Barrier", "Neon Tax", "Rule Keeper"];
const OTO_HUMOR_HUNT = [
  "Kamu nemu NPC di balik warung. Dia bilang cuma lewat, tapi kok bawa crate.",
  "NPC muncul dari gang neon sambil pura-pura sibuk.",
  "Kamu hampir dapat Secret, tapi semesta bilang: sabar dulu bang.",
  "Kucing Pajak datang membawa invoice. Semua warga langsung pura-pura AFK.",
  "Gang neon terasa tenang, sampai ada ayam lewat bawa aura boss."
];
const OTO_HUMOR_CRATE = [
  "Crate kebuka pelan... isinya bukan harapan kosong, lumayan.",
  "Cahaya biru keluar dari crate. Warga sekitar langsung mode kepo.",
  "Drop-nya belum sultan, tapi setidaknya bukan sendal sebelah.",
  "Crate ini dibuka dengan doa dan sedikit rasa deg-degan."
];
const OTO_HUMOR_BATTLE = [
  "Team kamu maju dengan percaya diri. Separuh percaya, separuh diri.",
  "Musuh terlihat serius. Team kamu terlihat lapar.",
  "Battle selesai. Kursi plastik di arena jadi saksi bisu.",
  "Strategi team: maju dulu, mikir belakangan. Untung masih game."
];
const OTO_HUMOR_ROYALE = [
  "Meja Hansip lagi dingin. Jangan ngajak emosi, ajak otkerja dulu.",
  "Koin muter keren, hasilnya bikin mikir ulang hidup virtual.",
  "Menang boleh senyum, tapi jangan langsung merasa jadi owner casino. Ini cuma coin game.",
  "Coin game doang, santai. Kalau kalah, otkerja masih buka lowongan."
];

const OTO_NPC_NAMES = {
  common: ["Bang Jaga Sendal","Ayam Gang Server","Kucing Numpang Lewat","Bocil Voice AFK","Mas Tukang Ping","Pawang Gorengan","Warga Lupa Daily","Tukang Emote Random","Kang Mute Sendiri","Penjaga Kursi Plastik","Warga Salah Channel","Bocil Ngetag Owner","Tukang Stiker Receh","Mas Kopi Dingin","Satpam Warung Tulus","Kucing Duduk Doang","Warga Nanya Prefix","Anak Baru Nyasar","Tukang Typo","Bang Parkir AFK","Penunggu VC Kosong","Warga Claim Telat","Ayam Lewat Timeline","Pedagang Es Teh","Tukang Bawa Kabar","Warga Mode Hemat","Mas Loading Lama","Penjaga Gerbang OT","Kipas Angin Rusuh","Tukang Sapu Neon"],
  uncommon: ["Bebek Sigma","Satpam Neon","Kurir Salah Channel","Kang Seblak Delay","Penjual Es Teh Damai","Admin Mode Santai","Penjaga Warung AFK","Bocil Ping Owner","Tukang Rename Role","Kucing Bawa Invoice","Mekanik Becak Turbo","Warga Semi Aktif","Duta Daily Streak","Pencari Sendal Kiri","Kurir Hampir Sampai","Chef Mie Curhat","Penjaga Portal Warung","Tukang Benerin Mic","Ayam Punya Aura","Penjual Potion Murah","Bocil Spam Emoji","Warga Tukang React","Kang Parkir Dungeon","Bebek Bawa Map","Tukang Nyari Event","Penjual Kunci Aneh","Admin Ngopi","Warga Tukang Screenshot","Tukang Delay Battle","Capybara Santai"],
  rare: ["Kucing Pajak","Pak RW Bluetooth","Raja Kursi Plastik","Dealer Gorengan Tulus","Si Paling Claim Daily","Bocah Anti Cooldown","Kang Voice Nyasar","Pawang Sticker Lucu","Kurir Dimensi Biru","Chef Seblak Neon","Warga Drop Rare","Pawang Ayam Kabur","Penjaga Chest Warung","Kucing Bawa Crate","Staff Setengah Serius","Mekanik Angkot Drift","Raja Typo Santuy","Tukang Inspect Gear","NPC Salah Quest","Penjual Map Kebalik","Bocil Luck Aktif","Dukun Drop Rate","Kang Paket Mystery","Tukang Buka Secret","Warga Semi Sultan","Penjaga Arena Neon","Bebek Punya Skill","Ayam Mode Boost","Kurir Speedrun","Tukang Reroll Nasib"],
  epic: ["Ayam Cyber","Moderator Senyum Tipis","Dukun WiFi Lancar","Bang Nitro Becak","Chef Seblak Dimensi","Penjaga Portal AFK","Raja Gorengan Hilang","Staff Mode Silent","Capybara Quantum Mini","Kucing Admin Bayangan","Penjaga Dungeon 404","Kurir Lintas Server","Raja Warung Chaos","Pawang Boss Tidur","Dewa Cooldown Kecil","Tukang Buff Team","Shadow Tukang Ping","Bang Crate Biru","Ayam Drift Neon","Guard OT Core","Staff Anti Drama","Penjual Relic Murah","Dukun Upgrade Aman","Bebek Time Traveler","NPC Mode Plot Twist","Tukang Summon Event","Chef Kopi Galaxy","Pawang Monster Lag","Kang Review Warung","Penjaga Secret Gate"],
  legendary: ["King Bekiw Neon","Pak RW Final Form","Sultan Coin Tulus","Naga Chat Warga","Admin Bintang Lima","Raja All-In Virtual","Guardian DESA TULUS","Pangeran Neon Server","Ratu Warung Tulus","Komandan Dungeon OT","Sultan Crate Biru","Dewa Gorengan Neon","Panglima Boss AFK","Kucing Core Guardian","Ayam Galaxy Kecil","Pak RW Ultra Santuy","Moderator Blue Crown","Warga Legend OT","Penjaga Museum Sendal","Duke of Daily Streak","Raja Market Aman","Hero Kampung Tulus","Guardian Voice Channel","Chef Supreme Seblak","Dukun Mythic Chance","Captain Team Royale","Master Collection OT","Sultan Secret Shop","Neon Knight Tulus","Pawang Raid Boss"],
  mythic: ["Bekiw Mode Royale","Shadow Staff OT","Ayam Galaxy Tulus","Capybara Quantum","Kucing Server Core","Raja Hoki Biru","Naga Rules Tulus","Cyber Pak RW","Neon Emperor OT","Dewa Channel Biru","Core Guardian Tulus","Mythic Bang Warung","Admin Dimensi Biru","Ratu Card Dust","Boss Ping Merah","Oracle of DESA TULUS","Warden Dungeon 404","Mythic Kurir Nyasar","Sultan Fragment OT","Keeper of Blue Flame","Kucing Quantum Pajak","Pak RW Overclock","Guardian Season OT","Dewa Battle Chance","Neon Archmage Tulus","Avatar Chat Warga","Mythic Pet Handler","Commander Royale Arena","Shadow Bekiw Core","King of Neon Luck"],
  secret: ["??? Owner dari Dimensi Neon","??? Bot Error yang Jadi Dewa","??? Kartu Tulus Terlarang","??? Raja Secret DESA TULUS","??? NPC yang Tidak Ada di Rules","??? Neon Core Bekiw","??? Penjaga Rahasia OT","??? Entity 00E5FF","??? Avatar Biru Terakhir","??? Admin dari Masa Depan","??? Kucing yang Mengetahui Token","??? Jangan Tampilkan Token","??? Secret Keeper OT","??? Warga yang Tidak Pernah Kalah","??? Dewa Sendal Sebelah","??? Core 0B5CFF","??? Tulus Final Archive","??? Penjaga Pintu Railway","??? Mongo Spirit OT","??? Bot yang Tidak Pernah Reset","??? Dimensi Chat Warga","??? Crown of DESA TULUS","??? The Last Daily","??? Glitch Tulus Royale","??? Penulis Rules Rahasia","??? Entity Anti Reset","??? Blue Flame Owner","??? NPC Bernama Tanda Tanya","??? The Silent Moderator","??? Hansip Secret King"],
  limited: ["Hansip Blue Festival Bekiw","Hansip Season Guardian","Hansip Birthday Spirit","Hansip Warung Festival King","Hansip Boss Parade Knight","Hansip Pet Carnival Master","Hansip Dungeon Rush Lord","Hansip Market Week Sultan","Hansip Chaos Day Avatar","Hansip Blue Royale Queen","Hansip New Year Hunter","Hansip Weekend Myth","Hansip Tulus Anniversary NPC","Hansip Secret Event Keeper","Hansip Neon Valentine Guard","Hansip Ramadhan Tulus Spirit","Hansip Idul Fitri Guardian","Hansip Pancasila Blue Hero","Hansip Summer Warung Boss","Hansip Final Season Crown"]
};

const OTO_WEAPON_NAMES = {
  common: ["Sendal Neon","Payung Mini","Penggaris Warung","Sapu Biru","Panci Kecil","Tongkat Plastik","Remote Bekas","Botol Es Teh","Kabel Charger","Kursi Lipat"],
  uncommon: ["Payung Anti Zonk","Pisau Gorengan","Mic Warung","Helm Becak","Tongkat Admin","Sendok Seblak","Kipas AFK","Stiker Boom","Gunting Neon","Senter Biru"],
  rare: ["Neon Dagger","Pedang Biru Tulus","Keris WiFi Lancar","Shield Kursi Plastik","Bow Chat Warga","Spear Gorengan","Blade Kucing Pajak","Hammer Pak RW","Wand Es Teh","Saber Cooldown"],
  epic: ["Panci Seblak Dimensi","Sabit Galaxy OT","Crown Blade","Staff Blue Core","Axe Dungeon 404","Rifle Sticker Lucu","Greatsword Warung","Scythe AFK","Hammer Neon Royal","Spear Chaos"],
  legendary: ["Crown Royale Bekiw","Tongkat Pak RW Final","Pedang Guardian OT","Blade Naga Chat Warga","Royal Blue Saber","Great Axe Tulus","Staff DESA TULUS","Bow Sultan Coin","Shield Admin Bintang","Katana Neon Legend"],
  mythic: ["Core Bot DESA TULUS","Kartu Hoki Royale","Pedang Owner Dimensi Neon","Crown Mythic Bekiw","Blue Flame Excalibur","Void Saber OT","Railgun Neon Core","Mythic Warung Staff","Dragon Blade Rules","Quantum Sendal"],
  secret: ["Kartu Tulus Terlarang","Script Rahasia OT","Pedang Anti Reset","Token Tanpa Nama","Crown Secret 00E5FF","Core Railway Spirit","Blade of Hidden Owner","Secret Neon Archive","Sword of No Reset","Hansip Final Core"]
};
const OTO_CONSUMABLES = ["Energy Drink Tulus","Kopi Semangat","Roti Anti Panik","Snack Lucky","Potion Kopi","Es Teh Damai","Sup Warung","Bento Pak RW","Permen Fokus","Soda Santuy","Teh Biru Neon","Mie Fokus","Gorengan Buff","Seblak Recovery","Air Mineral Dungeon","Jus Hoki","Susu Pet Tulus","Ramuan Cooldown","Potion Anti Zonk","Kopi Critical"];
const OTO_MATERIALS = ["Kayu Tulus","Batu Kopi","Gear Karatan","Oli Becak","Kain Hoodie","Kristal AFK","Debu Kartu","Bumbu Rahasia","Pasir Pulau","Serpihan Badge","Logam Juragan","Daun Santuy","Benang Warung","Kaca Basecamp","Baut Odong-Odong","Blue Core Shard","Neon Circuit","Token Warung","Fragment Kursi Plastik","Essence Dungeon","Dust 00E5FF","Relic Pak RW","Crystal Chat Warga","Iron Tulus","Fiber Neon","Royal Thread","Core Anti Reset","Memory Shard OT","Scroll Fragment","Secret Dust"];
const OTO_CRATES = ["Basic Crate","Neon Crate","Royale Crate","Mythic Crate","Secret Crate","Warung Crate","Pet Crate","Battle Crate","Dungeon Crate","Event Crate","Limited Crate","Blue Core Crate","Chaos Crate","Market Crate","Daily Crate","Weekly Crate","Season Crate","Hansip Crate","Fragment Crate","Weapon Crate"];
const OTO_FRAGMENTS = ["Common Fragment","Uncommon Fragment","Rare Fragment","Epic Fragment","Legendary Fragment","Mythic Fragment","Secret Fragment","Limited Fragment","Blue Core Fragment","Warung Fragment","Chaos Fragment","Dungeon Fragment","Pet Fragment","Boss Fragment","Event Fragment","Skill Fragment","Evolution Fragment","Weapon Fragment","Hansip Fragment","Anti Reset Fragment"];
const OTO_SHOP_ITEMS = ["Luck Box","Hunt Ticket","Card Dust","Energy Drink","Neon Booster","Rename Tag","Battle Shield","Secret Radar","Basic Crate","Neon Crate","Pet Snack","Dungeon Ticket","Quest Pass","Streak Shield","Repair Kit","HP Potion","Blue Core Charm","Warung Coupon","Chaos Ticket","NPC Radar","Weapon Polish","Fragment Pouch","Card Dust Pack","Team Booster","Daily Booster","Royale Ticket","Lucky Coupon","Skill Book","Evolution Stone","Hansip Badge"];
const otoCooldowns = new Map();
const otoRedirectCooldowns = new Map();
const OTO_DIRECT_COMMANDS = new Set(["otflow","oth","othunt","otzoo","otnpc","otcollection","otcard","otinv","otprofil","otprofile","otteam","otb","otbattle","otluck","otopen","otupgrade","otevolve","otequip","otweapon","otlock","otunlock","otrelease","otkerja","otwork","otslots","otgive","otcash","otbal","otcoin","otbj","otblackjack","othoki","otcf","otroyale","otkartu","otquest","otlb","otrank","otchannel","otsetup","otregenimage","otimage","otgivecrate","otgiveweapon","otgivenpc","otresetplayer","otsetevent","otsetmaxbet","otassetcheck","otnpcimagecheck"]);
const OTO_OVERLAP_COMMANDS = new Set(["othelp","otpanel","otdaily","otshop","otbuy","ottop","otsetchannel","otsendpanel","otupdatepanel","otgivecoin","otgivexp","otbackup"]);
const OTO_OWNER_COMMANDS = new Set(["otchannel","otsetup","otregenimage","otimage","otgivecoin","otgivexp","otgivecrate","otgiveweapon","otgivenpc","otresetplayer","otbackup","otsetevent","otsetmaxbet","otassetcheck","otnpcimagecheck"]);

const OTO_COMMANDS = [
  ["otflow","otflow","Lihat alur main Hansip dari awal sampai battle."], ["oth","oth","Hunt NPC Hansip dengan PNG visual."], ["othunt","othunt","Alias hunt NPC Hansip."], ["otzoo","otzoo","Collection/NPC embed compact."], ["otnpc","otnpc rare","Lihat koleksi/filter NPC visual."], ["otcollection","otcollection","Alias collection Hansip."], ["otcard","otcard Kucing Pajak","Lihat card NPC dengan image otomatis."], ["otinv","otinv crate","Inventory Hansip."], ["otprofil","otprofil","Profil Hansip."], ["otprofile","otprofile","Alias profil Hansip."], ["otteam","otteam view","Atur team 5 NPC + synergy."], ["otb","otb","Battle Hansip premium."], ["otbattle","otbattle","Alias battle Hansip."], ["otluck","otluck","Aktifkan luck kecil 20 menit."], ["otopen","otopen all basic","Buka crate satuan atau mass open."], ["otupgrade","otupgrade Kucing Pajak","Upgrade NPC pakai fragment/coin."], ["otevolve","otevolve Kucing Pajak","Evolve/ascend NPC tertentu."], ["otequip","otequip Kucing Pajak Neon Dagger","Equip weapon ke NPC."], ["otweapon","otweapon page 2","Lihat daftar weapon."], ["otlock","otlock Kucing Pajak","Lock NPC agar aman."], ["otunlock","otunlock Kucing Pajak","Buka kunci NPC."], ["otrelease","otrelease Kucing Pajak confirm","Release NPC tidak terkunci."], ["otkerja","otkerja","Kerja cari coin game."], ["otgive","otgive @user 100","Transfer Hansip Coin virtual dengan konfirmasi."], ["otcash","otcash","Cek saldo Hansip Coin."], ["otbal","otbal","Cek saldo Hansip Coin."], ["otcoin","otcoin","Alias saldo Hansip Coin."], ["otbj","otbj all","Blackjack virtual compact. Bisa `otbj 100` atau `otbj all`."], ["otblackjack","otblackjack all","Alias blackjack. Bisa all-in."], ["othoki","othoki 1000","Mode hoki virtual coin game."], ["otcf","otcf heads all","Coin flip compact. Bisa `otcf heads 100` atau `otcf tails all`."], ["otroyale","otroyale all","Hansip Royale coin game."], ["otkartu","otkartu 1000","Kartu virtual player vs dealer."], ["otquest","otquest","Quest harian Hansip."], ["othelp","othelp oto","Help Center Hansip."], ["otpanel","otpanel oto","Panel panduan Hansip."], ["otdaily","otdaily","Daily reward Hansip."], ["otshop","otshop","Shop Hansip."], ["otbuy","otbuy Basic Crate","Beli item shop Hansip."], ["ottop","ottop","Leaderboard Hansip visual."], ["otlb","otlb","Alias leaderboard Hansip."], ["otrank","otrank","Cek rank Hansip."], ["otchannel","otchannel oto #channel","Owner set channel Hansip."], ["otsetup","otsetup","Owner setup cepat Hansip."], ["otregenimage","otregenimage","Owner regenerate visual cache Hansip."], ["otimage","otimage generate allnpc","Owner Auto Image Studio command."], ["otgivecrate","otgivecrate @user Basic Crate 1","Owner beri crate Hansip."], ["otgiveweapon","otgiveweapon @user Neon Dagger","Owner beri weapon Hansip."], ["otgivenpc","otgivenpc @user Kucing Pajak","Owner beri NPC Hansip."], ["otresetplayer","otresetplayer @user confirm","Owner reset player Hansip."], ["otsetevent","otsetevent Blue Festival","Owner set event Hansip."], ["otsetmaxbet","otsetmaxbet 50000","Owner atur max bet virtual."], ["otassetcheck","otassetcheck","Owner cek asset Hansip."], ["otnpcimagecheck","otnpcimagecheck","Owner cek image NPC Hansip."]
].map(([name, usage, description]) => ({ name, category: OTO_OWNER_COMMANDS.has(name) ? "owner" : "member", permission: OTO_OWNER_COMMANDS.has(name) ? "owner" : "member", usage, description }));

for (const cmd of OTO_COMMANDS) {
  if (!OT_COMMAND_MAP.has(cmd.name)) {
    OT_COMMANDS.push(cmd);
    OT_COMMAND_MAP.set(cmd.name, cmd);
  }
}
const OTO_COMMAND_SET = new Set(OTO_COMMANDS.map(c => c.name));

function otoConfig() {
  return {
    enabled: config.otoEnabled !== false,
    channelId: String(config.otoChannelId || "").trim(),
    logChannelId: String(config.otoLogChannelId || "").trim(),
    oneChannel: config.otoOnlyOneChannel !== false,
    prefix: config.otoPrefix || "ot",
    embedColor: config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF",
    embedAccent: config.otoEmbedAccent || "#00E5FF",
    embedDark: config.otoEmbedDark || "#07111F",
    footer: "DESA TULUS • Hansip",
    maxBet: Math.max(100, Number(config.otoMaxBet || 50000)),
    royaleEnabled: config.otoRoyaleEnabled !== false,
    autoImage: config.otoAutoImageEnabled !== false,
    imageMode: config.otoAutoImageMode || "canvas"
  };
}
function otoRarity(key) { return OTO_RARITIES.find(r => r.key === String(key || "").toLowerCase()) || OTO_RARITIES[0]; }
function otoSlug(text) { return String(text || "oto").toLowerCase().replace(/\?\?\?/g, "secret").normalize("NFKD").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "").slice(0, 64) || "oto"; }
function otoRand(list) { return list[Math.floor(Math.random() * list.length)]; }
function otoEscapeXml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
function otoShort(text, n = 96) { const t = String(text || ""); return t.length > n ? `${t.slice(0, n - 1)}…` : t; }

function otoNpcDescription(name, rarity) {
  const lower = String(name || "").toLowerCase();
  if (lower.includes("kucing") && lower.includes("pajak")) return "Kucing misterius yang muncul membawa invoice dan bikin warga pura-pura AFK.";
  if (lower.includes("ayam") && lower.includes("cyber")) return "Ayam cyber biru yang larinya cepat, tapi tetap sempat pose sebelum battle.";
  if (lower.includes("pak rw")) return "Karakter fiksi Pak RW mode premium dengan aura biru dan gaya sok serius yang lucu.";
  if (lower.includes("secret") || lower.includes("???")) return "NPC rahasia Hansip. Namanya misterius, tapi tidak pernah membuka token/env/secret asli.";
  return `${name} adalah NPC ${rarity.name} dari HANSIP DESA TULUS dengan gaya lucu, clean, dan aura biru Hansip.`;
}
function otoGenerateNpcCatalog() {
  const list = [];
  for (const [rarityKey, names] of Object.entries(OTO_NPC_NAMES)) {
    const rarity = otoRarity(rarityKey);
    names.forEach((name, i) => {
      const element = OTO_ELEMENTS[(i + rarityKey.length) % OTO_ELEMENTS.length];
      const skill = OTO_SKILLS[(i * 2 + rarityKey.length) % OTO_SKILLS.length];
      const id = otoSlug(name);
      const powerBase = { common: 130, uncommon: 240, rare: 620, epic: 1100, legendary: 1900, mythic: 3200, secret: 5200, limited: 4300 }[rarityKey] || 100;
      list.push({
        id, name, rarity: rarityKey, rarityName: rarity.name, element, skill,
        description: otoNpcDescription(name, rarity), level: 1, exp: 0,
        power: powerBase + i * 9,
        imageMode: "auto",
        imagePrompt: `Cute original fantasy Discord game card character, ${name}, ${element}, ${skill}, premium dark blue neon DESA TULUS Hansip style, clean, funny, no copyrighted character, no real person.`,
        image: path.join("assets", "generated", "npc", rarityKey, `${id}.svg`),
        cardImage: path.join("assets", "generated", "card", rarityKey, `${id}_card.svg`),
        fallbackImage: path.join("assets", "npc-default", `${rarityKey}.svg`)
      });
    });
  }
  return list;
}
function otoGenerateItemCatalog() {
  const items = [];
  for (const name of OTO_CONSUMABLES) items.push({ id: otoSlug(name), name, type: "consumable", rarity: "common", effect: { energy: 15 }, buyPrice: 280, sellPrice: 90, source: ["shop", "daily"], stackable: true, tradeable: true, imageMode: "auto" });
  for (const name of OTO_MATERIALS) items.push({ id: otoSlug(name), name, type: "material", rarity: "uncommon", effect: { craft: 1 }, buyPrice: 180, sellPrice: 70, source: ["hunt", "quest"], stackable: true, tradeable: true, imageMode: "auto" });
  for (const [rarity, names] of Object.entries(OTO_WEAPON_NAMES)) names.forEach((name, i) => items.push({ id: otoSlug(name), name, type: "weapon", rarity, power: (OTO_RARITY_KEYS.indexOf(rarity) + 1) * 120 + i * 18, buyPrice: 0, sellPrice: 240 + i * 30, source: ["crate"], stackable: false, tradeable: true, imageMode: "auto" }));
  for (const name of OTO_CRATES) items.push({ id: otoSlug(name), name, type: "crate", rarity: name.toLowerCase().includes("secret") ? "secret" : name.toLowerCase().includes("mythic") ? "mythic" : name.toLowerCase().includes("royale") ? "legendary" : name.toLowerCase().includes("neon") ? "rare" : "common", buyPrice: name === "Basic Crate" ? 650 : name === "Neon Crate" ? 1800 : 5000, sellPrice: 120, source: ["shop", "daily", "quest"], stackable: true, tradeable: true, imageMode: "auto" });
  for (const name of OTO_FRAGMENTS) items.push({ id: otoSlug(name), name, type: "fragment", rarity: name.toLowerCase().includes("secret") ? "secret" : name.toLowerCase().includes("mythic") ? "mythic" : name.toLowerCase().includes("legendary") ? "legendary" : "rare", buyPrice: 0, sellPrice: 50, source: ["hunt", "crate", "release"], stackable: true, tradeable: true, imageMode: "auto" });
  for (const name of OTO_SHOP_ITEMS) if (!items.some(x => x.name === name)) items.push({ id: otoSlug(name), name, type: "utility", rarity: name.toLowerCase().includes("secret") ? "secret" : name.toLowerCase().includes("neon") || name.toLowerCase().includes("luck") ? "rare" : "common", buyPrice: 500, sellPrice: 100, source: ["shop"], stackable: true, tradeable: true, imageMode: "auto" });
  return items;
}
function otoDefaultAssets() {
  const banners = OTO_BANNER_KEYS;
  return { version: "5.9.99", banners: Object.fromEntries(banners.map(x => [x, path.join("assets", "generated", "banners", `${x}.svg`)])), generatedAt: new Date().toISOString(), imageMode: config.otoAutoImageMode || "canvas", missing: [] };
}
function otoEnsureDirs() {
  const dirs = [ASSETS_DIR, OTO_BANNERS_DIR, OTO_GENERATED_DIR, OTO_GENERATED_NPC_DIR, OTO_GENERATED_CARD_DIR, OTO_GENERATED_ITEM_DIR, OTO_GENERATED_BANNER_DIR, OTO_GENERATED_BATTLE_DIR, OTO_GENERATED_PROFILE_DIR, OTO_GENERATED_HUNT_DIR, OTO_GENERATED_NPC_CARD_DIR, OTO_GENERATED_ZOO_DIR, OTO_GENERATED_INVENTORY_DIR, OTO_GENERATED_CRATE_DIR, OTO_GENERATED_ARCADE_DIR, OTO_GENERATED_LEADERBOARD_DIR, OTO_GENERATED_CACHE_DIR, OTO_TEMPLATES_DIR, OTO_NPC_DEFAULT_DIR, OTO_ITEM_ASSET_DIR];
  for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });
  for (const r of OTO_RARITY_KEYS) {
    fs.mkdirSync(path.join(OTO_GENERATED_NPC_DIR, r), { recursive: true });
    fs.mkdirSync(path.join(OTO_GENERATED_CARD_DIR, r), { recursive: true });
    fs.mkdirSync(path.join(OTO_GENERATED_ITEM_DIR, r), { recursive: true });
  }
}
function otoReadJson(file, fallback) { return readGameJson(file, fallback); }
function otoWriteJson(file, data) { writeGameJson(file, data); }
function otoReadPlayers() { return otoReadJson(OTO_PLAYERS_FILE, {}); }
function otoWritePlayers(data) { otoWriteJson(OTO_PLAYERS_FILE, data || {}); }
function otoReadNpcs() { const data = otoReadJson(OTO_NPCS_FILE, []); return Array.isArray(data) && data.length ? data : otoGenerateNpcCatalog(); }
function otoWriteNpcs(data) { otoWriteJson(OTO_NPCS_FILE, data || []); }
function otoReadItems() { const data = otoReadJson(OTO_ITEMS_FILE, []); return Array.isArray(data) && data.length ? data : otoGenerateItemCatalog(); }
function otoWriteItems(data) { otoWriteJson(OTO_ITEMS_FILE, data || []); }
function otoReadAssets() { return otoReadJson(OTO_ASSETS_FILE, otoDefaultAssets()); }
function otoWriteAssets(data) { otoWriteJson(OTO_ASSETS_FILE, data || {}); }
function otoEnsureFiles() {
  otoEnsureDirs();
  if (!fs.existsSync(OTO_PLAYERS_FILE)) otoWritePlayers({});
  if (!fs.existsSync(OTO_NPCS_FILE)) otoWriteNpcs(otoGenerateNpcCatalog());
  if (!fs.existsSync(OTO_ITEMS_FILE)) otoWriteItems(otoGenerateItemCatalog());
  if (!fs.existsSync(OTO_ASSETS_FILE)) otoWriteAssets(otoDefaultAssets());
  if (!fs.existsSync(OTO_BACKUP_FILE)) otoWriteJson(OTO_BACKUP_FILE, { version: "5.9.99", backups: [] });
  if (!fs.existsSync(OTO_BATTLES_FILE)) otoWriteJson(OTO_BATTLES_FILE, {});
  if (!fs.existsSync(OTO_ARCADE_FILE)) otoWriteJson(OTO_ARCADE_FILE, {});
  for (const r of OTO_RARITIES) {
    const fallback = path.join(OTO_NPC_DEFAULT_DIR, `${r.key}.svg`);
    if (!fs.existsSync(fallback)) otoGenerateSvg(fallback, { kind: "NPC DEFAULT", title: `${r.emoji} ${r.name}`, subtitle: "Hansip Fallback Card", rarity: r.key, accent: r.color }, 1024, 1024);
  }
}
function otoPlayerDefault(user) {
  return { userId: user.id, username: user.username || user.tag || "Warga OT", coin: 1000, exp: 0, level: 1, dust: 0, luckUntil: 0, inventory: { crates: { basic_crate: 1 }, weapons: {}, fragments: {}, items: {} }, npcs: {}, team: [null, null, null, null, null], stats: { hunts: 0, battles: 0, wins: 0, losses: 0, royaleWin: 0, royaleLose: 0, work: 0, crateOpen: 0 }, daily: {}, locked: {}, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}
function otoGetPlayer(user) { const players = otoReadPlayers(); if (!players[user.id]) { players[user.id] = otoPlayerDefault(user); otoWritePlayers(players); } players[user.id] = otoNormalizePlayer(players[user.id]); return { players, player: players[user.id] }; }
function otoSavePlayer(user, player) { const players = otoReadPlayers(); players[user.id] = { ...otoNormalizePlayer(player), updatedAt: new Date().toISOString() }; otoWritePlayers(players); }
function otoLevel(exp) { return Math.max(1, Math.floor(Math.sqrt(Number(exp || 0) / 120)) + 1); }
function otoFindNpc(name) { const q = otoSlug(name); return otoReadNpcs().find(n => n.id === q) || otoReadNpcs().find(n => otoSlug(n.name).includes(q) || q.includes(otoSlug(n.name))); }
function otoFindItem(name) { const q = otoSlug(name); return otoReadItems().find(i => i.id === q) || otoReadItems().find(i => otoSlug(i.name).includes(q) || q.includes(otoSlug(i.name))); }
function otoPickVariant() {
  if (config.otoVariantEnabled === false) return OTO_VARIANTS[0];
  const active = OTO_VARIANTS.filter(v => v.chance > 0);
  const total = active.reduce((a, v) => a + v.chance, 0);
  let roll = Math.random() * total;
  for (const v of active) { roll -= v.chance; if (roll <= 0) return v; }
  return OTO_VARIANTS[0];
}
function otoVariantMeta(key) { return OTO_VARIANTS.find(v => v.key === key) || OTO_VARIANTS[0]; }
function otoRarityIndex(key) { return Math.max(0, OTO_RARITY_KEYS.indexOf(String(key || "common"))); }
function otoFragmentQty(rarityKey, action = "duplicate") {
  const base = action === "release" ? 3 : 1;
  return base + Math.max(0, otoRarityIndex(rarityKey));
}
function otoDustQty(rarityKey, action = "duplicate") {
  return (action === "release" ? 6 : 4) + otoRarityIndex(rarityKey) * 3;
}
function otoNormalizePlayer(player) {
  player.inventory = player.inventory || { crates: {}, weapons: {}, fragments: {}, items: {} };
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.npcs = player.npcs || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 5) : [null, null, null, null, null];
  while (player.team.length < 5) player.team.push(null);
  player.stats = player.stats || {};
  player.dust = Number(player.dust || 0);
  return player;
}
function otoOwnedNpcPower(n) {
  const variant = otoVariantMeta(n?.variant || "normal");
  return Math.floor((Number(n?.power || 0) + Number(n?.level || 1) * 35) * Number(variant.bonus || 1));
}
function otoTeamNpcs(player) { return (player.team || []).map(id => id && player.npcs?.[id] ? player.npcs[id] : null).filter(Boolean); }
function otoTeamSynergy(player) {
  if (config.otoTeamSynergyEnabled === false) return { bonusPower: 0, bonusCoin: 0, bonusExp: 0, bonusCrate: 0, lines: [] };
  const team = otoTeamNpcs(player);
  const catalog = otoReadNpcs();
  const getCatalog = owned => catalog.find(n => n.id === owned.id) || owned;
  const out = { bonusPower: 0, bonusCoin: 0, bonusExp: 0, bonusCrate: 0, lines: [] };
  for (const syn of OTO_SYNERGIES) {
    let count = 0;
    if (syn.elements) count = team.filter(n => syn.elements.includes(getCatalog(n).element)).length;
    if (syn.rarities) count = team.filter(n => syn.rarities.includes(n.rarity)).length;
    if (count >= syn.need) {
      out.bonusPower += syn.bonusPower || 0;
      out.bonusCoin += syn.bonusCoin || 0;
      out.bonusExp += syn.bonusExp || 0;
      out.bonusCrate += syn.bonusCrate || 0;
      out.lines.push(`• **${syn.name}** — ${syn.desc}`);
    }
  }
  return out;
}
function otoAddCrate(player, crateName, qty = 1) { const id = otoSlug(crateName); player.inventory.crates[id] = Number(player.inventory.crates[id] || 0) + qty; }
function otoAddFragment(player, fragName, qty = 1) { const id = otoSlug(fragName); player.inventory.fragments[id] = Number(player.inventory.fragments[id] || 0) + qty; }
function otoAddItem(player, itemName, qty = 1) { const item = otoFindItem(itemName) || { id: otoSlug(itemName), name: itemName, type: "item" }; const bucket = item.type === "weapon" ? "weapons" : item.type === "crate" ? "crates" : item.type === "fragment" ? "fragments" : "items"; player.inventory[bucket][item.id] = Number(player.inventory[bucket][item.id] || 0) + qty; return item; }
function otoAddNpc(player, npc) {
  otoNormalizePlayer(player);
  const owned = player.npcs[npc.id];
  const rarity = otoRarity(npc.rarity);
  const variant = otoPickVariant();
  if (owned) {
    const frag = `${rarity.name} Fragment`;
    const fragQty = otoFragmentQty(npc.rarity, "duplicate");
    const dustQty = otoDustQty(npc.rarity, "duplicate");
    otoAddFragment(player, frag, fragQty);
    player.dust = Number(player.dust || 0) + dustQty;
    owned.duplicates = Number(owned.duplicates || 0) + 1;
    owned.variants = Array.from(new Set([...(owned.variants || [owned.variant || "normal"]), variant.key]));
    if (variant.key !== "normal" && variant.bonus > Number(otoVariantMeta(owned.variant || "normal").bonus || 1)) {
      owned.variant = variant.key;
      owned.power = Math.floor(Number(owned.power || npc.power) * variant.bonus);
    }
    return { duplicate: true, fragment: frag, fragmentQty: fragQty, dustQty, variant };
  }
  player.npcs[npc.id] = { id: npc.id, name: npc.name, rarity: npc.rarity, element: npc.element, level: 1, exp: 0, power: Math.floor(npc.power * variant.bonus), locked: false, weapon: "", variant: variant.key, variants: [variant.key], obtainedAt: new Date().toISOString() };
  return { duplicate: false, variant };
}
function otoTeamPower(player) { otoNormalizePlayer(player); const base = (player.team || []).reduce((sum, id) => { const n = id ? player.npcs[id] : null; const w = n?.weapon ? (otoFindItem(n.weapon)?.power || 0) : 0; return sum + (n ? otoOwnedNpcPower(n) + w : 0); }, 0); const fullBonus = (player.team || []).filter(Boolean).length >= 5 ? 0.15 : 0; const syn = otoTeamSynergy(player); return Math.floor(base * (1 + fullBonus + Number(syn.bonusPower || 0))); }
function otoPickRarity() { const rates = config.otoDropRates || {}; const pool = OTO_RARITIES.filter(r => r.key !== "limited").map(r => ({ ...r, weight: Number(rates[r.key] ?? r.weight) })); const total = pool.reduce((a, r) => a + r.weight, 0); let roll = Math.random() * total; for (const r of pool) { roll -= r.weight; if (roll <= 0) return r.key; } return "common"; }
function otoPickNpc() { const rarity = otoPickRarity(); const list = otoReadNpcs().filter(n => n.rarity === rarity); return otoRand(list.length ? list : otoReadNpcs()); }
function otoCooldown(userId, key, ms) { const id = `${userId}:${key}`; const last = otoCooldowns.get(id) || 0; const diff = Date.now() - last; if (diff < ms) return Math.ceil((ms - diff) / 1000); otoCooldowns.set(id, Date.now()); return 0; }
function otoRandomHumor(type) { if (type === "crate") return otoRand(OTO_HUMOR_CRATE); if (type === "battle") return otoRand(OTO_HUMOR_BATTLE); if (type === "royale") return otoRand(OTO_HUMOR_ROYALE); return otoRand(OTO_HUMOR_HUNT); }
function otoBaseEmbed(title, description = "") { return new EmbedBuilder().setColor(otoConfig().embedColor).setTitle(title).setDescription(description).setFooter({ text: otoConfig().footer }).setTimestamp(); }
function otoSvgConcept(name = "") { const lower = String(name).toLowerCase(); if (lower.includes("kucing")) return "🐱"; if (lower.includes("ayam")) return "🐔"; if (lower.includes("bebek")) return "🦆"; if (lower.includes("pak rw")) return "👑"; if (lower.includes("warung")) return "🏪"; if (lower.includes("crate")) return "📦"; if (lower.includes("weapon") || lower.includes("pedang") || lower.includes("blade")) return "⚔️"; if (lower.includes("kunci")) return "🗝️"; if (lower.includes("kopi")) return "☕"; if (lower.includes("sendal")) return "🩴"; if (lower.includes("secret") || lower.includes("???")) return "<a:Alphabet_S:1513667784519712769>"; return "💠"; }
function otoGenerateSvg(file, meta = {}, width = 1280, height = 720) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const title = otoEscapeXml(otoShort(meta.title || meta.name || "Hansip", 42));
  const subtitle = otoEscapeXml(otoShort(meta.subtitle || meta.rarity || "HANSIP DESA TULUS", 76));
  const skill = otoEscapeXml(otoShort(meta.skill || meta.description || "Premium blue collection card", 68));
  const rarity = otoRarity(meta.rarity || "rare");
  const accent = meta.accent || rarity.color || "#00E5FF";
  const icon = otoEscapeXml(meta.icon || otoSvgConcept(title));
  const card = width === height;
  const power = otoEscapeXml(String(meta.power || "POWER"));
  const element = otoEscapeXml(String(meta.element || meta.subtitle || "BLUE CORE"));
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#06101f"/><stop offset="0.42" stop-color="#0B5CFF"/><stop offset="1" stop-color="#020814"/></linearGradient>
    <linearGradient id="frame" x1="0" x2="1"><stop offset="0" stop-color="${accent}"/><stop offset="0.45" stop-color="#F7FAFF"/><stop offset="1" stop-color="#00E5FF"/></linearGradient>
    <radialGradient id="glow" cx="50%" cy="35%" r="62%"><stop offset="0" stop-color="${accent}" stop-opacity="0.80"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient>
    <filter id="shadow"><feDropShadow dx="0" dy="20" stdDeviation="20" flood-color="#000" flood-opacity="0.50"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="16"/></filter>
  </defs>
  <rect width="100%" height="100%" rx="${card ? 60 : 42}" fill="url(#bg)"/>
  <path d="M42 90 C${width*0.25} 20 ${width*0.75} 20 ${width-42} 90 L${width-42} ${height-54} L42 ${height-54} Z" fill="rgba(7,17,31,0.58)" stroke="url(#frame)" stroke-width="${card ? 7 : 5}"/>
  <circle cx="${width*0.70}" cy="${height*0.20}" r="${Math.min(width,height)*0.36}" fill="url(#glow)"/>
  <circle cx="${width*0.22}" cy="${height*0.74}" r="${Math.min(width,height)*0.24}" fill="#00E5FF" opacity="0.14" filter="url(#soft)"/>
  <text x="${card ? 70 : 62}" y="${card ? 92 : 82}" font-size="${card ? 28 : 24}" fill="${accent}" font-family="Inter,Segoe UI,Arial" font-weight="900">${rarity.emoji} ${otoEscapeXml(rarity.name.toUpperCase())}</text>
  <text x="${width-70}" y="${card ? 92 : 82}" text-anchor="end" font-size="${card ? 26 : 22}" fill="#B9EFFF" font-family="Inter,Segoe UI,Arial" font-weight="800">Hansip CARD</text>
  <g filter="url(#shadow)"><rect x="${width*0.11}" y="${height*0.15}" width="${width*0.78}" height="${height*0.50}" rx="${card ? 42 : 30}" fill="rgba(2,8,20,0.54)" stroke="rgba(255,255,255,0.22)"/></g>
  <text x="50%" y="${height*0.40}" text-anchor="middle" font-size="${card ? 190 : 128}" font-family="Segoe UI Emoji, Apple Color Emoji, sans-serif">${icon}</text>
  <text x="50%" y="${height*0.63}" text-anchor="middle" font-size="${card ? 56 : 54}" fill="#F7FAFF" font-family="Inter,Segoe UI,Arial" font-weight="1000">${title}</text>
  <rect x="${width*0.20}" y="${height*0.675}" width="${width*0.60}" height="${card ? 54 : 46}" rx="999" fill="rgba(0,229,255,0.12)" stroke="${accent}" opacity="0.92"/>
  <text x="50%" y="${height*0.71}" text-anchor="middle" font-size="${card ? 28 : 24}" fill="#DDFBFF" font-family="Inter,Segoe UI,Arial" font-weight="800">${subtitle}</text>
  <text x="50%" y="${height*0.78}" text-anchor="middle" font-size="${card ? 24 : 22}" fill="#B9EFFF" font-family="Inter,Segoe UI,Arial">${skill}</text>
  <text x="${card ? 82 : 64}" y="${height-86}" font-size="${card ? 24 : 20}" fill="#F7FAFF" font-family="Inter,Segoe UI,Arial" font-weight="800">ELEMENT: ${element}</text>
  <text x="${width-82}" y="${height-86}" text-anchor="end" font-size="${card ? 24 : 20}" fill="#F7FAFF" font-family="Inter,Segoe UI,Arial" font-weight="800">${power}</text>
  <text x="${width-42}" y="${height-36}" text-anchor="end" font-size="22" fill="rgba(247,250,255,0.76)" font-family="Inter,Segoe UI,Arial" font-weight="800">DESA TULUS • Hansip</text>
  </svg>`;
  fs.writeFileSync(file, svg);
  return file;
}
function otoAssetPath(kind, key, meta = {}) {
  otoEnsureDirs();
  const rarity = String(meta.rarity || "common").toLowerCase();
  if (kind === "banner") return path.join(OTO_GENERATED_BANNER_DIR, `${key}.svg`);
  if (kind === "npc") return path.join(OTO_GENERATED_NPC_DIR, rarity, `${otoSlug(key)}.svg`);
  if (kind === "card") return path.join(OTO_GENERATED_CARD_DIR, rarity, `${otoSlug(key)}_card.svg`);
  if (kind === "item") return path.join(OTO_GENERATED_ITEM_DIR, rarity, `${otoSlug(key)}.svg`);
  return path.join(OTO_GENERATED_DIR, `${otoSlug(key)}.svg`);
}
function otoGetOrCreateAsset(kind, key, meta = {}) {
  if (!otoConfig().autoImage) return "";
  const manual = (config.otoManualBanners || {})[key] || (config.otoManualNpcImages || {})[key];
  if (manual && fs.existsSync(path.join(__dirname, manual))) return path.join(__dirname, manual);
  const file = otoAssetPath(kind, key, meta);
  if (fs.existsSync(file)) return file;
  try { return otoGenerateSvg(file, { ...meta, title: meta.title || key, subtitle: meta.subtitle || "HANSIP DESA TULUS", icon: meta.icon || otoSvgConcept(key) }, kind === "card" || kind === "npc" || kind === "item" ? 1024 : 1280, kind === "card" || kind === "npc" || kind === "item" ? 1024 : 720); } catch (error) { console.error("⚠️ Hansip image generate gagal:", error.message); return ""; }
}

function otoVisualCanvasAvailable() { return Boolean(createCanvas) && config.otoVisualPngEnabled !== false; }
function otoVisualPath(kind, key = "visual", ext = "png") {
  const safe = otoSlug(`${key}_${Date.now()}_${Math.floor(Math.random() * 9999)}`);
  const map = {
    battle: OTO_GENERATED_BATTLE_DIR,
    profile: OTO_GENERATED_PROFILE_DIR,
    hunt: OTO_GENERATED_HUNT_DIR,
    card: OTO_GENERATED_NPC_CARD_DIR,
    zoo: OTO_GENERATED_ZOO_DIR,
    inventory: OTO_GENERATED_INVENTORY_DIR,
    crate: OTO_GENERATED_CRATE_DIR,
    arcade: OTO_GENERATED_ARCADE_DIR,
    leaderboard: OTO_GENERATED_LEADERBOARD_DIR,
    animation: OTO_GENERATED_ANIMATION_DIR,
    blackjack_gif: OTO_GENERATED_ANIM_BLACKJACK_DIR,
    coinflip_gif: OTO_GENERATED_ANIM_COINFLIP_DIR,
    battle_gif: OTO_GENERATED_ANIM_BATTLE_DIR,
    hunt_gif: OTO_GENERATED_ANIM_HUNT_DIR,
    crate_gif: OTO_GENERATED_ANIM_CRATE_DIR,
    cache: OTO_GENERATED_CACHE_DIR
  };
  const dir = map[kind] || OTO_GENERATED_CACHE_DIR;
  fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, `${safe}.${String(ext || "png").replace(/^\./, "")}`);
}
function otoCleanOldVisualCache() {
  if (config.otoImageAutoCleanup === false) return;
  const maxAge = Number(config.otoImageCacheMaxAgeHours || 24) * 60 * 60 * 1000;
  const dirs = [OTO_GENERATED_BATTLE_DIR, OTO_GENERATED_PROFILE_DIR, OTO_GENERATED_HUNT_DIR, OTO_GENERATED_ZOO_DIR, OTO_GENERATED_INVENTORY_DIR, OTO_GENERATED_CRATE_DIR, OTO_GENERATED_ARCADE_DIR, OTO_GENERATED_LEADERBOARD_DIR, OTO_GENERATED_CACHE_DIR];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir)) {
        const p = path.join(dir, f);
        if (!f.endsWith(".png")) continue;
        const st = fs.statSync(p);
        if (Date.now() - st.mtimeMs > maxAge) fs.unlinkSync(p);
      }
    } catch {}
  }
}
function otoVColor(rarity = "rare") { return otoRarity(rarity).color || "#00E5FF"; }
function otoCanvasFont(size, weight = 800) { return `${weight} ${size}px Inter, Segoe UI, Arial, sans-serif`; }
function otoDrawRound(ctx, x, y, w, h, r, fill, stroke = "", line = 2) {
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
}
function otoDrawText(ctx, text, x, y, size = 24, color = "#F7FAFF", weight = 800, align = "left") {
  ctx.font = otoCanvasFont(size, weight); ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top";
  ctx.fillText(String(text ?? ""), x, y);
}
function otoFitText(ctx, text, maxWidth, size = 24, weight = 800) {
  let value = String(text || ""); ctx.font = otoCanvasFont(size, weight);
  while (value.length > 2 && ctx.measureText(value).width > maxWidth) value = value.slice(0, -2);
  return value.length < String(text || "").length ? `${value}…` : value;
}
function otoDrawBar(ctx, x, y, w, h, pct, color = "#00E5FF", label = "") {
  otoDrawRound(ctx, x, y, w, h, h / 2, "rgba(4,9,20,.78)", "rgba(255,255,255,.12)", 1);
  otoDrawRound(ctx, x + 3, y + 3, Math.max(8, (w - 6) * Math.max(0, Math.min(1, pct))), h - 6, (h - 6) / 2, color, "", 0);
  if (label) otoDrawText(ctx, label, x + w - 10, y + 5, 16, "#F7FAFF", 900, "right");
}
function otoDrawBg(ctx, w, h, title = "Hansip", subtitle = "HANSIP DESA TULUS") {
  const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#020814"); g.addColorStop(.45, "#071B38"); g.addColorStop(1, "#020713");
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  const glow = ctx.createRadialGradient(w * .72, h * .10, 20, w * .72, h * .10, Math.max(w, h) * .55);
  glow.addColorStop(0, "rgba(0,229,255,.34)"); glow.addColorStop(1, "rgba(0,229,255,0)"); ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
  const glow2 = ctx.createRadialGradient(w * .12, h * .75, 10, w * .12, h * .75, Math.max(w, h) * .36);
  glow2.addColorStop(0, "rgba(11,92,255,.38)"); glow2.addColorStop(1, "rgba(11,92,255,0)"); ctx.fillStyle = glow2; ctx.fillRect(0, 0, w, h);
  otoDrawRound(ctx, 16, 16, w - 32, h - 32, 26, "rgba(7,17,31,.40)", "rgba(0,229,255,.40)", 2);
  otoDrawText(ctx, title, w / 2, 28, 40, "#F7FAFF", 1000, "center");
  otoDrawText(ctx, subtitle, w / 2, 76, 20, "#8EEBFF", 800, "center");
}
function otoConceptColor(name = "") {
  const l = String(name).toLowerCase();
  if (l.includes("kucing")) return "#2DD4FF";
  if (l.includes("ayam")) return "#FFD166";
  if (l.includes("bebek")) return "#A7F3D0";
  if (l.includes("buaya")) return "#39E58C";
  if (l.includes("slime") || l.includes("slimu")) return "#5EEAD4";
  if (l.includes("api") || l.includes("fox")) return "#FF5F7A";
  if (l.includes("singo") || l.includes("lion")) return "#FBBF24";
  if (l.includes("octo")) return "#A78BFA";
  if (l.includes("secret") || l.includes("???")) return "#1E1B4B";
  return "#0B5CFF";
}
function otoDrawNpcIcon(ctx, x, y, size, npc = {}, side = "blue") {
  const rarity = otoRarity(npc.rarity || "rare");
  const color = otoConceptColor(npc.name || npc.id || "oto");
  const cx = x + size / 2, cy = y + size / 2;
  otoDrawRound(ctx, x, y, size, size, 24, "rgba(2,8,20,.78)", rarity.color, 3);
  const g = ctx.createRadialGradient(cx, cy, size * .08, cx, cy, size * .58); g.addColorStop(0, color); g.addColorStop(1, "rgba(0,229,255,.10)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, size * .34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.beginPath(); ctx.arc(cx - size * .11, cy - size * .08, size * .035, 0, Math.PI * 2); ctx.arc(cx + size * .11, cy - size * .08, size * .035, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.88)"; ctx.lineWidth = Math.max(2, size * .018); ctx.beginPath(); ctx.arc(cx, cy + size * .04, size * .11, 0, Math.PI); ctx.stroke();
  const icon = otoSvgConcept(npc.name || "Hansip"); otoDrawText(ctx, icon, cx, cy + size * .23, size * .18, "#FFFFFF", 900, "center");
  otoDrawText(ctx, rarity.emoji, x + size - 10, y + 8, size * .16, "#FFFFFF", 900, "right");
}
async function otoCanvasToFile(canvas, file) {
  let buffer;
  if (typeof canvas.encode === "function") buffer = await canvas.encode("png");
  else if (typeof canvas.toBuffer === "function") buffer = canvas.toBuffer("image/png");
  else throw new Error("Canvas encoder tidak tersedia");
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buffer); return file;
}

function otoVisualFileValid(file, minBytes = 1600) {
  try {
    if (!file || !fs.existsSync(file)) return false;
    const stat = fs.statSync(file);
    return stat.size >= minBytes && stat.size <= Number(config.otoAnimationMaxSizeMb || 8) * 1024 * 1024;
  } catch { return false; }
}
function otoAnimationAllowed(kind) {
  if (config.otoAnimatedVisualEnabled === false) return false;
  if (String(config.otoVisualMode || "auto") === "image_only") return false;
  if (kind === "blackjack" && config.otoBlackjackAnimated === false) return false;
  if (kind === "coinflip" && config.otoCoinFlipAnimated === false) return false;
  if (kind === "battle" && config.otoBattleAnimated === false) return false;
  if (kind === "hunt" && config.otoHuntAnimated === false) return false;
  if (kind === "crate" && config.otoCrateAnimated === false) return false;
  return Boolean(GIFEncoder && quantize && applyPalette && createCanvas);
}
async function otoCanvasesToGif(frames, file, delay = 90) {
  try {
    if (!frames.length || !GIFEncoder || !quantize || !applyPalette) return "";
    const gif = GIFEncoder();
    for (const canvas of frames) {
      const ctx = canvas.getContext("2d");
      const { width, height } = canvas;
      const rgba = ctx.getImageData(0, 0, width, height).data;
      const palette = quantize(rgba, 256);
      const indexed = applyPalette(rgba, palette);
      gif.writeFrame(indexed, width, height, { palette, delay });
    }
    gif.finish();
    const buffer = Buffer.from(gif.bytesView());
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buffer);
    return otoVisualFileValid(file) ? file : "";
  } catch (error) {
    console.warn("⚠️ Hansip GIF animation gagal, fallback ke PNG:", error.message || String(error));
    return "";
  }
}
function otoDrawCard(ctx, x, y, w, h, card = {}, hidden = false) {
  otoDrawRound(ctx, x, y, w, h, 14, hidden ? "#06214A" : "#F8FBFF", hidden ? "#00E5FF" : "#BFD7FF", 3);
  if (hidden) {
    otoDrawText(ctx, "Hansip", x + w / 2, y + h / 2 - 17, 30, "#8EEBFF", 1000, "center");
    otoDrawText(ctx, "◆", x + w / 2, y + h / 2 + 18, 24, "#00E5FF", 900, "center");
    return;
  }
  const rank = String(card.rank || card.value || "A");
  const suit = String(card.suit || "♠");
  const red = /[♥♦]/.test(suit);
  const col = red ? "#FF4D6D" : "#07111F";
  otoDrawText(ctx, rank, x + 14, y + 12, 24, col, 1000);
  otoDrawText(ctx, suit, x + 15, y + 44, 30, col, 1000);
  otoDrawText(ctx, suit, x + w / 2, y + h / 2 - 25, 58, col, 1000, "center");
  otoDrawText(ctx, rank, x + w - 14, y + h - 42, 24, col, 1000, "right");
}
function otoMakeCardObj(value = 2) {
  const suits = ["♠", "♥", "♦", "♣"];
  const ranks = ["2","3","4","5","6","7","8","9","10","J","Q","K","A"];
  const v = Math.max(2, Math.min(14, Number(value || 2)));
  return { rank: ranks[v - 2] || "A", suit: suits[Math.floor(Math.random() * suits.length)], value: v };
}
function otoDrawBlackjackScene(ctx, w, h, data = {}, frame = 99) {
  otoDrawBg(ctx, w, h, "OTO BLACKJACK", "Hansip Coin hanya virtual game");
  otoDrawRound(ctx, 58, 120, w - 116, h - 190, 34, "rgba(2,8,20,.72)", "rgba(0,229,255,.45)", 3);
  otoDrawText(ctx, `Player: ${data.username || "Player"}`, 92, 148, 24, "#8EEBFF", 900);
  otoDrawText(ctx, `Bet: ${Number(data.bet || 0).toLocaleString("id-ID")} Hansip Coin`, w - 92, 148, 24, "#F7FAFF", 900, "right");
  otoDrawText(ctx, "DEALER", 100, 202, 24, "#FF8FA3", 1000);
  otoDrawText(ctx, "PLAYER", 100, 390, 24, "#00E5FF", 1000);
  const dealer = data.dealerCards || [];
  const player = data.playerCards || [];
  const dShow = Math.min(dealer.length, Math.max(0, frame - 0));
  const pShow = Math.min(player.length, Math.max(0, frame - 1));
  for (let i = 0; i < 2; i++) otoDrawCard(ctx, 260 + i * 110, 198, 86, 124, dealer[i], i >= dShow);
  for (let i = 0; i < 2; i++) otoDrawCard(ctx, 260 + i * 110, 386, 86, 124, player[i], i >= pShow);
  const showTotals = frame >= 5;
  otoDrawText(ctx, showTotals ? `Total Dealer: ${data.dealerTotal}` : "Dealing cards...", 510, 240, 28, "#F7FAFF", 1000);
  otoDrawText(ctx, showTotals ? `Total Player: ${data.playerTotal}` : "Kartu sedang dibagikan", 510, 430, 28, "#F7FAFF", 1000);
  otoDrawRound(ctx, 92, 560, w - 184, 92, 24, "rgba(0,229,255,.10)", data.win ? "#00E5FF" : data.draw ? "#FFD166" : "#FF5F7A", 3);
  otoDrawText(ctx, frame >= 6 ? (data.result || "RESULT") : "Menunggu hasil...", w / 2, 580, 34, data.win ? "#00E5FF" : data.draw ? "#FFD166" : "#FF5F7A", 1000, "center");
  otoDrawText(ctx, frame >= 6 ? `Saldo: ${Number(data.coin || 0).toLocaleString("id-ID")} Hansip Coin` : "", w / 2, 620, 20, "#DDFBFF", 900, "center");
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 52, h - 42, 18, "rgba(247,250,255,.76)", 900, "right");
}
async function generateBlackjackAnimation(user, data = {}) {
  if (!otoAnimationAllowed("blackjack")) return "";
  const w = 1000, h = 720, frames = [];
  for (let f = 0; f < 8; f++) { const c = createCanvas(w, h); otoDrawBlackjackScene(c.getContext("2d"), w, h, { ...data, username: user.username }, f); frames.push(c); }
  return otoCanvasesToGif(frames, otoVisualPath("blackjack_gif", `${user.id}_blackjack`, "gif"), 95);
}
function otoDrawCoinFlipScene(ctx, w, h, data = {}, frame = 99) {
  otoDrawBg(ctx, w, h, "OTO COIN FLIP", "Heads / Tails • Hansip Coin virtual");
  const cx = w / 2, cy = 265;
  const flipScale = frame < 7 ? Math.abs(Math.cos(frame * Math.PI / 3.5)) : 1;
  const rx = 130 * Math.max(.10, flipScale);
  const grd = ctx.createRadialGradient(cx - 35, cy - 40, 10, cx, cy, 160); grd.addColorStop(0, "#F7FAFF"); grd.addColorStop(.45, "#00E5FF"); grd.addColorStop(1, "#0B5CFF");
  ctx.fillStyle = grd; ctx.beginPath(); ctx.ellipse(cx, cy, rx, 130, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#9AF7FF"; ctx.lineWidth = 6; ctx.stroke();
  if (rx > 30) { otoDrawText(ctx, frame < 7 ? "Hansip" : (data.side || "HEADS"), cx, cy - 34, 42, "#07111F", 1000, "center"); otoDrawText(ctx, "◆", cx, cy + 20, 34, "#07111F", 1000, "center"); }
  otoDrawRound(ctx, 90, 465, w - 180, 96, 24, "rgba(2,8,20,.72)", data.win ? "#00E5FF" : "#FF5F7A", 3);
  otoDrawText(ctx, `Pilih: ${String(data.choice || "HEADS").toUpperCase()}  •  Bet: ${Number(data.bet || 0).toLocaleString("id-ID")}`, cx, 480, 24, "#DDFBFF", 900, "center");
  otoDrawText(ctx, frame >= 7 ? `${data.win ? "WIN" : "LOSE"} • Hasil ${data.side}` : "Coin sedang berputar...", cx, 518, 30, data.win ? "#00E5FF" : "#FF5F7A", 1000, "center");
  otoDrawText(ctx, "Hansip Coin hanya virtual game, bukan uang asli.", cx, 588, 20, "#B9EFFF", 800, "center");
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 52, h - 42, 18, "rgba(247,250,255,.76)", 900, "right");
}
async function generateCoinFlipAnimation(user, data = {}) {
  if (!otoAnimationAllowed("coinflip")) return "";
  const w = 1000, h = 660, frames = [];
  for (let f = 0; f < 9; f++) { const c = createCanvas(w, h); otoDrawCoinFlipScene(c.getContext("2d"), w, h, data, f); frames.push(c); }
  return otoCanvasesToGif(frames, otoVisualPath("coinflip_gif", `${user.id}_coinflip`, "gif"), 80);
}
async function otoVisualHuntFile(user, npc, player, reward = {}) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-hunt", { title: "OTO HUNT", icon: otoSvgConcept(npc.name), rarity: npc.rarity });
  const w = 1000, h = 560, file = otoVisualPath("hunt", `${user.id}_hunt`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, "Hansip HUNT RESULT", "Hunt NPC • Collection Premium");
  otoDrawRound(ctx, 54, 122, 360, 360, 30, "rgba(2,8,20,.72)", otoVColor(npc.rarity), 3); otoDrawNpcIcon(ctx, 90, 152, 288, npc);
  otoDrawText(ctx, `Hunter: ${user.username}`, 450, 130, 22, "#8EEBFF", 800);
  otoDrawText(ctx, otoFitText(ctx, npc.name, 470, 42, 1000), 450, 168, 42, "#F7FAFF", 1000);
  otoDrawText(ctx, `${otoRarity(npc.rarity).emoji} ${otoRarity(npc.rarity).name} • ${npc.element}`, 450, 222, 26, otoVColor(npc.rarity), 900);
  otoDrawText(ctx, `Variant: ${reward.variant || "Normal"}`, 450, 260, 22, "#DDFBFF", 800);
  otoDrawText(ctx, `Skill: ${npc.skill}`, 450, 296, 22, "#DDFBFF", 800);
  otoDrawText(ctx, `Power: ${Number(reward.power || npc.power || 0).toLocaleString("id-ID")}`, 450, 332, 28, "#FFFFFF", 1000);
  otoDrawRound(ctx, 450, 382, 480, 92, 22, "rgba(0,229,255,.10)", "rgba(0,229,255,.35)", 2);
  otoDrawText(ctx, `+${reward.xp || 0} EXP   +${reward.coin || 0} Coin`, 475, 398, 26, "#F7FAFF", 1000);
  otoDrawText(ctx, `${reward.fragment || "Fragment"}  •  ${reward.crate || "Crate chance: none"}`, 475, 436, 20, "#B9EFFF", 800);
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 48, h - 46, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
async function otoVisualCardFile(user, npc, owned = {}) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("card", npc.id, { title: npc.name, rarity: npc.rarity, icon: otoSvgConcept(npc.name), element: npc.element, skill: npc.skill });
  const w = 800, h = 1100, file = otoVisualPath("card", `${user.id}_${npc.id}_card`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, "Hansip NPC CARD", `${otoRarity(npc.rarity).emoji} ${otoRarity(npc.rarity).name} • ${npc.element}`);
  const rarity = otoRarity(npc.rarity), variant = otoVariantMeta(owned.variant || "normal");
  otoDrawRound(ctx, 66, 125, 668, 520, 42, "rgba(2,8,20,.72)", rarity.color, 5); otoDrawNpcIcon(ctx, 190, 190, 420, npc);
  otoDrawText(ctx, otoFitText(ctx, npc.name, 620, 46, 1000), 400, 675, 46, "#FFFFFF", 1000, "center");
  otoDrawText(ctx, `${variant.key === "normal" ? "Normal" : variant.emoji + " " + variant.name} • ${npc.skill}`, 400, 732, 24, "#B9EFFF", 800, "center");
  otoDrawRound(ctx, 72, 790, 656, 190, 26, "rgba(0,229,255,.10)", "rgba(255,255,255,.16)", 2);
  const level = owned.level || 1, exp = owned.exp || 0, need = level * 400, power = otoOwnedNpcPower(owned.id ? owned : { ...npc, level, power: npc.power, variant: owned.variant || "normal" });
  otoDrawText(ctx, `Lv. ${level}`, 105, 820, 28, "#FFFFFF", 1000); otoDrawText(ctx, `Power ${Number(power).toLocaleString("id-ID")}`, 590, 820, 28, "#FFFFFF", 1000, "right");
  otoDrawBar(ctx, 105, 870, 490, 30, Math.min(1, exp / need), "#00E5FF", `${exp}/${need}`);
  otoDrawText(ctx, `Weapon: ${owned.weapon ? (otoFindItem(owned.weapon)?.name || owned.weapon) : "Belum equip"}`, 105, 920, 22, "#DDFBFF", 800);
  otoDrawText(ctx, `Status: ${owned.locked ? "🔒 Locked" : "🔓 Unlocked"}`, 105, 952, 22, "#DDFBFF", 800);
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 50, h - 54, 20, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
function otoTeamVisualList(player, fallback = true) {
  const team = (player.team || []).filter(Boolean).map(id => player.npcs[id]).filter(Boolean);
  if (team.length) return team;
  if (!fallback) return [];
  return Object.values(player.npcs || {}).sort((a,b)=>otoOwnedNpcPower(b)-otoOwnedNpcPower(a)).slice(0, 3);
}
async function otoVisualBattleFile(user, player, enemyList, result = {}) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-battle", { title: "OTO BATTLE", icon: "⚔️", rarity: result.win ? "epic" : "rare" });
  const w = 1440, h = 1080, file = otoVisualPath("battle", `${user.id}_battle`), c = createCanvas(w, h), ctx = c.getContext("2d");
  const team = otoTeamVisualList(player, true).slice(0, 3);
  const fallbackTeam = [otoFindNpc("Kucing Pajak"), otoFindNpc("Buaya Chillax") || otoFindNpc("Bebek Sigma"), otoFindNpc("Slimu Bening") || otoFindNpc("Kucing Numpang Lewat")].filter(Boolean);
  const playerTeam = team.length ? team : fallbackTeam;
  const enemyTeam = (enemyList && enemyList.length ? enemyList : [otoFindNpc("Ayam Cyber"), otoFindNpc("Raja Kursi Plastik"), otoFindNpc("Octopi Nyinyir")].filter(Boolean)).slice(0, 3);
  otoDrawBg(ctx, w, h, "Hansip BATTLE", "Team kamu masuk battle!");
  // top HUD
  otoDrawRound(ctx, 42, 128, 358, 70, 22, "rgba(11,92,255,.24)", "#00E5FF", 3);
  otoDrawText(ctx, "TIM KAMU", 220, 149, 30, "#8EEBFF", 1000, "center");
  otoDrawRound(ctx, 1040, 128, 358, 70, 22, "rgba(255,95,122,.18)", "#FF5F7A", 3);
  otoDrawText(ctx, "TIM MUSUH", 1220, 149, 30, "#FF8FA3", 1000, "center");
  const totalLevel = playerTeam.reduce((a,n)=>a+Number(n.level || 1),0);
  const enemyLevel = enemyTeam.reduce((a,n)=>a+Number(n.level || 1),0);
  otoDrawRound(ctx, 430, 128, 260, 70, 22, "rgba(2,8,20,.64)", "rgba(0,229,255,.30)", 2);
  otoDrawText(ctx, "TOTAL LEVEL", 560, 142, 18, "#9FB9FF", 900, "center");
  otoDrawText(ctx, String(totalLevel || 0), 560, 164, 34, "#00E5FF", 1000, "center");
  otoDrawRound(ctx, 700, 116, 92, 92, 28, "rgba(0,229,255,.12)", "#00E5FF", 3);
  otoDrawText(ctx, "VS", 746, 144, 36, "#A9F8FF", 1000, "center");
  otoDrawRound(ctx, 802, 128, 260, 70, 22, "rgba(2,8,20,.64)", "rgba(255,95,122,.30)", 2);
  otoDrawText(ctx, "TOTAL LEVEL", 932, 142, 18, "#FFA6B5", 900, "center");
  otoDrawText(ctx, String(enemyLevel || 0), 932, 164, 34, "#FF5F7A", 1000, "center");
  otoDrawText(ctx, "⚔", 720, 530, 58, "rgba(0,229,255,.85)", 1000, "center");

  function battleRow(n, idx, x, y, red = false) {
    const sideColor = red ? "#FF4D6D" : "#00E5FF";
    const hpMax = 560 + idx * 80 + (red ? 100 : 60);
    const hpNow = Math.max(80, Math.floor(hpMax * (red ? (0.82 - idx * .08) : (0.78 - idx * .07))));
    const power = Number(otoOwnedNpcPower(n) || n.power || (900 + idx * 120));
    const level = Number(n.level || (red ? 19 + idx : 18 + idx));
    otoDrawRound(ctx, x, y, 610, 184, 24, "rgba(2,8,20,.72)", sideColor, 3);
    otoDrawNpcIcon(ctx, x + 26, y + 24, 136, n, red ? "red" : "blue");
    otoDrawText(ctx, otoFitText(ctx, n.name || "NPC Hansip", 360, 30, 1000), x + 185, y + 28, 30, "#FFFFFF", 1000);
    otoDrawText(ctx, "HP", x + 185, y + 82, 20, "#DDFBFF", 900);
    otoDrawBar(ctx, x + 235, y + 76, 320, 32, hpNow / hpMax, sideColor, `${hpNow}/${hpMax}`);
    const stY = y + 122;
    const statColor = red ? "#FFB5C2" : "#B9EFFF";
    otoDrawText(ctx, `⚔ ${72 + idx*9 + (red?8:0)}`, x + 185, stY, 22, statColor, 900);
    otoDrawText(ctx, `🛡 ${45 + idx*5}`, x + 285, stY, 22, statColor, 900);
    otoDrawText(ctx, `♥ ${34 + idx*6}`, x + 385, stY, 22, statColor, 900);
    otoDrawText(ctx, `↯ ${61 - idx*7 + (red?4:0)}`, x + 485, stY, 22, statColor, 900);
    otoDrawRound(ctx, x + 185, y + 148, 112, 30, 12, "rgba(255,255,255,.05)", sideColor, 1);
    otoDrawText(ctx, `Lv. ${level}`, x + 241, y + 154, 18, "#F7FAFF", 900, "center");
    otoDrawRound(ctx, x + 315, y + 148, 245, 30, 12, "rgba(255,255,255,.05)", sideColor, 1);
    otoDrawText(ctx, `POWER ${power.toLocaleString("id-ID")}`, x + 438, y + 154, 18, sideColor, 1000, "center");
  }
  const startY = 236;
  playerTeam.slice(0,3).forEach((n,i)=>battleRow(n, i, 42, startY+i*210, false));
  enemyTeam.slice(0,3).forEach((n,i)=>battleRow(n, i, 788, startY+i*210, true));
  const resultColor = result.win ? "#00E5FF" : result.draw ? "#FFD166" : "#FF5F7A";
  otoDrawRound(ctx, 330, 884, 780, 118, 28, "rgba(2,8,20,.78)", resultColor, 3);
  otoDrawText(ctx, `${result.win ? "MENANG" : result.draw ? "DRAW" : "KALAH"} dalam ${result.turns || 8} turn!`, 720, 910, 42, resultColor, 1000, "center");
  otoDrawText(ctx, `+${result.xp || 0} EXP  •  +${result.coin || 0} Hansip Coin`, 720, 962, 26, "#F7FAFF", 900, "center");
  otoDrawText(ctx, "DESA TULUS • Hansip", w / 2, h - 46, 20, "rgba(247,250,255,.78)", 900, "center");
  return otoCanvasToFile(c, file);
}

async function otoVisualProfileFile(user, player) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-panel", { title: "OTO PROFILE", icon: "👤", rarity: "rare" });
  const w = 1000, h = 560, file = otoVisualPath("profile", `${user.id}_profile`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, "Hansip PROFILE CARD", "HANSIP DESA TULUS");
  otoDrawRound(ctx, 70, 130, 250, 250, 34, "rgba(2,8,20,.72)", "#00E5FF", 3);
  otoDrawText(ctx, (user.username || "OT").slice(0,2).toUpperCase(), 195, 210, 84, "#F7FAFF", 1000, "center");
  const lvl = otoLevel(player.exp), need = Math.max(1, lvl*500), progress = (player.exp % need)/need;
  otoDrawText(ctx, user.username, 360, 135, 40, "#FFFFFF", 1000); otoDrawText(ctx, `Rank: ${lvl < 5 ? "Warga Baru" : lvl < 20 ? "Petualang Tulus" : "Legenda Hansip"}`, 360, 185, 24, "#8EEBFF", 900);
  otoDrawBar(ctx, 360, 230, 520, 34, progress, "#00E5FF", `Lv. ${lvl} • ${player.exp} EXP`);
  otoDrawText(ctx, `💰 ${Number(player.coin||0).toLocaleString("id-ID")} Hansip Coin`, 360, 290, 26, "#F7FAFF", 900);
  otoDrawText(ctx, `🎴 NPC ${Object.keys(player.npcs||{}).length} • ⚔️ Team ${otoTeamPower(player).toLocaleString("id-ID")}`, 360, 330, 24, "#DDFBFF", 800);
  otoDrawText(ctx, `Win/Lose: ${player.stats?.wins || 0}/${player.stats?.losses || 0}`, 360, 368, 22, "#DDFBFF", 800);
  const team = otoTeamVisualList(player, true).slice(0,5); team.forEach((n,i)=>otoDrawNpcIcon(ctx, 360+i*92, 415, 70, n));
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
async function otoVisualNPCFile(user, player, owned = []) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-card", { title: "OTO COLLECTION", icon: "🎴", rarity: "rare" });
  const w = 1000, h = 600, file = otoVisualPath("zoo", `${user.id}_zoo`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, `${user.username}'s Hansip Collection`, "NPC compact • NPC Collection");
  const counts = Object.fromEntries(OTO_RARITY_KEYS.map(r=>[r, Object.values(player.npcs||{}).filter(n=>n.rarity===r).length]));
  let x = 70, y = 140; OTO_RARITY_KEYS.slice(0,7).forEach((r, ri)=>{ const rar=otoRarity(r); otoDrawText(ctx, `${rar.emoji} ${rar.name}`, x, y + ri*52, 22, rar.color, 1000); for(let i=0;i<8;i++){ const has=i<Math.min(8,counts[r]||0); otoDrawRound(ctx, x+190+i*40, y+ri*52-2, 30,30,8, has?rar.color:"rgba(255,255,255,.08)", has?"#F7FAFF":"rgba(255,255,255,.18)",1); if(!has) otoDrawText(ctx,"?",x+205+i*40,y+ri*52+2,18,"#7E8BAA",900,"center"); }});
  const strongest = Object.values(player.npcs||{}).sort((a,b)=>otoOwnedNpcPower(b)-otoOwnedNpcPower(a))[0]; if(strongest){ otoDrawRound(ctx, 710, 160, 220, 270, 28, "rgba(2,8,20,.72)", otoVColor(strongest.rarity), 3); otoDrawNpcIcon(ctx, 745, 190, 150, strongest); otoDrawText(ctx,"FEATURED",820,350,18,"#8EEBFF",900,"center"); otoDrawText(ctx,otoFitText(ctx,strongest.name,190,22,900),820,378,22,"#FFFFFF",900,"center"); otoDrawText(ctx,`Power ${otoOwnedNpcPower(strongest).toLocaleString("id-ID")}`,820,410,18,"#DDFBFF",800,"center"); }
  otoDrawText(ctx, `Collection Points: ${Object.keys(player.npcs||{}).length * 10}`, 70, 530, 24, "#F7FAFF", 1000);
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
async function otoVisualInventoryFile(user, player) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-inventory", { title: "OTO INVENTORY", icon: "🎒", rarity: "rare" });
  const w = 1000, h = 560, file = otoVisualPath("inventory", `${user.id}_inventory`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, "Hansip INVENTORY", `${user.username}'s item summary`);
  const boxes = [ ["Hansip Coin", Number(player.coin||0).toLocaleString("id-ID"), "💰"], ["Card Dust", Number(player.dust||0).toLocaleString("id-ID"), "🎴"], ["Total NPC", Object.keys(player.npcs||{}).length, "💠"], ["Weapon", Object.keys(player.inventory?.weapons||{}).length, "⚔️"], ["Crate", Object.values(player.inventory?.crates||{}).reduce((a,b)=>a+Number(b||0),0), "📦"], ["Fragment", Object.values(player.inventory?.fragments||{}).reduce((a,b)=>a+Number(b||0),0), "🧩"] ];
  boxes.forEach((b,i)=>{ const x=70+(i%3)*295, y=145+Math.floor(i/3)*135; otoDrawRound(ctx,x,y,250,105,22,"rgba(2,8,20,.72)","rgba(0,229,255,.32)",2); otoDrawText(ctx,b[2],x+28,y+28,34,"#FFFFFF",900); otoDrawText(ctx,b[0],x+80,y+24,20,"#8EEBFF",900); otoDrawText(ctx,String(b[1]),x+80,y+56,28,"#F7FAFF",1000); });
  const best = Object.values(player.npcs||{}).sort((a,b)=>otoOwnedNpcPower(b)-otoOwnedNpcPower(a))[0]; otoDrawText(ctx, `Best NPC: ${best ? best.name : "Belum ada"}`, 78, 445, 24, "#F7FAFF", 1000);
  otoDrawText(ctx, "Command: otinv crate • otinv weapon • otopen all", 78, 482, 20, "#B9EFFF", 800);
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
async function otoVisualCrateFile(user, summary = {}) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-crate", { title: "OTO CRATE", icon: "📦", rarity: summary.best?.rarity || "rare" });
  const w = 1000, h = 560, file = otoVisualPath("crate", `${user.id}_crate`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, summary.mass ? "Hansip CRATE MASS OPEN" : "Hansip CRATE OPENED", "Weapon hanya dari crate");
  otoDrawRound(ctx, 70, 135, 270, 300, 34, "rgba(2,8,20,.72)", otoVColor(summary.best?.rarity || "rare"), 4); otoDrawText(ctx,"📦",205,210,124,"#FFFFFF",900,"center");
  const opened = Object.entries(summary.opened||{}).map(([id,n])=>`${id.replace(/_/g," ")} x${n}`).slice(0,4).join(" • ") || "Crate x1";
  otoDrawText(ctx, opened, 390, 145, 22, "#8EEBFF", 900);
  otoDrawText(ctx, `Best Drop: ${summary.best ? summary.best.name : "Belum ada"}`, 390, 190, 30, "#F7FAFF", 1000);
  otoDrawText(ctx, `Coin +${Number(summary.coin||0).toLocaleString("id-ID")}   Dust +${summary.dust||0}`, 390, 245, 26, "#DDFBFF", 900);
  const weaponLine = Object.entries(summary.weapons||{}).slice(0,5).map(([n,q])=>`⚔️ ${n} x${q}`).join("   ") || "Tidak ada weapon"; otoDrawText(ctx, otoFitText(ctx, weaponLine, 530, 22, 800), 390, 295, 22, "#FFFFFF", 800);
  const fragLine = Object.entries(summary.fragments||{}).slice(0,5).map(([n,q])=>`🧩 ${n} x${q}`).join("   ") || "Tidak ada fragment"; otoDrawText(ctx, otoFitText(ctx, fragLine, 530, 22, 800), 390, 335, 22, "#FFFFFF", 800);
  otoDrawRound(ctx,390,390,530,64,20,"rgba(0,229,255,.10)","rgba(0,229,255,.35)",2); otoDrawText(ctx, "Crate kebuka rapi. Yang keluar bukan cuma item, tapi juga percaya diri.", 415, 412, 20, "#B9EFFF", 800);
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}
async function otoVisualArcadeFile(user, data = {}) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-royale", { title: "OTO ARCADE", icon: "🃏", rarity: data.win ? "epic" : "rare" });
  if (data.kind === "blackjack") {
    const gif = await generateBlackjackAnimation(user, data);
    if (otoVisualFileValid(gif)) return gif;
    const w = 1000, h = 720, file = otoVisualPath("arcade", `${user.id}_blackjack`), c = createCanvas(w, h), ctx = c.getContext("2d");
    otoDrawBlackjackScene(ctx, w, h, { ...data, username: user.username }, 99);
    return otoCanvasToFile(c, file);
  }
  if (data.kind === "coinflip") {
    const gif = await generateCoinFlipAnimation(user, data);
    if (otoVisualFileValid(gif)) return gif;
    const w = 1000, h = 660, file = otoVisualPath("arcade", `${user.id}_coinflip`), c = createCanvas(w, h), ctx = c.getContext("2d");
    otoDrawCoinFlipScene(ctx, w, h, data, 99);
    return otoCanvasToFile(c, file);
  }
  const w = 1000, h = 620, file = otoVisualPath("arcade", `${user.id}_arcade`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, data.title || "Hansip Virtual Arcade", "Coin game only • no real money");
  otoDrawRound(ctx, 70, 125, 860, 330, 38, "rgba(2,8,20,.72)", data.win ? "#00E5FF" : data.draw ? "#FFD166" : "#FF5F7A", 4);
  if (data.mode === "card") {
    otoDrawCard(ctx, 330, 200, 94, 136, data.playerCard || { rank: "J", suit: "♠" });
    otoDrawCard(ctx, 575, 200, 94, 136, data.dealerCard || { rank: "9", suit: "♦" });
    otoDrawText(ctx, "PLAYER", 377, 350, 20, "#00E5FF", 1000, "center");
    otoDrawText(ctx, "DEALER", 622, 350, 20, "#FF8FA3", 1000, "center");
  } else {
    const coinData = { side: data.resultSide || (data.win ? "ROYALE" : "ZONK"), choice: data.choice || "ROYALE", win: data.win, bet: data.bet, coin: data.coin };
    otoDrawCoinFlipScene(ctx, w, h, coinData, 99);
    return otoCanvasToFile(c, file);
  }
  otoDrawText(ctx, data.result || "RESULT", 500, 410, 42, data.win ? "#00E5FF" : data.draw ? "#FFD166" : "#FF5F7A", 1000, "center");
  otoDrawText(ctx, `Bet ${Number(data.bet||0).toLocaleString("id-ID")} Hansip Coin • Saldo ${Number(data.coin||0).toLocaleString("id-ID")}`, 500, 478, 25, "#F7FAFF", 900, "center");
  otoDrawText(ctx, "Hansip Coin hanya virtual game, bukan uang asli.", 500, 526, 20, "#B9EFFF", 800, "center");
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}

async function otoVisualLeaderboardFile(user, players = []) {
  if (!otoVisualCanvasAvailable()) return otoGetOrCreateAsset("banner", "oto-top", { title: "OTO TOP", icon: "🏆", rarity: "legendary" });
  const w = 1000, h = 600, file = otoVisualPath("leaderboard", `top`), c = createCanvas(w, h), ctx = c.getContext("2d");
  otoDrawBg(ctx, w, h, "Hansip LEADERBOARD", "Top 10 HANSIP DESA TULUS");
  players.slice(0,10).forEach((p,i)=>{ const y=125+i*41; otoDrawRound(ctx,80,y,840,34,12,i<3?"rgba(0,229,255,.16)":"rgba(2,8,20,.58)",i<3?"#00E5FF":"rgba(255,255,255,.12)",1); otoDrawText(ctx,`#${i+1}`,105,y+7,18,"#8EEBFF",1000); otoDrawText(ctx,`@${p.username || p.userId}`,165,y+7,18,"#FFFFFF",900); otoDrawText(ctx,`Lv ${otoLevel(p.exp)} • ${Number(p.coin||0).toLocaleString("id-ID")} coin • Team ${otoTeamPower(p).toLocaleString("id-ID")}`,895,y+7,18,"#DDFBFF",800,"right"); });
  otoDrawText(ctx, "DESA TULUS • Hansip", w - 42, h - 36, 18, "rgba(247,250,255,.76)", 900, "right");
  return otoCanvasToFile(c, file);
}

function otoPayload(embed, assetFile) {
  if (assetFile && otoVisualFileValid(assetFile)) {
    const name = path.basename(assetFile);
    embed.setImage(`attachment://${name}`);
    return { embeds: [embed], files: [new AttachmentBuilder(assetFile, { name })] };
  }
  if (assetFile) console.warn("Generated Hansip visual invalid / empty visual, using fallback embed.");
  return { embeds: [embed] };
}
async function otoReply(message, embed, assetFile = "") { return replyOt(message, otoPayload(embed, assetFile)); }
async function otoLog(text) { const id = otoConfig().logChannelId; if (!id) return; const ch = await client.channels.fetch(id).catch(() => null); if (ch?.isTextBased()) ch.send({ content: String(text).slice(0, 1800) }).catch(() => null); }
function otoIsChannel(message) { return otoConfig().channelId && message.channel?.id === otoConfig().channelId; }
async function otoEnsureChannel(message, ownerBypass = false) {
  const cfg = otoConfig();
  if (!cfg.enabled) { await replyOt(message, { content: "💠 Hansip sedang dinonaktifkan owner." }); return false; }
  if (!cfg.oneChannel || ownerBypass) return true;
  if (!cfg.channelId) { await replyOt(message, { content: "💠 Channel Hansip belum diset. Owner bisa pakai `otsetchannel oto #💠・oto-game`." }); return false; }
  if (message.channel?.id === cfg.channelId) return true;
  const key = `${message.author.id}:oto-redirect`; const last = otoRedirectCooldowns.get(key) || 0; if (Date.now() - last > 9000) { otoRedirectCooldowns.set(key, Date.now()); await message.reply({ content: `💠 Hansip hanya bisa dimainkan di <#${cfg.channelId}>. Biar channel lain tetap rapi, mainnya di sana ya.` }).then(m => setTimeout(() => m.delete().catch(() => null), 10000)).catch(() => null); }
  return false;
}
function otoShouldHandle(message, commandName, args = []) {
  const first = String(args[0] || "").toLowerCase();
  if (OTO_DIRECT_COMMANDS.has(commandName)) return true;
  if (OTO_OVERLAP_COMMANDS.has(commandName)) return otoIsChannel(message) || first === "oto" || first === "oto-game" || first === "otogame";
  return false;
}
function otoHelpEmbed() {
  return otoBaseEmbed("💠 Hansip Help Center", `━━━━━━━━━━━━━━━━━━━━

🎴 **Koleksi**
\`oth\` — hunt NPC
\`otnpc\` — koleksi NPC
\`otcard <npc>\` — lihat card NPC
\`otinv\` — inventory
\`otlock <npc>\` / \`otunlock <npc>\` — kunci/buka NPC
\`otrelease <npc> confirm\` — release aman

⚔️ **Team & Battle**
\`otteam view\` — lihat team 5 NPC + synergy
\`otteam add <npc> <1-5>\` — pasang team
\`otb\` — battle
\`otupgrade <npc>\` — upgrade
\`otevolve <npc>\` — evolve/ascend

🎁 **Crate**
\`otopen <crate>\` — buka crate
\`otopen all\` — buka semua crate
\`otopen all basic/neon/royale/mythic/secret\` — mass open filter

💰 **Coin Game**
\`otkerja\` — cari coin
\`othoki <jumlah/all>\` — royale flip
\`otkartu <jumlah/all>\` — kartu virtual

🎯 **Harian**
\`otdaily\` — claim harian
\`otquest\` — misi harian
\`otshop\` — shop
\`ottop\` — leaderboard

━━━━━━━━━━━━━━━━━━━━
Coin Hansip hanya coin game virtual, bukan uang asli, tidak ada top-up/cashout.`);
}
async function otoSendPanel(message, editOld = false) {
  otoEnsureFiles();
  const cfg = otoConfig();
  const target = cfg.channelId ? await client.channels.fetch(cfg.channelId).catch(() => null) : message.channel;
  if (!target?.isTextBased()) return replyOt(message, { content: "❌ Channel Hansip belum valid. Pakai `otsetchannel oto #channel`." });
  const embed = otoBaseEmbed("💠 Hansip — HANSIP DESA TULUS", "Game koleksi NPC ultra premium: hunt, card otomatis, variant/shiny, duplicate jadi fragment, crate, weapon khusus crate, team synergy, battle, daily loop, leaderboard, dan mode hoki virtual coin game.\n\n━━━━━━━━━━━━━━━━━━━━\n\n**Mulai:** `oth` / `othunt`\n**Card:** `otcard Kucing Pajak`\n**Inventory:** `otinv`\n**Team:** `otteam view`\n**Battle:** `otb`\n**Crate:** `otopen all`\n**Coin:** `otkerja`\n**Royale:** `othoki 1000`\n\n━━━━━━━━━━━━━━━━━━━━\nMain hanya di channel Hansip supaya server tetap rapi.");
  const asset = otoGetOrCreateAsset("banner", "oto-panel", { title: "Hansip", subtitle: "HANSIP DESA TULUS ROYALE", icon: "💠", rarity: "rare" });
  const payload = otoPayload(embed, asset);
  let sent = null;
  if (editOld && config.otoPanelMessageId && cfg.channelId) {
    const old = await target.messages.fetch(config.otoPanelMessageId).catch(() => null);
    if (old) sent = await old.edit(payload).catch(() => null);
  }
  if (!sent) sent = await target.send(payload).catch(() => null);
  if (sent) { config.otoPanelMessageId = sent.id; saveConfig(config); }
  return replyOt(message, { content: `✅ Panel Hansip berhasil ${editOld ? "diupdate" : "dikirim"} di ${target}.` });
}
async function otoCmdSetChannel(message, args = []) {
  const mention = message.mentions.channels.first();
  const id = mention?.id || String(args.find(a => /^\d{15,25}$/.test(a)) || "");
  if (!id) return replyOt(message, { content: "⚠️ Format: `otsetchannel oto #💠・oto-game`" });
  config.otoChannelId = id; saveConfig(config); otoEnsureFiles();
  return replyOt(message, { content: `✅ Channel Hansip diset ke <#${id}>. Data lama tetap aman.` });
}
async function otoCmdSetLog(message, args = []) {
  const mention = message.mentions.channels.first();
  const id = mention?.id || String(args.find(a => /^\d{15,25}$/.test(a)) || "");
  if (!id) return replyOt(message, { content: "⚠️ Format: `otchannel log #channel-log`" });
  config.otoLogChannelId = id; saveConfig(config);
  return replyOt(message, { content: `✅ Channel log Hansip diset ke <#${id}>.` });
}
async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  otoEnsureFiles(); otoCleanOldVisualCache();
  const wait = otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 15000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum hunt lagi.` });
  const { player } = otoGetPlayer(message.author);
  const npc = otoPickNpc();
  const rarity = otoRarity(npc.rarity);
  const add = otoAddNpc(player, npc);
  const variant = add.variant || OTO_VARIANTS[0];
  const coin = 40 + Math.floor(Math.random() * 90) + otoRarityIndex(npc.rarity) * 45;
  const xp = 20 + Math.floor(Math.random() * 45);
  const huntFrag = `${rarity.name} Fragment`;
  if (!add.duplicate) otoAddFragment(player, huntFrag, 1);
  player.coin += coin; player.exp += xp; player.level = otoLevel(player.exp);
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  if (add.duplicate) player.stats.duplicates = Number(player.stats.duplicates || 0) + 1;
  if (variant.key !== "normal") player.stats.variantDrops = Number(player.stats.variantDrops || 0) + 1;
  const syn = otoTeamSynergy(player);
  const crateBase = player.luckUntil > Date.now() ? 0.16 : 0.08;
  const crateChance = Math.random() < Math.min(0.30, crateBase + Number(syn.bonusCrate || 0));
  let crateText = "Tidak dapat crate kali ini.";
  if (crateChance) { const crate = Math.random() < 0.75 ? "Basic Crate" : "Neon Crate"; otoAddCrate(player, crate, 1); crateText = `Dapat **${crate} x1**`; }
  otoSavePlayer(message.author, player);
  const foundLine = add.duplicate
    ? `🔁 **Duplicate!** ${npc.name} jadi **${add.fragment} x${add.fragmentQty}** + **Card Dust ${add.dustQty}**.`
    : `${rarity.emoji} **${rarity.name}** • **${npc.name}**${variant.key !== "normal" ? `\nVariant: ${variant.emoji} **${variant.name}** • Power Bonus +${Math.round((variant.bonus - 1) * 100)}%` : ""}`;
  const embed = otoBaseEmbed("🌱 Hansip Hunt", `**${message.author.username}** melakukan hunt di HANSIP DESA TULUS!\n\n━━━━━━━━━━━━━━━━━━━━\n\n🎴 NPC Found\n${foundLine}\n\n🎁 Reward\n💰 Coin +${coin}\n⭐ EXP +${xp}\n🧩 ${add.duplicate ? `${add.fragment} x${add.fragmentQty}` : `${huntFrag} x1`}\n${add.duplicate ? `🎴 Card Dust +${add.dustQty}\n` : ""}\n📦 ${crateText}\n\nKomentar:\n${add.duplicate ? "NPC itu balik lagi. Invoice-nya juga nambah." : otoRandomHumor("hunt")}\n\nCommand: \`otcard ${npc.name}\` • \`otteam add ${npc.name} 1\` • \`otinv\``);
  const asset = await otoVisualHuntFile(message.author, npc, player, { coin, xp, fragment: add.duplicate ? `${add.fragment} x${add.fragmentQty}` : `${huntFrag} x1`, crate: crateText.replace(/\*\*/g,""), variant: variant.name, power: Math.floor(npc.power * (variant.bonus || 1)) });
  return otoReply(message, embed, asset);
}
function otoInventoryLines(player, type = "all") {
  const items = otoReadItems();
  const buckets = type === "crate" ? ["crates"] : type === "weapon" ? ["weapons"] : type === "fragment" ? ["fragments"] : type === "item" ? ["items"] : ["crates", "weapons", "fragments", "items"];
  const lines = [];
  for (const bucket of buckets) for (const [id, qty] of Object.entries(player.inventory?.[bucket] || {})) { const item = items.find(x => x.id === id); lines.push(`• **${item?.name || id}** x${qty}${item ? ` — ${otoRarity(item.rarity).emoji} ${item.rarity}` : ""}`); }
  return lines.slice(0, 20);
}
async function otoCmdInv(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const type = String(args[0] || "all").toLowerCase();
  const lines = otoInventoryLines(player, type).slice(0, 18);
  const lockedCount = Object.values(player.npcs || {}).filter(n => n.locked).length;
  const embed = otoBaseEmbed("🎒 OTO INVENTORY", `👤 Player\n${message.author}\n\n━━━━━━━━━━━━━━━━━━━━\n\n💰 Coin: **${player.coin.toLocaleString("id-ID")}**\n🎴 Card Dust: **${Number(player.dust || 0).toLocaleString("id-ID")}**\n🎴 NPC Unique: **${Object.keys(player.npcs || {}).length}**\n🔒 Locked NPC: **${lockedCount}**\n\n${lines.length ? lines.join("\n") : "Inventory masih kosong. Gunakan `oth` atau `otdaily`."}\n\n━━━━━━━━━━━━━━━━━━━━\nKategori: \`otinv crate\` • \`otinv weapon\` • \`otinv fragment\` • \`otinv item\`\nCommand: \`otopen all\` • \`otshop\``);
  const asset = await otoVisualInventoryFile(message.author, player);
  return otoReply(message, embed, asset);
}
async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const target = message.mentions.users.first() || message.author;
  const { player } = otoGetPlayer(target);
  const syn = otoTeamSynergy(player);
  const embed = otoBaseEmbed("👤 OTO PROFILE", `👤 Player\n${target}\n\n━━━━━━━━━━━━━━━━━━━━\n\nLevel: **${otoLevel(player.exp)}**\nEXP: **${player.exp.toLocaleString("id-ID")}**\nCoin: **${player.coin.toLocaleString("id-ID")}**\nCard Dust: **${Number(player.dust || 0).toLocaleString("id-ID")}**\nNPC Unique: **${Object.keys(player.npcs || {}).length}**\nTeam Power: **${otoTeamPower(player).toLocaleString("id-ID")}**\nLuck: **${player.luckUntil > Date.now() ? "Aktif" : "Tidak aktif"}**\n\nSynergy:\n${syn.lines.length ? syn.lines.join("\n") : "Belum ada synergy aktif."}\n\n━━━━━━━━━━━━━━━━━━━━\nLanjut: \`oth\` • \`otinv\` • \`otteam view\` • \`otb\``);
  const asset = await otoVisualProfileFile(target, player);
  return otoReply(message, embed, asset);
}
async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  let owned = Object.values(player.npcs || {});
  if (OTO_RARITY_KEYS.includes(q)) owned = owned.filter(n => n.rarity === q);
  else if (q === "search") { const term = args.slice(1).join(" "); owned = owned.filter(n => n.name.toLowerCase().includes(term.toLowerCase())); }
  const rarityCounts = OTO_RARITY_KEYS.map(r => `${otoRarity(r).emoji}${owned.filter(n => n.rarity === r).length}`).join(" ");
  const strongest = Object.values(player.npcs || {}).sort((a,b)=>otoOwnedNpcPower(b)-otoOwnedNpcPower(a))[0];
  const lines = owned.slice(0, 12).map(n => `${otoRarity(n.rarity).emoji} **${n.name}**${n.variant && n.variant !== "normal" ? ` • ${otoVariantMeta(n.variant).emoji} ${otoVariantMeta(n.variant).name}` : ""} • Lv ${n.level} • Power ${otoOwnedNpcPower(n).toLocaleString("id-ID")}${n.locked ? " • 🔒" : ""}`);
  const desc = `Total Owned Filter: **${owned.length}**\nUnique NPC: **${Object.keys(player.npcs || {}).length}/${otoReadNpcs().length}**\nRarity Count: ${rarityCounts}\nStrongest: ${strongest ? `**${strongest.name}** • ${otoOwnedNpcPower(strongest).toLocaleString("id-ID")} Power` : "Belum ada"}\n\n━━━━━━━━━━━━━━━━━━━━\n${lines.length ? lines.join("\n") : "Belum punya NPC di filter ini. Gunakan `oth` buat hunt."}\n\nFilter: \`otnpc rare\` • \`otnpc epic\` • \`otnpc search kucing\``;
  const asset = await otoVisualNPCFile(message.author, player, owned);
  return otoReply(message, otoBaseEmbed("🎴 OTO NPC COLLECTION", desc), asset);
}
async function otoCmdCard(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const name = args.join(" ");
  if (!name) return replyOt(message, { content: "⚠️ Format: `otcard Kucing Pajak`" });
  const npc = otoFindNpc(name);
  if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." });
  const { player } = otoGetPlayer(message.author);
  const owned = player.npcs[npc.id] || { level: 1, exp: 0, power: npc.power, locked: false, weapon: "", id: npc.id, name: npc.name, rarity: npc.rarity, variant: "normal" };
  const rarity = otoRarity(npc.rarity), variant = otoVariantMeta(owned.variant || "normal");
  const pos = (player.team || []).findIndex(id => id === npc.id);
  const weapon = owned.weapon ? (otoFindItem(owned.weapon)?.name || owned.weapon) : "Belum equip";
  const embed = otoBaseEmbed(`${rarity.emoji} NPC CARD • ${npc.name}`, `━━━━━━━━━━━━━━━━━━━━\nRarity: ${rarity.emoji} **${rarity.name}**\nVariant: ${variant.key === "normal" ? "Normal" : `${variant.emoji} **${variant.name}**`}\nElement: **${npc.element}**\nLevel: **${owned.level || 1}**\nEXP: **${owned.exp || 0} / ${(owned.level || 1) * 400}**\nPower: **${otoOwnedNpcPower(owned).toLocaleString("id-ID")}**\n\nSkill:\n**${npc.skill}**\n\nEffect:\nChance kecil bikin musuh miss karena panik lihat skill Hansip.\n\n━━━━━━━━━━━━━━━━━━━━\nWeapon:\n⚔️ ${weapon}\n\nStatus:\n${owned.locked ? "🔒 Locked" : "🔓 Unlocked"}\n\nTeam:\n${pos >= 0 ? `Posisi ${pos + 1}` : "Belum masuk team"}\n\nCommand:\n\`otupgrade ${npc.name}\` • \`otequip ${npc.name} <weapon>\` • \`otlock ${npc.name}\``);
  const asset = await otoVisualCardFile(message.author, npc, owned);
  return otoReply(message, embed, asset);
}
async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const sub = String(args[0] || "view").toLowerCase();
  if (sub === "add") {
    const pos = Math.max(1, Math.min(5, Number(args[args.length - 1] || 1)));
    const name = args.slice(1, -1).join(" ");
    const npc = otoFindNpc(name);
    if (!npc || !player.npcs[npc.id]) return replyOt(message, { content: "❌ NPC belum kamu miliki atau nama tidak ditemukan." });
    if ((player.team || []).includes(npc.id)) return replyOt(message, { content: "⚠️ NPC itu sudah ada di team." });
    player.team[pos - 1] = npc.id; otoSavePlayer(message.author, player);
    return replyOt(message, { content: `✅ **${npc.name}** masuk team posisi ${pos}. Cek synergy dengan \`otteam view\`.` });
  }
  if (sub === "remove") { const pos = Math.max(1, Math.min(5, Number(args[1] || 1))); player.team[pos - 1] = null; otoSavePlayer(message.author, player); return replyOt(message, { content: `✅ Team posisi ${pos} dikosongkan.` }); }
  if (sub === "clear") { player.team = [null,null,null,null,null]; otoSavePlayer(message.author, player); return replyOt(message, { content: "✅ Team Hansip dikosongkan." }); }
  const catalog = otoReadNpcs();
  const lines = (player.team || []).map((id, i) => { const n = id && player.npcs[id] ? player.npcs[id] : null; const c = n ? (catalog.find(x => x.id === n.id) || n) : null; return n ? `**${i + 1}.** ${otoRarity(n.rarity).emoji} ${n.name} ${n.variant && n.variant !== "normal" ? otoVariantMeta(n.variant).emoji : ""} • Lv ${n.level} • ${c.element || "-"} • Power ${otoOwnedNpcPower(n).toLocaleString("id-ID")}` : `**${i + 1}.** Kosong`; }).join("\n");
  const syn = otoTeamSynergy(player);
  return otoReply(message, otoBaseEmbed("⚔️ OTO TEAM", `${lines}\n\n━━━━━━━━━━━━━━━━━━━━\nTeam Power: **${otoTeamPower(player).toLocaleString("id-ID")}**\nBonus full team 5/5: +15% battle power.\n\nSynergy Aktif:\n${syn.lines.length ? syn.lines.join("\n") : "Belum ada. Coba gabungkan element/rarity yang sama."}\n\nCommand: \`otteam add <npc> <1-5>\` • \`otb\``), await otoVisualBattleFile(message.author, player, [], { power: otoTeamPower(player), enemyPower: 0, win: true, xp: 0, coin: 0, turns: 0 }));
}
async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "battle", Number(config.otoBattleCooldownMs || 30000));
  if (wait) return replyOt(message, { content: `⏳ Battle cooldown **${wait} detik**.` });
  const { player } = otoGetPlayer(message.author);
  const power = otoTeamPower(player);
  if (power <= 0) return replyOt(message, { content: "❌ Kamu belum punya team aktif. Tambahkan NPC dengan: `otteam add <id/nama npc> <slot>`" });
  const enemies = [otoPickNpc(), otoPickNpc(), otoPickNpc()].map((n,i)=>({ ...n, level: 17+i, power: Math.floor(n.power * (0.75 + Math.random() * 0.9)) }));
  const enemyPower = enemies.reduce((a,b)=>a+Number(b.power||0),0);
  const luck = player.luckUntil > Date.now() ? 1.08 : 1; const syn = otoTeamSynergy(player);
  const chance = Math.max(12, Math.min(88, Math.round((power * luck / Math.max(1, power * luck + enemyPower)) * 100)));
  const win = Math.random() * 100 < chance;
  const xp = Math.floor((win ? 85 : 28) * (1 + Number(syn.bonusExp || 0))); const coin = Math.floor((win ? 160 : 45) * (1 + Number(syn.bonusCoin || 0)));
  player.exp += xp; player.coin += coin; player.level = otoLevel(player.exp); player.stats.battles = Number(player.stats.battles || 0) + 1; player.stats[win ? "wins" : "losses"] = Number(player.stats[win ? "wins" : "losses"] || 0) + 1;
  const mvpId = (player.team || []).filter(Boolean).sort((a,b)=>otoOwnedNpcPower(player.npcs[b])-otoOwnedNpcPower(player.npcs[a]))[0]; const mvp = mvpId ? player.npcs[mvpId] : null;
  for (const id of (player.team || []).filter(Boolean)) if (player.npcs[id]) player.npcs[id].exp = Number(player.npcs[id].exp || 0) + (win ? 45 : 15);
  if (win) otoAddFragment(player, `${otoRarity(enemies[0].rarity).name} Fragment`, 2);
  otoSavePlayer(message.author, player);
  const embed = otoBaseEmbed(win ? "⚔️ OTO BATTLE — WIN" : "⚔️ OTO BATTLE — LOSE", `Team Power: **${power.toLocaleString("id-ID")}**\nEnemy Power: **${enemyPower.toLocaleString("id-ID")}**\nChance: **${chance}%**\nSynergy: ${syn.lines.length ? syn.lines.join(" • ") : "Tidak ada"}\n\nResult: ${win ? "✅ Menang" : "😭 Kalah"}\nMVP: ${mvp ? `${otoRarity(mvp.rarity).emoji} **${mvp.name}**` : "Team Hansip"}\nReward: 💰 +${coin} coin • ⭐ +${xp} EXP\n${win ? `🧩 ${otoRarity(enemies[0].rarity).name} Fragment x2` : "🎁 Reward hiburan kecil tetap masuk."}\n\n${win ? otoRandomHumor("battle") : "Team kamu kalah, tapi bukan berarti lemah. Mungkin kursi plastik arena kurang mendukung."}\n\nCommand: \`oth\` • \`otteam view\` • \`otshop\` • \`otopen all\``);
  const asset = await otoVisualBattleFile(message.author, player, enemies, { power, enemyPower, win, xp, coin, turns: 8 });
  return otoReply(message, embed, asset);
}
async function otoCmdWeapon(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const page = Math.max(1, Number(args.find(a => /^\d+$/.test(a)) || 1));
  const entries = Object.entries(player.inventory.weapons || {}).map(([id, qty]) => ({ item: otoFindItem(id) || { name: id, rarity: "common", power: 0 }, qty }));
  const lines = entries.slice((page - 1) * 12, page * 12).map(({item, qty}) => `${otoRarity(item.rarity).emoji} **${item.name}** x${qty} • +${item.power || 0} Power`).join("\n");
  return otoReply(message, otoBaseEmbed("⚔️ OTO WEAPON", `${lines || "Belum punya weapon. Weapon hanya dari crate, pakai `otopen all`."}\n\n━━━━━━━━━━━━━━━━━━━━\nPage ${page} • Command: \`otequip <npc> <weapon>\``), otoGetOrCreateAsset("banner", "oto-crate", { title: "OTO WEAPON", icon: "⚔️", rarity: "rare" }));
}
async function otoCmdRoyale(message, args = [], mode = "flip") {
  if (!(await otoEnsureChannel(message))) return;
  if (config.otoRoyaleEnabled === false) return replyOt(message, { content: "💠 Hansip Royale sedang dinonaktifkan owner." });
  const wait = otoCooldown(message.author.id, `royale:${mode}`, Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum main lagi.` });
  const { player } = otoGetPlayer(message.author);
  let choice = "";
  let amountArg = args[0];
  if (mode === "coinflip") {
    choice = String(args[0] || "").toLowerCase();
    if (!["heads", "tails", "head", "tail", "h", "t"].includes(choice)) return replyOt(message, { content: "⚠️ Format: `otcf heads 100` atau `otcf tails 100`. Coin hanya virtual game Hansip." });
    choice = ["heads", "head", "h"].includes(choice) ? "HEADS" : "TAILS";
    amountArg = args[1];
  }
  const parsed = otoParseAmount(amountArg, player); const maxBet = Math.max(100, Number(mode === "coinflip" ? (config.otoCoinFlipMaxBet || config.otoMaxBet || 50000) : (config.otoMaxBet || 50000))); let bet = parsed.amount;
  if (bet <= 0) return replyOt(message, { content: mode === "coinflip" ? "⚠️ Format: `otcf heads 100` atau `otcf tails 100`." : "⚠️ Format: `othoki 1000` atau `othoki all`. Coin hanya coin game Hansip." });
  if (bet > player.coin) return replyOt(message, { content: "❌ Coin kamu kurang. Pakai `otkerja` dulu." });
  if (bet > maxBet) return replyOt(message, { content: `❌ Max bet Hansip saat ini **${maxBet.toLocaleString("id-ID")} coin**.` });
  let win = false, draw = false, detail = "", assetData = {};
  if (mode === "card") {
    const pv = Math.floor(Math.random() * 13) + 2; const dv = Math.floor(Math.random() * 13) + 2;
    const pc = otoMakeCardObj(pv); const dc = otoMakeCardObj(dv);
    win = pv > dv; draw = pv === dv; detail = `Kartu kamu: **${pc.rank}${pc.suit}**\nKartu dealer: **${dc.rank}${dc.suit}**`;
    assetData = { mode: "card", playerCard: pc, dealerCard: dc };
  } else if (mode === "coinflip") {
    const side = Math.random() < 0.5 ? "HEADS" : "TAILS";
    win = choice === side;
    detail = `Pilihan kamu: **${choice}**\nHasil coin: **${side}**`;
    assetData = { kind: "coinflip", choice, side };
  } else {
    const chance = player.luckUntil > Date.now() ? 0.6 : 0.5; win = Math.random() < chance; const side = win ? "ROYALE 👑" : "ZONK"; detail = `Koin jatuh di sisi **${side}**`; assetData = { resultSide: side };
  }
  if (draw) {} else if (win) player.coin += bet; else player.coin -= bet;
  player.stats.royale = Number(player.stats.royale || 0) + 1; otoSavePlayer(message.author, player);
  const title = draw ? "➖ OTO ARCADE — DRAW" : win ? "✅ OTO ARCADE — MENANG" : "😭 OTO ARCADE — KALAH";
  const embed = otoBaseEmbed(title, `👤 Player\n${message.author}\n\n━━━━━━━━━━━━━━━━━━━━\n\n💰 Bet: **${bet.toLocaleString("id-ID")} Hansip Coin**\n${detail}\n\nSaldo sekarang:\n💵 **${player.coin.toLocaleString("id-ID")} Hansip Coin**\n\nKomentar:\n${otoRandomHumor("royale")}\n\nCatatan:\nCoin di sini hanya coin game Hansip, bukan uang asli. Tidak ada top-up dan cashout.`);
  const asset = await otoVisualArcadeFile(message.author, { ...assetData, title: mode === "card" ? "Hansip Kartu Virtual" : mode === "coinflip" ? "Hansip Coin Flip" : "Hansip Royale Table", icon: mode === "card" ? "🃏" : "🪙", result: draw ? "DRAW" : win ? "MENANG" : "KALAH", win, draw, bet, coin: player.coin });
  return otoReply(message, embed, asset);
}

async function otoCmdBlackjack(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  if (config.otoBlackjackEnabled === false) return replyOt(message, { content: "🃏 Hansip Blackjack sedang OFF." });
  const wait = otoCooldown(message.author.id, "blackjack", Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum blackjack lagi.` });
  const { player } = otoGetPlayer(message.author); const bet = Number(args[0] || 0); const min = Number(config.otoMinBet || 10), max = Number(config.otoBlackjackMaxBet || config.otoMaxBet || 50000);
  if (!bet || bet < min) return replyOt(message, { content: `⚠️ Format: \`otbj ${min}\`. Min bet ${min} Hansip Coin.` });
  if (bet > max) return replyOt(message, { content: `❌ Max bet blackjack **${max.toLocaleString("id-ID")} Hansip Coin**.` });
  if (bet > player.coin) return replyOt(message, { content: "❌ Coin kamu kurang. Pakai `otkerja` dulu." });
  const cardValue = () => Math.floor(Math.random()*13)+2;
  const dealerCards = [otoMakeCardObj(cardValue()), otoMakeCardObj(cardValue())];
  const playerCards = [otoMakeCardObj(cardValue()), otoMakeCardObj(cardValue())];
  const val = cards => cards.reduce((a,c)=>a+Math.min(10, c.value === 14 ? 11 : c.value),0);
  let pv = val(playerCards), dv = val(dealerCards);
  const playerBlackjack = pv === 21; const dealerBlackjack = dv === 21;
  const win = (playerBlackjack && !dealerBlackjack) || ((pv <= 21) && (dv > 21 || pv > dv));
  const draw = pv === dv;
  if (!draw) player.coin += win ? (playerBlackjack ? Math.floor(bet * 1.5) : bet) : -bet;
  player.stats.blackjack = Number(player.stats.blackjack || 0) + 1; otoSavePlayer(message.author, player);
  const resultText = playerBlackjack && win ? "BLACKJACK" : draw ? "DRAW" : win ? "WIN" : "LOSE";
  const embed = otoBaseEmbed(win ? "🃏 OTO BLACKJACK — WIN" : draw ? "🃏 OTO BLACKJACK — DRAW" : "🃏 OTO BLACKJACK — LOSE", `Kamu bet **${bet.toLocaleString("id-ID")} Hansip Coin**\n\nDealer: **${dealerCards.map(c=>c.rank+c.suit).join(" ")} = ${dv}**\nKamu: **${playerCards.map(c=>c.rank+c.suit).join(" ")} = ${pv}**\n\nSaldo: **${player.coin.toLocaleString("id-ID")} Hansip Coin**\n\nHansip Coin hanya virtual game, bukan uang asli.`);
  const asset = await otoVisualArcadeFile(message.author, { kind: "blackjack", title: "Hansip Blackjack", icon: "🃏", result: resultText, win, draw, bet, coin: player.coin, dealerCards, playerCards, dealerTotal: dv, playerTotal: pv });
  return otoReply(message, embed, asset);
}

async function otoCmdBal(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  return replyOt(message, { content: `💰 Saldo kamu: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**. Coin ini hanya virtual game, bukan uang asli.` });
}
async function otoCmdGive(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  if (config.otoCoinTransferEnabled === false) return replyOt(message, { content: "🪙 Transfer Hansip Coin sedang OFF." });
  const target = message.mentions.users.first(); const amount = Number(args.find(a => /^\d+$/.test(a)) || 0);
  if (!target || !amount) return replyOt(message, { content: "⚠️ Format: `otgive @user 100`" });
  if (target.bot || target.id === message.author.id) return replyOt(message, { content: "❌ Tidak bisa transfer ke bot atau diri sendiri." });
  const { player } = otoGetPlayer(message.author); if (player.coin < amount) return replyOt(message, { content: "❌ Saldo Hansip Coin kurang." });
  const confirmId = `oto_transfer_yes_${message.author.id}_${Date.now()}`; const cancelId = `oto_transfer_no_${message.author.id}_${Date.now()}`;
  const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(confirmId).setLabel("Confirm").setEmoji("✅").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(cancelId).setLabel("Cancel").setEmoji("❌").setStyle(ButtonStyle.Secondary));
  const msg = await replyOt(message, { embeds: [otoBaseEmbed("🪙 Konfirmasi Transfer Hansip Coin", `${message.author} akan memberi ${target}:\n**${amount.toLocaleString("id-ID")} Hansip Coin**\n\n⚠️ Hansip Coin hanya uang virtual game. Tidak boleh ditukar dengan uang asli, crypto, item real, atau transaksi dunia nyata.`)], components: [row] });
  const collector = msg.createMessageComponentCollector({ time: 60000, max: 1 });
  collector.on("collect", async interaction => {
    if (interaction.user.id !== message.author.id) return interaction.reply({ content: "❌ Ini bukan transfer kamu.", flags: MessageFlags.Ephemeral }).catch(() => null);
    if (interaction.customId === cancelId) return interaction.update({ content: "❌ Transfer dibatalkan.", embeds: [], components: [] }).catch(() => null);
    const from = otoGetPlayer(message.author).player, toPack = otoGetPlayer(target), to = toPack.player;
    if (from.coin < amount) return interaction.update({ content: "❌ Saldo sudah tidak cukup.", embeds: [], components: [] }).catch(() => null);
    from.coin -= amount; to.coin += amount; otoSavePlayer(message.author, from); otoSavePlayer(target, to);
    return interaction.update({ content: `✅ ${message.author} mengirim **${amount.toLocaleString("id-ID")} Hansip Coin** ke ${target}.`, embeds: [], components: [] }).catch(() => null);
  });
  collector.on("end", collected => { if (!collected.size) msg.edit({ components: [] }).catch(() => null); });
}
async function otoCmdTop(message) {
  if (!(await otoEnsureChannel(message))) return;
  const players = Object.values(otoReadPlayers()).sort((a,b)=>(b.exp+b.coin/10+otoTeamPower(b))-(a.exp+a.coin/10+otoTeamPower(a))).slice(0,10);
  const lines = players.map((p,i)=>`**${i+1}.** <@${p.userId}> — Lv ${otoLevel(p.exp)} • ${Number(p.coin||0).toLocaleString("id-ID")} coin • Team ${otoTeamPower(p).toLocaleString("id-ID")}`);
  const asset = await otoVisualLeaderboardFile(message.author, players);
  return otoReply(message, otoBaseEmbed("🏆 OTO LEADERBOARD", `${lines.join("\n") || "Belum ada player."}\n\nFunny top: Top All-In Nyesek • Top Meja Panas • Top Kucing Pajak Collector`), asset);
}
async function otoCmdUpgrade(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const name = args.join(" "); const npc = otoFindNpc(name);
  if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." });
  const { player } = otoGetPlayer(message.author); const owned = player.npcs[npc.id];
  if (!owned) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." });
  const fragName = `${otoRarity(owned.rarity).name} Fragment`;
  const fragId = otoSlug(fragName);
  const cost = owned.level * 250;
  const fragCost = Math.max(1, Math.ceil(owned.level / 2));
  if (player.coin < cost) return replyOt(message, { content: `❌ Coin kurang. Butuh ${cost} coin.` });
  if ((player.inventory.fragments[fragId] || 0) < fragCost) return replyOt(message, { content: `❌ Fragment kurang. Butuh ${fragName} x${fragCost}.` });
  player.coin -= cost; player.inventory.fragments[fragId] -= fragCost; if (player.inventory.fragments[fragId] <= 0) delete player.inventory.fragments[fragId];
  owned.level += 1; owned.power += 80 + otoRarityIndex(owned.rarity) * 25;
  otoSavePlayer(message.author, player);
  return replyOt(message, { content: `✅ **${owned.name}** naik ke level **${owned.level}**. Biaya: ${cost} coin + ${fragName} x${fragCost}. Power sekarang **${owned.power}**.` });
}
async function otoCmdEvolve(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const npc = otoFindNpc(args.join(" ")); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." });
  const { player } = otoGetPlayer(message.author); const owned = player.npcs[npc.id];
  if (!owned) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." });
  if ((owned.level || 1) < 10) return replyOt(message, { content: "⚠️ Evolve butuh NPC minimal level 10." });
  const fragName = `${otoRarity(owned.rarity).name} Fragment`; const fragId = otoSlug(fragName);
  if ((player.inventory.fragments[fragId] || 0) < 20 || player.coin < 5000) return replyOt(message, { content: `❌ Evolve butuh ${fragName} x20 dan 5.000 coin.` });
  player.inventory.fragments[fragId] -= 20; player.coin -= 5000; owned.evolved = true; owned.power = Math.floor(Number(owned.power || npc.power) * 1.18); owned.variant = owned.variant === "normal" ? "neon" : owned.variant;
  otoSavePlayer(message.author, player);
  return otoReply(message, otoBaseEmbed("💠 OTO EVOLVE SUCCESS", `**${owned.name}** berhasil evolve.\n\nPower naik menjadi **${owned.power.toLocaleString("id-ID")}** dan card visual terlihat lebih premium.\n\nCommand: \`otcard ${owned.name}\` • \`otteam view\``), otoGetOrCreateAsset("card", npc.id, { title: owned.name, rarity: owned.rarity, skill: npc.skill, icon: otoSvgConcept(npc.name), element: npc.element, power: `EVOLVED ${owned.power}` }));
}
async function otoCmdEquip(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author); const joined = args.join(" ");
  const weapon = Object.keys(player.inventory.weapons || {}).map(id => otoFindItem(id)).filter(Boolean).find(w => joined.toLowerCase().includes(w.name.toLowerCase()) || joined.includes(w.id));
  const npc = otoReadNpcs().find(n => joined.toLowerCase().includes(n.name.toLowerCase()));
  if (!npc || !player.npcs[npc.id]) return replyOt(message, { content: "❌ NPC belum dimiliki / nama tidak cocok." });
  if (!weapon) return replyOt(message, { content: "❌ Weapon tidak ditemukan di inventory. Weapon hanya dari crate." });
  player.npcs[npc.id].weapon = weapon.id; otoSavePlayer(message.author, player);
  return replyOt(message, { content: `✅ **${weapon.name}** dipasang ke **${npc.name}**. Cek card: \`otcard ${npc.name}\`.` });
}
async function otoCmdLockRelease(message, args = [], lock = true) {
  if (!(await otoEnsureChannel(message))) return;
  const npc = otoFindNpc(args.join(" ")); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." });
  const { player } = otoGetPlayer(message.author); if (!player.npcs[npc.id]) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." });
  player.npcs[npc.id].locked = lock; otoSavePlayer(message.author, player);
  return replyOt(message, { content: `${lock ? "🔒" : "🔓"} **${npc.name}** ${lock ? "dikunci. NPC ini aman dari release/upgrade material." : "dibuka. Hati-hati kalau mau release."}` });
}
async function otoCmdRelease(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const confirm = args.map(a => String(a).toLowerCase()).includes("confirm");
  const npc = otoFindNpc(args.filter(a => String(a).toLowerCase() !== "confirm").join(" "));
  if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." });
  const { player } = otoGetPlayer(message.author); const owned = player.npcs[npc.id];
  if (!owned) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." });
  if (owned.locked) return replyOt(message, { content: "🔒 NPC terkunci. Pakai `otunlock <npc>` dulu kalau benar-benar mau release." });
  const idx = otoRarityIndex(npc.rarity);
  if (idx >= otoRarityIndex("epic") && !confirm) return replyOt(message, { content: `⚠️ **${npc.name}** rarity ${otoRarity(npc.rarity).name}. Untuk release, ketik: \`otrelease ${npc.name} confirm\`` });
  const qty = otoFragmentQty(npc.rarity, "release"); const dust = otoDustQty(npc.rarity, "release");
  delete player.npcs[npc.id]; otoAddFragment(player, `${otoRarity(npc.rarity).name} Fragment`, qty); player.dust += dust; player.team = (player.team || []).map(id => id === npc.id ? null : id);
  otoSavePlayer(message.author, player);
  return replyOt(message, { content: `✅ **${npc.name}** dilepas menjadi ${otoRarity(npc.rarity).name} Fragment x${qty} dan Card Dust +${dust}.` });
}
async function otoCmdWork(message) { if (!(await otoEnsureChannel(message))) return; const wait = otoCooldown(message.author.id, "work", Number(config.otoWorkCooldownMs || 300000)); if (wait) return replyOt(message, { content: `⏳ Kerja cooldown. Coba lagi **${wait} detik**.` }); const jobs = ["Jaga meja Hansip", "Jadi kasir Royale", "Bersihin meja hoki", "Ngitung coin warga", "Jaga pintu VIP", "Bantu dealer ngocok kartu", "Jual es teh neon", "Bersihin arena battle", "Antar crate ke NPC", "Jadi admin papan leaderboard"]; const { player } = otoGetPlayer(message.author); const coin = 220 + Math.floor(Math.random() * 260); player.coin += coin; player.stats.work = Number(player.stats.work || 0) + 1; otoSavePlayer(message.author, player); return otoReply(message, otoBaseEmbed("💼 OTO KERJA", `Kamu kerja: **${otoRand(jobs)}**\n\n💰 Coin +${coin}\nSaldo sekarang: **${player.coin.toLocaleString("id-ID")}**\n\nKomentar:\nKamu kerja jadi penjaga meja Hansip. Ada warga all-in sambil bilang “tenang”. Kamu cuma senyum dan nyiapin sapu.`), otoGetOrCreateAsset("banner", "oto-royale", { title: "OTO KERJA", icon: "💰", rarity: "rare" })); }
async function otoCmdRoyale(message, args = [], mode = "flip") { if (!(await otoEnsureChannel(message))) return; if (config.otoRoyaleEnabled === false) return replyOt(message, { content: "💠 Hansip Royale sedang dinonaktifkan owner." }); const wait = otoCooldown(message.author.id, `royale:${mode}`, Number(config.otoRoyaleCooldownMs || 10000)); if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum main lagi.` }); const { player } = otoGetPlayer(message.author); const parsed = otoParseAmount(args[0], player); const maxBet = Math.max(100, Number(config.otoMaxBet || 50000)); let bet = parsed.amount; if (bet <= 0) return replyOt(message, { content: "⚠️ Format: `othoki 1000` atau `othoki all`. Coin hanya coin game Hansip." }); if (bet > player.coin) return replyOt(message, { content: "❌ Coin kamu kurang. Pakai `otkerja` dulu." }); if (bet > maxBet) return replyOt(message, { content: `❌ Max bet Hansip saat ini **${maxBet.toLocaleString("id-ID")} coin**.` }); let win = false, draw = false, detail = ""; if (mode === "card") { const cards = ["2","3","4","5","6","7","8","9","10","Jack","Queen","King","Ace"]; const pv = Math.floor(Math.random() * 13) + 2; const dv = Math.floor(Math.random() * 13) + 2; win = pv > dv; draw = pv === dv; detail = `Kartu kamu: **${cards[pv-2]}**\nKartu dealer: **${cards[dv-2]}**`; } else { const chance = player.luckUntil > Date.now() ? 0.6 : 0.5; win = Math.random() < chance; detail = `Koin jatuh di sisi **${win ? "ROYALE 👑" : "ZONK"}**`; }
  if (draw) { detail += "\nSeri, bet dikembalikan."; } else if (win) { player.coin += bet; player.stats.royaleWin = Number(player.stats.royaleWin || 0) + 1; } else { player.coin -= bet; player.stats.royaleLose = Number(player.stats.royaleLose || 0) + 1; }
  otoSavePlayer(message.author, player); const title = draw ? "➖ OTO KARTU — SERI" : win ? "✅ OTO ROYALE — MENANG" : parsed.all ? "💀 ALL-IN OTO — HABIS" : "😭 OTO ROYALE — KALAH"; const embed = otoBaseEmbed(title, `👤 Player\n${message.author}\n\n━━━━━━━━━━━━━━━━━━━━\n\n💰 Bet:\n${bet.toLocaleString("id-ID")} Coin\n\n${detail}\n\nSaldo sekarang:\n💵 **${player.coin.toLocaleString("id-ID")} Coin**\n\nKomentar:\n${otoRandomHumor("royale")}\n\nCatatan:\nCoin di sini hanya coin game Hansip, bukan uang asli. Tidak ada top-up, cashout, pulsa, saldo, atau hadiah uang.`); return otoReply(message, embed, otoGetOrCreateAsset("banner", mode === "card" ? "oto-card" : "oto-royale", { title: mode === "card" ? "OTO KARTU" : "OTO ROYALE", icon: mode === "card" ? "🃏" : "👑", rarity: win ? "legendary" : "rare" })); }
async function otoCmdLuck(message) { if (!(await otoEnsureChannel(message))) return; const { player } = otoGetPlayer(message.author); const wait = otoCooldown(message.author.id, "luck", 20 * 60000); if (wait) return replyOt(message, { content: `<a:clover:1513671524949823639> Luck masih cooldown. Coba lagi **${wait} detik**.` }); player.luckUntil = Date.now() + 20 * 60000; otoSavePlayer(message.author, player); return otoReply(message, otoBaseEmbed("<a:clover:1513671524949823639> OTO LUCK AKTIF", "Luck aktif **20 menit**.\nChance NPC bagus, crate, battle, dan royale naik sedikit. Tidak terlalu OP, tetap santai."), otoGetOrCreateAsset("banner", "oto-luck", { title: "OTO LUCK", icon: "<a:clover:1513671524949823639>", rarity: "rare" })); }
function otoCrateDrop(crateId) { const name = crateId.replace(/_/g, " "); const high = name.includes("secret") ? "secret" : name.includes("mythic") ? "mythic" : name.includes("royale") ? "legendary" : name.includes("neon") ? "epic" : "rare"; const r = Math.random(); const rarity = r < 0.03 ? high : r < 0.14 ? "epic" : r < 0.35 ? "rare" : r < 0.65 ? "uncommon" : "common"; const weapon = otoRand((OTO_WEAPON_NAMES[rarity] || OTO_WEAPON_NAMES.common)); return { weapon, rarity, fragments: `${otoRarity(rarity).name} Fragment`, dust: 3 + Math.floor(Math.random() * 8), coin: 80 + Math.floor(Math.random() * 220) } }
async function otoCmdOpen(message, args = []) { if (!(await otoEnsureChannel(message))) return; const wait = otoCooldown(message.author.id, "open", Number(config.otoOpenCooldownMs || 3000)); if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum buka crate lagi.` }); const { player } = otoGetPlayer(message.author); const sub = String(args[0] || "").toLowerCase(); let crateIds = []; if (sub === "all") { const filter = args.slice(1).join(" "); crateIds = Object.keys(player.inventory.crates || {}).filter(id => !filter || id.includes(otoSlug(filter))); } else { const crateName = args.join(" ") || "Basic Crate"; const item = otoFindItem(crateName); const id = item?.type === "crate" ? item.id : otoSlug(crateName); if ((player.inventory.crates[id] || 0) > 0) crateIds = [id]; }
  if (!crateIds.length) return replyOt(message, { content: "❌ Kamu tidak punya crate itu. Cek `otinv crate`." }); const summary = { opened: {}, weapons: {}, fragments: {}, dust: 0, coin: 0, best: null }; for (const id of crateIds) { const count = sub === "all" ? Number(player.inventory.crates[id] || 0) : 1; if (count <= 0) continue; player.inventory.crates[id] -= count; if (player.inventory.crates[id] <= 0) delete player.inventory.crates[id]; summary.opened[id] = count; for (let i = 0; i < Math.min(count, 100); i++) { const drop = otoCrateDrop(id); const weaponItem = otoAddItem(player, drop.weapon, 1); otoAddFragment(player, drop.fragments, 1); player.dust += drop.dust; player.coin += drop.coin; summary.weapons[weaponItem.name] = (summary.weapons[weaponItem.name] || 0) + 1; summary.fragments[drop.fragments] = (summary.fragments[drop.fragments] || 0) + 1; summary.dust += drop.dust; summary.coin += drop.coin; if (!summary.best || OTO_RARITY_KEYS.indexOf(weaponItem.rarity) > OTO_RARITY_KEYS.indexOf(summary.best.rarity || "common")) summary.best = weaponItem; } }
  player.stats.crateOpen = Number(player.stats.crateOpen || 0) + Object.values(summary.opened).reduce((a,b)=>a+b,0); otoSavePlayer(message.author, player); const opened = Object.entries(summary.opened).map(([id, n]) => `${id.replace(/_/g, " ")} x${n}`).join("\n"); const weapons = Object.entries(summary.weapons).slice(0, 8).map(([n, q]) => `⚔️ ${n} x${q}`).join("\n"); const frags = Object.entries(summary.fragments).slice(0, 8).map(([n, q]) => `🧩 ${n} x${q}`).join("\n"); const embed = otoBaseEmbed(sub === "all" ? "🎁 OTO CRATE MASS OPEN" : "🎁 OTO CRATE OPEN", `👤 Player\n${message.author}\n\n━━━━━━━━━━━━━━━━━━━━\n\n📦 Crate Dibuka\n${opened}\n\n━━━━━━━━━━━━━━━━━━━━\n\n🎁 Reward Summary\n\n⚔️ Weapon Found\n${weapons || "Tidak ada weapon."}\n\n🧩 Fragment\n${frags || "Tidak ada fragment."}\n\n🎴 Card Dust\n+${summary.dust}\n\n💰 Coin\n+${summary.coin}\n\n━━━━━━━━━━━━━━━━━━━━\n\n🌟 Best Drop\n${summary.best ? `${otoRarity(summary.best.rarity).emoji} **${summary.best.name}**\n${summary.best.rarity} Weapon • +${summary.best.power || 0} Power` : "Belum ada."}\n\n<a:Alphabet_S:1513667784519712769> Rare Moment\n${otoRandomHumor("crate")}\n\nCommand:\n\`otinv\`\n\`otequip <npc> <weapon>\``); return otoReply(message, embed, otoGetOrCreateAsset("banner", "oto-crate", { title: "OTO CRATE", icon: "📦", rarity: summary.best?.rarity || "rare" })); }
async function otoCmdDaily(message) { if (!(await otoEnsureChannel(message))) return; const { player } = otoGetPlayer(message.author); const today = todayKey(); if (player.daily?.lastClaim === today) return replyOt(message, { content: "🎁 Daily Hansip hari ini sudah diambil." }); const coin = 550; const xp = 120; player.coin += coin; player.exp += xp; player.dust += 10; otoAddCrate(player, "Basic Crate", 1); if (Math.random() < 0.25) otoAddCrate(player, "Neon Crate", 1); player.daily = { lastClaim: today, streak: (player.daily?.streak || 0) + 1 }; otoSavePlayer(message.author, player); return otoReply(message, otoBaseEmbed("🎁 OTO DAILY", `✅ Kamu dapat:\n💰 Coin +${coin}\n⭐ EXP +${xp}\n🎴 Card Dust +10\n📦 Basic Crate x1\n\nStreak: **${player.daily.streak} hari**`), otoGetOrCreateAsset("banner", "oto-daily", { title: "OTO DAILY", icon: "🎁", rarity: "rare" })); }
async function otoCmdQuest(message) { if (!(await otoEnsureChannel(message))) return; const embed = otoBaseEmbed("🎯 OTO QUEST", "Misi harian:\n• Hunt 5x\n• Battle 3x\n• Open crate 1x\n• Upgrade NPC 1x\n• Main kartu 1x\n• Kerja 2x\n• Dapat Rare NPC atau lebih tinggi\n\nQuest lucu:\n• Kalah 1x tapi tetap semangat\n• Buka crate tanpa panik\n• Lihat NPC card 1x\n• Masukkan NPC ke team 1x\n\nCommand: `oth` • `otb` • `otopen all` • `otcard <npc>`"); return otoReply(message, embed, otoGetOrCreateAsset("banner", "oto-quest", { title: "OTO QUEST", icon: "🎯", rarity: "rare" })); }
async function otoCmdShop(message) { if (!(await otoEnsureChannel(message))) return; const lines = OTO_SHOP_ITEMS.slice(0, 18).map((name, i) => `**${i+1}.** ${name} — ${i % 3 === 0 ? "650" : i % 3 === 1 ? "1.200" : "2.500"} coin`).join("\n"); return otoReply(message, otoBaseEmbed("🛒 OTO SHOP", `${lines}\n\n━━━━━━━━━━━━━━━━━━━━\nKategori: Booster • Crate • Fragment • Utility • Luck • Battle • Event\n\nBeli: \`otbuy Basic Crate\``), otoGetOrCreateAsset("banner", "oto-shop", { title: "OTO SHOP", icon: "🛒", rarity: "rare" })); }
async function otoCmdBuy(message, args = []) { if (!(await otoEnsureChannel(message))) return; const name = args.join(" "); if (!name) return replyOt(message, { content: "⚠️ Format: `otbuy Basic Crate`" }); const { player } = otoGetPlayer(message.author); const item = otoFindItem(name) || { id: otoSlug(name), name, type: "utility", rarity: "common", buyPrice: 650 }; const price = Number(item.buyPrice || 650) || 650; if (price <= 0) return replyOt(message, { content: "❌ Item ini tidak dijual di shop." }); if (player.coin < price) return replyOt(message, { content: "❌ Coin kurang. Pakai `otkerja` atau `oth`." }); player.coin -= price; otoAddItem(player, item.name, 1); otoSavePlayer(message.author, player); return replyOt(message, { content: `✅ Kamu membeli **${item.name}** seharga **${price.toLocaleString("id-ID")} coin**.` }); }
async function otoCmdTop(message) { if (!(await otoEnsureChannel(message))) return; const players = Object.values(otoReadPlayers()).sort((a,b)=>(b.exp+b.coin/10+otoTeamPower(b))-(a.exp+a.coin/10+otoTeamPower(a))).slice(0,10); const lines = players.map((p,i)=>`**${i+1}.** <@${p.userId}> — Lv ${otoLevel(p.exp)} • ${Number(p.coin||0).toLocaleString("id-ID")} coin • Team ${otoTeamPower(p).toLocaleString("id-ID")}`); return otoReply(message, otoBaseEmbed("🏆 OTO LEADERBOARD", `${lines.join("\n") || "Belum ada player."}\n\nFunny top: Top All-In Nyesek • Top Meja Panas • Top Kucing Pajak Collector`), otoGetOrCreateAsset("banner", "oto-top", { title: "OTO TOP", icon: "🏆", rarity: "legendary" })); }
async function otoCmdUpgrade(message, args = []) { if (!(await otoEnsureChannel(message))) return; const name = args.join(" "); const npc = otoFindNpc(name); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." }); const { player } = otoGetPlayer(message.author); const owned = player.npcs[npc.id]; if (!owned) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." }); const cost = owned.level * 250; if (player.coin < cost) return replyOt(message, { content: `❌ Coin kurang. Butuh ${cost} coin.` }); player.coin -= cost; owned.level += 1; owned.power += 80 + OTO_RARITY_KEYS.indexOf(owned.rarity) * 25; otoSavePlayer(message.author, player); return replyOt(message, { content: `✅ **${owned.name}** naik ke level **${owned.level}**. Power sekarang **${owned.power}**.` }); }
async function otoCmdEquip(message, args = []) { if (!(await otoEnsureChannel(message))) return; const { player } = otoGetPlayer(message.author); const joined = args.join(" "); const weapon = Object.keys(player.inventory.weapons || {}).map(id => otoFindItem(id)).filter(Boolean).find(w => joined.toLowerCase().includes(w.name.toLowerCase()) || joined.includes(w.id)); const npc = otoReadNpcs().find(n => joined.toLowerCase().includes(n.name.toLowerCase())); if (!npc || !player.npcs[npc.id]) return replyOt(message, { content: "❌ NPC belum dimiliki / nama tidak cocok." }); if (!weapon) return replyOt(message, { content: "❌ Weapon tidak ditemukan di inventory. Weapon hanya dari crate." }); player.npcs[npc.id].weapon = weapon.id; otoSavePlayer(message.author, player); return replyOt(message, { content: `✅ **${weapon.name}** dipasang ke **${npc.name}**.` }); }
async function otoCmdLockRelease(message, args = [], lock = true) { if (!(await otoEnsureChannel(message))) return; const npc = otoFindNpc(args.join(" ")); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." }); const { player } = otoGetPlayer(message.author); if (!player.npcs[npc.id]) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." }); player.npcs[npc.id].locked = lock; otoSavePlayer(message.author, player); return replyOt(message, { content: `${lock ? "🔒" : "🔓"} **${npc.name}** ${lock ? "dikunci" : "dibuka"}.` }); }
async function otoCmdRelease(message, args = []) { if (!(await otoEnsureChannel(message))) return; const npc = otoFindNpc(args.join(" ")); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." }); const { player } = otoGetPlayer(message.author); const owned = player.npcs[npc.id]; if (!owned) return replyOt(message, { content: "❌ Kamu belum punya NPC itu." }); if (owned.locked) return replyOt(message, { content: "🔒 NPC terkunci. Pakai `otrelease` tidak bisa untuk locked NPC. Buka dulu dengan `otlock`?" }); delete player.npcs[npc.id]; otoAddFragment(player, `${otoRarity(npc.rarity).name} Fragment`, 3); player.team = (player.team || []).map(id => id === npc.id ? null : id); otoSavePlayer(message.author, player); return replyOt(message, { content: `✅ **${npc.name}** dilepas menjadi fragment x3.` }); }
async function otoCmdOwnerGive(message, args = [], type = "coin") { const member = message.mentions.members.first(); if (!member) return replyOt(message, { content: "⚠️ Mention user dulu." }); const { player } = otoGetPlayer(member.user); if (type === "coin" || type === "xp") { const amount = Math.max(1, Number(args.find(a => /^\d+$/.test(a)) || 0)); if (!amount) return replyOt(message, { content: "⚠️ Jumlah harus angka." }); if (type === "coin") player.coin += amount; else player.exp += amount; otoSavePlayer(member.user, player); return replyOt(message, { content: `✅ ${type.toUpperCase()} Hansip diberikan ke ${member}: ${amount}.` }); } if (type === "crate") { const qty = Math.max(1, Number(args.find(a => /^\d+$/.test(a)) || 1)); const name = args.filter(a => !a.startsWith("<@") && !/^\d+$/.test(a)).join(" ") || "Basic Crate"; otoAddCrate(player, name, qty); otoSavePlayer(member.user, player); return replyOt(message, { content: `✅ ${member} mendapat **${name} x${qty}**.` }); } if (type === "weapon") { const name = args.filter(a => !a.startsWith("<@")).join(" "); const item = otoAddItem(player, name || "Neon Dagger", 1); otoSavePlayer(member.user, player); return replyOt(message, { content: `✅ ${member} mendapat weapon **${item.name}**.` }); } if (type === "npc") { const npc = otoFindNpc(args.filter(a => !a.startsWith("<@")).join(" ")) || otoFindNpc("Kucing Pajak"); otoAddNpc(player, npc); otoSavePlayer(member.user, player); return replyOt(message, { content: `✅ ${member} mendapat NPC **${npc.name}**.` }); } }
async function otoCmdAssetCheck(message) { otoEnsureFiles(); const npcs = otoReadNpcs(); const missing = []; const banners = OTO_BANNER_KEYS; for (const b of banners) { const p = otoGetOrCreateAsset("banner", b, { title: b, icon: "💠", rarity: "rare" }); if (!p || !fs.existsSync(p)) missing.push(b); } const embed = otoBaseEmbed("🧩 OTO ASSET CHECK", `Banners dicek: **${banners.length}**\nNPC catalog: **${npcs.length}**\nMissing: **${missing.length ? missing.join(", ") : "Tidak ada"}**\n\nAuto Visual Mode: **${config.otoAutoImageMode || "canvas"}**\nExternal AI: **${config.otoExternalAiImageEnabled ? "Aktif" : "OFF"}**\n\nSecret/env/token tidak ditampilkan.`); return replyOt(message, { embeds: [embed] }); }
async function otoCmdNpcImageCheck(message) { otoEnsureFiles(); const npcs = otoReadNpcs(); let generated = 0, missing = 0; for (const npc of npcs) { const p = otoGetOrCreateAsset("card", npc.id, { title: npc.name, rarity: npc.rarity, skill: npc.skill, icon: otoSvgConcept(npc.name) }); if (p && fs.existsSync(p)) generated++; else missing++; } return replyOt(message, { embeds: [otoBaseEmbed("🎴 OTO NPC IMAGE CHECK", `NPC total: **${npcs.length}**\nPunya/generated image: **${generated}**\nMissing: **${missing}**\nMode: **${config.otoAutoImageMode || "canvas"}**`)] }); }
async function otoCmdImage(message, args = []) { const sub = String(args[0] || "").toLowerCase(); const target = String(args[1] || "").toLowerCase(); if (sub === "mode") { const mode = target === "ai" ? "ai" : "canvas"; config.otoAutoImageMode = mode; config.otoExternalAiImageEnabled = mode === "ai" ? config.otoExternalAiImageEnabled : false; saveConfig(config); return replyOt(message, { content: `✅ Mode image Hansip diset ke **${mode}**. Default aman tetap Emoji-only.` }); } if (sub === "status") return otoCmdAssetCheck(message); if (sub === "missing") return otoCmdNpcImageCheck(message); if (sub === "clearcache") { otoCleanOldVisualCache(); return replyOt(message, { content: "✅ Cache visual Hansip dibersihkan aman." }); } if (sub === "generate" && target === "banners") { OTO_BANNER_KEYS.forEach(b => otoGetOrCreateAsset("banner", b, { title: b.toUpperCase(), icon: "💠", rarity: "rare" })); return replyOt(message, { content: "✅ Banner Hansip generated aman." }); } if (sub === "generate" && target === "allnpc") { for (const npc of otoReadNpcs()) otoGetOrCreateAsset("card", npc.id, { title: npc.name, rarity: npc.rarity, skill: npc.skill, icon: otoSvgConcept(npc.name) }); return replyOt(message, { content: "✅ Semua NPC card Hansip digenerate aman." }); } if ((sub === "generate" || sub === "refresh") && target === "npc") { const npc = otoFindNpc(args.slice(2).join(" ")); if (!npc) return replyOt(message, { content: "❌ NPC tidak ditemukan." }); const p = otoGetOrCreateAsset("card", npc.id, { title: npc.name, rarity: npc.rarity, skill: npc.skill, icon: otoSvgConcept(npc.name) }); return replyOt(message, { content: `✅ Image NPC **${npc.name}** siap: ${path.relative(__dirname, p)}` }); } return replyOt(message, { content: "⚠️ Format: `otimage generate npc <nama>`, `otimage generate allnpc`, `otimage generate banners`, `otimage status`, `otimage missing`, `otimage mode canvas`." }); }
async function otoCmdBackup(message) { otoEnsureFiles(); fs.mkdirSync(BACKUP_DIR, { recursive: true }); const backup = { meta: { app: "Hansip", build: OTO_BUILD_VERSION, createdAt: new Date().toISOString(), note: "Tidak menyertakan .env/token/secret." }, players: otoReadPlayers(), assets: otoReadAssets() }; const file = path.join(BACKUP_DIR, `oto-backup-${Date.now()}.json`); fs.writeFileSync(file, JSON.stringify(backup, null, 2)); return replyOt(message, { content: `✅ Backup Hansip dibuat aman: \`${path.basename(file)}\`. Tidak menyertakan .env/token/secret.` }); }

/* =========================
   Hansip v1.27.0 — Blackjack All-In + otcf Compact Fix
   - otbj all / otblackjack all supported.
   - otcf heads all / otcf tails all supported.
   - No image/PNG/GIF attachment for blackjack and coinflip.
   - Hansip Coin is virtual only, no real money/cashout/top-up.
========================= */
function otoParseBetInputV127(input, player, allInEnabled = true) {
  const raw = String(input || "").trim().toLowerCase();
  if (["all", "allin", "all-in", "semua"].includes(raw)) {
    return { amount: Math.max(0, Number(player.coin || 0)), all: true };
  }
  const cleaned = raw.replace(/[^0-9]/g, "");
  return { amount: Math.max(0, Number(cleaned || 0)), all: false };
}
function otoCardValueV127(card) {
  const rank = card.rank;
  if (rank === "A") return 11;
  if (["J", "Q", "K"].includes(rank)) return 10;
  return Number(rank || 0);
}
function otoHandValueV127(cards = []) {
  let total = 0;
  let aces = 0;
  for (const card of cards) {
    total += otoCardValueV127(card);
    if (card.rank === "A") aces += 1;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  return total;
}
function otoCardsTextV127(cards = []) {
  return cards.map(c => `\`${c.rank}${c.suit}\``).join(" ") || "`?`";
}
function otoBlackjackResultV127(playerTotal, dealerTotal, playerCards = []) {
  const natural = playerCards.length === 2 && playerTotal === 21;
  if (natural && dealerTotal !== 21) return "BLACKJACK";
  if (playerTotal > 21 && dealerTotal > 21) return "DRAW";
  if (playerTotal > 21) return "LOSE";
  if (dealerTotal > 21) return "WIN";
  if (playerTotal > dealerTotal) return "WIN";
  if (dealerTotal > playerTotal) return "LOSE";
  return "DRAW";
}
async function otoCmdBlackjack(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  if (config.otoBlackjackEnabled === false) return replyOt(message, { content: "🃏 Hansip Blackjack sedang OFF." });
  const wait = otoCooldown(message.author.id, "blackjack", Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum blackjack lagi.` });

  const { player } = otoGetPlayer(message.author);
  const parsed = otoParseBetInputV127(args[0], player, config.otoBlackjackAllInEnabled !== false);
  const min = Number(config.otoMinBet || 10);
  const max = Number(config.otoBlackjackMaxBet || config.otoMaxBet || 50000);
  const isAllIn = parsed.all;
  const bet = parsed.amount;

  if (isAllIn && config.otoBlackjackAllInEnabled === false) return replyOt(message, { content: "❌ All-in blackjack sedang dinonaktifkan owner." });
  if (!bet || bet < min) return replyOt(message, { content: `⚠️ Format: \`otbj ${min}\` atau \`otbj all\`. Min bet ${min} Hansip Coin.` });
  if (!isAllIn && bet > max) return replyOt(message, { content: `❌ Max bet blackjack **${max.toLocaleString("id-ID")} Hansip Coin**. Untuk all-in pakai \`otbj all\` jika owner mengizinkan.` });
  if (bet > player.coin) return replyOt(message, { content: "❌ Coin kamu kurang. Pakai `otkerja` dulu." });

  const draw = () => otoMakeCardObj(Math.floor(Math.random() * 13) + 2);
  const dealerCards = [draw(), draw()];
  const playerCards = [draw(), draw()];
  while (otoHandValueV127(dealerCards) < 17) dealerCards.push(draw());

  const pv = otoHandValueV127(playerCards);
  const dv = otoHandValueV127(dealerCards);
  const result = otoBlackjackResultV127(pv, dv, playerCards);
  const profit = result === "BLACKJACK" ? Math.floor(bet * 1.5) : bet;
  let resultText = "";
  if (result === "WIN") { player.coin += profit; resultText = `💎 Kamu menang **${profit.toLocaleString("id-ID")} Hansip Coin**!`; }
  else if (result === "BLACKJACK") { player.coin += profit; resultText = `🃏 BLACKJACK! Kamu menang **${profit.toLocaleString("id-ID")} Hansip Coin**!`; }
  else if (result === "DRAW") { resultText = `⚖️ Seri! Bet **${bet.toLocaleString("id-ID")} Hansip Coin** dikembalikan.`; }
  else { player.coin -= bet; resultText = `💨 Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**!`; }

  player.stats.blackjack = Number(player.stats.blackjack || 0) + 1;
  player.stats[result === "LOSE" ? "blackjackLose" : result === "DRAW" ? "blackjackDraw" : "blackjackWin"] = Number(player.stats[result === "LOSE" ? "blackjackLose" : result === "DRAW" ? "blackjackDraw" : "blackjackWin"] || 0) + 1;
  otoSavePlayer(message.author, player);

  const colorMap = { WIN: "#0B5CFF", LOSE: "#FF4D6D", DRAW: "#F6C85F", BLACKJACK: "#00E5FF" };
  const embed = new EmbedBuilder()
    .setColor(colorMap[result] || "#0B5CFF")
    .setTitle(`🃏 Hansip Blackjack — ${result}${isAllIn ? " • ALL-IN" : ""}`)
    .setDescription(`${message.author}, kamu bet **${bet.toLocaleString("id-ID")} Hansip Coin** buat main blackjack${isAllIn ? "\n💀 Mode: **ALL-IN**" : ""}\n\n**Dealer** \`[${dv}]\`\n${otoCardsTextV127(dealerCards)}\n\n**${message.author.username}** \`[${pv}]\`\n${otoCardsTextV127(playerCards)}\n\n${resultText}\n\nSaldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`)
    .setFooter({ text: "DESA TULUS • Hansip Coin hanya virtual game" });
  return replyOt(message, { embeds: [embed] });
}
async function otoCmdRoyale(message, args = [], mode = "flip") {
  if (!(await otoEnsureChannel(message))) return;
  if (mode !== "coinflip") {
    // Keep simple royale/card fallback without image.
    mode = mode || "flip";
  }
  if (config.otoRoyaleEnabled === false) return replyOt(message, { content: "💠 Hansip Royale sedang dinonaktifkan owner." });
  const wait = otoCooldown(message.author.id, `royale:${mode}`, Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum main lagi.` });
  const { player } = otoGetPlayer(message.author);

  let choice = "";
  let amountArg = args[0];
  if (mode === "coinflip") {
    choice = String(args[0] || "").toLowerCase();
    if (!["heads", "tails", "head", "tail", "h", "t"].includes(choice)) return replyOt(message, { content: "⚠️ Format: `otcf heads 100`, `otcf tails 100`, `otcf heads all`, atau `otcf tails all`." });
    choice = ["heads", "head", "h"].includes(choice) ? "HEADS" : "TAILS";
    amountArg = args[1];
  }
  const parsed = otoParseBetInputV127(amountArg, player, config.otoCoinFlipAllInEnabled !== false);
  const isAllIn = parsed.all;
  const maxBet = Math.max(100, Number(mode === "coinflip" ? (config.otoCoinFlipMaxBet || config.otoMaxBet || 50000) : (config.otoMaxBet || 50000)));
  const bet = parsed.amount;
  if (isAllIn && mode === "coinflip" && config.otoCoinFlipAllInEnabled === false) return replyOt(message, { content: "❌ All-in coin flip sedang dinonaktifkan owner." });
  if (bet <= 0) return replyOt(message, { content: mode === "coinflip" ? "⚠️ Format: `otcf heads 100` atau `otcf tails all`." : "⚠️ Format: `othoki 1000` atau `othoki all`." });
  if (bet > player.coin) return replyOt(message, { content: "❌ Coin kamu kurang. Pakai `otkerja` dulu." });
  if (!isAllIn && bet > maxBet) return replyOt(message, { content: `❌ Max bet Hansip saat ini **${maxBet.toLocaleString("id-ID")} coin**. Untuk all-in pakai \`otcf heads all\` / \`otcf tails all\`.` });

  if (mode === "coinflip") {
    const side = Math.random() < 0.5 ? "HEADS" : "TAILS";
    const win = choice === side;
    if (win) player.coin += bet;
    else player.coin -= bet;
    player.stats.coinflip = Number(player.stats.coinflip || 0) + 1;
    player.stats[win ? "coinflipWin" : "coinflipLose"] = Number(player.stats[win ? "coinflipWin" : "coinflipLose"] || 0) + 1;
    otoSavePlayer(message.author, player);
    const embed = new EmbedBuilder()
      .setColor(win ? "#0B5CFF" : "#FF4D6D")
      .setTitle(`${win ? "✅" : "💨"} Hansip Coin Flip — ${win ? "WIN" : "LOSE"}${isAllIn ? " • ALL-IN" : ""}`)
      .setDescription(`${message.author}, kamu memilih **${choice}** dengan bet **${bet.toLocaleString("id-ID")} Hansip Coin**${isAllIn ? "\n💀 Mode: **ALL-IN**" : ""}\n\n🪙 Coin berputar...\nHasil: **${side}**\n\n${win ? `💎 Kamu menang **${bet.toLocaleString("id-ID")} Hansip Coin**!` : `💨 Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**!`}\n\nSaldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**\n\nCatatan: Hansip Coin hanya virtual game, bukan uang asli.`)
      .setFooter({ text: "DESA TULUS • Hansip" });
    return replyOt(message, { embeds: [embed] });
  }

  const chance = player.luckUntil > Date.now() ? 0.6 : 0.5;
  const win = Math.random() < chance;
  if (win) player.coin += bet; else player.coin -= bet;
  otoSavePlayer(message.author, player);
  const embed = new EmbedBuilder()
    .setColor(win ? "#0B5CFF" : "#FF4D6D")
    .setTitle(`${win ? "✅" : "😭"} OTO ROYALE — ${win ? "MENANG" : "KALAH"}${isAllIn ? " • ALL-IN" : ""}`)
    .setDescription(`${message.author}, bet **${bet.toLocaleString("id-ID")} Hansip Coin**${isAllIn ? "\n💀 Mode: **ALL-IN**" : ""}\n\nKoin jatuh di sisi **${win ? "ROYALE 👑" : "ZONK"}**\n\nSaldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**\n\nCoin ini hanya coin game Hansip, bukan uang asli.`)
    .setFooter({ text: "DESA TULUS • Hansip" });
  return replyOt(message, { embeds: [embed] });
}


/* =========================
   Hansip No-Image Emoji Hard Fix v1.29.0
   This block intentionally overrides Hansip command handlers so the game stops sending images.
   No AttachmentBuilder, no Canvas, no setImage, no generated PNG/GIF files.
========================= */
const OTO_V129_ACTIVE_SESSIONS = new Map();
const OTO_V129_TRANSFER_SESSIONS = new Map();

function otoV129Emoji(key, fallback) {
  const animated = config.otoAnimatedEmojiIds || {};
  const direct = {
    coin: config.otoEmojiCoin || "🪙",
    coinSpin: config.otoEmojiCoinSpin || animated.coinSpin || animated.coin || "🪙",
    blackjackSpin: config.otoEmojiBlackjackSpin || animated.blackjackSpin || "🃏",
    diceSpin: config.otoEmojiDiceSpin || animated.diceSpin || "🎲",
    loading: config.otoEmojiLoading || animated.loading || "🔄",
    fragment: config.otoEmojiFragment || "<:PurpleR:1513668875189878785>",
    xp: config.otoEmojiXp || "✨",
    win: config.otoEmojiWin || "💎",
    lose: config.otoEmojiLose || "💨",
    draw: config.otoEmojiDraw || "⚖️",
    core: config.otoEmojiCore || "💠"
  };
  if (config.otoAnimatedEmojiEnabled !== false && animated[key]) return animated[key];
  return direct[key] || fallback || "💠";
}
function otoV129Delay(type="default") {
  const base = Number(config.otoRevealDelayMs || 4000);
  if (type === "bj") return Number(config.otoBlackjackDelayMs || base);
  if (type === "cf") return Number(config.otoCoinFlipDelayMs || base);
  if (type === "hunt") return Number(config.otoHuntRevealDelayMs || base);
  if (type === "slots") return Number(config.otoSlotsDelayMs || base);
  return base;
}
function otoV129Sleep(ms) { return new Promise(r => setTimeout(r, Math.max(0, Number(ms||0)))); }
function otoV129Embed(title, desc, color="#0B5CFF", footer="DESA TULUS • Hansip") {
  return new EmbedBuilder().setColor(color).setTitle(title).setDescription(desc).setFooter({ text: footer });
}
function otoV129NoImage(embed) { try { embed.setImage(null); embed.setThumbnail(null); } catch(_) {} return embed; }
function otoV129Balance(player) { return Number(player?.coin || 0); }
function otoV129ParseBet(args, player, maxBet=50000, allowAll=true) {
  const raw = String(args || "").toLowerCase();
  const bal = otoV129Balance(player);
  if (allowAll && raw === "all") return { all:true, amount: bal };
  const cleaned = raw.replace(/\./g, "").replace(/,/g, "");
  const n = Math.floor(Number(cleaned || 0));
  return { all:false, amount: Math.max(0, n) };
}

async function otoCmdBal(message) {
  if (!(await otoEnsureChannel(message))) return;
  const target = message.mentions.users.first() || message.author;
  const { player } = otoGetPlayer(target);
  const targetMode = target.id !== message.author.id;
  return replyOt(message, { embeds: [otoV129NoImage(new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`${otoV129Emoji("coin", "🪙")} | ${targetMode ? target.username : message.author.username}, ${targetMode ? "sekarang punya" : "kamu sekarang punya"} **${Number(player.coin||0).toLocaleString("id-ID")} Hansip Coin**!`)
    .setFooter({ text: "DESA TULUS • Hansip Coin virtual" }))] });
}

async function otoCmdWork(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "work", 5 * 60 * 1000);
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum kerja lagi.` });
  const { player } = otoGetPlayer(message.author);
  const jobs = ["Penjaga Warung Hansip", "Penghitung Fragment", "Dealer Blackjack Virtual", "Penjaga NPC Hansip", "Kurir Crate Biru", "Tukang Bersihin Arena"];
  const job = otoRand(jobs);
  const coin = 150 + Math.floor(Math.random()*351);
  player.coin += coin;
  player.stats.work = Number(player.stats.work||0)+1;
  otoSavePlayer(message.author, player);
  return replyOt(message, { embeds: [otoV129NoImage(new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`💼 | ${message.author.username} bekerja sebagai **${job}** dan mendapatkan **${coin.toLocaleString("id-ID")} Hansip Coin**!`)
    .setFooter({ text: "DESA TULUS • Hansip Coin virtual" }))] });
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum hunt lagi.` });
  const { player } = otoGetPlayer(message.author);
  const cost = Number(config.otoHuntCost || 5);
  if (player.coin < cost) return replyOt(message, { content: `❌ Coin kamu kurang. Hunt butuh **${cost} Hansip Coin**. Pakai \`otkerja\` dulu.` });
  player.coin -= cost;
  const loading = await replyOt(message, { embeds: [otoV129NoImage(new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`🌱 | ${message.author.username} memakai **${cost} Hansip Coin** untuk hunt...\n\n${otoV129Emoji("loading", "🔄")} NPC sedang dicari...\nTunggu **2 detik**.`)
    .setFooter({ text: "DESA TULUS • Hansip" }))] });
  await otoV129Sleep(otoV129Delay("hunt"));
  const hasFrag = Object.values(player.inventory?.fragments || {}).reduce((a,b)=>a+Number(b||0),0) > 0;
  const min = hasFrag ? Number(config.otoHuntWithFragmentMinNpc || 1) : Number(config.otoHuntWithoutFragmentMinNpc || 1);
  const max = hasFrag ? Number(config.otoHuntWithFragmentMaxNpc || 10) : Number(config.otoHuntWithoutFragmentMaxNpc || 3);
  const count = Math.max(1, Math.min(10, min + Math.floor(Math.random() * (max-min+1))));
  const rarityXp = { common:[1,5], uncommon:[4,9], rare:[8,15], epic:[15,30], mythic:[30,75], secret:[75,150], limited:[100,200], legendary:[30,75] };
  const icons = ["🙂","😎","🤓","🥸","🤠","😄","😆","😅","😂","😇"];
  const found=[]; let xp=0, frag=0, dust=0, dup=0;
  for (let i=0;i<count;i++) {
    const npc = otoPickNpc();
    const r = otoRarity(npc.rarity);
    const range = rarityXp[npc.rarity] || [1,5];
    xp += range[0] + Math.floor(Math.random()*(range[1]-range[0]+1));
    if (player.npcs[npc.id]) {
      dup++; const fq = otoFragmentQty(npc.rarity, "duplicate"); const dq = otoDustQty(npc.rarity, "duplicate");
      const fkey = `${npc.rarity}_fragment`; player.inventory.fragments[fkey] = Number(player.inventory.fragments[fkey] || 0) + fq; frag += fq; player.dust += dq; dust += dq;
    } else {
      player.npcs[npc.id] = { id:npc.id, name:npc.name, rarity:npc.rarity, element:npc.element, skill:npc.skill, level:1, exp:0, power:npc.power, variant: otoPickVariant().key, locked:false, weapon:"", obtainedAt:new Date().toISOString() };
    }
    found.push(`${r.emoji} ${npc.name}`);
  }
  player.exp += xp;
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  otoSavePlayer(message.author, player);
  const shown = found.slice(0, 6).join(" • ") + (found.length > 6 ? ` • +${found.length-6} NPC lain` : "");
  const desc = count > 1
    ? `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!\n▫️ | ${icons.slice(0, Math.min(count,10)).join(" ")} mendapat **${xp} XP**!${frag ? `\n<:PurpleR:1513668875189878785> | Fragment bonus: **+${frag} Fragment**` : ""}${dup ? `\n🔁 | ${dup} NPC duplicate berubah jadi <:PurpleR:1513668875189878785> **${frag} Fragment** dan 🎴 **${dust} Dust**!` : ""}\n\nKamu menemukan:\n${shown}`
    : `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap ${shown}!\n▫️ | ${icons[0]} mendapat **${xp} XP**!${dup ? `\n🔁 | Duplicate berubah jadi <:PurpleR:1513668875189878785> **${frag} Fragment** dan 🎴 **${dust} Dust**!` : ""}`;
  const embed = new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc).setFooter({ text: "DESA TULUS • Hansip" });
  return loading?.edit ? loading.edit({ embeds:[otoV129NoImage(embed)], components: [] }).catch(() => replyOt(message,{embeds:[embed]})) : replyOt(message,{embeds:[embed]});
}

async function otoCmdNpc(message, args=[]) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const q = String(args[0] || "").toLowerCase();
  const allOwned = Object.values(player.npcs || {});
  const pointMap = { common:1, uncommon:3, rare:10, epic:25, mythic:75, secret:250, limited:500, legendary:75 };
  const counts = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0, limited:0 };
  for (const n of allOwned) { const key = n.rarity === "legendary" ? "mythic" : (counts[n.rarity] !== undefined ? n.rarity : "common"); counts[key]++; }
  const points = allOwned.reduce((a,n)=>a+(pointMap[n.rarity]||1),0);
  if (["common","uncommon","rare","epic","mythic","secret","limited"].includes(q) || q === "search") {
    let list = allOwned;
    if (q === "search") { const term = args.slice(1).join(" ").toLowerCase(); list = list.filter(n => n.name.toLowerCase().includes(term) || n.id.includes(term)); }
    else list = allOwned.filter(n => (q === "mythic" ? ["mythic","legendary"].includes(n.rarity) : n.rarity === q));
    const lines = list.slice(0,15).map((n,i)=>`${i+1}. \`${n.id}\` — ${n.name} • Lv. ${n.level||1} • Power ${otoOwnedNpcPower(n).toLocaleString("id-ID")}`).join("\n") || "Belum ada NPC di filter ini.";
    return replyOt(message, { embeds:[otoV129NoImage(new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setTitle(`${otoRarity(q).emoji || "🎴"} ${q ? q[0].toUpperCase()+q.slice(1) : "Hansip"} NPC Collection`).setDescription(`${lines}\n\nCommand:\n\`otcard <npcId>\`\n\`otteam add <npcId> <slot>\``).setFooter({text:"DESA TULUS • Hansip"}))] });
  }
  const row = (label, icon, amount) => amount > 5 ? `${label} ${Array(5).fill(icon).join(" ")} +${amount-5}` : `${label} ${amount ? Array(amount).fill(icon).join(" ") + " " + Array(Math.max(0,5-amount)).fill("?").join(" ") : "? ? ? ? ?"}`;
  const desc = `🌱 🌿 🐾 💠 **${message.author.username}'s Hansip NPC Collection!** 💠 🐾 🌿 🌱\n\n${row("C","<:LetterC:1513669277759176704>",counts.common)}\n${row("U","<:PastelGreenU:1513669101640482907>",counts.uncommon)}\n${row("R","<:PurpleR:1513668875189878785>",counts.rare)}\n${row("E","<:letter_E:1513668672609189888>",counts.epic)}\n${row("M","<a:LetterM:1513668125638398262>",counts.mythic)}\n${row("S","✨",counts.secret)}${counts.limited ? `\n${row("L","💠",counts.limited)}` : ""}\n\nNPC Points: **${points}**\nM-${counts.mythic}, E-${counts.epic}, R-${counts.rare}, U-${counts.uncommon}, C-${counts.common}, S-${counts.secret}`;
  return replyOt(message, { embeds:[otoV129NoImage(new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setTitle(`🌿 ${message.author.username}'s Hansip NPC Collection!`).setDescription(desc).setFooter({text:"DESA TULUS • Hansip"}))] });
}

function otoV129DeckCard() { const ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]; const suits=["♠","♥","♦","♣"]; return { rank: otoRand(ranks), suit: otoRand(suits) }; }
function otoV129BjValue(cards) { let t=0,a=0; for (const c of cards) { if (c.rank === "A") { t+=11; a++; } else if (["J","Q","K"].includes(c.rank)) t+=10; else t+=Number(c.rank); } while(t>21 && a>0){ t-=10; a--; } return t; }
function otoV129CardText(cards) { return cards.map(c=>`\`${c.rank}${c.suit}\``).join(" "); }
function otoV129BjResult(playerTotal, dealerTotal, playerCards) { if (playerCards.length===2 && playerTotal===21 && dealerTotal!==21) return "BLACKJACK"; if (playerTotal>21 && dealerTotal>21) return "DRAW"; if (playerTotal>21) return "LOSE"; if (dealerTotal>21) return "WIN"; if (playerTotal>dealerTotal) return "WIN"; if (dealerTotal>playerTotal) return "LOSE"; return "DRAW"; }
function otoV129BjButtons(disabled=false) { return [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("oto_bj_hit").setEmoji("➕").setStyle(ButtonStyle.Primary).setDisabled(disabled), new ButtonBuilder().setCustomId("oto_bj_stand").setEmoji("🛑").setStyle(ButtonStyle.Secondary).setDisabled(disabled), new ButtonBuilder().setCustomId("oto_bj_cancel").setEmoji("❌").setStyle(ButtonStyle.Danger).setDisabled(disabled))]; }
function otoV129BjEmbed(user, username, bet, dealer, player, status="PLAYING", text="Pilih aksi dengan tombol di bawah.") {
  const pt=otoV129BjValue(player), dt=otoV129BjValue(dealer); const colors={PLAYING:"#0B5CFF",WIN:"#0B5CFF",LOSE:"#FF4D6D",DRAW:"#F6C85F",BLACKJACK:"#00E5FF"};
  return new EmbedBuilder().setColor(colors[status] || "#0B5CFF").setTitle(`🃏 Hansip Blackjack — ${status}`).setDescription(`${user}, kamu bet **${Number(bet).toLocaleString("id-ID")} Hansip Coin** buat main blackjack\n\n**Dealer** \`[${dt}]\`\n${otoV129CardText(dealer)}\n\n**${username}** \`[${pt}]\`\n${otoV129CardText(player)}\n\n${text}`).setFooter({ text:"DESA TULUS • Hansip Coin hanya virtual game" });
}
async function otoCmdBlackjack(message, args=[]) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "blackjack", Number(config.otoBlackjackCooldownMs || 10000));
  if (wait) return replyOt(message, { content:`⏳ Tunggu **${wait} detik** sebelum main blackjack lagi.` });
  if (OTO_V129_ACTIVE_SESSIONS.has(message.author.id)) return replyOt(message, { content:"❌ Kamu masih punya meja blackjack aktif." });
  const { player } = otoGetPlayer(message.author); const max=Number(config.otoMaxBet || 50000), min=10;
  const raw = String(args[0] || "").toLowerCase(); const all = raw === "all"; let bet = all ? player.coin : Math.floor(Number(raw.replace(/\./g,""))||0);
  if (!all && bet > max) return replyOt(message, { content:`❌ Max bet blackjack **${max.toLocaleString("id-ID")} Hansip Coin**. Untuk all-in pakai \`otbj all\`.` });
  if (!bet || bet < min) return replyOt(message, { content:`⚠️ Format: \`otbj ${min}\` atau \`otbj all\`. Min bet ${min} Hansip Coin.` });
  if (bet > player.coin) return replyOt(message, { content:"❌ Coin kamu kurang. Pakai `otkerja` dulu." });
  player.coin -= bet; otoSavePlayer(message.author, player);
  OTO_V129_ACTIVE_SESSIONS.set(message.author.id, true);
  const msg = await replyOt(message, { embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🃏 Hansip Blackjack").setDescription(`${message.author}, kamu bet **${bet.toLocaleString("id-ID")} Hansip Coin** buat main blackjack.\n\n${otoV129Emoji("blackjackSpin","🃏")} Kartu sedang dikocok...\nTunggu **2 detik** sebelum kartu dibuka.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})] });
  await otoV129Sleep(otoV129Delay("bj"));
  let dealer=[otoV129DeckCard(), otoV129DeckCard()], hand=[otoV129DeckCard(), otoV129DeckCard()];
  async function finish(status) { const { player: p2 } = otoGetPlayer(message.author); const profit = status === "BLACKJACK" ? Math.floor(bet*2.5) : status === "WIN" ? bet*2 : status === "DRAW" ? bet : 0; p2.coin += profit; p2.stats.blackjack = Number(p2.stats.blackjack||0)+1; p2.stats[status === "WIN" || status === "BLACKJACK" ? "blackjackWin" : status === "LOSE" ? "blackjackLose" : "blackjackDraw"] = Number(p2.stats[status === "WIN" || status === "BLACKJACK" ? "blackjackWin" : status === "LOSE" ? "blackjackLose" : "blackjackDraw"]||0)+1; otoSavePlayer(message.author,p2); const text = status === "BLACKJACK" ? `🃏 BLACKJACK! Kamu menang **${(profit-bet).toLocaleString("id-ID")} Hansip Coin**!` : status === "WIN" ? `🎲 Kamu menang **${bet.toLocaleString("id-ID")} Hansip Coin**!` : status === "DRAW" ? `⚖️ Seri! Bet **${bet.toLocaleString("id-ID")} Hansip Coin** dikembalikan.` : `🎲 Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**!`; OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); return msg.edit({ embeds:[otoV129BjEmbed(message.author, message.author.username, bet, dealer, hand, status, `${text}\nSaldo sekarang: **${Number(p2.coin||0).toLocaleString("id-ID")} Hansip Coin**`)], components: otoV129BjButtons(true) }).catch(()=>null); }
  let status0 = otoV129BjResult(otoV129BjValue(hand), otoV129BjValue(dealer), hand);
  if (status0 === "BLACKJACK") return finish(status0);
  await msg.edit({ embeds:[otoV129BjEmbed(message.author, message.author.username, bet, dealer, hand)], components: otoV129BjButtons(false) }).catch(()=>null);
  const collector = msg.createMessageComponentCollector({ time:60000 });
  let locked=false;
  collector.on("collect", async i => {
    if (i.user.id !== message.author.id) return i.reply({ content:"❌ Ini bukan meja blackjack kamu.", flags: MessageFlags.Ephemeral }).catch(()=>null);
    if (locked) return i.deferUpdate().catch(()=>null);
    locked=true; await i.deferUpdate().catch(()=>null);
    if (i.customId === "oto_bj_cancel") { const { player:p2 }=otoGetPlayer(message.author); p2.coin += bet; otoSavePlayer(message.author,p2); OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); collector.stop("cancel"); return msg.edit({ embeds:[new EmbedBuilder().setColor("#FF4D6D").setTitle("❌ Hansip Blackjack Dibatalkan").setDescription(`Bet **${bet.toLocaleString("id-ID")} Hansip Coin** dikembalikan.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})], components: otoV129BjButtons(true)}).catch(()=>null); }
    if (i.customId === "oto_bj_hit") { await msg.edit({ embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🃏 Hansip Blackjack").setDescription(`${otoV129Emoji("blackjackSpin","🃏")} Kartu tambahan sedang dibuka...\nTunggu **2 detik**.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})], components: otoV129BjButtons(true)}).catch(()=>null); await otoV129Sleep(otoV129Delay("bj")); hand.push(otoV129DeckCard()); const st=otoV129BjResult(otoV129BjValue(hand), otoV129BjValue(dealer), hand); if (st === "LOSE" || st === "DRAW") { collector.stop("done"); return finish(st); } locked=false; return msg.edit({ embeds:[otoV129BjEmbed(message.author,message.author.username,bet,dealer,hand)], components: otoV129BjButtons(false)}).catch(()=>null); }
    if (i.customId === "oto_bj_stand") { await msg.edit({ embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🃏 Hansip Blackjack").setDescription(`${otoV129Emoji("blackjackSpin","🃏")} Dealer sedang membuka kartu...\nTunggu **2 detik**.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})], components: otoV129BjButtons(true)}).catch(()=>null); await otoV129Sleep(otoV129Delay("bj")); while(otoV129BjValue(dealer)<17) dealer.push(otoV129DeckCard()); const st=otoV129BjResult(otoV129BjValue(hand), otoV129BjValue(dealer), hand); collector.stop("done"); return finish(st); }
    locked=false;
  });
  collector.on("end", async (_, reason)=>{ if (reason === "done" || reason === "cancel") return; if (OTO_V129_ACTIVE_SESSIONS.has(message.author.id)) { const { player:p2 }=otoGetPlayer(message.author); p2.coin += bet; otoSavePlayer(message.author,p2); OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); await msg.edit({ components: otoV129BjButtons(true), embeds:[new EmbedBuilder().setColor("#F6C85F").setTitle("⌛ Hansip Blackjack Timeout").setDescription(`Meja otomatis ditutup. Bet **${bet.toLocaleString("id-ID")} Hansip Coin** dikembalikan.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})] }).catch(()=>null); } });
}

async function otoCmdRoyale(message, args=[], mode="flip") {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, `royale:${mode}`, Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content:`⏳ Tunggu **${wait} detik** sebelum main lagi.` });
  const { player } = otoGetPlayer(message.author); const maxBet = Number(config.otoMaxBet || 50000);
  if (mode === "coinflip") {
    let a0=String(args[0]||"").toLowerCase(), a1=String(args[1]||"").toLowerCase(); let choice, amountRaw;
    if (a0 === "all") { amountRaw="all"; choice=a1; } else { choice=a0; amountRaw=a1; }
    if (["kepala","head","heads","h"].includes(choice)) choice="HEADS"; else if (["ekor","tail","tails","t"].includes(choice)) choice="TAILS"; else return replyOt(message,{content:"⚠️ Format: `otcf heads 100`, `otcf tails 100`, `otcf all kepala`, atau `otcf all ekor`."});
    let bet = amountRaw === "all" ? Math.min(player.coin, maxBet) : Math.floor(Number(String(amountRaw||"0").replace(/\./g,""))||0);
    if (bet<=0) return replyOt(message,{content:"⚠️ Bet tidak valid. Contoh: `otcf heads 100`."}); if (bet>player.coin) return replyOt(message,{content:"❌ Coin kamu kurang. Pakai `otkerja` dulu."});
    const msg=await replyOt(message,{embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🪙 Hansip Coin Flip").setDescription(`${message.author}, kamu memasang **${bet.toLocaleString("id-ID")} Hansip Coin** di **${choice}**.\n\n${otoV129Emoji("coinSpin","🪙")} Koin sedang berputar...\nHasil akan muncul dalam **2 detik**.`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})]});
    await otoV129Sleep(otoV129Delay("cf")); const side=Math.random()<0.5?"HEADS":"TAILS"; const win=side===choice; if(win) player.coin += bet; else player.coin -= bet; otoSavePlayer(message.author,player);
    const embed=new EmbedBuilder().setColor(win?"#0B5CFF":"#FF4D6D").setTitle(`🪙 Hansip Coin Flip — ${win?"WIN":"LOSE"}`).setDescription(`${message.author}, hasil koin adalah **${side}**!\n\nPilihan kamu: **${choice}**\nBet: **${bet.toLocaleString("id-ID")} Hansip Coin**\n\n${win?`💎 Kamu menang **${bet.toLocaleString("id-ID")} Hansip Coin**!`:`💨 Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**!`}\nSaldo sekarang: **${Number(player.coin||0).toLocaleString("id-ID")} Hansip Coin**`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"});
    return msg?.edit ? msg.edit({embeds:[embed],components:[]}).catch(()=>replyOt(message,{embeds:[embed]})) : replyOt(message,{embeds:[embed]});
  }
  // Other simple virtual coin modes stay embed-only.
  const raw=String(args[0]||"").toLowerCase(); let bet=raw==="all"?Math.min(player.coin,maxBet):Math.floor(Number(raw.replace(/\./g,""))||0); if(bet<=0) return replyOt(message,{content:"⚠️ Format: `othoki 1000` atau `othoki all`."}); if(bet>player.coin) return replyOt(message,{content:"❌ Coin kamu kurang."}); const win=Math.random()<0.5; if(win) player.coin+=bet; else player.coin-=bet; otoSavePlayer(message.author,player); return replyOt(message,{embeds:[new EmbedBuilder().setColor(win?"#0B5CFF":"#FF4D6D").setTitle(`${win?"✅":"😭"} OTO ROYALE — ${win?"MENANG":"KALAH"}`).setDescription(`${message.author}, bet **${bet.toLocaleString("id-ID")} Hansip Coin**\n\n${win?"Koin jatuh di sisi **ROYALE 👑**":"Koin jatuh di sisi **ZONK**"}\n\nSaldo sekarang: **${Number(player.coin||0).toLocaleString("id-ID")} Hansip Coin**\n\nCoin ini hanya coin game Hansip, bukan uang asli.`).setFooter({text:"DESA TULUS • Hansip"})]});
}

async function otoCmdGive(message,args=[]) {
  if (!(await otoEnsureChannel(message))) return;
  const target=message.mentions.users.first(); const amount=Math.floor(Number(String(args.find(a=>/^\d/.test(a))||"0").replace(/\./g,""))||0);
  if(!target || amount<1) return replyOt(message,{content:"⚠️ Format: `otgive @user 500`."}); if(target.id===message.author.id) return replyOt(message,{content:"❌ Tidak bisa transfer ke diri sendiri."}); if(target.bot) return replyOt(message,{content:"❌ Tidak bisa transfer ke bot."});
  const { player:sender }=otoGetPlayer(message.author); if(sender.coin<amount) return replyOt(message,{content:"❌ Saldo Hansip Coin kamu kurang."});
  const row=new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId("oto_give_confirm").setLabel("Confirm").setEmoji("✅").setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId("oto_give_cancel").setLabel("Cancel").setEmoji("❌").setStyle(ButtonStyle.Danger));
  const embed=new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🪙 Hansip Coin Transfer").setDescription(`${message.author} mau memberi Hansip Coin ke ${target}.\n\nUntuk menerima transfer ini, klik ✅ Confirm.\nUntuk membatalkan transaksi ini, klik ❌ Cancel.\n\n⚠️ **Aturan penting:**\nHansip Coin hanya currency virtual game. Dilarang dipakai untuk jual beli uang asli, saldo, pulsa, crypto, item real, atau transaksi dunia nyata.\n\n**${message.author} akan memberi ${target}:**\n\n${amount.toLocaleString("id-ID")} Hansip Coin`).setFooter({text:"DESA TULUS • Hansip Transfer"});
  const msg=await replyOt(message,{embeds:[embed],components:[row]}); const col=msg.createMessageComponentCollector({time:60000}); let done=false;
  col.on("collect", async i=>{ if(i.customId==="oto_give_confirm" && i.user.id!==target.id) return i.reply({content: i.user.id===message.author.id?"❌ Transfer harus dikonfirmasi oleh penerima.":"❌ Ini bukan transaksi kamu.", flags:MessageFlags.Ephemeral}).catch(()=>null); if(i.customId==="oto_give_cancel" && ![target.id,message.author.id].includes(i.user.id)) return i.reply({content:"❌ Ini bukan transaksi kamu.", flags:MessageFlags.Ephemeral}).catch(()=>null); await i.deferUpdate().catch(()=>null); if(done) return; done=true; col.stop("done"); const disabled=new ActionRowBuilder().addComponents(row.components.map(c=>ButtonBuilder.from(c).setDisabled(true))); if(i.customId==="oto_give_cancel") return msg.edit({embeds:[new EmbedBuilder().setColor("#FF4D6D").setTitle("❌ Hansip Coin Transfer Dibatalkan").setDescription(`Transfer dari ${message.author} ke ${target} dibatalkan.\n\n${amount.toLocaleString("id-ID")} Hansip Coin\n\nTidak ada saldo yang berubah.`).setFooter({text:"DESA TULUS • Hansip Transfer"})],components:[disabled]}).catch(()=>null); const {player:s2}=otoGetPlayer(message.author); if(s2.coin<amount) return msg.edit({embeds:[new EmbedBuilder().setColor("#FF4D6D").setTitle("❌ Hansip Coin Transfer Gagal").setDescription("Saldo pengirim sudah tidak cukup saat konfirmasi. Transfer dibatalkan.").setFooter({text:"DESA TULUS • Hansip Transfer"})],components:[disabled]}).catch(()=>null); const {player:r2}=otoGetPlayer(target); s2.coin-=amount; r2.coin+=amount; otoSavePlayer(message.author,s2); otoSavePlayer(target,r2); return msg.edit({embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("✅ Hansip Coin Transfer Berhasil").setDescription(`${target} menerima transfer dari ${message.author}.\n\n+${amount.toLocaleString("id-ID")} Hansip Coin\n\nSaldo ${message.author.username}: ${Number(s2.coin||0).toLocaleString("id-ID")} Hansip Coin\nSaldo ${target.username}: ${Number(r2.coin||0).toLocaleString("id-ID")} Hansip Coin\n\nHansip Coin hanya virtual game, bukan uang asli.`).setFooter({text:"DESA TULUS • Hansip Transfer"})],components:[disabled]}).catch(()=>null); });
  col.on("end", async()=>{ if(done) return; const disabled=new ActionRowBuilder().addComponents(row.components.map(c=>ButtonBuilder.from(c).setDisabled(true))); await msg.edit({embeds:[new EmbedBuilder().setColor("#F6C85F").setTitle("⌛ Hansip Coin Transfer Expired").setDescription(`Transfer dari ${message.author} ke ${target} otomatis dibatalkan karena tidak dikonfirmasi.\n\n${amount.toLocaleString("id-ID")} Hansip Coin\n\nTidak ada saldo yang berubah.`).setFooter({text:"DESA TULUS • Hansip Transfer"})],components:[disabled]}).catch(()=>null); });
}

async function otoCmdSlots(message,args=[]) {
  if (!(await otoEnsureChannel(message))) return;
  const wait=otoCooldown(message.author.id,"slots",10000); if(wait) return replyOt(message,{content:`⏳ Tunggu **${wait} detik** sebelum spin lagi.`}); const {player}=otoGetPlayer(message.author); const raw=String(args[0]||"").toLowerCase(); const max=Number(config.otoMaxBet||50000); let bet=raw==="all"?Math.min(player.coin,max):Math.floor(Number(raw.replace(/\./g,""))||0); if(bet<=0) return replyOt(message,{content:"⚠️ Format: `otslots 100` atau `otslots all`."}); if(bet>player.coin) return replyOt(message,{content:"❌ Coin kamu kurang."}); const msg=await replyOt(message,{embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setDescription(`🎰 | ${message.author.username} memutar slot dengan bet **${bet.toLocaleString("id-ID")} Hansip Coin**...\n${otoV129Emoji("diceSpin","🎲")} ${otoV129Emoji("diceSpin","🎲")} ${otoV129Emoji("diceSpin","🎲")}`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"})]}); await otoV129Sleep(otoV129Delay("slots")); const reels=["🍒","💠","<:PurpleR:1513668875189878785>","🪙","✨","🎴"]; const r=[otoRand(reels),otoRand(reels),otoRand(reels)]; const win=r[0]===r[1]&&r[1]===r[2]; if(win) player.coin+=bet*3; else player.coin-=bet; otoSavePlayer(message.author,player); const embed=new EmbedBuilder().setColor(win?"#0B5CFF":"#FF4D6D").setDescription(`🎰 | Hasil: ${r.join(" ")}\n${win?`💎 JACKPOT! Kamu menang **${(bet*3).toLocaleString("id-ID")} Hansip Coin**!`:`💨 Belum hoki. Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**.`}\nSaldo sekarang: **${Number(player.coin||0).toLocaleString("id-ID")} Hansip Coin**`).setFooter({text:"DESA TULUS • Hansip Coin hanya virtual game"}); return msg?.edit?msg.edit({embeds:[embed],components:[]}).catch(()=>replyOt(message,{embeds:[embed]})):replyOt(message,{embeds:[embed]});
}

async function otoCmdInv(message,args=[]) { if (!(await otoEnsureChannel(message))) return; const {player}=otoGetPlayer(message.author); const crates=Object.values(player.inventory?.crates||{}).reduce((a,b)=>a+Number(b||0),0); const weapons=Object.keys(player.inventory?.weapons||{}).length; const frags=Object.values(player.inventory?.fragments||{}).reduce((a,b)=>a+Number(b||0),0); return replyOt(message,{embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🎒 Hansip Inventory").setDescription(`🪙 Coin: **${Number(player.coin||0).toLocaleString("id-ID")}**\n🎴 Dust: **${Number(player.dust||0).toLocaleString("id-ID")}**\n🎴 NPC: **${Object.keys(player.npcs||{}).length}**\n📦 Crate: **${crates}**\n⚔️ Weapon: **${weapons}**\n<:PurpleR:1513668875189878785> Fragment: **${frags}**\n\nCommand: \`otinv crate\` • \`otopen all\` • \`otshop\``).setFooter({text:"DESA TULUS • Hansip"})]}); }
async function otoCmdOpen(message,args=[]) { if (!(await otoEnsureChannel(message))) return; const {player}=otoGetPlayer(message.author); const crates=player.inventory?.crates||{}; const total=Object.values(crates).reduce((a,b)=>a+Number(b||0),0); if(!total) return replyOt(message,{content:"📦 Kamu belum punya crate. Hunt/daily dulu ya."}); const opened = String(args[0]||"").toLowerCase()==="all" ? total : 1; let coin=opened*(50+Math.floor(Math.random()*80)), dust=opened*(2+Math.floor(Math.random()*5)), frag=opened*(1+Math.floor(Math.random()*4)); player.coin+=coin; player.dust+=dust; player.inventory.fragments.common_fragment=Number(player.inventory.fragments.common_fragment||0)+frag; // consume simple
  for (const k of Object.keys(crates)) { if (opened===total) crates[k]=0; else { crates[k]=Math.max(0,Number(crates[k]||0)-1); break; } } otoSavePlayer(message.author,player); return replyOt(message,{embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("📦 Hansip Crate Open").setDescription(`📦 | ${message.author.username} membuka **${opened} crate**!\n\n🎁 Reward:\n🪙 Coin +**${coin.toLocaleString("id-ID")}**\n🎴 Dust +**${dust}**\n<:PurpleR:1513668875189878785> Fragment +**${frag}**\n\nCommand: \`otinv\` • \`otopen all\``).setFooter({text:"DESA TULUS • Hansip"})]}); }
async function otoCmdBattle(message) { if (!(await otoEnsureChannel(message))) return; const {player}=otoGetPlayer(message.author); const power=otoTeamPower(player); if(power<=0) return replyOt(message,{content:"❌ Kamu belum punya team aktif. Pakai `otteam add <npc> <slot>`."}); const enemy=Math.floor(power*(0.7+Math.random()*0.8)); const win=power>=enemy || Math.random()<0.45; const coin=win?200+Math.floor(Math.random()*250):40+Math.floor(Math.random()*80); const xp=win?40+Math.floor(Math.random()*50):10+Math.floor(Math.random()*20); player.coin+=coin; player.exp+=xp; player.stats.battles=Number(player.stats.battles||0)+1; player.stats[win?"wins":"losses"]=Number(player.stats[win?"wins":"losses"]||0)+1; otoSavePlayer(message.author,player); return replyOt(message,{embeds:[new EmbedBuilder().setColor(win?"#0B5CFF":"#FF4D6D").setTitle(`⚔️ Hansip Battle — ${win?"WIN":"LOSE"}`).setDescription(`Team Power: **${power.toLocaleString("id-ID")}**\nEnemy Power: **${enemy.toLocaleString("id-ID")}**\n\n${win?"💎 Team kamu menang battle!":"💨 Team kamu kalah, tapi tetap dapat reward hiburan."}\n\nReward:\n🪙 Coin +**${coin}**\n✨ EXP +**${xp}**\n\nCommand: \`oth\` • \`otteam view\` • \`otinv\``).setFooter({text:"DESA TULUS • Hansip"})]}); }
async function otoCmdTop(message) { if (!(await otoEnsureChannel(message))) return; const players=Object.values(otoReadPlayers()).sort((a,b)=>(Number(b.coin||0)+Number(b.exp||0))-(Number(a.coin||0)+Number(a.exp||0))).slice(0,10); const lines=players.map((p,i)=>`**#${i+1}** ${p.username||p.userId} — 🪙 ${Number(p.coin||0).toLocaleString("id-ID")} • Lv ${otoLevel(p.exp)}`).join("\n")||"Belum ada leaderboard."; return replyOt(message,{embeds:[new EmbedBuilder().setColor(config.otoEmbedColor||"#0B5CFF").setTitle("🏆 Hansip Leaderboard").setDescription(lines).setFooter({text:"DESA TULUS • Hansip"})]}); }
/* END Hansip No-Image Emoji Hard Fix v1.29.0 */

async function processOtoCommand(message, parsed, command) {
  if (!OTO_COMMAND_SET.has(command.name) && !OTO_OVERLAP_COMMANDS.has(command.name)) return false;
  if (!otoShouldHandle(message, command.name, parsed.args)) return false;
  const isOwner = command.permission === "owner" || OTO_OWNER_COMMANDS.has(command.name) || (command.name === "otsendpanel" && parsed.args[0] === "oto") || (command.name === "otupdatepanel" && parsed.args[0] === "oto") || (command.name === "otsetchannel" && parsed.args[0] === "oto");
  if (isOwner && !isHansipwner(message.member || message.author, message.guild)) { await replyOt(message, { content: "❌ Command ini khusus owner Hansip." }); return true; }
  try {
    if (command.name === "otsetchannel" && String(parsed.args[0] || "").toLowerCase() === "oto") return otoCmdSetChannel(message, parsed.args.slice(1)), true;
    if (command.name === "otchannel") { if (String(parsed.args[0] || "").toLowerCase() === "log") return otoCmdSetLog(message, parsed.args.slice(1)), true; return otoCmdSetChannel(message, parsed.args.filter(a => a !== "oto")), true; }
    if (command.name === "otsendpanel" && parsed.args[0] === "oto") return otoSendPanel(message, false), true;
    if (command.name === "otupdatepanel" && parsed.args[0] === "oto") return otoSendPanel(message, true), true;
    if (command.name === "otpanel" && (parsed.args[0] === "oto" || otoIsChannel(message))) return otoSendPanel(message, true), true;
    if (command.name === "otsetup") { await otoCmdSetChannel(message, parsed.args); await otoSendPanel(message, true); return true; }
    if (command.name === "otregenimage") return otoCmdImage(message, ["generate", "allnpc"]), true;
    if (command.name === "otflow") return otoCmdFlow(message), true;
    if (command.name === "othelp") { if (!(await otoEnsureChannel(message))) return true; return otoReply(message, otoHelpEmbed(), otoGetOrCreateAsset("banner", "oto-panel", { title: "OTO HELP", icon: "💠", rarity: "rare" })), true; }
    if (command.name === "oth" || command.name === "othunt") return otoCmdHunt(message), true;
    if (command.name === "otinv") return otoCmdInv(message, parsed.args), true;
    if (command.name === "otprofil" || command.name === "otprofile") return otoCmdProfile(message), true;
    if (command.name === "otzoo" || command.name === "otnpc" || command.name === "otcollection") return otoCmdNpc(message, parsed.args), true;
    if (command.name === "otcard") return otoCmdCard(message, parsed.args), true;
    if (command.name === "otteam") return otoCmdTeam(message, parsed.args), true;
    if (command.name === "otb" || command.name === "otbattle") return otoCmdBattle(message), true;
    if (command.name === "otluck") return otoCmdLuck(message), true;
    if (command.name === "otopen") return otoCmdOpen(message, parsed.args), true;
    if (command.name === "otkerja" || command.name === "otwork") return otoCmdWork(message), true;
    if (command.name === "otslots") return otoCmdSlots(message, parsed.args), true;
    if (command.name === "otgive") return otoCmdGive(message, parsed.args), true;
    if (command.name === "otcash" || command.name === "otbal" || command.name === "otcoin") return otoCmdBal(message), true;
    if (command.name === "otbj" || command.name === "otblackjack") return otoCmdBlackjack(message, parsed.args), true;
    if (command.name === "othoki" || command.name === "otroyale") return otoCmdRoyale(message, parsed.args, "flip"), true;
    if (command.name === "otcf") return otoCmdRoyale(message, parsed.args, "coinflip"), true;
    if (command.name === "otkartu") return otoCmdRoyale(message, parsed.args, "card"), true;
    if (command.name === "otdaily") return otoCmdDaily(message), true;
    if (command.name === "otquest") return otoCmdQuest(message), true;
    if (command.name === "otshop") return otoCmdShop(message), true;
    if (command.name === "otbuy") return otoCmdBuy(message, parsed.args), true;
    if (command.name === "ottop" || command.name === "otlb" || command.name === "otrank") return otoCmdTop(message), true;
    if (command.name === "otupgrade") return otoCmdUpgrade(message, parsed.args), true;
    if (command.name === "otequip") return otoCmdEquip(message, parsed.args), true;
    if (command.name === "otweapon") return otoCmdWeapon(message, parsed.args), true;
    if (command.name === "otevolve") return otoCmdEvolve(message, parsed.args), true;
    if (command.name === "otlock") return otoCmdLockRelease(message, parsed.args, true), true;
    if (command.name === "otunlock") return otoCmdLockRelease(message, parsed.args, false), true;
    if (command.name === "otrelease") return otoCmdRelease(message, parsed.args), true;
    if (command.name === "otgivecoin") return otoCmdOwnerGive(message, parsed.args, "coin"), true;
    if (command.name === "otgivexp") return otoCmdOwnerGive(message, parsed.args, "xp"), true;
    if (command.name === "otgivecrate") return otoCmdOwnerGive(message, parsed.args, "crate"), true;
    if (command.name === "otgiveweapon") return otoCmdOwnerGive(message, parsed.args, "weapon"), true;
    if (command.name === "otgivenpc") return otoCmdOwnerGive(message, parsed.args, "npc"), true;
    if (command.name === "otsetmaxbet") { const amount = Number(parsed.args[0] || 0); if (!amount) return replyOt(message, { content: "⚠️ Format: `otsetmaxbet 50000`" }), true; config.otoMaxBet = amount; saveConfig(config); await replyOt(message, { content: `✅ Max bet Hansip jadi ${amount.toLocaleString("id-ID")} coin game.` }); return true; }
    if (command.name === "otassetcheck") return otoCmdAssetCheck(message), true;
    if (command.name === "otnpcimagecheck") return otoCmdNpcImageCheck(message), true;
    if (command.name === "otimage") return otoCmdImage(message, parsed.args), true;
    if (command.name === "otbackup") return otoCmdBackup(message), true;
    if (command.name === "otresetplayer") { const member = message.mentions.members.first(); if (!member || !parsed.args.includes("confirm")) return replyOt(message, { content: "⚠️ Format: `otresetplayer @user confirm`" }), true; const players = otoReadPlayers(); delete players[member.id]; otoWritePlayers(players); await replyOt(message, { content: `✅ Data Hansip ${member} direset aman. Data lama Hansip lain tidak disentuh.` }); return true; }
    if (command.name === "otsetevent") return replyOt(message, { content: `✅ Event Hansip diset: **${parsed.argText || "Blue Festival"}**.` }), true;
    return false;
  } catch (error) {
    console.error("❌ Hansip command error:", error);
    await replyOt(message, { content: "❌ Command Hansip gagal diproses, tapi data lama tetap aman dan tidak direset." });
    return true;
  }
}



function dashboardOtoCenterHtml() {
  otoEnsureFiles();
  const players = Object.keys(otoReadPlayers()).length;
  const npcs = otoReadNpcs();
  const items = otoReadItems();
  const missing = [];
  OTO_BANNER_KEYS.forEach(b => {
    const p = otoAssetPath("banner", b, { rarity: "rare" });
    if (!fs.existsSync(p)) missing.push(b);
  });
  const npcPreview = npcs.slice(0, 60).map(n => `<div class="list-row item-row" data-item="${htmlEscape(n.name)} ${htmlEscape(n.rarity)}"><div><b>${htmlEscape(otoRarity(n.rarity).emoji)} ${htmlEscape(n.name)}</b><span class="note"><br>${htmlEscape(n.rarity)} • ${htmlEscape(n.element)} • ${htmlEscape(n.skill)}</span></div><span class="chip ok">Auto Image</span></div>`).join("");
  const itemPreview = items.slice(0, 60).map(i => `<div class="list-row item-row" data-item="${htmlEscape(i.name)} ${htmlEscape(i.type)} ${htmlEscape(i.rarity)}"><div><b>${htmlEscape(i.name)}</b><span class="note"><br>${htmlEscape(i.type)} • ${htmlEscape(i.rarity)} • ${Number(i.buyPrice || 0).toLocaleString("id-ID")} coin</span></div><span class="chip ok">${htmlEscape(i.source?.[0] || "shop")}</span></div>`).join("");
  return dashboardSaveForm("oto", [
    dashboardInput("otoEnabled", "Hansip Aktif", { type: "checkbox", wide: true }),
    dashboardInput("otoChannelId", "Channel Hansip"),
    dashboardInput("otoLogChannelId", "Channel Log Hansip"),
    dashboardInput("otoOnlyOneChannel", "Hanya 1 Channel", { type: "checkbox", wide: true }),
    dashboardInput("otoEmbedColor", "Warna Embed Hansip", { type: "color" }),
    dashboardInput("otoEmbedAccent", "Accent Hansip", { type: "color" }),
    dashboardInput("otoAutoImageEnabled", "Emoji-only Mode", { type: "checkbox", wide: true }),
    dashboardInput("otoAutoImageMode", "Mode Visual Hansip"),
    dashboardInput("otoExternalAiImageEnabled", "Matikan Image/Canvas", { type: "checkbox", wide: true }),
    dashboardInput("otoRoyaleEnabled", "Hansip Royale Virtual", { type: "checkbox", wide: true }),
    dashboardInput("otoMaxBet", "Max Bet Coin Game", { type: "number" }),
    dashboardInput("otoRoyaleCooldownMs", "Cooldown Royale MS", { type: "number" }),
    dashboardInput("otoHuntCooldownMs", "Cooldown Hunt MS", { type: "number" }),
    dashboardInput("otoBannerEnabled", "Banner Embed", { type: "checkbox", wide: true }),
    dashboardInput("otoVariantEnabled", "Variant / Shiny System", { type: "checkbox", wide: true }),
    dashboardInput("otoDuplicateToFragment", "Duplicate Jadi Fragment", { type: "checkbox", wide: true }),
    dashboardInput("otoTeamSynergyEnabled", "Team Synergy", { type: "checkbox", wide: true })
  ].join(""), "💠 Hansip Control Center") + `<div class="panel"><h3>📡 Status Hansip</h3><div class="status-grid"><div><b>Build</b><span>${OTO_BUILD_VERSION}</span></div><div><b>Players</b><span>${players}</span></div><div><b>NPC Catalog</b><span>${npcs.length}</span></div><div><b>Item Catalog</b><span>${items.length}</span></div><div><b>Channel</b><span>${config.otoChannelId ? "Terisi" : "Belum"}</span></div><div><b>Visual Mode</b><span>${htmlEscape(config.otoAutoImageMode || "canvas")}</span></div><div><b>Missing Banner</b><span>${missing.length}</span></div><div><b>No Real Money</b><span>Aktif</span></div><div><b>Variant/Shiny</b><span>Aktif</span></div><div><b>Team Synergy</b><span>Aktif</span></div><div><b>Duplicate</b><span>Fragment</span></div></div></div><div class="panel"><div class="panel-title"><div><h3>🧑 Hansip NPC + Luck Studio</h3><p>Atur tema NPC orang, luck otomatis 1-100, level-up embed, dan mode tanpa gambar. Tidak menampilkan secret/env/token.</p></div><span class="chip ok">Emoji-only</span></div><div class="quick-grid"><a class="quick" href="/dashboard?tab=oto"><b>💠 Preview Hansip</b><span>Panel dan setting Hansip.</span></a><a class="quick" href="/dashboard?tab=json"><b>🧾 Safe JSON</b><span>Edit config aman.</span></a><span class="quick"><b>Command</b><span>otimage generate allnpc<br>otimage generate banners<br>otassetcheck</span></span><span class="quick"><b>Fallback</b><span>Manual image → generated image → rarity fallback → embed tanpa image.</span></span></div></div><div class="panel"><h3>🎴 NPC Catalog Preview</h3><input class="raw" style="min-height:auto" placeholder="Search NPC / rarity" oninput="document.querySelectorAll('.item-row').forEach(function(row){row.style.display=row.dataset.item.toLowerCase().includes(event.target.value.toLowerCase())?'flex':'none'})"><div class="list" style="margin-top:12px">${npcPreview}</div></div><div class="panel"><h3>🎒 Item / Crate / Weapon Preview</h3><div class="list">${itemPreview}</div><p class="note">Weapon full hanya dari crate. Coin Hansip hanya coin game virtual, tidak ada top-up/cashout/uang asli.</p></div>`;
}

const suggestionCooldown = new Map();

function commandCenterConfig() {
  return config.commandCenter || DEFAULT_CONFIG.commandCenter || {};
}

function permissionCenterConfig() {
  return config.permissionCenter || DEFAULT_CONFIG.permissionCenter || {};
}

function getConfiguredOwnerIds(guild = null) {
  const ids = [
    permissionCenterConfig().ownerUserId,
    config.ownerUserId,
    process.env.OWNER_USER_ID,
    process.env.OWNER_ID,
    process.env.BOT_OWNER_ID,
    guild?.ownerId
  ];
  return Array.from(new Set(ids.map(v => String(v || "").trim()).filter(v => /^\d{15,25}$/.test(v))));
}

function isHansipwner(memberOrUser, guild = null) {
  const userId = memberOrUser?.id || memberOrUser?.user?.id || "";
  return getConfiguredOwnerIds(guild).includes(userId);
}

function roleIdSet(values = []) {
  return new Set((values || []).map(v => String(v || "").trim()).filter(Boolean));
}

function memberHasAnyRole(member, ids = []) {
  if (!member?.roles?.cache) return false;
  const set = roleIdSet(ids);
  if (!set.size) return false;
  return member.roles.cache.some(role => set.has(role.id));
}

function isOtStaff(member) {
  if (!member) return false;
  if (isHansipwner(member, member.guild)) return true;
  const pc = permissionCenterConfig();
  const staffIds = [
    ...(config.staffRoleIds || []),
    ...(pc.staffRoleIds || []),
    ...(pc.adminRoleIds || [])
  ];
  return memberHasAnyRole(member, staffIds) || member.permissions?.has?.(PermissionFlagsBits.ManageGuild) || member.permissions?.has?.(PermissionFlagsBits.Administrator);
}

function canStaffSendPanel(member) {
  if (isHansipwner(member, member?.guild)) return true;
  const pc = permissionCenterConfig();
  return Boolean(pc.allowStaffSendPanel) && (isOtStaff(member) || memberHasAnyRole(member, pc.panelRoleIds || []));
}

function canStaffViewLogs(member) {
  if (isHansipwner(member, member?.guild)) return true;
  const pc = permissionCenterConfig();
  return Boolean(pc.allowStaffViewLogs !== false) && (isOtStaff(member) || memberHasAnyRole(member, pc.logRoleIds || []));
}

function isCommandDisabled(name) {
  const disabled = commandCenterConfig().disabledCommands || [];
  return disabled.map(v => String(v).toLowerCase()).includes(String(name).toLowerCase());
}

function hasCommandPermission(message, command) {
  if (!command) return false;
  if (command.permission === "member") return true;
  if (command.permission === "staff") return isOtStaff(message.member);
  if (command.permission === "staffPanel") return canStaffSendPanel(message.member);
  if (command.permission === "staffLog") return canStaffViewLogs(message.member);
  if (command.permission === "owner") return isHansipwner(message.author, message.guild);
  if (command.permission === "ownerOrStaffPanel") return isHansipwner(message.author, message.guild) || canStaffSendPanel(message.member);
  return false;
}

function getPermissionLevel(message) {
  if (isHansipwner(message.author, message.guild)) return "owner";
  if (isOtStaff(message.member)) return "staff";
  return "member";
}

function visibleCommandsFor(message) {
  const level = getPermissionLevel(message);
  return OT_COMMANDS.filter(cmd => {
    if (isCommandDisabled(cmd.name)) return false;
    if (level === "owner") return true;
    if (level === "staff") return cmd.category === "member" || cmd.category === "staff";
    return cmd.category === "member";
  });
}

function otBaseEmbed(title, description, color = null) {
  return new EmbedBuilder()
    .setColor(color || config.embedColor || "#0B5CFF")
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `${config.serverName || "DESA TULUS"} • Hansip Command Center` })
    .setTimestamp();
}

async function replyOt(message, payload) {
  return message.reply(payload).catch(() => message.channel.send(payload).catch(() => null));
}

function parseOtCommand(content) {
  const text = String(content || "").trim();
  if (!text) return null;
  const parts = text.split(/\s+/);
  let raw = String(parts.shift() || "").toLowerCase();

  if (raw === "ot" && parts[0]) raw = `ot${String(parts.shift()).toLowerCase()}`;
  const mapped = OT_LEGACY_ALIASES[raw] || raw;
  if (!OT_COMMAND_MAP.has(mapped)) return null;
  return { name: mapped, raw, args: parts, argText: parts.join(" ") };
}

function featureEnabled(key) {
  return config.features?.[key] !== false;
}

function formatStatus(value) {
  return value ? "✅ Aktif" : "❌ Nonaktif";
}

function uptimeText() {
  const total = Math.floor(process.uptime());
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h) return `${h}j ${m}m ${s}d`;
  if (m) return `${m}m ${s}d`;
  return `${s}d`;
}

function readPanelState() {
  return readJsonFile(PANEL_STATE_FILE, {});
}

function savePanelState(data) {
  writeJsonFile(PANEL_STATE_FILE, data || {});
}

function updatePanelState(type, message) {
  const state = readPanelState();
  state[type] = {
    channelId: message.channel?.id || "",
    messageId: message.id || "",
    sentAt: new Date().toISOString(),
    jumpUrl: message.url || ""
  };
  savePanelState(state);
}

function panelAntiSpamOk(type) {
  const ms = Number(commandCenterConfig().panelAntiSpamMs || 60000);
  const saved = readPanelState()[type];
  if (!saved?.sentAt) return { ok: true, waitMs: 0 };
  const diff = Date.now() - new Date(saved.sentAt).getTime();
  if (diff >= ms) return { ok: true, waitMs: 0 };
  return { ok: false, waitMs: ms - diff };
}

function commandTableMarkdown(commands) {
  return commands.map(cmd => `• \`${cmd.usage}\` — ${cmd.description}`).join("\n");
}

async function cmdHelp(message) {
  const visible = visibleCommandsFor(message);
  const member = visible.filter(c => c.category === "member");
  const staff = visible.filter(c => c.category === "staff");
  const owner = visible.filter(c => c.category === "owner");
  const level = getPermissionLevel(message);

  const embed = otBaseEmbed(
    "⌨️ Bantuan Command Hansip",
    `Bantuan ditampilkan sesuai izin kamu: **${level.toUpperCase()}**.\nCommand utama sekarang memakai format **ot...**.`
  );
  embed.addFields({ name: "👥 Member", value: commandTableMarkdown(member) || "Tidak ada.", inline: false });
  if (staff.length) embed.addFields({ name: "🛡️ Staff", value: commandTableMarkdown(staff), inline: false });
  if (owner.length) embed.addFields({ name: "👑 Owner", value: commandTableMarkdown(owner), inline: false });
  if (commandCenterConfig().showLegacyAliases !== false) {
    embed.addFields({ name: "🔁 Alias lama", value: "`!help`, `!ping`, `!panel`, `!status`, `!backup` tetap diarahkan ke command `ot...` agar user lama tidak error.", inline: false });
  }
  return replyOt(message, { embeds: [embed] });
}

async function cmdPing(message) {
  const ping = Math.max(0, Date.now() - message.createdTimestamp);
  const ws = Math.round(client.ws.ping || 0);
  return replyOt(message, { embeds: [otBaseEmbed("🏓 Pong Hansip", `Ping pesan: **${ping}ms**\nWebSocket: **${ws}ms**\n🛡️ Data lama tetap aman dan tidak direset.`)] });
}

async function cmdInfo(message) {
  const embed = otBaseEmbed("ℹ️ Info Hansip", `Hansip membantu server **${message.guild?.name || config.serverName || "DESA TULUS"}** lewat fitur mabar, AFK, sambung kata, dan dashboard.\n\nCommand utama: **othelp**, **otping**, **otmabar**, **otafk**.`);
  embed.addFields(
    { name: "Versi", value: String(config.botVersion || "1.16.0-command-center"), inline: true },
    { name: "Uptime", value: uptimeText(), inline: true },
    { name: "Storage", value: getStorageMode(), inline: false }
  );
  return replyOt(message, { embeds: [embed] });
}

function buildTextMabarPanelEmbed() {
  return new EmbedBuilder()
    .setColor("#7DBD77")
    .setTitle("🌾 CARI MABAR DESA TULUS")
    .setDescription(
      `Cari teman main tanpa memenuhi channel dengan pesan panjang.

**Alur:** \`Platform\` → \`Game\` → \`Mode\` → \`Slot\` → \`Waktu\` → \`Voice\`

Tersedia banyak pilihan game **Mobile** dan **PC**. Setelah selesai, Pak Hansip akan membuat post ringkas, tiga tombol, serta thread diskusi otomatis.`
    )
    .addFields(
      { name: "📱 Mobile", value: `${GAME_OPTIONS.Mobile.length} pilihan game`, inline: true },
      { name: "💻 PC", value: `${GAME_OPTIONS.PC.length} pilihan game`, inline: true },
      { name: "🧵 Rapi", value: "Thread dibuat otomatis", inline: true }
    )
    .setFooter({
      text: "DESA TULUS • Panel Cari Mabar",
      iconURL: "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless"
    })
    .setTimestamp();
}

async function cmdMabar(message) {
  if (!featureEnabled("mabar")) return replyOt(message, { content: "❌ Fitur mabar sedang dinonaktifkan oleh owner." });
  startSession(message.author.id);
  const row = buildSelectRow("mabar_panel_platform", "🎮 Klik di sini untuk mulai cari mabar", PLATFORM_OPTIONS);
  return replyOt(message, { embeds: [buildTextMabarPanelEmbed()], components: [row] });
}

async function cmdSaran(message, argText) {
  if (!featureEnabled("saran")) return replyOt(message, { content: "❌ Fitur saran belum aktif. Owner bisa aktifkan dengan `otfitur saran on` dan set channel dengan `otsetchannel saran #channel`." });
  const suggestion = String(argText || "").trim();
  if (suggestion.length < 5) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otsaran tambahkan event mabar mingguan`" });
  const cooldownMs = Number(commandCenterConfig().suggestionCooldownMs || 60000);
  const last = suggestionCooldown.get(message.author.id) || 0;
  const diff = Date.now() - last;
  if (diff < cooldownMs) return replyOt(message, { content: `⏳ Tunggu ${Math.ceil((cooldownMs - diff) / 1000)} detik sebelum kirim saran lagi.` });

  const channelId = config.suggestionChannelId || "";
  const target = channelId ? await client.channels.fetch(channelId).catch(() => null) : null;
  if (!target || !target.isTextBased()) return replyOt(message, { content: "❌ Channel saran belum diatur. Owner bisa pakai `otsetchannel saran #channel`." });

  const embed = otBaseEmbed("💡 Saran Warga", `${suggestion.slice(0, 1800)}\n\n👤 Dari: ${message.author}`);
  await target.send({ embeds: [embed] }).catch(() => null);
  suggestionCooldown.set(message.author.id, Date.now());
  return replyOt(message, { content: "✅ Saran kamu sudah dikirim dengan aman. Terima kasih ya." });
}

async function cmdStaff(message) {
  const embed = otBaseEmbed("🛡️ Menu Staff Hansip", "Menu ini khusus operasional. Staff tidak bisa mengubah config inti, backup/restore, reload, atau reset data.");
  embed.addFields(
    { name: "Command aman", value: "`otcekfitur`\n`otcekpanel`\n`otlog scam`\n`otkirimpanel mabar` jika owner mengizinkan", inline: false },
    { name: "Batasan", value: "Staff tidak bisa mengubah channel, role, config inti, backup, restore, reload, atau maintenance.", inline: false }
  );
  return replyOt(message, { embeds: [embed] });
}

function featureStatusLines() {
  const anti = antiScamConfig();
  return [
    `AFK: **${formatStatus(featureEnabled("afk"))}**`,
    `Mabar: **${formatStatus(featureEnabled("mabar"))}**`,
    `Saran: **${formatStatus(featureEnabled("saran") && Boolean(config.suggestionChannelId))}**`,
    `Anti Scam: **${formatStatus(anti.enabled !== false)}**`,
    `Anti Link/Phishing: **${formatStatus(anti.deleteSuspiciousLinks !== false || anti.deletePhishingLinks !== false)}**`,
    `Panel: **${formatStatus(featureEnabled("panel"))}**`,
    `Dashboard: **${formatStatus(featureEnabled("dashboard"))}**`,
    `Sambung Kata: **${formatStatus(featureEnabled("sambungKata"))}**`,
    `Truth/Dare: **${formatStatus(featureEnabled("truthOrDare"))}**`
  ];
}

async function cmdCekFitur(message) {
  return replyOt(message, { embeds: [otBaseEmbed("✅ Status Fitur Hansip", featureStatusLines().join("\n"))] });
}

async function cmdCekPanel(message) {
  const state = readPanelState();
  const lines = ["mabar", "afk", "sambung", "truth", "help", "saran"].map(type => {
    const item = state[type];
    if (!item) return `• **${type}**: belum tercatat`;
    return `• **${type}**: <#${item.channelId}> • ID \`${item.messageId}\` • ${item.sentAt}`;
  });
  return replyOt(message, { embeds: [otBaseEmbed("📌 Status Panel Hansip", lines.join("\n"))] });
}

async function sendNamedPanel(message, type) {
  if (!featureEnabled("panel")) return replyOt(message, { content: "❌ Fitur panel sedang dinonaktifkan oleh owner." });
  const panelType = String(type || "").toLowerCase();
  if (!panelType) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otkirimpanel mabar` atau `otpanel help`." });
  const spam = panelAntiSpamOk(panelType);
  if (!spam.ok) return replyOt(message, { content: `⏳ Panel **${panelType}** baru saja dikirim. Tunggu ${Math.ceil(spam.waitMs / 1000)} detik supaya tidak spam.` });

  let sent = null;
  if (panelType === "mabar") {
    const row = buildSelectRow("mabar_panel_platform", "🎮 Klik di sini untuk mulai cari mabar", PLATFORM_OPTIONS);
    sent = await message.channel.send({ embeds: [buildTextMabarPanelEmbed()], components: [row] });
  } else if (panelType === "afk") {
    sent = await message.channel.send({ embeds: [buildAfkSetupEmbed({ client })] });
  } else if (panelType === "sambung") {
    sent = await message.channel.send({ embeds: [buildSambungPanelEmbed({ client })] });
  } else if (panelType === "truth" || panelType === "truth-dare") {
    sent = await message.channel.send({ embeds: [buildTruthDarePanel({ client })], components: [buildTruthDareButtons()] });
  } else if (panelType === "help") {
    sent = await message.channel.send({ embeds: [otBaseEmbed("⌨️ Panel Bantuan Hansip", "Gunakan `othelp` untuk melihat command sesuai permission.\nMember: `otping`, `otinfo`, `otafk`, `otmabar`, `otsaran`.\nStaff/Owner akan melihat command tambahan otomatis.")] });
  } else if (panelType === "saran") {
    sent = await message.channel.send({ embeds: [otBaseEmbed("💡 Panel Saran", "Kirim saran dengan format:\n`otsaran isi saran kamu`\n\nSaran akan masuk ke channel saran jika sudah diatur owner.")] });
  } else {
    return replyOt(message, { content: "⚠️ Panel tidak dikenal. Pilihan: `mabar`, `afk`, `sambung`, `truth`, `help`, `saran`." });
  }

  if (sent) updatePanelState(panelType, sent);
  return replyOt(message, { content: `✅ Panel **${panelType}** berhasil dikirim. 🛡️ Data lama tetap aman dan tidak direset.` });
}

async function cmdLog(message, argText) {
  const type = String(argText || "afk").trim().toLowerCase();
  let lines = [];

  if (type === "afk") {
    const data = readAfkData();
    lines = Object.entries(data).slice(0, 10).map(([id, item]) => `• <@${id}> — ${item.reason || "AFK"}`);
  } else if (type === "mabar") {
    const data = readMabarData();
    lines = data.slice(-8).reverse().map(item => `• ${item.game || "Mabar"} — host <@${item.hostId || item.host || ""}>`);
  } else if (type === "error") {
    lines = [commandCenterConfig().lastError || mongoLastError || "Belum ada error penting yang tercatat."];
  } else {
    return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otlog afk`, `otlog mabar`, atau `otlog error`." });
  }

  return replyOt(message, { embeds: [otBaseEmbed("📜 Log Aman Hansip", lines.length ? lines.join("\n") : "Belum ada log untuk kategori ini.")] });
}

async function cmdStatus(message) {
  const stats = getDashboardStats();
  const state = readPanelState();
  const embed = otBaseEmbed("📡 Status Lengkap Hansip", "Status ini khusus owner. Tidak menampilkan token, env, cookie, atau MongoDB URI.");
  embed.addFields(
    { name: "Bot", value: `Online sebagai **${client.user?.tag || "Hansip"}**\nPing: **${Math.round(client.ws.ping || 0)}ms**\nUptime: **${uptimeText()}**`, inline: false },
    { name: "Version", value: `${config.botVersion || "1.16.0-command-center"}\n${OT_COMMAND_BUILD_VERSION}\nDashboard: ${DASHBOARD_BUILD_VERSION}`, inline: false },
    { name: "Storage", value: getStorageMode(), inline: false },
    { name: "Fitur aktif", value: featureStatusLines().join("\n"), inline: false },
    { name: "Hansip", value: `Channel: ${config.gameChannelId ? `<#${config.gameChannelId}>` : "Belum diatur"}\nAuto Event: ${config.gameAutoEventEnabled !== false ? "Aktif" : "Nonaktif"}\nAuto Manager: ${config.gameAutoManagerEnabled !== false ? "Aktif" : "Nonaktif"}\nBuild: ${OT_GAME_BUILD_VERSION}`, inline: false },
    { name: "Hansip — HANSIP DESA TULUS", value: `Channel: ${config.otoChannelId ? `<#${config.otoChannelId}>` : "Belum diatur"}\nOne Channel: ${config.otoOnlyOneChannel !== false ? "Aktif" : "Nonaktif"}\nAuto Image: ${config.otoAutoImageEnabled !== false ? "Aktif" : "Nonaktif"}\nMax Bet Virtual: ${Number(config.otoMaxBet || 50000).toLocaleString("id-ID")} coin\nBuild: ${OTO_BUILD_VERSION}`, inline: false },
    { name: "Panel", value: Object.keys(state).length ? Object.keys(state).map(k => `• ${k}: ${state[k].sentAt || "-"}`).join("\n") : "Belum ada panel tercatat.", inline: false },
    { name: "Backup", value: commandCenterConfig().lastBackupAt || "Belum ada backup.", inline: true },
    { name: "Error terakhir", value: commandCenterConfig().lastError || mongoLastError || "Tidak ada.", inline: true }
  );
  return replyOt(message, { embeds: [embed] });
}

async function cmdReload(message) {
  config = loadConfig();
  startDashboardCacheRefresh().catch(() => null);
  return replyOt(message, { embeds: [otBaseEmbed("🔄 Reload Aman", "✅ Config berhasil dibaca ulang.\n🛡️ Data lama, database, AFK, mabar, panel state, dan log tidak direset.")] });
}

function safeBackupFileList() {
  return [
    { label: "config", file: CONFIG_FILE },
    { label: "mabar", file: DATA_FILE },
    { label: "afk", file: AFK_DATA_FILE },
    { label: "sambungKata", file: SAMBUNG_DATA_FILE },
    { label: "panelState", file: PANEL_STATE_FILE },
    { label: "gameData", file: GAME_DATA_FILE },
    { label: "gamePlayers", file: GAME_PLAYERS_FILE },
    { label: "gameItems", file: GAME_ITEMS_FILE },
    { label: "gameShop", file: GAME_SHOP_FILE },
    { label: "gameEvents", file: GAME_EVENTS_FILE },
    { label: "gameQuests", file: GAME_QUESTS_FILE },
    { label: "gameAchievements", file: GAME_ACHIEVEMENTS_FILE },
    { label: "gameLeaderboard", file: GAME_LEADERBOARD_FILE },
    { label: "gameBackup", file: GAME_BACKUP_FILE }
  ];
}

function readBackupValue(file) {
  if (!fs.existsSync(file)) return { exists: false, value: null };
  try {
    return { exists: true, value: JSON.parse(fs.readFileSync(file, "utf8")) };
  } catch {
    return { exists: true, value: fs.readFileSync(file, "utf8") };
  }
}

function createSafeBackup(reason = "manual") {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backup = {
    meta: {
      app: "Hansip DESA TULUS",
      reason,
      createdAt: new Date().toISOString(),
      build: OT_COMMAND_BUILD_VERSION,
      note: "Backup aman: tidak menyertakan .env, token, API key, password, cookie, atau MongoDB URI."
    },
    files: {}
  };
  for (const item of safeBackupFileList()) {
    const data = readBackupValue(item.file);
    if (data.exists) backup.files[item.label] = data.value;
  }
  const fileName = `ot-backup-${stamp}.json`;
  const filePath = path.join(BACKUP_DIR, fileName);
  fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));
  config.commandCenter = { ...commandCenterConfig(), lastBackupAt: backup.meta.createdAt };
  saveConfig(config);
  return { fileName, filePath, backup };
}

async function cmdBackup(message) {
  const result = createSafeBackup("owner-command");
  const attachment = new AttachmentBuilder(result.filePath, { name: result.fileName });
  const embed = otBaseEmbed("💾 Backup Aman Dibuat", `✅ Backup berhasil dibuat: \`${result.fileName}\`\n\n🛡️ Tidak menyertakan \`.env\`, token, API key, password, cookie, atau MongoDB URI.\nData lama tidak direset.`);
  try {
    await message.author.send({ embeds: [embed], files: [attachment] });
    return replyOt(message, { content: "✅ Backup aman berhasil dibuat dan dikirim ke DM owner. Data lama tetap aman." });
  } catch {
    return replyOt(message, { embeds: [embed.addFields({ name: "Catatan", value: "DM owner tertutup, jadi file backup disimpan di folder `backups` pada runtime. Jangan kirim backup ke channel publik.", inline: false })] });
  }
}

function restoreSafeBackupFile(fileName) {
  const clean = path.basename(String(fileName || ""));
  if (!clean.endsWith(".json")) throw new Error("Nama file backup harus .json");
  const backupPath = path.join(BACKUP_DIR, clean);
  if (!fs.existsSync(backupPath)) throw new Error("File backup tidak ditemukan di folder backups.");
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  if (!backup?.files || typeof backup.files !== "object") throw new Error("Format backup tidak valid.");

  createSafeBackup("pre-restore");
  const fileMap = {
    config: CONFIG_FILE,
    mabar: DATA_FILE,
    afk: AFK_DATA_FILE,
    sambungKata: SAMBUNG_DATA_FILE,
    panelState: PANEL_STATE_FILE,
    gameData: GAME_DATA_FILE,
    gamePlayers: GAME_PLAYERS_FILE,
    gameItems: GAME_ITEMS_FILE,
    gameShop: GAME_SHOP_FILE,
    gameEvents: GAME_EVENTS_FILE,
    gameQuests: GAME_QUESTS_FILE,
    gameAchievements: GAME_ACHIEVEMENTS_FILE,
    gameLeaderboard: GAME_LEADERBOARD_FILE,
    gameBackup: GAME_BACKUP_FILE
  };
  for (const [key, value] of Object.entries(backup.files)) {
    if (!fileMap[key]) continue;
    writeJsonFile(fileMap[key], value);
  }
  config = loadConfig();
  config.commandCenter = { ...commandCenterConfig(), lastRestoreAt: new Date().toISOString() };
  saveConfig(config);
  return clean;
}

async function cmdRestore(message, args) {
  if (args[0] !== "confirm" || !args[1]) {
    return replyOt(message, { embeds: [otBaseEmbed("⚠️ Restore Butuh Konfirmasi", "Restore tidak dijalankan otomatis.\nFormat aman:\n`otrestore confirm nama-file-backup.json`\n\nSebelum restore, bot akan membuat pre-backup data aktif dulu.")] });
  }
  try {
    const restored = restoreSafeBackupFile(args[1]);
    return replyOt(message, { embeds: [otBaseEmbed("✅ Restore Berhasil", `Backup \`${restored}\` berhasil direstore.\n🛡️ Pre-backup data aktif sudah dibuat sebelum restore.`)] });
  } catch (error) {
    config.commandCenter = { ...commandCenterConfig(), lastError: error.message };
    saveConfig(config);
    return replyOt(message, { content: `❌ Restore gagal: ${error.message}` });
  }
}

async function cmdPanel(message, args) {
  const action = String(args[0] || "status").toLowerCase();
  if (["status", "check", "cek"].includes(action)) return cmdCekPanel(message);
  if (["refresh", "mabar", "afk", "sambung", "truth", "truth-dare", "help", "saran", "game"].includes(action)) {
    const type = action === "refresh" ? String(args[1] || "help").toLowerCase() : action;
    if (type === "game") return sendGamePanel(message, true);
    return sendNamedPanel(message, type);
  }
  return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otpanel status`, `otpanel mabar`, `otpanel help`, `otpanel refresh mabar`, `otpanel game`." });
}

function getMentionedChannelId(message, args) {
  const mentioned = message.mentions.channels.first();
  if (mentioned) return mentioned.id;
  return String(args[1] || "").replace(/[<#>]/g, "").trim();
}

async function cmdSetChannel(message, args) {
  const key = String(args[0] || "").toLowerCase();
  const channelId = getMentionedChannelId(message, args);
  const map = {
    log: "ownerLogChannelId",
    game: "gameChannelId",
    gamehub: "gameChannelId",
    gamelog: "gameLogChannelId",
    mabar: "mabarChannelId",
    saran: "suggestionChannelId",
    panel: "panelChannelId",
    staff: "staffChannelId",
    afk: "afkChannelId",
    sambung: "sambungKataChannelId",
    truth: "truthOrDareChannelId",
    game: "gameChannelId",
    gamelog: "gameLogChannelId"
  };
  if (!map[key] || !/^\d{15,25}$/.test(channelId)) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otsetchannel mabar #mabar`" });
  config[map[key]] = channelId;
  saveConfig(config);
  return replyOt(message, { content: "✅ Setting channel berhasil diperbarui dengan aman. 🛡️ Data lama tetap aman dan tidak direset." });
}

function getMentionedRoleId(message, args) {
  const mentioned = message.mentions.roles.first();
  if (mentioned) return mentioned.id;
  return String(args[1] || "").replace(/[<@&>]/g, "").trim();
}

async function cmdSetRole(message, args) {
  const key = String(args[0] || "").toLowerCase();
  const roleId = getMentionedRoleId(message, args);
  if (!/^\d{15,25}$/.test(roleId)) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otsetrole staff @role`" });
  const pc = permissionCenterConfig();
  if (key === "staff") config.staffRoleIds = Array.from(new Set([...(config.staffRoleIds || []), roleId]));
  else if (key === "admin") pc.adminRoleIds = Array.from(new Set([...(pc.adminRoleIds || []), roleId]));
  else if (key === "allowed" || key === "panel") pc.panelRoleIds = Array.from(new Set([...(pc.panelRoleIds || []), roleId]));
  else if (key === "log") pc.logRoleIds = Array.from(new Set([...(pc.logRoleIds || []), roleId]));
  else return replyOt(message, { content: "⚠️ Format kurang tepat. Pilihan role: `staff`, `admin`, `panel`, `log`." });
  config.permissionCenter = pc;
  saveConfig(config);
  return replyOt(message, { content: "✅ Setting role berhasil diperbarui dengan aman. Command penting tetap owner only." });
}

async function cmdFitur(message, args) {
  const keyRaw = String(args[0] || "").toLowerCase();
  const valueRaw = String(args[1] || "").toLowerCase();
  const map = {
    afk: "afk",
    mabar: "mabar",
    saran: "saran",
    panel: "panel",
    dashboard: "dashboard",
    truth: "truthOrDare",
    sambung: "sambungKata",
    game: "gameHub",
    gamehub: "gameHub"
  };

  if (!map[keyRaw] || !["on", "off", "aktif", "nonaktif"].includes(valueRaw)) {
    return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otfitur afk on`." });
  }

  const enabled = valueRaw === "on" || valueRaw === "aktif";
  config.features = { ...(config.features || {}), [map[keyRaw]]: enabled };
  if (map[keyRaw] === "gameHub") config.gameEnabled = enabled;
  saveConfig(config);

  return replyOt(message, { content: `✅ Fitur **${keyRaw}** sekarang **${enabled ? "aktif" : "nonaktif"}**. Data lama tetap aman dan tidak direset.` });
}

async function cmdTest(message, args) {
  const what = String(args[0] || "").toLowerCase();

  if (!what) {
    return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `ottest afk`, `ottest mabar`, `ottest panel`, atau `ottest backup`." });
  }

  if (what === "backup") return cmdBackup(message);
  if (what === "afk") {
    return replyOt(message, {
      embeds: [otBaseEmbed("🧪 Test AFK", `AFK: ${formatStatus(featureEnabled("afk"))}
Channel: ${config.afkChannelId ? `<#${config.afkChannelId}>` : "Belum diatur"}`)]
    });
  }
  if (what === "mabar") return cmdMabar(message);
  if (what === "panel") return cmdCekPanel(message);

  return replyOt(message, { content: "⚠️ Test tidak dikenal. Pilihan: `afk`, `mabar`, `panel`, atau `backup`." });
}

async function cmdMaintenance(message, args) {
  const value = String(args[0] || "").toLowerCase();
  if (!["on", "off", "aktif", "nonaktif"].includes(value)) return replyOt(message, { content: "⚠️ Format kurang tepat. Contoh: `otmaintenance on` atau `otmaintenance off`." });
  const enabled = value === "on" || value === "aktif";
  config.commandCenter = { ...commandCenterConfig(), maintenanceMode: enabled };
  saveConfig(config);
  return replyOt(message, { embeds: [otBaseEmbed("🛠️ Maintenance Hansip", enabled ? "Mode maintenance aktif. Fitur penting tetap aman dan bot tidak dimatikan total." : "Mode maintenance sudah dimatikan. Bot kembali normal.")] });
}


function gameModuleEnabled(name) {
  const disabled = new Set([...(config.gameDisabledModules || [])].map(v => String(v).toLowerCase()));
  const toggles = config.gameModuleToggles || {};
  if (disabled.has(String(name).toLowerCase())) return false;
  if (Object.prototype.hasOwnProperty.call(toggles, name) && toggles[name] === false) return false;
  return true;
}
function adventureCategoryByCommand(commandName) {
  return ADVENTURE_100_CATEGORIES.find(c => c.command.split(" ")[0] === commandName) || ADVENTURE_100_CATEGORIES.find(c => c.command.includes(commandName));
}
async function cmdHansipStart(message) {
  if (!(await ensureGameChannelForMessage(message))) return;
  ensureGameFiles();
  const { player } = getGamePlayer(message.author);
  player.coin = Math.max(Number(player.coin || 0), 250);
  player.energy = Math.max(Number(player.energy || 0), 100);
  player.title = player.title || "Warga Baru Datang";
  player.rank = player.rank || "Warga Baru";
  addItemToPlayer(player, "consumable_energy_drink_tulus_000", 1);
  saveGamePlayer(message.author, player);
  const embed = gameBaseEmbed("🚀 Hansip Dimulai", `${message.author}, profile game kamu sudah siap. Starter reward masuk aman.\n\n**Alur awal:**\n1. \`othunt\` buat mulai adventure.\n2. \`otbattle\` kalau ketemu musuh.\n3. \`otdaily\` ambil daily reward.\n4. \`otquest\` cek misi.\n\nLanjut: \`othunt\` • \`otprofile\` • \`otdaily\` • \`otshop\``);
  embed.addFields({ name: "Starter", value: "+250 coin game\n+100 energy\n+Energy Drink Tulus", inline: true }, { name: "Reminder", value: "Coin hanya coin game fiktif. Tidak ada uang asli/cashout.", inline: true });
  return replyOt(message, { embeds: [embed] });
}
function adventureStatusLine(player) {
  return `Lv **${calcGameLevel(player.xp || 0)}** • HP **${player.hp || 100}/${player.maxHp || 100}** • Energy **${player.energy || 0}/${player.maxEnergy || 100}** • Coin **${player.coin || 0}**`;
}
function updateChaos(delta = 1, reason = "activity") {
  const data = readGameData();
  data.chaos = data.chaos || { meter: 10, label: "Santai", history: [] };
  data.chaos.meter = Math.max(0, Math.min(100, Number(data.chaos.meter || 0) + delta));
  data.chaos.label = data.chaos.meter <= 25 ? "Santai" : data.chaos.meter <= 50 ? "Mulai Aneh" : data.chaos.meter <= 75 ? "Chaos Lucu" : "Server Mode Absurd";
  data.chaos.history = [{ reason, meter: data.chaos.meter, time: new Date().toISOString() }, ...(data.chaos.history || [])].slice(0, 30);
  writeGameData(data);
  return data.chaos;
}
async function cmdHansipGeneric(message, commandName, args = [], argText = "") {
  if (commandName === "otstart") return cmdHansipStart(message);
  if (!(await ensureGameChannelForMessage(message))) return;
  ensureGameFiles();
  const wait = checkGameCooldown(message.author.id, `cmd:${commandName}`, gameConfig().gameCooldownMs);
  if (wait) return replyOt(message, { content: `⏳ Jangan spam ya. Coba lagi sekitar **${wait} detik**.` });
  const { player } = getGamePlayer(message.author);
  const category = adventureCategoryByCommand(commandName) || { title: "Hansip Action", description: "Aksi Hansip.", id: "action" };
  const moduleId = category.id || commandName.replace(/^ot/, "");
  if (!gameModuleEnabled(moduleId)) return replyOt(message, { content: "❌ Module ini sedang dimatikan owner dari dashboard." });
  const mult = rewardMultiplier(moduleId);
  const isRisk = commandName === "otrisk" || commandName === "otchance";
  const isLucky = commandName === "otlucky" || commandName === "otsurprise";
  if (isRisk && config.gameRiskModeEnabled === false) return replyOt(message, { content: "❌ Risk Challenge sedang dinonaktifkan owner." });
  const energyCost = isRisk ? 16 : isLucky ? 8 : ["otprofile","otinventory","otshop","otquest","ottop","otevent","otmap","otweather","otnpc","otbank"].includes(commandName) ? 0 : 9;
  if (player.energy < energyCost) return replyOt(message, { embeds: [gameBaseEmbed("🔋 Energy Kurang", `Energy kamu **${player.energy}/${player.maxEnergy}**. Gunakan \`otdaily\`, \`otrest\`, atau tunggu regen.\n\nLanjut: \`otdaily\` • \`otrest\` • \`otshop\``)] });
  if (commandName === "otprofile") return replyOt(message, { embeds: [gameProfileEmbed(message.author)] });
  if (commandName === "otinventory") return cmdGameInventory(message);
  if (commandName === "otshop") return cmdGameShop(message);
  if (commandName === "otquest" || commandName === "otmission") return cmdGameMission(message);
  if (commandName === "ottop") return cmdGameTop(message);
  if (commandName === "otevent") return cmdGameEvent(message);
  if (commandName === "otdaily") return cmdGameDaily(message);
  player.energy -= energyCost;
  const outcome = rollHansipOutcome(isRisk ? "risk" : isLucky ? "lucky" : "play");
  const xpGain = Math.floor((25 + Math.random() * 45) * mult.xp * outcome.rewardScale);
  const coinGain = Math.floor((40 + Math.random() * 95) * mult.coin * outcome.rewardScale);
  player.xp += xpGain; player.coin += coinGain; player.level = calcGameLevel(player.xp);
  player.stats = player.stats || {}; player.stats.actions = Number(player.stats.actions || 0) + 1; player.stats[moduleId] = Number(player.stats[moduleId] || 0) + 1; player.stats[outcome.key] = Number(player.stats[outcome.key] || 0) + 1;
  if (outcome.hpDelta) player.hp = Math.max(1, Math.min(player.maxHp || 100, Number(player.hp || 100) + outcome.hpDelta));
  const item = pickRandomItem(mult.drop); if (item) addItemToPlayer(player, item.id, 1);
  const questDone = updateQuestProgress(player, moduleId); const unlocked = checkAchievements(player);
  const chaos = config.gameChaosEnabled !== false ? updateChaos(isRisk ? 3 : isLucky ? 2 : 1, commandName) : { meter: 0, label: "Off" };
  saveGamePlayer(message.author, player);
  const npc = ADVENTURE_NPCS[Math.floor(Math.random() * ADVENTURE_NPCS.length)];
  const monster = ADVENTURE_MONSTERS[Math.floor(Math.random() * ADVENTURE_MONSTERS.length)];
  const embed = gameBaseEmbed(`${category.title} • ${outcome.label}`, `${outcome.text}\n${randomHansipHumor()}\n\nNPC muncul: **${npc}**\nEncounter: **${monster}**`);
  embed.addFields(
    { name: "Reward", value: `+${xpGain} XP\n+${coinGain} coin game${item ? `\n🎁 ${item.name} (${item.rarity})` : ""}`, inline: true },
    { name: "Status", value: `${adventureStatusLine(player)}\nChaos: **${chaos.meter ?? 0} ${chaos.label || "Santai"}**`, inline: true },
    { name: "Progress", value: `${questDone.length ? `Quest: ${questDone.map(q => q.name).join(", ")}` : "Quest berjalan."}\n${unlocked.length ? `Achievement: ${unlocked.map(a => a.badgeEmoji + " " + a.name).join(", ")}` : "Achievement aman."}`, inline: false },
    { name: "Lanjut", value: "`othunt` • `otbattle` • `otinventory` • `otshop` • `otquest` • `otprofile`", inline: false }
  );
  if (isRisk || isLucky) embed.addFields({ name: "Aman", value: "Coin hanya coin game fiktif. Tidak ada uang asli, cashout, pulsa, saldo, atau taruhan uang asli.", inline: false });
  return replyOt(message, { embeds: [embed] });
}
async function cmdHansipOwnerGeneric(message, commandName, args = [], argText = "") {
  ensureGameFiles();
  const data = readGameData();
  const sub = args[0] || "";
  if (commandName === "otstopevent") {
    data.activeEvent = null; data.activity = [{ title: "Event stopped", message: `Dihentikan oleh ${message.author.tag}`, time: new Date().toISOString() }, ...(data.activity || [])].slice(0, 40); writeGameData(data);
    return replyOt(message, { content: "✅ Event Hansip dihentikan. Data lama tetap aman." });
  }
  if (commandName === "otstartevent") {
    const ev = (readGameEvents().find(e => e.id === sub) || readGameEvents()[Math.floor(Math.random()*readGameEvents().length)]);
    data.activeEvent = { ...ev, startedAt: Date.now(), endsAt: Date.now() + Number(config.gameAutoEventDurationMinutes || 120) * 60000 };
    data.activity = [{ title: "Event start", message: data.activeEvent.name, time: new Date().toISOString() }, ...(data.activity || [])].slice(0, 40); writeGameData(data);
    return replyOt(message, { embeds: [gameBaseEmbed("⚡ Event Hansip Dimulai", `**${data.activeEvent.name}** aktif sampai <t:${Math.floor(data.activeEvent.endsAt0)}:R>.`)] });
  }
  if (commandName === "otspawnboss") {
    data.boss = { id: "raja_afk", name: "Boss Raja AFK", hp: 5000, maxHp: 5000, active: true, endsAt: Date.now() + 3600000 };
    writeGameData(data); return replyOt(message, { embeds: [gameBaseEmbed("🐉 Boss Spawn", "Boss Raja AFK muncul. Gunakan `otraid join` lalu `otraid attack`. Panel tidak spam.")] });
  }
  if (commandName === "otforcebackup" || commandName === "otbackup") return cmdGameBackup(message);
  if (commandName === "otchaos" && sub === "reset") { data.chaos = { meter: 0, label: "Santai", history: [] }; writeGameData(data); return replyOt(message, { content: "✅ Chaos Meter direset aman." }); }
  if (commandName === "otchaos" && sub === "set") { data.chaos = { ...(data.chaos || {}), meter: Math.max(0, Math.min(100, Number(args[1] || 0))) }; data.chaos.label = data.chaos.meter <= 25 ? "Santai" : data.chaos.meter <= 50 ? "Mulai Aneh" : data.chaos.meter <= 75 ? "Chaos Lucu" : "Server Mode Absurd"; writeGameData(data); return replyOt(message, { content: `✅ Chaos Meter jadi ${data.chaos.meter}.` }); }
  if (commandName === "otdisablemodule" || commandName === "otenablemodule") {
    const mod = String(args[0] || "").toLowerCase(); if (!mod) return replyOt(message, { content: "⚠️ Format: `otdisablemodule risk` atau `otenablemodule risk`" });
    const set = new Set(config.gameDisabledModules || []); commandName === "otdisablemodule" ? set.add(mod) : set.delete(mod); config.gameDisabledModules = Array.from(set); saveConfig(config);
    return replyOt(message, { content: `✅ Module **${mod}** ${commandName === "otdisablemodule" ? "dimatikan" : "diaktifkan"}.` });
  }
  if (commandName === "otgamelog") {
    const lines = (data.activity || []).slice(0, 10).map((x,i) => `**${i+1}.** ${x.title || "Log"} — ${x.message || "-"}`);
    return replyOt(message, { embeds: [gameBaseEmbed("📜 Game Logs", lines.join("\n") || "Belum ada log game.")] });
  }
  return replyOt(message, { embeds: [gameBaseEmbed("👑 Owner Hansip", "Command owner diterima. Gunakan `otstartevent`, `otstopevent`, `otspawnboss`, `otforcebackup`, `otdisablemodule`, `otenablemodule`, `otgamelog`, atau `otchaos set <angka>`.\n\n🛡️ Secret/env/token tidak ditampilkan.")] });
}

async function processOtTextCommand(message) {
  const parsed = parseOtCommand(message.content);
  if (!parsed) return false;
  const command = OT_COMMAND_MAP.get(parsed.name);
  if (!command) return false;
  if (isCommandDisabled(command.name)) {
    await replyOt(message, { content: "❌ Command ini sedang dinonaktifkan oleh owner." });
    return true;
  }
  if (!hasCommandPermission(message, command)) {
    const denied = command.permission === "owner" ? "❌ Command ini khusus owner Hansip." : "❌ Command ini hanya untuk staff yang memiliki izin.";
    await replyOt(message, { content: denied });
    return true;
  }
  if (commandCenterConfig().maintenanceMode && command.category === "member" && !["othelp", "otping", "otinfo"].includes(command.name)) {
    await replyOt(message, { content: "🛠️ Hansip sedang maintenance. Command umum sementara dibatasi." });
    return true;
  }

  try {
    const otoHandled = await processOtoCommand(message, parsed, command);
    if (otoHandled) return true;

    if (command.name === "othelp") await cmdHelp(message);
    else if (command.name === "otping") await cmdPing(message);
    else if (command.name === "otinfo") await cmdInfo(message);
    else if (command.name === "otmabar") await cmdMabar(message);
    else if (command.name === "otsaran") await cmdSaran(message, parsed.argText);
    else if (command.name === "otgame") await cmdGame(message, parsed.args);
    else if (command.name === "otprofile") await cmdGameProfile(message);
    else if (command.name === "otdaily") await cmdGameDaily(message);
    else if (command.name === "otshop") await cmdGameShop(message);
    else if (command.name === "otinventory") await cmdGameInventory(message);
    else if (command.name === "otmission") await cmdGameMission(message);
    else if (command.name === "ottop") await cmdGameTop(message);
    else if (command.name === "otevent") await cmdGameEvent(message);
    else if (command.name === "otowner") await cmdGameOwner(message);
    else if (command.name === "otsendpanel") await (parsed.args[0] === "game" ? sendGamePanel(message, false) : sendNamedPanel(message, parsed.args[0]));
    else if (command.name === "otupdatepanel") await (parsed.args[0] === "game" ? sendGamePanel(message, true) : sendNamedPanel(message, parsed.args[0]));
    else if (command.name === "otsetlog") await cmdSetChannel(message, ["gamelog", ...(parsed.args || []).slice(1)]);
    else if (command.name === "otgivecoin") await cmdGameGive(message, parsed.args, "coin");
    else if (command.name === "otgivexp") await cmdGameGive(message, parsed.args, "xp");
    else if (command.name === "otgiveitem") await cmdGameGiveItem(message, parsed.args);
    else if (command.name === "otresetuser") await cmdGameResetUser(message, parsed.args);
    else if (command.name === "otcheckdata") await cmdGameCheckData(message);
    else if (command.name === "otfixdata") await cmdGameFixData(message);
    else if (command.name === "otstaff") await cmdStaff(message);
    else if (command.name === "otcekfitur") await cmdCekFitur(message);
    else if (command.name === "otcekpanel") await cmdCekPanel(message);
    else if (command.name === "otkirimpanel") await (parsed.args[0] === "game" ? sendGamePanel(message, false) : sendNamedPanel(message, parsed.args[0]));
    else if (command.name === "otlog") await cmdLog(message, parsed.argText);
    else if (command.name === "otstatus") await cmdStatus(message);
    else if (command.name === "otreload") await cmdReload(message);
    else if (command.name === "otbackup") await cmdBackup(message);
    else if (command.name === "otrestore") await cmdRestore(message, parsed.args);
    else if (command.name === "otpanel") await cmdPanel(message, parsed.args);
    else if (command.name === "otsetchannel") await cmdSetChannel(message, parsed.args);
    else if (command.name === "otsetrole") await cmdSetRole(message, parsed.args);
    else if (command.name === "otfitur") await cmdFitur(message, parsed.args);
    else if (command.name === "ottest") await cmdTest(message, parsed.args);
    else if (command.name === "otmaintenance") await cmdMaintenance(message, parsed.args);
    else if (ADVENTURE_GENERIC_COMMANDS.has(command.name)) await cmdHansipGeneric(message, command.name, parsed.args, parsed.argText);
    else if (ADVENTURE_GENERIC_OWNER_COMMANDS.has(command.name)) await cmdHansipOwnerGeneric(message, command.name, parsed.args, parsed.argText);
    else await replyOt(message, { content: "⚠️ Command belum tersedia. Gunakan `othelp`." });
  } catch (error) {
    console.error("❌ OT Command error:", error);
    config.commandCenter = { ...commandCenterConfig(), lastError: error.message || String(error) };
    saveConfig(config);
    await replyOt(message, { content: "❌ Command gagal diproses, tapi data lama tetap aman dan tidak direset." });
  }
  return true;
}

function dashboardCommandRows(category) {
  return OT_COMMANDS.filter(cmd => cmd.category === category).map(cmd => `<div class="list-row command-row" data-command="${htmlEscape(cmd.name)} ${htmlEscape(cmd.description)}"><div><b>${htmlEscape(cmd.name)}</b><span class="note"><br>${htmlEscape(cmd.description)}<br>Format: <code>${htmlEscape(cmd.usage)}</code></span></div><span class="chip ${isCommandDisabled(cmd.name) ? "warn" : "ok"}">${isCommandDisabled(cmd.name) ? "Nonaktif" : "Aktif"}</span></div>`).join("");
}

function dashboardCommandCenterHtml() {
  const previewMember = commandTableMarkdown(OT_COMMANDS.filter(c => c.category === "member"));
  const previewStaff = commandTableMarkdown(OT_COMMANDS.filter(c => c.category === "staff"));
  const previewOwner = commandTableMarkdown(OT_COMMANDS.filter(c => c.category === "owner"));
  return `<div class="panel"><div class="panel-title"><div><h3>⌨️ Command Center</h3><p>Command utama Hansip memakai format <b>ot...</b>. Command penting tetap owner only.</p></div><span class="chip ok">${htmlEscape(OT_COMMAND_BUILD_VERSION)}</span></div><input class="raw" style="min-height:auto" placeholder="Cari command, contoh: backup / panel / mabar" oninput="document.querySelectorAll('.command-row').forEach(function(row){row.style.display=row.dataset.command.toLowerCase().includes(event.target.value.toLowerCase())?'flex':'none'})"><div class="status-grid" style="margin-top:14px"><div><b>Prefix utama</b><span>${htmlEscape(commandCenterConfig().prefix || "ot")}</span></div><div><b>Maintenance</b><span>${commandCenterConfig().maintenanceMode ? "Aktif" : "Nonaktif"}</span></div><div><b>Alias lama</b><span>${commandCenterConfig().showLegacyAliases !== false ? "Aktif" : "Nonaktif"}</span></div><div><b>Anti-spam panel</b><span>${Number(commandCenterConfig().panelAntiSpamMs || 60000) / 1000} detik</span></div></div></div><div class="panel"><h3>👥 Member Commands</h3><div class="list">${dashboardCommandRows("member")}</div></div><div class="panel"><h3>🛡️ Staff Commands</h3><div class="list">${dashboardCommandRows("staff")}</div></div><div class="panel"><h3>👑 Owner Commands</h3><div class="list">${dashboardCommandRows("owner")}</div></div><div class="panel"><h3>Preview Help Menu</h3><pre class="codebox">MEMBER\n${htmlEscape(previewMember)}\n\nSTAFF\n${htmlEscape(previewStaff)}\n\nOWNER\n${htmlEscape(previewOwner)}</pre></div>`;
}

function dashboardPermissionCenterHtml() {
  return dashboardSaveForm("permissions", [
    dashboardInput("permissionCenter.ownerUserId", "Owner User ID"),
    dashboardInput("staffRoleIds", "Staff Role IDs utama", { type: "textarea", wide: true }),
    dashboardInput("permissionCenter.staffRoleIds", "Staff Role IDs tambahan", { type: "textarea", wide: true }),
    dashboardInput("permissionCenter.adminRoleIds", "Admin Role IDs", { type: "textarea", wide: true }),
    dashboardInput("permissionCenter.panelRoleIds", "Role boleh kirim panel", { type: "textarea", wide: true }),
    dashboardInput("permissionCenter.logRoleIds", "Role boleh lihat log", { type: "textarea", wide: true }),
    dashboardInput("permissionCenter.allowStaffSendPanel", "Staff boleh kirim panel", { type: "checkbox", wide: true }),
    dashboardInput("permissionCenter.allowStaffViewLogs", "Staff boleh lihat log aman", { type: "checkbox", wide: true }),
    dashboardInput("permissionCenter.allowStaffManageMabar", "Staff boleh operasional mabar", { type: "checkbox", wide: true }),
    dashboardInput("permissionCenter.allowStaffAnnouncement", "Staff boleh announcement jika diizinkan", { type: "checkbox", wide: true }),
    dashboardInput("commandCenter.panelAntiSpamMs", "Anti-spam Panel MS", { type: "number" }),
    dashboardInput("commandCenter.suggestionCooldownMs", "Cooldown Saran MS", { type: "number" }),
    dashboardInput("commandCenter.maintenanceMode", "Maintenance Mode", { type: "checkbox", wide: true }),
    dashboardInput("commandCenter.disabledCommands", "Command dinonaktifkan", { type: "textarea", wide: true })
  ].join(""), "🔐 Permission Center") + `<div class="panel hint-panel"><b>Catatan aman:</b> Owner command dicek dari Owner User ID/env/guild owner, bukan hanya role Discord. Token, .env, password, dan MongoDB URI tidak ditampilkan.</div>`;
}

/* =========================
   EVENTS
========================= */
client.once("clientReady", async () => {
  startPakHansipCustomStatusRotation(client);
  console.log(`✅ ${client.user.tag} online sebagai Hansip`);
  startDashboardCacheRefresh().catch(() => null);
  setInterval(() => startDashboardCacheRefresh().catch(() => null), DASHBOARD_DISCORD_CACHE_TTL);
  await registerCommands();
  await startGameAutoManager().catch(error => console.error("⚠️ Hansip manager gagal start:", error.message));
  try {
    otoEnsureFiles();
    console.log("✅ Hansip aktif");
    console.log("✅ Game channel system aktif");
    console.log("✅ Data player Hansip aman");
    console.log(`✅ Storage aktif: ${getStorageMode()}`);
    console.log("✅ Asset image system aktif");
    console.log("✅ Auto image generator aktif");
    console.log("✅ NPC image card aktif");
    console.log("✅ Tidak ada data yang direset");
  } catch (error) {
    console.error("⚠️ Hansip init warning:", error.message);
  }
});


client.on("messageCreate", async (message) => {
  try {
    if (!message.guild || message.author.bot) return;

    const trigger = parseAfkTrigger(message.content);

    // AFK sekarang bisa dipasang dari channel mana pun.
    // Embed status tetap dikirim ke channel AFK kalau afkChannelId sudah diisi.
    if (trigger) {
      if (config.features?.afk === false) {
        await message.reply({ content: "❌ Fitur AFK sedang dinonaktifkan oleh owner." }).catch(() => null);
        return;
      }
      const targetChannel = await getAfkChannel(message.channel);
      await setAfkStatus(message.member, targetChannel, trigger.reason);
      return;
    }

    const data = readAfkData();

    // Kalau user yang sedang AFK chat di channel mana pun, status AFK langsung hilang.
    // Ini juga membersihkan nickname [AFK] yang nyangkut walaupun data AFK lama hilang.
    if (config.afkRemoveOnMessage !== false && (data[message.author.id] || memberLooksAfkByNickname(message.member))) {
      await removeAfkStatus(message.member, message.channel);
    }

    const handledOtCommand = await processOtTextCommand(message);
    if (handledOtCommand) return;

    const freshAfkData = readAfkData();
    const mentionedAfkUsers = [];
    for (const user of message.mentions.users.values()) {
      if (user.id === message.author.id) continue;
      const saved = freshAfkData[user.id];
      if (!saved) continue;
      mentionedAfkUsers.push(
        `😴 ${user} sedang **AFK**: ${saved.reason}\n⏱️ Sejak: **${formatAfkDuration(saved.since)}**`
      );
    }

    if (mentionedAfkUsers.length > 0) {
      await message.reply({ content: mentionedAfkUsers.slice(0, 3).join("\n\n") }).catch(() => null);
    }

    await processSambungKataMessage(message);
  } catch (error) {
    console.error("❌ Error AFK message:", error);
  }
});

client.on("interactionCreate", async (interaction) => {
  try {
    const handledGameInteraction = await handleGameInteraction(interaction);
    if (handledGameInteraction) return;

    if (interaction.isChatInputCommand()) {
      if (interaction.commandName === "setup-mabar") {
        return sendMabarPanel(interaction);
      }

      if (interaction.commandName === "cari-mabar") {
        startSession(interaction.user.id);
        return showClickMabarMenu(interaction, "platform");
      }

      if (interaction.commandName === "setup-truth-dare") {
        return sendTruthDarePanel(interaction);
      }

      if (interaction.commandName === "setup-afk") {
        return sendAfkPanel(interaction);
      }

      if (interaction.commandName === "setup-sambung-kata") {
        return sendSambungPanel(interaction);
      }

      if (interaction.commandName === "sambung-status") {
        return sendSambungStatus(interaction);
      }

      if (interaction.commandName === "sambung-reset") {
        return resetSambungStory(interaction);
      }

      if (interaction.commandName === "afk") {
        return slashSetAfk(interaction);
      }

      if (interaction.commandName === "truth-dare") {
        const jenis = interaction.options.getString("jenis") || "random";
        return sendTruthDareResult(interaction, jenis);
      }
    }

    if (interaction.isButton()) {
      if (interaction.customId === "tod_truth") {
        return sendTruthDareResult(interaction, "truth");
      }

      if (interaction.customId === "tod_dare") {
        return sendTruthDareResult(interaction, "dare");
      }

      if (interaction.customId === "tod_random") {
        return sendTruthDareResult(interaction, "random");
      }

      if (interaction.customId === "mabar_open_menu" || interaction.customId === "mabar_open_modal") {
        startSession(interaction.user.id);
        return showClickMabarMenu(interaction, "platform");
      }

      if (interaction.customId === "mabar_cancel") {
        mabarSessions.delete(interaction.user.id);

        if (interaction.message?.flags?.has?.(MessageFlags.Ephemeral)) {
          return interaction.update({
            content: "✅ Pencarian mabar dibatalkan.",
            embeds: [],
            components: []
          });
        }

        return interaction.reply({
          content: "✅ Pencarian mabar dibatalkan.",
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith("mabar_join_")) {
        const voiceChannelId = interaction.customId.replace("mabar_join_", "");

        if (!voiceChannelId || voiceChannelId === "none") {
          return interaction.reply({
            content: "🎙️ Host belum terdeteksi masuk voice saat post dibuat. Coba DM host dulu ya.",
            flags: MessageFlags.Ephemeral
          });
        }

        return interaction.reply({
          content: `🔊 Klik untuk join voice: https://discord.com/channels/${interaction.guildId}/${voiceChannelId}`,
          flags: MessageFlags.Ephemeral
        });
      }

      if (interaction.customId.startsWith("mabar_dm_")) {
        const hostId = interaction.customId.replace("mabar_dm_", "");
        const host = await client.users.fetch(hostId).catch(() => null);

        if (!host) {
          return interaction.reply({
            content: "❌ Host tidak ditemukan.",
            flags: MessageFlags.Ephemeral
          });
        }

        const clicker = interaction.user;
        let dmStatus = "";

        try {
          await host.send(
            `📩 ${clicker} ingin ikut mabar dari server **${config.serverName || "DESA TULUS"}**.\n` +
            "Silakan cek post mabar kamu atau balas DM dia kalau perlu."
          );
          dmStatus = "\n✅ Host juga sudah aku kasih notifikasi DM.";
        } catch {
          dmStatus = "\n⚠️ Aku tidak bisa DM host, mungkin DM host tertutup.";
        }

        return interaction.reply({
          content: `📩 Host mabar: ${host}.${dmStatus}`,
          flags: MessageFlags.Ephemeral
        });
      }
    }

    if (interaction.isStringSelectMenu()) {
      const value = interaction.values[0];

      if (interaction.customId === "mabar_panel_platform") {
        const session = startSession(interaction.user.id);
        session.platform = value;
        session.updatedAt = Date.now();

        return interaction.reply({
          ...getStepPayload(session, "game"),
          flags: MessageFlags.Ephemeral
        });
      }

      const session = getSession(interaction.user.id);

      if (interaction.customId === "mabar_select_platform") {
        session.platform = value;
        session.game = null;
        session.mode = null;
        session.slot = null;
        session.waktu = null;
        session.voice = null;
        session.updatedAt = Date.now();
        return showClickMabarMenu(interaction, "game");
      }

      if (interaction.customId === "mabar_select_game") {
        session.game = value;
        session.updatedAt = Date.now();
        return showClickMabarMenu(interaction, "mode");
      }

      if (interaction.customId === "mabar_select_mode") {
        session.mode = value;
        session.updatedAt = Date.now();
        return showClickMabarMenu(interaction, "slot");
      }

      if (interaction.customId === "mabar_select_slot") {
        session.slot = Number(value);
        session.updatedAt = Date.now();
        return showClickMabarMenu(interaction, "waktu");
      }

      if (interaction.customId === "mabar_select_waktu") {
        session.waktu = value;
        session.updatedAt = Date.now();
        return showClickMabarMenu(interaction, "voice");
      }

      if (interaction.customId === "mabar_select_voice") {
        session.voice = value === "Ya";
        session.updatedAt = Date.now();
        return finishClickMabar(interaction);
      }
    }
  } catch (error) {
    console.error("❌ Error interaction:", error);

    const content = error.message?.includes("Channel cari mabar")
      ? `❌ ${error.message}`
      : "❌ Ada error di Hansip. Cek console Railway buat detailnya.";

    if (interaction.deferred || interaction.replied) {
      return interaction.editReply({ content, embeds: [], components: [] }).catch(() => null);
    }

    if (interaction.isStringSelectMenu() || interaction.isButton()) {
      return interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => null);
    }

    return interaction.reply({ content, flags: MessageFlags.Ephemeral }).catch(() => null);
  }
});

process.on("unhandledRejection", (error) => console.error("❌ Unhandled Rejection:", error));
process.on("uncaughtException", (error) => console.error("❌ Uncaught Exception:", error));

async function startOtBot() {
  await initPersistentStorage();
  await client.login(process.env.DISCORD_TOKEN);
}

startOtBot().catch(error => {
  console.error("❌ Gagal start Hansip:", error);
  process.exit(1);
});



/* =========================
   Hansip COIN FLIP SIMPLE + 2 SECOND DELAY v1.31.0
   - Semua reveal delay Hansip default 2 detik.
   - otcf hanya format: otcf <jumlah> atau otcf all.
   - Tidak perlu heads/tails/kepala/ekor.
   - otcf numeric dibatasi 1–9999 by default.
   - otcf all = all-in saldo Hansip Coin virtual.
   - Tetap embed compact + emoji, tanpa image/Canvas/AttachmentBuilder/setImage.
========================= */

function otoV129Delay(type="default") {
  const base = Number(config.otoRevealDelayMs || 2000);
  if (type === "bj") return Number(config.otoBlackjackDelayMs || base || 2000);
  if (type === "cf") return Number(config.otoCoinFlipDelayMs || base || 2000);
  if (type === "hunt") return Number(config.otoHuntRevealDelayMs || base || 2000);
  if (type === "slots") return Number(config.otoSlotsDelayMs || base || 2000);
  if (type === "daily") return Number(config.otoDailyDelayMs || base || 2000);
  if (type === "quest") return Number(config.otoQuestDelayMs || base || 2000);
  return base || 2000;
}

function otoParseSimpleCfBet(args = [], player = {}) {
  const raw = String(args[0] || "").toLowerCase();
  const balance = Number(player.coin || 0);
  const maxNumeric = Number(config.otoCoinFlipMaxBet || 9999);

  if (!raw) return { ok:false, reason:"⚠️ Format: `otcf 100` atau `otcf all`.", bet:0, all:false };
  if (raw === "all") {
    if (config.otoCoinFlipAllInEnabled === false) return { ok:false, reason:"❌ All-in coin flip sedang dinonaktifkan owner.", bet:0, all:true };
    return { ok:true, bet:balance, all:true };
  }

  const amount = Math.floor(Number(raw.replace(/\./g, "").replace(/,/g, "")) || 0);
  if (amount < 1) return { ok:false, reason:"⚠️ Bet minimal **1 Hansip Coin**. Contoh: `otcf 100`.", bet:0, all:false };
  if (amount > maxNumeric) return { ok:false, reason:`❌ Max bet otcf adalah **${maxNumeric.toLocaleString("id-ID")} Hansip Coin**. Pakai \`otcf all\` kalau mau all-in.`, bet:0, all:false };
  return { ok:true, bet:amount, all:false };
}

async function otoCmdRoyale(message, args=[], mode="flip") {
  if (!(await otoEnsureChannel(message))) return;

  const wait = otoCooldown(message.author.id, `royale:${mode}`, Number(config.otoRoyaleCooldownMs || 10000));
  if (wait) return replyOt(message, { content:`⏳ Tunggu **${wait} detik** sebelum main lagi.` });

  const { player } = otoGetPlayer(message.author);
  const maxBet = Number(config.otoMaxBet || 50000);

  if (mode === "coinflip") {
    const parsed = otoParseSimpleCfBet(args, player);
    if (!parsed.ok) return replyOt(message, { content: parsed.reason });

    const bet = parsed.bet;
    if (bet <= 0) return replyOt(message, { content:"❌ Saldo kamu 0. Pakai `otkerja` dulu buat cari Hansip Coin." });
    if (bet > player.coin) return replyOt(message, { content:"❌ Coin kamu kurang. Pakai `otkerja` dulu." });

    const msg = await replyOt(message, { embeds: [
      new EmbedBuilder()
        .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
        .setTitle(`🪙 Hansip Coin Flip${parsed.all ? " — ALL-IN" : ""}`)
        .setDescription(`${message.author}, kamu memasang **${bet.toLocaleString("id-ID")} Hansip Coin**.\n\n${otoV129Emoji("coinSpin","🪙")} Koin sedang berputar...\nHasil akan muncul dalam **2 detik**.`)
        .setFooter({ text:"DESA TULUS • Hansip Coin hanya virtual game" })
    ]});

    await otoV129Sleep(otoV129Delay("cf"));

    const side = Math.random() < 0.5 ? "HEADS" : "TAILS";
    const win = Math.random() < (player.luckUntil > Date.now() ? 0.6 : 0.5);

    if (win) {
      player.coin += bet;
      player.stats.royaleWin = Number(player.stats.royaleWin || 0) + 1;
    } else {
      player.coin -= bet;
      player.stats.royaleLose = Number(player.stats.royaleLose || 0) + 1;
    }

    if (player.coin < 0) player.coin = 0;
    otoSavePlayer(message.author, player);

    const embed = new EmbedBuilder()
      .setColor(win ? "#0B5CFF" : "#FF4D6D")
      .setTitle(`🪙 Hansip Coin Flip — ${win ? "WIN" : "LOSE"}${parsed.all ? " • ALL-IN" : ""}`)
      .setDescription(`${message.author}, koin berhenti di sisi **${side}**!\n\nBet: **${bet.toLocaleString("id-ID")} Hansip Coin**\n\n${win ? `💎 Kamu menang **${bet.toLocaleString("id-ID")} Hansip Coin**!` : `💨 Kamu kalah **${bet.toLocaleString("id-ID")} Hansip Coin**!`}\nSaldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**\n\nCoin ini hanya virtual game Hansip, bukan uang asli.`)
      .setFooter({ text:"DESA TULUS • Hansip Coin hanya virtual game" });

    return msg?.edit ? msg.edit({ embeds:[embed], components:[] }).catch(() => replyOt(message, { embeds:[embed] })) : replyOt(message, { embeds:[embed] });
  }

  // Other virtual coin modes stay simple embed-only.
  const raw = String(args[0] || "").toLowerCase();
  let bet = raw === "all" ? Math.min(Number(player.coin || 0), maxBet) : Math.floor(Number(raw.replace(/\./g, "")) || 0);
  if (bet <= 0) return replyOt(message, { content:"⚠️ Format: `othoki 1000` atau `othoki all`." });
  if (bet > player.coin) return replyOt(message, { content:"❌ Coin kamu kurang." });

  const win = Math.random() < 0.5;
  if (win) player.coin += bet; else player.coin -= bet;
  if (player.coin < 0) player.coin = 0;
  otoSavePlayer(message.author, player);

  return replyOt(message, { embeds:[
    new EmbedBuilder()
      .setColor(win ? "#0B5CFF" : "#FF4D6D")
      .setTitle(`${win ? "✅" : "😭"} OTO ROYALE — ${win ? "MENANG" : "KALAH"}`)
      .setDescription(`${message.author}, bet **${bet.toLocaleString("id-ID")} Hansip Coin**\n\n${win ? "Koin jatuh di sisi **ROYALE 👑**" : "Koin jatuh di sisi **ZONK**"}\n\nSaldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**\n\nCoin ini hanya coin game Hansip, bukan uang asli.`)
      .setFooter({ text:"DESA TULUS • Hansip" })
  ]});
}


/* =========================
   Hansip BLACKJACK LIVE ENEMY v1.32.0
   - Dealer/musuh tidak diam lagi.
   - Dealer mulai dari 1 kartu terlihat agar angka tidak langsung stuck di 20.
   - Setelah player klik ➕, player dapat kartu dan Dealer Hansip juga otomatis mengambil kartu jika masih perlu.
   - Setelah player klik 🛑, Dealer Hansip otomatis mengambil kartu sampai minimal 17.
   - Semua action edit embed yang sama, delay 2 detik, emoji only, tanpa image.
========================= */
function otoV132Delay(){ return Number(config.otoBlackjackDelayMs || config.otoRevealDelayMs || 2000); }
function otoV132Sleep(ms){ return new Promise(r=>setTimeout(r, Math.max(0, Number(ms||0)))); }
function otoV132Deck(){ const suits=["♠","♥","♦","♣"], ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]; const deck=[]; for(const s of suits) for(const r of ranks) deck.push({rank:r,suit:s}); return deck.sort(()=>Math.random()-0.5); }
function otoV132Draw(state){ if(!state.deck || !state.deck.length) state.deck=otoV132Deck(); return state.deck.pop(); }
function otoV132Value(cards=[]){ let total=0, aces=0; for(const c of cards){ if(!c) continue; if(c.rank==='A'){ total+=11; aces++; } else if(['J','Q','K'].includes(c.rank)) total+=10; else total+=Number(c.rank||0); } while(total>21 && aces>0){ total-=10; aces--; } return total; }
function otoV132Cards(cards=[]){ return (cards.length?cards:[{rank:'?',suit:''}]).map(c=>`\`${c.rank}${c.suit}\``).join(' '); }
function otoV132Result(playerTotal,dealerTotal,playerCards=[]){ const natural=playerCards.length===2 && playerTotal===21; if(natural && dealerTotal!==21) return 'BLACKJACK'; if(playerTotal>21 && dealerTotal>21) return 'DRAW'; if(playerTotal>21) return 'LOSE'; if(dealerTotal>21) return 'WIN'; if(playerTotal>dealerTotal) return 'WIN'; if(dealerTotal>playerTotal) return 'LOSE'; return 'DRAW'; }
function otoV132ResultText(result,bet){ const n=Number(bet||0); if(result==='BLACKJACK') return `🃏 BLACKJACK! Kamu menang **${Math.floor(n*1.5).toLocaleString('id-ID')} Hansip Coin**!`; if(result==='WIN') return `🎲 Kamu menang **${n.toLocaleString('id-ID')} Hansip Coin**!`; if(result==='DRAW') return `⚖️ Seri! Bet **${n.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`; return `🎲 Kamu kalah **${n.toLocaleString('id-ID')} Hansip Coin**!`; }
function otoV132Buttons(disabled=false){ return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('oto_bj_hit').setEmoji('➕').setStyle(ButtonStyle.Primary).setDisabled(disabled),
  new ButtonBuilder().setCustomId('oto_bj_stand').setEmoji('🛑').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  new ButtonBuilder().setCustomId('oto_bj_cancel').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(disabled)
)]; }
function otoV132Embed(message, state, status='PLAYING', statusText='Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.', dealerAction=''){
  const dealerTotal=otoV132Value(state.dealer), playerTotal=otoV132Value(state.hand);
  const colorMap={PLAYING:'#0B5CFF',WIN:'#0B5CFF',LOSE:'#FF4D6D',DRAW:'#F6C85F',BLACKJACK:'#00E5FF'};
  const actionLine=dealerAction?`\n${dealerAction}\n`:'';
  return new EmbedBuilder().setColor(colorMap[status]||'#0B5CFF').setTitle(`🃏 Hansip Blackjack — ${status}${state.all?' • ALL-IN':''}`).setDescription(`${message.author}, kamu bet **${Number(state.bet||0).toLocaleString('id-ID')} Hansip Coin** buat main blackjack${state.all?'\n💀 Mode: **ALL-IN**':''}\n\n**Dealer Hansip** \`[${dealerTotal}]\`\n${otoV132Cards(state.dealer)}\n\n**${message.author.username}** \`[${playerTotal}]\`\n${otoV132Cards(state.hand)}\n${actionLine}\n${statusText}`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'});
}
function otoV132LoadingEmbed(message, text){ const spin=(typeof otoV129Emoji==='function'?otoV129Emoji('blackjackSpin','🃏'):'🃏'); return new EmbedBuilder().setColor(config.otoEmbedColor||'#0B5CFF').setTitle('🃏 Hansip Blackjack').setDescription(`${message.author}\n\n${spin} ${text}\nTunggu **2 detik**.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'}); }
function otoV132DealerReact(state, force=false){ let drew=0; const standOn=Number(config.otoBlackjackDealerStandOn||17); if(force){ while(otoV132Value(state.dealer)<standOn){ state.dealer.push(otoV132Draw(state)); drew++; } } else if(config.otoBlackjackDealerDrawOnPlayerHit!==false){ const dealerTotal=otoV132Value(state.dealer); if(dealerTotal<standOn){ state.dealer.push(otoV132Draw(state)); drew++; } }
  if(drew>0) return `🤖 Dealer Hansip ikut mengambil **${drew} kartu**. Angkanya sekarang naik jadi **${otoV132Value(state.dealer)}**.`;
  return `🤖 Dealer Hansip bertahan di angka **${otoV132Value(state.dealer)}**.`;
}
async function otoCmdBlackjack(message,args=[]){
  if(!(await otoEnsureChannel(message))) return;
  const wait=otoCooldown(message.author.id,'blackjack',Number(config.otoBlackjackCooldownMs||10000));
  if(wait) return replyOt(message,{content:`⏳ Tunggu **${wait} detik** sebelum main blackjack lagi.`});
  if(OTO_V129_ACTIVE_SESSIONS && OTO_V129_ACTIVE_SESSIONS.has(message.author.id)) return replyOt(message,{content:'❌ Kamu masih punya meja blackjack aktif.'});
  const {player}=otoGetPlayer(message.author); const raw=String(args[0]||'').toLowerCase(); const all=raw==='all'; const min=Number(config.otoMinBet||10), max=Number(config.otoBlackjackMaxBet||config.otoMaxBet||50000); let bet=all?Number(player.coin||0):Math.floor(Number(raw.replace(/\./g,''))||0);
  if(!all && bet>max) return replyOt(message,{content:`❌ Max bet blackjack **${max.toLocaleString('id-ID')} Hansip Coin**. Untuk all-in pakai \`otbj all\`.`});
  if(!bet || bet<min) return replyOt(message,{content:`⚠️ Format: \`otbj ${min}\` atau \`otbj all\`. Min bet ${min} Hansip Coin.`});
  if(bet>player.coin) return replyOt(message,{content:'❌ Coin kamu kurang. Pakai `otkerja` dulu.'});
  player.coin-=bet; otoSavePlayer(message.author,player); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.set(message.author.id,true);
  const state={deck:otoV132Deck(), dealer:[], hand:[], bet, all};
  const msg=await replyOt(message,{embeds:[otoV132LoadingEmbed(message,'Kartu sedang dikocok...')],components:[]});
  await otoV132Sleep(otoV132Delay());
  state.dealer=[otoV132Draw(state)];
  state.hand=[otoV132Draw(state),otoV132Draw(state)];
  async function finish(result, dealerAction=''){
    const {player:p2}=otoGetPlayer(message.author); const profit=result==='BLACKJACK'?Math.floor(bet*2.5):result==='WIN'?bet*2:result==='DRAW'?bet:0; p2.coin+=profit; p2.stats.blackjack=Number(p2.stats.blackjack||0)+1; p2.stats[result==='WIN'||result==='BLACKJACK'?'blackjackWin':result==='LOSE'?'blackjackLose':'blackjackDraw']=Number(p2.stats[result==='WIN'||result==='BLACKJACK'?'blackjackWin':result==='LOSE'?'blackjackLose':'blackjackDraw']||0)+1; otoSavePlayer(message.author,p2); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); const finalText=`${otoV132ResultText(result,bet)}\nSaldo sekarang: **${Number(p2.coin||0).toLocaleString('id-ID')} Hansip Coin**`; return msg.edit({embeds:[otoV132Embed(message,state,result,finalText,dealerAction)],components:otoV132Buttons(true)}).catch(()=>null);
  }
  const startResult=otoV132Result(otoV132Value(state.hand),otoV132Value(state.dealer),state.hand);
  if(startResult==='BLACKJACK'){ const dealerAction=otoV132DealerReact(state,true); return finish(startResult,dealerAction); }
  await msg.edit({embeds:[otoV132Embed(message,state,'PLAYING','Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.','🤖 Dealer Hansip mulai dengan 1 kartu, jadi angkanya akan ikut bergerak.')],components:otoV132Buttons(false)}).catch(()=>null);
  const collector=msg.createMessageComponentCollector({time:60000}); let locked=false;
  collector.on('collect',async i=>{
    if(i.user.id!==message.author.id) return i.reply({content:'❌ Ini bukan meja blackjack kamu.',flags:MessageFlags.Ephemeral}).catch(()=>null);
    if(locked) return i.deferUpdate().catch(()=>null); locked=true; await i.deferUpdate().catch(()=>null);
    if(i.customId==='oto_bj_cancel'){ const {player:p2}=otoGetPlayer(message.author); p2.coin+=bet; otoSavePlayer(message.author,p2); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); collector.stop('cancel'); return msg.edit({embeds:[new EmbedBuilder().setColor('#FF4D6D').setTitle('❌ Hansip Blackjack Dibatalkan').setDescription(`Bet **${bet.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'})],components:otoV132Buttons(true)}).catch(()=>null); }
    if(i.customId==='oto_bj_hit'){
      await msg.edit({embeds:[otoV132LoadingEmbed(message,'Kartu tambahan sedang dibuka, Dealer Hansip juga bersiap mengambil kartu...')],components:otoV132Buttons(true)}).catch(()=>null); await otoV132Sleep(otoV132Delay()); state.hand.push(otoV132Draw(state)); const dealerAction=otoV132DealerReact(state,false); const st=otoV132Result(otoV132Value(state.hand),otoV132Value(state.dealer),state.hand); if(st==='LOSE'||st==='DRAW'||st==='WIN'){ // finish only if player bust or dealer bust after live draw
        const pt=otoV132Value(state.hand), dt=otoV132Value(state.dealer); if(pt>21 || dt>21){ collector.stop('done'); return finish(st,dealerAction); }
      }
      locked=false; return msg.edit({embeds:[otoV132Embed(message,state,'PLAYING','Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.',dealerAction)],components:otoV132Buttons(false)}).catch(()=>null);
    }
    if(i.customId==='oto_bj_stand'){
      await msg.edit({embeds:[otoV132LoadingEmbed(message,'Dealer Hansip sedang membuka kartu otomatis...')],components:otoV132Buttons(true)}).catch(()=>null); await otoV132Sleep(otoV132Delay()); const dealerAction=otoV132DealerReact(state,true); const st=otoV132Result(otoV132Value(state.hand),otoV132Value(state.dealer),state.hand); collector.stop('done'); return finish(st,dealerAction);
    }
    locked=false;
  });
  collector.on('end',async(_,reason)=>{ if(reason==='done'||reason==='cancel') return; if(OTO_V129_ACTIVE_SESSIONS && OTO_V129_ACTIVE_SESSIONS.has(message.author.id)){ const {player:p2}=otoGetPlayer(message.author); p2.coin+=bet; otoSavePlayer(message.author,p2); OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); await msg.edit({components:otoV132Buttons(true),embeds:[new EmbedBuilder().setColor('#F6C85F').setTitle('⌛ Hansip Blackjack Timeout').setDescription(`Meja otomatis ditutup. Bet **${bet.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'})]}).catch(()=>null); } });
}


/* =========================
   Hansip BLACKJACK RANDOM LIVE ENEMY + HUMAN NPC EMOJI v1.33.0
   - Dealer Hansip/musuh punya angka random dan otomatis bergerak.
   - Dealer tidak stuck di angka 20.
   - Saat player klik ➕, player dapat kartu dan dealer bisa otomatis ikut ambil kartu secara random.
   - Saat player klik 🛑, dealer otomatis draw dengan logic random sampai hidup seperti musuh asli.
   - NPC hunt tidak lagi memakai emoji hewan/kotak; default memakai emoji wajah/orang.
   - Tetap tanpa image/Canvas/AttachmentBuilder/setImage.
========================= */
function otoV133Delay(){ return Number(config.otoBlackjackDelayMs || config.otoRevealDelayMs || 2000); }
function otoV133Sleep(ms){ return new Promise(r=>setTimeout(r, Math.max(0, Number(ms||0)))); }
function otoV133Deck(){ const suits=["♠","♥","♦","♣"], ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"]; const deck=[]; for(const s of suits) for(const r of ranks) deck.push({rank:r,suit:s}); return deck.sort(()=>Math.random()-0.5); }
function otoV133Draw(state){ if(!state.deck || !state.deck.length) state.deck=otoV133Deck(); return state.deck.pop(); }
function otoV133Value(cards=[]){ let total=0, aces=0; for(const c of cards){ if(!c) continue; if(c.rank==='A'){ total+=11; aces++; } else if(['J','Q','K'].includes(c.rank)) total+=10; else total+=Number(c.rank||0); } while(total>21 && aces>0){ total-=10; aces--; } return total; }
function otoV133Cards(cards=[]){ return (cards.length?cards:[{rank:'?',suit:''}]).map(c=>`\`${c.rank}${c.suit}\``).join(' '); }
function otoV133Result(playerTotal,dealerTotal,playerCards=[]){ const natural=playerCards.length===2 && playerTotal===21; if(natural && dealerTotal!==21) return 'BLACKJACK'; if(playerTotal>21 && dealerTotal>21) return 'DRAW'; if(playerTotal>21) return 'LOSE'; if(dealerTotal>21) return 'WIN'; if(playerTotal>dealerTotal) return 'WIN'; if(dealerTotal>playerTotal) return 'LOSE'; return 'DRAW'; }
function otoV133ResultText(result,bet){ const n=Number(bet||0); if(result==='BLACKJACK') return `🃏 BLACKJACK! Kamu menang **${Math.floor(n*1.5).toLocaleString('id-ID')} Hansip Coin**!`; if(result==='WIN') return `🎲 Kamu menang **${n.toLocaleString('id-ID')} Hansip Coin**!`; if(result==='DRAW') return `⚖️ Seri! Bet **${n.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`; return `🎲 Kamu kalah **${n.toLocaleString('id-ID')} Hansip Coin**!`; }
function otoV133Buttons(disabled=false){ return [new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId('oto_bj_hit').setEmoji('➕').setStyle(ButtonStyle.Primary).setDisabled(disabled),
  new ButtonBuilder().setCustomId('oto_bj_stand').setEmoji('🛑').setStyle(ButtonStyle.Secondary).setDisabled(disabled),
  new ButtonBuilder().setCustomId('oto_bj_cancel').setEmoji('❌').setStyle(ButtonStyle.Danger).setDisabled(disabled)
)]; }
function otoV133DealerMood(){ return otoRand(['tenang','nekat','hati-hati','ngejar angka','sok yakin','lagi hoki']); }
function otoV133DealerLiveMove(state, mode='hit'){
  let drew=0; const before=otoV133Value(state.dealer); const playerTotal=otoV133Value(state.hand); const standOn=Number(config.otoBlackjackDealerStandOn||17);
  let chance=0;
  if(mode==='stand') chance=1;
  else if(before<12) chance=1;
  else if(before<standOn) chance=Number(config.otoBlackjackDealerRandomDrawChance||0.85);
  else if(before<playerTotal && before<21) chance=Number(config.otoBlackjackDealerChasePlayerChance||0.65);
  else if(before<=18) chance=0.22;
  else chance=0.06;
  const maxDraw = mode==='stand' ? 6 : (Math.random()<0.25 ? 2 : 1);
  while(drew<maxDraw){
    const current=otoV133Value(state.dealer);
    if(mode==='stand'){
      if(current>=standOn && !(current<playerTotal && current<21 && Math.random()<0.55)) break;
    } else {
      if(Math.random()>chance) break;
      if(current>=21) break;
    }
    state.dealer.push(otoV133Draw(state)); drew++;
    if(mode!=='stand' && otoV133Value(state.dealer)>=17 && Math.random()<0.70) break;
  }
  const after=otoV133Value(state.dealer); const mood=otoV133DealerMood();
  if(drew>0) return `🤖 Dealer Hansip mode **${mood}** dan mengambil **${drew} kartu**. Angkanya naik dari **${before}** jadi **${after}**.`;
  return `🤖 Dealer Hansip mode **${mood}** dan bertahan di angka **${after}**.`;
}
function otoV133Embed(message,state,status='PLAYING',statusText='Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.',dealerAction=''){
  const dealerTotal=otoV133Value(state.dealer), playerTotal=otoV133Value(state.hand); const colorMap={PLAYING:'#0B5CFF',WIN:'#0B5CFF',LOSE:'#FF4D6D',DRAW:'#F6C85F',BLACKJACK:'#00E5FF'}; const actionLine=dealerAction?`\n${dealerAction}\n`:'';
  return new EmbedBuilder().setColor(colorMap[status]||'#0B5CFF').setTitle(`🃏 Hansip Blackjack — ${status}${state.all?' • ALL-IN':''}`).setDescription(`${message.author}, kamu bet **${Number(state.bet||0).toLocaleString('id-ID')} Hansip Coin** buat main blackjack${state.all?'\n💀 Mode: **ALL-IN**':''}\n\n**Dealer Hansip** \`[${dealerTotal}]\`\n${otoV133Cards(state.dealer)}\n\n**${message.author.username}** \`[${playerTotal}]\`\n${otoV133Cards(state.hand)}\n${actionLine}\n${statusText}`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'});
}
function otoV133LoadingEmbed(message,text){ const spin=(typeof otoV129Emoji==='function'?otoV129Emoji('blackjackSpin','🃏'):'🃏'); return new EmbedBuilder().setColor(config.otoEmbedColor||'#0B5CFF').setTitle('🃏 Hansip Blackjack').setDescription(`${message.author}\n\n${spin} ${text}\nTunggu **2 detik**.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'}); }
async function otoCmdBlackjack(message,args=[]){
  if(!(await otoEnsureChannel(message))) return; const wait=otoCooldown(message.author.id,'blackjack',Number(config.otoBlackjackCooldownMs||10000)); if(wait) return replyOt(message,{content:`⏳ Tunggu **${wait} detik** sebelum main blackjack lagi.`});
  if(OTO_V129_ACTIVE_SESSIONS && OTO_V129_ACTIVE_SESSIONS.has(message.author.id)) return replyOt(message,{content:'❌ Kamu masih punya meja blackjack aktif.'});
  const {player}=otoGetPlayer(message.author); const raw=String(args[0]||'').toLowerCase(); const all=raw==='all'; const min=Number(config.otoMinBet||10), max=Number(config.otoBlackjackMaxBet||config.otoMaxBet||50000); let bet=all?Number(player.coin||0):Math.floor(Number(raw.replace(/\./g,''))||0);
  if(!all && bet>max) return replyOt(message,{content:`❌ Max bet blackjack **${max.toLocaleString('id-ID')} Hansip Coin**. Untuk all-in pakai \`otbj all\`.`}); if(!bet||bet<min) return replyOt(message,{content:`⚠️ Format: \`otbj ${min}\` atau \`otbj all\`. Min bet ${min} Hansip Coin.`}); if(bet>player.coin) return replyOt(message,{content:'❌ Coin kamu kurang. Pakai `otkerja` dulu.'});
  player.coin-=bet; otoSavePlayer(message.author,player); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.set(message.author.id,true);
  const state={deck:otoV133Deck(),dealer:[],hand:[],bet,all}; const msg=await replyOt(message,{embeds:[otoV133LoadingEmbed(message,'Kartu sedang dikocok, Dealer Hansip menyiapkan angka random...')],components:[]}); await otoV133Sleep(otoV133Delay());
  state.dealer=[otoV133Draw(state)]; if(Math.random()<0.18) state.dealer.push(otoV133Draw(state)); state.hand=[otoV133Draw(state),otoV133Draw(state)];
  async function finish(result,dealerAction=''){ const {player:p2}=otoGetPlayer(message.author); const profit=result==='BLACKJACK'?Math.floor(bet*2.5):result==='WIN'?bet*2:result==='DRAW'?bet:0; p2.coin+=profit; p2.stats.blackjack=Number(p2.stats.blackjack||0)+1; p2.stats[result==='WIN'||result==='BLACKJACK'?'blackjackWin':result==='LOSE'?'blackjackLose':'blackjackDraw']=Number(p2.stats[result==='WIN'||result==='BLACKJACK'?'blackjackWin':result==='LOSE'?'blackjackLose':'blackjackDraw']||0)+1; otoSavePlayer(message.author,p2); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); const finalText=`${otoV133ResultText(result,bet)}\nSaldo sekarang: **${Number(p2.coin||0).toLocaleString('id-ID')} Hansip Coin**`; return msg.edit({embeds:[otoV133Embed(message,state,result,finalText,dealerAction)],components:otoV133Buttons(true)}).catch(()=>null); }
  const startResult=otoV133Result(otoV133Value(state.hand),otoV133Value(state.dealer),state.hand); if(startResult==='BLACKJACK'){ const dealerAction=otoV133DealerLiveMove(state,'stand'); return finish(startResult,dealerAction); }
  await msg.edit({embeds:[otoV133Embed(message,state,'PLAYING','Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.','🤖 Dealer Hansip mulai dengan angka random, lalu akan ikut bergerak saat kamu ambil aksi.')],components:otoV133Buttons(false)}).catch(()=>null);
  const collector=msg.createMessageComponentCollector({time:60000}); let locked=false;
  collector.on('collect',async i=>{ if(i.user.id!==message.author.id) return i.reply({content:'❌ Ini bukan meja blackjack kamu.',flags:MessageFlags.Ephemeral}).catch(()=>null); if(locked) return i.deferUpdate().catch(()=>null); locked=true; await i.deferUpdate().catch(()=>null);
    if(i.customId==='oto_bj_cancel'){ const {player:p2}=otoGetPlayer(message.author); p2.coin+=bet; otoSavePlayer(message.author,p2); if(OTO_V129_ACTIVE_SESSIONS) OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); collector.stop('cancel'); return msg.edit({embeds:[new EmbedBuilder().setColor('#FF4D6D').setTitle('❌ Hansip Blackjack Dibatalkan').setDescription(`Bet **${bet.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'})],components:otoV133Buttons(true)}).catch(()=>null); }
    if(i.customId==='oto_bj_hit'){ await msg.edit({embeds:[otoV133LoadingEmbed(message,'Kartu tambahan dibuka. Dealer Hansip juga sedang menghitung langkah random...')],components:otoV133Buttons(true)}).catch(()=>null); await otoV133Sleep(otoV133Delay()); state.hand.push(otoV133Draw(state)); const dealerAction=otoV133DealerLiveMove(state,'hit'); const pt=otoV133Value(state.hand), dt=otoV133Value(state.dealer); const st=otoV133Result(pt,dt,state.hand); if(pt>21 || dt>21){ collector.stop('done'); return finish(st,dealerAction); } locked=false; return msg.edit({embeds:[otoV133Embed(message,state,'PLAYING','Pilih ➕ untuk tambah kartu atau 🛑 untuk stop.',dealerAction)],components:otoV133Buttons(false)}).catch(()=>null); }
    if(i.customId==='oto_bj_stand'){ await msg.edit({embeds:[otoV133LoadingEmbed(message,'Dealer Hansip sedang membuka kartu otomatis secara random...')],components:otoV133Buttons(true)}).catch(()=>null); await otoV133Sleep(otoV133Delay()); const dealerAction=otoV133DealerLiveMove(state,'stand'); const st=otoV133Result(otoV133Value(state.hand),otoV133Value(state.dealer),state.hand); collector.stop('done'); return finish(st,dealerAction); }
    locked=false;
  });
  collector.on('end',async(_,reason)=>{ if(reason==='done'||reason==='cancel') return; if(OTO_V129_ACTIVE_SESSIONS && OTO_V129_ACTIVE_SESSIONS.has(message.author.id)){ const {player:p2}=otoGetPlayer(message.author); p2.coin+=bet; otoSavePlayer(message.author,p2); OTO_V129_ACTIVE_SESSIONS.delete(message.author.id); await msg.edit({components:otoV133Buttons(true),embeds:[new EmbedBuilder().setColor('#F6C85F').setTitle('⌛ Hansip Blackjack Timeout').setDescription(`Meja otomatis ditutup. Bet **${bet.toLocaleString('id-ID')} Hansip Coin** dikembalikan.`).setFooter({text:'DESA TULUS • Hansip Coin hanya virtual game'})]}).catch(()=>null); } });
}

// Override hunt agar icon NPC memakai wajah/orang, bukan kotak/hewan.
async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Tunggu **${wait} detik** sebelum hunt lagi.` });
  const { player } = otoGetPlayer(message.author); const cost = Number(config.otoHuntCost || 5);
  if (player.coin < cost) return replyOt(message, { content: `❌ Coin kamu kurang. Hunt butuh **${cost} Hansip Coin**. Pakai \`otkerja\` dulu.` });
  player.coin -= cost;
  const loading = await replyOt(message, { embeds: [otoV129NoImage(new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(`🌱 | ${message.author.username} memakai **${cost} Hansip Coin** untuk hunt...\n\n${otoV129Emoji("loading", "🔄")} NPC sedang dicari...\nTunggu **2 detik**.`).setFooter({ text: "DESA TULUS • Hansip" }))] });
  await otoV129Sleep(otoV129Delay("hunt")); const hasFrag = Object.values(player.inventory?.fragments || {}).reduce((a,b)=>a+Number(b||0),0) > 0; const min = hasFrag ? Number(config.otoHuntWithFragmentMinNpc || 1) : Number(config.otoHuntWithoutFragmentMinNpc || 1); const max = hasFrag ? Number(config.otoHuntWithFragmentMaxNpc || 10) : Number(config.otoHuntWithoutFragmentMaxNpc || 3); const count = Math.max(1, Math.min(10, min + Math.floor(Math.random() * (max-min+1))));
  const rarityXp = { common:[1,5], uncommon:[4,9], rare:[8,15], epic:[15,30], mythic:[30,75], secret:[75,150], limited:[100,200], legendary:[30,75] }; const icons = config.otoNpcHumanEmojis || ["🙂","😎","🤓","🥸","🤠","😄","😆","😅","😂","😇","🙃","😉","😊","🤖","🧑","👨","👩"];
  const found=[]; let xp=0, frag=0, dust=0, dup=0; for (let i=0;i<count;i++) { const npc=otoPickNpc(); const r=otoRarity(npc.rarity); const range=rarityXp[npc.rarity] || [1,5]; xp += range[0] + Math.floor(Math.random()*(range[1]-range[0]+1)); if (player.npcs[npc.id]) { dup++; const fq=otoFragmentQty(npc.rarity,"duplicate"); const dq=otoDustQty(npc.rarity,"duplicate"); const fkey=`${npc.rarity}_fragment`; player.inventory.fragments[fkey]=Number(player.inventory.fragments[fkey]||0)+fq; frag+=fq; player.dust+=dq; dust+=dq; } else { player.npcs[npc.id]={ id:npc.id, name:npc.name, rarity:npc.rarity, element:npc.element, skill:npc.skill, level:1, exp:0, power:npc.power, variant: otoPickVariant().key, locked:false, weapon:"", obtainedAt:new Date().toISOString() }; } found.push(`${r.emoji} ${npc.name}`); }
  player.exp += xp; player.stats.hunts = Number(player.stats.hunts || 0) + 1; otoSavePlayer(message.author, player); const shown = found.slice(0, 6).join(" • ") + (found.length > 6 ? ` • +${found.length-6} NPC lain` : ""); const faceLine = Array.from({length: Math.min(count,10)}, (_,i)=>icons[i % icons.length]).join(" ");
  const desc = count > 1 ? `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!\n▫️ | ${faceLine} mendapat **${xp} XP**!${frag ? `\n<:PurpleR:1513668875189878785> | Fragment bonus: **+${frag} Fragment**` : ""}${dup ? `\n🔁 | ${dup} NPC duplicate berubah jadi <:PurpleR:1513668875189878785> **${frag} Fragment** dan 🎴 **${dust} Dust**!` : ""}\n\nKamu menemukan:\n${shown}` : `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap ${shown}!\n▫️ | ${faceLine} mendapat **${xp} XP**!${dup ? `\n🔁 | Duplicate berubah jadi <:PurpleR:1513668875189878785> **${frag} Fragment** dan 🎴 **${dust} Dust**!` : ""}`;
  const embed = new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc).setFooter({ text: "DESA TULUS • Hansip" }); return loading?.edit ? loading.edit({ embeds:[otoV129NoImage(embed)], components: [] }).catch(() => replyOt(message,{embeds:[embed]})) : replyOt(message,{embeds:[embed]});
}



/* =========================
   Hansip NO-IMAGE PROFILE + LUCK + NPC POLISH v1.36.0
   Hard rules:
   - Tidak ada image/gambar/Canvas/AttachmentBuilder/.setImage untuk output Hansip.
   - otnpc/otzoo/otcollection tema NPC orang, bukan zoo/hewan/kotak.
   - otluck menampilkan angka random 1-100 dipengaruhi level.
   - otprofile embed rapi dan premium tanpa gambar.
   - otteam add pakai format: otteam add <nama/emoji/npc> slot <1-3>.
   - Level up embed rapi sesuai request user.
========================= */

function otoV136RemoveImages(embed) {
  try {
    if (embed && typeof embed.setImage === "function") embed.setImage(null);
    if (embed && typeof embed.setThumbnail === "function") embed.setThumbnail(null);
  } catch (_) {}
  return embed;
}

async function otoReply(message, embed, asset = null) {
  return replyOt(message, { embeds: [otoV136RemoveImages(embed)] });
}

function otoV136Sup(num) {
  const s = String(Math.max(0, Math.floor(Number(num || 0)))).padStart(2, "0");
  const map = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹"};
  return s.split("").map(x => map[x] || x).join("");
}

function otoV136PeoplePool(rarity = "common") {
  const cfgPool = config.otoNpcPeopleEmojiPool || {};
  const fallback = {
    common: ["🙂","🙃","😄","😊","😅"],
    uncommon: ["😎","🧢","🧑","👱","👨‍🍳"],
    rare: ["🤓","🧑‍💻","🕵️","🧑‍🔧","🧑‍🎨"],
    epic: ["🥸","🧙","🦸","🥷","🧑‍🚀"],
    mythic: ["🤠","👑","🧛","🧞","🧝"],
    secret: ["🧙‍♂️","🕴️","🧟","🥷","👤"],
    limited: ["👑","🪽","🧚","🦹","🧑‍🚀"]
  };
  return cfgPool[rarity] || fallback[rarity] || fallback.common;
}

function otoV136RarityEmoji(rarity = "common", index = 0) {
  const custom = config.otoNpcCustomEmojiIds || {};
  if (custom[rarity]) return custom[rarity];
  const pool = otoV136PeoplePool(rarity);
  return pool[Math.abs(Number(index || 0)) % pool.length] || "🙂";
}

function otoV136RarityCounts(player = {}) {
  const counts = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0, limited:0 };
  for (const n of Object.values(player.npcs || {})) {
    const r = String(n.rarity || "common").toLowerCase();
    if (counts[r] != null) counts[r] += 1;
  }
  return counts;
}

function otoV136NpcPoints(counts = {}) {
  return Number(counts.common||0)*1 + Number(counts.uncommon||0)*3 + Number(counts.rare||0)*10 + Number(counts.epic||0)*25 + Number(counts.mythic||0)*75 + Number(counts.secret||0)*250 + Number(counts.limited||0)*500;
}

function otoV136Row(label, rarity, total = 0) {
  const count = Number(total || 0);
  if (count <= 0) return `${label}   ❔⁰⁰  ❔⁰⁰  ❔⁰⁰  ❔⁰⁰  ❔⁰⁰`;
  const parts = [];
  let remain = count;
  for (let i=0; i<5; i++) {
    if (remain <= 0) { parts.push(`❔⁰⁰`); continue; }
    const slotsLeft = 5 - i;
    const chunk = i === 4 ? remain : Math.max(1, Math.floor(remain / slotsLeft));
    parts.push(`${otoV136RarityEmoji(rarity, i)}${otoV136Sup(chunk)}`);
    remain -= chunk;
  }
  return `${label}   ${parts.join("  ")}`;
}

function otoV136NextXp(level = 1) {
  return Math.max(120, Math.floor(Math.pow(Number(level || 1), 2) * 120));
}

function otoV136Luck(level = 1) {
  const min = Number(config.otoLuckMin || 1);
  const max = Number(config.otoLuckMax || 100);
  const lv = Math.max(1, Number(level || 1));
  const base = Math.min(max - 1, min + Math.floor(lv * Number(config.otoLuckBasePerLevel || 2)));
  const bonus = Math.floor(Math.random() * (Number(config.otoLuckRandomBonus || 18) + 1));
  return Math.max(min, Math.min(max, base + bonus));
}

function otoV136LuckText(level = 1) {
  const luck = otoV136Luck(level);
  let tier = "Normal";
  if (luck >= 90) tier = "GOD LUCK";
  else if (luck >= 75) tier = "Sultan Luck";
  else if (luck >= 55) tier = "Bagus";
  else if (luck >= 35) tier = "Lumayan";
  return { luck, tier, line: `<a:clover:1513671524949823639>Luck: ${luck} • ${tier}` };
}

function otoV136LevelReward(level = 1) {
  const lv = Number(level || 1);
  if (lv % 25 === 0) return "👑 Secret Fragment x1";
  if (lv % 10 === 0) return "📦 Royale Crate x1";
  if (lv % 5 === 0) return "📦 Neon Crate x1";
  if (lv % 3 === 0) return "<:PurpleR:1513668875189878785> Fragment x5";
  return "🎁 Basic Crate x1";
}

function otoV136LevelUpEmbed(user, player, oldLevel, newLevel) {
  const nextXp = otoV136NextXp(newLevel);
  const coin = Number(config.otoLevelUpCoinBase || 100) + newLevel * Number(config.otoLevelUpCoinPerLevel || 25);
  const reward = otoV136LevelReward(newLevel);
  player.coin = Number(player.coin || 0) + coin;
  const luck = otoV136LuckText(newLevel);
  return new EmbedBuilder()
    .setColor(config.otoEmbedAccent || "#00E5FF")
    .setTitle("✨ Hansip LEVEL UP!")
    .setDescription([
      `🎉 Selamat ${user}!`,
      `Kamu berhasil naik ke **Level ${newLevel}**.`,
      "",
      `⚡ XP: **${Number(player.exp || 0).toLocaleString("id-ID")}/${nextXp.toLocaleString("id-ID")}**`,
      `💰 Coin didapat: **+${coin.toLocaleString("id-ID")}**`,
      `🎁 Hadiah: **${reward}**`,
      luck.line
    ].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip Level System" });
}

async function otoV136MaybeLevelUp(message, player, oldLevel) {
  const newLevel = otoLevel(player.exp);
  player.level = newLevel;
  if (newLevel > oldLevel && config.otoLevelUpEnabled !== false) {
    const embed = otoV136LevelUpEmbed(message.author, player, oldLevel, newLevel);
    otoSavePlayer(message.author, player);
    await replyOt(message, { embeds: [embed] });
  }
  return newLevel;
}

async function otoCmdLuck(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const level = otoLevel(player.exp);
  const luck = otoV136LuckText(level);
  player.luck = luck.luck;
  player.luckUntil = Date.now() + Number(config.otoLuckDurationMs || 1200000);
  otoSavePlayer(message.author, player);
  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedAccent || "#00E5FF")
    .setTitle("<a:clover:1513671524949823639> Hansip LUCK CHECK")
    .setDescription([
      `${message.author}, luck kamu hari ini:`,
      "",
      `🎲 Angka Luck: **${luck.luck}**`,
      `🏷️ Level: **${level}**`,
      `✨ Status: **${luck.tier}**`,
      "",
      "Semakin tinggi level, peluang angka luck besar makin naik.",
      "Luck tetap random biar Hansip terasa hidup.",
      "",
      "Command: `oth` • `otb` • `otopen all`"
    ].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip" });
  return replyOt(message, { embeds: [embed] });
}

async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const target = message.mentions.users.first() || message.author;
  const { player } = otoGetPlayer(target);
  const level = otoLevel(player.exp);
  const nextXp = otoV136NextXp(level);
  const counts = otoV136RarityCounts(player);
  const crates = Object.values(player.inventory?.crates || {}).reduce((a,b)=>a+Number(b||0),0);
  const weapons = Object.keys(player.inventory?.weapons || {}).length;
  const frags = Object.values(player.inventory?.fragments || {}).reduce((a,b)=>a+Number(b||0),0);
  const teamPower = otoTeamPower(player);
  const wins = Number(player.stats?.wins || 0);
  const losses = Number(player.stats?.losses || 0);
  const luck = otoV136LuckText(level);
  player.lastLuck = luck.luck;
  otoSavePlayer(target, player);

  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle(`👤 Hansip Profile — ${target.username}`)
    .setDescription([
      `👤 Player: ${target}`,
      `🏷️ Level: **${level}**`,
      `⚡ XP: **${Number(player.exp || 0).toLocaleString("id-ID")}/${nextXp.toLocaleString("id-ID")}**`,
      luck.line,
      "",
      `🪙 Coin: **${Number(player.coin || 0).toLocaleString("id-ID")}**`,
      `🎴 NPC: **${Object.keys(player.npcs || {}).length}**`,
      `🧩 Fragment: **${frags.toLocaleString("id-ID")}**`,
      `📦 Crate: **${crates}**`,
      `⚔️ Weapon: **${weapons}**`,
      "",
      `⚔️ Team Power: **${teamPower.toLocaleString("id-ID")}**`,
      `🏆 Battle: **${wins}W / ${losses}L**`,
      `🧑 NPC Points: **${otoV136NpcPoints(counts).toLocaleString("id-ID")}**`,
      "",
      "Command: `oth` • `otnpc` • `otteam view` • `otluck`"
    ].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip Profile" });
  return replyOt(message, { embeds: [embed] });
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  const counts = otoV136RarityCounts(player);
  const level = otoLevel(player.exp);

  if (OTO_RARITY_KEYS.includes(q)) {
    const owned = Object.values(player.npcs || {}).filter(n => n.rarity === q);
    const lines = owned.slice(0, 15).map((n, i) => `${i+1}. ${otoV136RarityEmoji(n.rarity, i)} \`${n.id}\` — **${n.name}** • Lv.${n.level || 1} • Power ${otoOwnedNpcPower(n).toLocaleString("id-ID")}${n.locked ? " • 🔒" : ""}`);
    return replyOt(message, { embeds: [new EmbedBuilder()
      .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setTitle(`${otoV136RarityEmoji(q)} ${q.toUpperCase()} NPC Collection`)
      .setDescription((lines.length ? lines.join("\n") : "Belum punya NPC di rarity ini.") + "\n\nCommand: `otcard <npcId>` • `otteam add <npcId> slot 1`")
      .setFooter({ text: "DESA TULUS • Hansip" })] });
  }

  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle(`🧑 ${message.author.username}'s Hansip NPC Collection!`)
    .setDescription([
      `🧑 🙂 😎 🤓 **${message.author.username}'s NPC collection!** 🤓 😎 🙂`,
      "",
      otoV136Row("common", "common", counts.common),
      otoV136Row("uncommon", "uncommon", counts.uncommon),
      otoV136Row("rare", "rare", counts.rare),
      otoV136Row("epic", "epic", counts.epic),
      otoV136Row("mythic", "mythic", counts.mythic),
      otoV136Row("secret", "secret", counts.secret),
      counts.limited ? otoV136Row("limited", "limited", counts.limited) : "",
      "",
      `NPC Points: **${otoV136NpcPoints(counts).toLocaleString("id-ID")}**`,
      `M-${counts.mythic}, E-${counts.epic}, R-${counts.rare}, U-${counts.uncommon}, C-${counts.common}, S-${counts.secret}`,
      otoV136LuckText(level).line,
      "",
      "Command: `otnpc rare` • `otcard <npcId>` • `otteam add <npcId> slot 1`"
    ].filter(Boolean).join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip" });
  return replyOt(message, { embeds: [embed] });
}

function otoV136FindOwnedNpc(player, query) {
  const q = String(query || "").trim();
  if (!q) return null;
  const slug = otoSlug(q);
  const owned = Object.values(player.npcs || {});
  let found = owned.find(n => n.id === slug || otoSlug(n.name) === slug || n.name.toLowerCase() === q.toLowerCase());
  if (found) return found;
  found = owned.find(n => otoSlug(n.name).includes(slug) || slug.includes(otoSlug(n.name)));
  if (found) return found;
  // allow emoji-based add: pick first NPC matching rarity emoji/person icon
  const rarityByEmoji = ["common","uncommon","rare","epic","mythic","secret","limited"].find(r => otoV136PeoplePool(r).includes(q) || otoV136RarityEmoji(r) === q);
  if (rarityByEmoji) return owned.find(n => n.rarity === rarityByEmoji) || null;
  return null;
}

async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  otoNormalizePlayer(player);
  player.team = Array.isArray(player.team) ? player.team.slice(0,3) : [null,null,null];
  while (player.team.length < 3) player.team.push(null);
  const sub = String(args[0] || "view").toLowerCase();

  if (sub === "add") {
    const slotIndex = args.findIndex(a => String(a).toLowerCase() === "slot");
    let pos = 1;
    let nameParts = args.slice(1);
    if (slotIndex >= 0) {
      pos = Math.max(1, Math.min(3, Number(args[slotIndex + 1] || 1)));
      nameParts = args.slice(1, slotIndex);
    } else {
      pos = Math.max(1, Math.min(3, Number(args[args.length - 1] || 1)));
      nameParts = args.slice(1, -1);
    }
    const name = nameParts.join(" ").trim();
    const owned = otoV136FindOwnedNpc(player, name);
    if (!owned) return replyOt(message, { content: "❌ NPC belum kamu miliki atau nama/emoji NPC tidak ditemukan. Contoh: `otteam add Kucing Pajak slot 1`" });
    if (player.team.includes(owned.id)) return replyOt(message, { content: "⚠️ NPC itu sudah ada di team." });
    player.team[pos - 1] = owned.id;
    otoSavePlayer(message.author, player);
    return replyOt(message, { embeds: [new EmbedBuilder()
      .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setTitle("✅ Hansip Team Updated")
      .setDescription(`${otoV136RarityEmoji(owned.rarity)} **${owned.name}** masuk ke team slot **${pos}**.\n\nCommand: \`otteam view\` • \`otb\``)
      .setFooter({ text: "DESA TULUS • Hansip" })] });
  }

  if (sub === "remove") {
    const pos = Math.max(1, Math.min(3, Number(args.find(a => /^\d+$/.test(a)) || args[1] || 1)));
    player.team[pos-1] = null; otoSavePlayer(message.author, player);
    return replyOt(message, { content: `✅ Team slot ${pos} dikosongkan.` });
  }
  if (sub === "clear") { player.team = [null,null,null]; otoSavePlayer(message.author, player); return replyOt(message, { content: "✅ Team Hansip dikosongkan." }); }

  const lines = player.team.map((id,i) => {
    const n = id && player.npcs[id] ? player.npcs[id] : null;
    return n ? `**Slot ${i+1}.** ${otoV136RarityEmoji(n.rarity, i)} **${n.name}** • Lv.${n.level || 1} • Power ${otoOwnedNpcPower(n).toLocaleString("id-ID")}` : `**Slot ${i+1}.** Kosong`;
  }).join("\n");
  const syn = otoTeamSynergy(player);
  return replyOt(message, { embeds: [new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setTitle("⚔️ Hansip Team")
    .setDescription(`${lines}\n\nTeam Power: **${otoTeamPower(player).toLocaleString("id-ID")}**\nSynergy: ${syn.lines.length ? syn.lines.join(" • ") : "Belum ada"}\n\nFormat add:\n\`otteam add <nama/emoji/npc> slot <1-3>\``)
    .setFooter({ text: "DESA TULUS • Hansip" })] });
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000));
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });
  const { player } = otoGetPlayer(message.author);
  otoNormalizePlayer(player);
  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) return replyOt(message, { content: `❌ Coin kurang. Hunt butuh **${cost} Hansip Coin**. Pakai \`otkerja\` dulu.` });
  const oldLevel = otoLevel(player.exp);
  player.coin -= cost;
  const fragmentTotal = Object.values(player.inventory?.fragments || {}).reduce((a,b)=>a+Number(b||0),0);
  const maxNpc = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMaxNpc || 10) : Number(config.otoHuntWithoutFragmentMaxNpc || 3);
  const minNpc = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMinNpc || 1) : Number(config.otoHuntWithoutFragmentMinNpc || 1);
  const count = Math.max(minNpc, Math.min(maxNpc, minNpc + Math.floor(Math.random() * (maxNpc - minNpc + 1))));
  const found = [];
  let xp = 0, fragReward = 0, dupCount = 0, dust = 0;
  for (let i=0;i<count;i++) {
    const npc = otoPickNpc();
    const result = otoAddNpc(player, npc);
    const rarityXp = { common:[1,5], uncommon:[4,9], rare:[8,15], epic:[15,30], mythic:[30,75], secret:[75,150], limited:[100,200] }[npc.rarity] || [1,5];
    xp += rarityXp[0] + Math.floor(Math.random() * (rarityXp[1]-rarityXp[0]+1));
    found.push(`${otoV136RarityEmoji(npc.rarity, i)} **${npc.name}**`);
    if (result.duplicate) { dupCount++; fragReward += Number(result.fragmentQty || 0); dust += Number(result.dustQty || 0); }
  }
  if (fragmentTotal > 0) xp = Math.floor(xp * (1.05 + Math.random()*0.25));
  player.exp = Number(player.exp || 0) + xp;
  const npcIconLine = found.slice(0,10).map((x)=>x.split(" ")[0]).join(" ");
  const desc = [
    `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!`,
    `▫️ | ${npcIconLine || "🙂"} mendapat **${xp} XP**!`,
    `🎴 | ${found.slice(0,5).join(" • ")}${found.length > 5 ? ` • +${found.length-5} NPC lain` : ""}`,
    fragReward ? `<:PurpleR:1513668875189878785> | Fragment bonus: **+${fragReward} Fragment**` : "",
    dupCount ? `🔁 | ${dupCount} NPC duplicate berubah jadi <:PurpleR:1513668875189878785> **${fragReward} Fragment** dan 🎴 **${dust} Dust**!` : "",
    otoV136LuckText(oldLevel).line,
    "",
    "Command: `otnpc` • `otinv` • `otteam add <npc> slot 1`"
  ].filter(Boolean).join("\n");
  otoSavePlayer(message.author, player);
  await replyOt(message, { embeds: [new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc).setFooter({ text: "DESA TULUS • Hansip" })] });
  await otoV136MaybeLevelUp(message, player, oldLevel);
}

async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = otoCooldown(message.author.id, "battle", Number(config.otoBattleCooldownMs || 30000));
  if (wait) return replyOt(message, { content: `⏳ Battle cooldown **${wait} detik**.` });
  const { player } = otoGetPlayer(message.author);
  const oldLevel = otoLevel(player.exp);
  const power = otoTeamPower(player);
  if (power <= 0) return replyOt(message, { content: "❌ Kamu belum punya team aktif. Pakai `otteam add <npc> slot 1`." });
  const level = otoLevel(player.exp);
  const luck = otoV136LuckText(level);
  const enemy = Math.floor(power * (0.75 + Math.random() * 0.8));
  const chance = Math.max(10, Math.min(90, Math.round((power + luck.luck*10) / Math.max(1, power + enemy) * 100)));
  const win = Math.random()*100 < chance;
  const coin = win ? 180 + Math.floor(Math.random()*260) : 40 + Math.floor(Math.random()*80);
  const xp = win ? 45 + Math.floor(Math.random()*70) : 12 + Math.floor(Math.random()*30);
  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  player.stats = player.stats || {};
  player.stats.battles = Number(player.stats.battles || 0) + 1;
  player.stats[win ? "wins" : "losses"] = Number(player.stats[win ? "wins" : "losses"] || 0) + 1;
  otoSavePlayer(message.author, player);
  await replyOt(message, { embeds: [new EmbedBuilder()
    .setColor(win ? "#0B5CFF" : "#FF4D6D")
    .setTitle(`⚔️ Hansip Battle — ${win ? "WIN" : "LOSE"}`)
    .setDescription([`Team Power: **${power.toLocaleString("id-ID")}**`, `Enemy Power: **${enemy.toLocaleString("id-ID")}**`, `Chance: **${chance}%**`, luck.line, "", win ? "💎 Team kamu menang battle!" : "💨 Team kamu kalah, tapi tetap dapat reward hiburan.", "", `Reward:`, `🪙 Coin +**${coin}**`, `✨ EXP +**${xp}**`, "", "Command: `oth` • `otteam view` • `otluck`"].join("\n"))
    .setFooter({ text: "DESA TULUS • Hansip" })] });
  await otoV136MaybeLevelUp(message, player, oldLevel);
}

async function otoCmdDaily(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const oldLevel = otoLevel(player.exp);
  const coin = 250 + Math.floor(Math.random()*350);
  const xp = 40 + Math.floor(Math.random()*60);
  const frag = 3 + Math.floor(Math.random()*8);
  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  otoAddFragment(player, "Common Fragment", frag);
  otoSavePlayer(message.author, player);
  await replyOt(message, { embeds: [new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(`🎁 | ${message.author.username}, kamu mengambil daily dan mendapatkan **${coin} Hansip Coin**, **${xp} XP**, dan <:PurpleR:1513668875189878785> **${frag} Fragment**!`).setFooter({ text: "DESA TULUS • Hansip" })] });
  await otoV136MaybeLevelUp(message, player, oldLevel);
}


/* =========================
   Hansip OTNPC HARD EXACT OVERRIDE v1.42.0
   Ini sengaja diletakkan di akhir file supaya mengalahkan handler otoCmdNpc lama.
   Output otnpc/otzoo/otcollection dipaksa sama persis style request user.
   Tidak pakai image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_NPC_EXACT_EMOJI_V142 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>"
};

function otoV142Sup(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoV142LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV142LuckByLevel(level = 1) {
  const lv = Math.max(1, Number(level || 1));
  const base = Math.min(100, 10 + Math.floor(lv * 2));
  const random = Math.floor(Math.random() * 11);
  return Math.max(1, Math.min(100, base + random));
}

function otoV142RarityCounts(player) {
  const counts = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const n of Object.values(player?.npcs || {})) {
    const r = String(n.rarity || "common").toLowerCase();
    if (counts[r] !== undefined) counts[r]++;
  }
  return counts;
}

function otoV142Points(counts) {
  return (
    Number(counts.common || 0) * 1 +
    Number(counts.uncommon || 0) * 3 +
    Number(counts.rare || 0) * 10 +
    Number(counts.epic || 0) * 25 +
    Number(counts.mythic || 0) * 75 +
    Number(counts.secret || 0) * 250
  );
}

function otoV142Row(letter, faces, counts) {
  return `${letter} : ${faces.map((emoji, i) => `${emoji}${otoV142Sup((counts || [])[i] || 0)}`).join(" ")}`;
}

function otoV142SplitCounts(total = 0, slots = 5) {
  const arr = Array(slots).fill(0);
  let left = Math.max(0, Number(total || 0));
  for (let i = 0; i < slots && left > 0; i++) {
    arr[i] = 1;
    left--;
  }
  if (left > 0) arr[slots - 1] += left;
  return arr;
}

function otoV142NpcDescription(username, player) {
  const counts = otoV142RarityCounts(player);
  const level = typeof otoLevel === "function" ? otoLevel(player?.exp || 0) : Math.max(1, Number(player?.level || 1));
  const luck = otoV142LuckByLevel(level);
  const points = otoV142Points(counts);

  return [
    `${OTO_NPC_EXACT_EMOJI_V142.title} ${username}'s Hansip NPC Collection!`,
    "",
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.common, [":slight_smile:", ":upside_down:", ":smile:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.common)),
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.uncommon, [":sunglasses:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.uncommon)),
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.rare, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.rare)),
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.epic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.epic)),
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.mythic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.mythic)),
    otoV142Row(OTO_NPC_EXACT_EMOJI_V142.secret, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV142SplitCounts(counts.secret)),
    "",
    `NPC Points: ${points.toLocaleString("id-ID")}`,
    `M-${counts.mythic}, E-${counts.epic}, R-${counts.rare}, U-${counts.uncommon}, C-${counts.common}, S-${counts.secret}`,
    "",
    `${OTO_NPC_EXACT_EMOJI_V142.luck}Luck: ${luck} • ${otoV142LuckTier(luck)}`,
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);

  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);

  const rarityKeys = ["common", "uncommon", "rare", "epic", "mythic", "secret"];
  if (rarityKeys.includes(q)) {
    const owned = Object.values(player.npcs || {}).filter(n => String(n.rarity || "common").toLowerCase() === q);
    const letter = OTO_NPC_EXACT_EMOJI_V142[q] || OTO_NPC_EXACT_EMOJI_V142.common;
    const lines = owned.slice(0, 15).map((n, i) => {
      const power = typeof otoOwnedNpcPower === "function" ? otoOwnedNpcPower(n).toLocaleString("id-ID") : Number(n.power || 0).toLocaleString("id-ID");
      return `${i + 1}. ${letter} \`${n.id}\` — **${n.name}** • Lv.${n.level || 1} • Power ${power}${n.locked ? " • 🔒" : ""}`;
    });

    return replyOt(message, { embeds: [new EmbedBuilder()
      .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setDescription(`${letter} ${q.toUpperCase()} NPC Collection\n\n${lines.length ? lines.join("\n") : "Belum punya NPC di rarity ini."}\n\nCommand: otcard <npcId> • otteam add <npcId> slot 1`)
      .setFooter({ text: "DESA TULUS • Hansip" })] });
  }

  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoV142NpcDescription(message.author.username, player))
    .setFooter({ text: "DESA TULUS • Hansip" });

  return replyOt(message, { embeds: [embed] });
}


/* =========================
   Hansip HUNT -> NPC COLLECTION SYNC HARD FIX v1.43.0
   Masalah yang difix:
   - Setelah `oth`, NPC wajib masuk ke player.npcs.
   - Setelah itu `otnpc` wajib membaca player.npcs yang sama.
   - `otnpc recent` menampilkan hasil hunt terakhir.
   - Tidak ada image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

function otoV143NpcId(npc) {
  return npc?.id || (typeof otoSlug === "function" ? otoSlug(npc?.name || "npc") : String(npc?.name || "npc").toLowerCase().replace(/\s+/g, "_"));
}

function otoV143SafeAddNpc(player, npc) {
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || { crates:{}, weapons:{}, fragments:{}, items:{} };
  player.inventory.fragments = player.inventory.fragments || {};
  player.dust = Number(player.dust || 0);

  const id = otoV143NpcId(npc);
  const rarity = String(npc?.rarity || "common").toLowerCase();

  if (player.npcs[id]) {
    const fragId = `${rarity}_fragment`;
    const fragQty = 1 + Math.max(0, ["common","uncommon","rare","epic","mythic","secret","limited"].indexOf(rarity));
    const dustQty = 4 + fragQty * 2;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + fragQty;
    player.dust += dustQty;
    player.npcs[id].duplicates = Number(player.npcs[id].duplicates || 0) + 1;
    return { id, duplicate: true, fragmentId: fragId, fragmentQty: fragQty, dustQty: dustQty };
  }

  player.npcs[id] = {
    id,
    name: npc?.name || id,
    rarity,
    element: npc?.element || "Tulus",
    level: 1,
    exp: 0,
    power: Number(npc?.power || 100),
    locked: false,
    weapon: "",
    variant: "normal",
    obtainedAt: new Date().toISOString()
  };

  return { id, duplicate: false, fragmentId: "", fragmentQty: 0, dustQty: 0 };
}

function otoV143PickNpc() {
  try {
    if (typeof otoPickNpc === "function") {
      const npc = otoPickNpc();
      if (npc) return npc;
    }
  } catch (_) {}

  const fallback = [
    { id:"bang_jaga_sendal", name:"Bang Jaga Sendal", rarity:"common", element:"Tulus", power:120 },
    { id:"warga_senyum_tipis", name:"Warga Senyum Tipis", rarity:"common", element:"Tulus", power:130 },
    { id:"admin_ngopi", name:"Admin Ngopi", rarity:"uncommon", element:"Warung", power:220 },
    { id:"kucing_pajak", name:"Kucing Pajak", rarity:"rare", element:"Market", power:520 },
    { id:"ayam_cyber", name:"Ayam Cyber", rarity:"epic", element:"Cyber", power:880 },
    { id:"bekiw_mode_royale", name:"Bekiw Mode Royale", rarity:"mythic", element:"Royal", power:1500 },
    { id:"oto_secret_king", name:"Hansip Secret King", rarity:"secret", element:"Secret", power:2500 }
  ];

  const roll = Math.random();
  if (roll < 0.55) return fallback[Math.floor(Math.random() * 2)];
  if (roll < 0.78) return fallback[2];
  if (roll < 0.92) return fallback[3];
  if (roll < 0.985) return fallback[4];
  if (roll < 0.998) return fallback[5];
  return fallback[6];
}

function otoV143RarityEmoji(rarity) {
  const map = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>",
    limited: "👑"
  };
  return map[String(rarity || "common").toLowerCase()] || map.common;
}

function otoV143NpcFace(rarity, index = 0) {
  const pool = {
    common: [":slight_smile:", ":upside_down:", ":smile:", ":slight_smile:", ":smile:"],
    uncommon: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    rare: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    epic: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    mythic: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    secret: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"]
  };
  const arr = pool[String(rarity || "common").toLowerCase()] || pool.common;
  return arr[index % arr.length];
}

function otoV143ExpByRarity(rarity) {
  const range = {
    common: [1,5],
    uncommon: [4,9],
    rare: [8,15],
    epic: [15,30],
    mythic: [30,75],
    secret: [75,150],
    limited: [100,200]
  }[String(rarity || "common").toLowerCase()] || [1,5];

  return range[0] + Math.floor(Math.random() * (range[1] - range[0] + 1));
}

function otoV143RarityCounts(player) {
  const counts = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const n of Object.values(player?.npcs || {})) {
    const r = String(n.rarity || "common").toLowerCase();
    if (counts[r] !== undefined) counts[r]++;
  }
  return counts;
}

function otoV143MaybeLevel(player) {
  try { return typeof otoLevel === "function" ? otoLevel(player?.exp || 0) : Math.max(1, Number(player?.level || 1)); }
  catch (_) { return Math.max(1, Number(player?.level || 1)); }
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;

  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return replyOt(message, { content: `❌ Coin kamu kurang. Hunt butuh **${cost} Hansip Coin**. Pakai \`otkerja\` dulu.` });
  }

  player.coin = Number(player.coin || 0) - cost;

  const fragmentTotal = Object.values(player.inventory?.fragments || {}).reduce((a,b) => a + Number(b || 0), 0);
  const min = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMinNpc || 1) : Number(config.otoHuntWithoutFragmentMinNpc || 1);
  const max = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMaxNpc || 10) : Number(config.otoHuntWithoutFragmentMaxNpc || 3);
  const count = Math.max(min, Math.min(max, min + Math.floor(Math.random() * (max - min + 1))));

  const oldLevel = otoV143MaybeLevel(player);
  const found = [];
  const recent = [];
  let xp = 0;
  let fragReward = 0;
  let dupCount = 0;
  let dust = 0;

  for (let i = 0; i < count; i++) {
    const npc = otoV143PickNpc();
    const result = otoV143SafeAddNpc(player, npc);
    const rarity = String(npc.rarity || "common").toLowerCase();
    const gotXp = otoV143ExpByRarity(rarity);
    xp += gotXp;

    const rarityEmoji = otoV143RarityEmoji(rarity);
    const face = otoV143NpcFace(rarity, i);

    found.push(`${rarityEmoji} ${face} **${npc.name}**`);
    recent.push({ id: result.id, name: npc.name, rarity, duplicate: result.duplicate });

    if (result.duplicate) {
      dupCount++;
      fragReward += Number(result.fragmentQty || 0);
      dust += Number(result.dustQty || 0);
    }
  }

  if (fragmentTotal > 0) xp = Math.floor(xp * (1.05 + Math.random() * 0.25));

  player.exp = Number(player.exp || 0) + xp;
  player.level = otoV143MaybeLevel(player);
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;
  player.stats.huntExp = Number(player.stats.huntExp || 0) + xp;
  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dupCount, fragment: fragReward, dust };

  otoSavePlayer(message.author, player);

  const iconLine = recent.map((n, i) => otoV143NpcFace(n.rarity, i)).slice(0, 10).join(" ");
  const desc = [
    `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!`,
    `▫️ | ${iconLine || ":slight_smile:"} mendapat **${xp} XP**!`,
    `🎴 | ${found.slice(0,5).join(" • ")}${found.length > 5 ? ` • +${found.length - 5} NPC lain` : ""}`,
    fragReward ? `<:PurpleR:1513668875189878785> | Fragment bonus: **+${fragReward} Fragment**` : "",
    dupCount ? `🔁 | ${dupCount} NPC duplicate berubah jadi <:PurpleR:1513668875189878785> **${fragReward} Fragment** dan 🎴 **${dust} Dust**!` : "",
    `<a:clover:1513671524949823639>Luck: ${typeof otoV142LuckByLevel === "function" ? otoV142LuckByLevel(player.level) : (10 + Math.floor(Math.random()*20))} • Normal`,
    "",
    "✅ NPC sudah tersimpan. Cek: `otnpc`",
    "Command: `otnpc` • `otnpc recent` • `otinv` • `otteam add <npcId> slot 1`"
  ].filter(Boolean).join("\n");

  await replyOt(message, {
    embeds: [new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc).setFooter({ text: "DESA TULUS • Hansip" })]
  });

  if (typeof otoV136MaybeLevelUp === "function") await otoV136MaybeLevelUp(message, player, oldLevel);
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;

  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);

  if (q === "recent") {
    const recent = player.lastHunt?.npcs || [];
    const lines = recent.length
      ? recent.map((n, i) => `${i+1}. ${otoV143RarityEmoji(n.rarity)} ${otoV143NpcFace(n.rarity, i)} \`${n.id}\` — **${n.name}**${n.duplicate ? " • duplicate" : ""}`).join("\n")
      : "Belum ada hasil hunt terakhir. Gunakan `oth` dulu.";

    return replyOt(message, { embeds: [new EmbedBuilder()
      .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setDescription(`🎴 Hasil Hunt Terakhir\n\n${lines}\n\nCommand: \`otcard <npcId>\` • \`otteam add <npcId> slot 1\``)
      .setFooter({ text: "DESA TULUS • Hansip" })] });
  }

  const rarityKeys = ["common", "uncommon", "rare", "epic", "mythic", "secret"];
  if (rarityKeys.includes(q)) {
    const owned = Object.values(player.npcs || {}).filter(n => String(n.rarity || "common").toLowerCase() === q);
    const letter = otoV143RarityEmoji(q);
    const lines = owned.slice(0, 15).map((n, i) => {
      const power = typeof otoOwnedNpcPower === "function" ? otoOwnedNpcPower(n).toLocaleString("id-ID") : Number(n.power || 0).toLocaleString("id-ID");
      return `${i+1}. ${letter} ${otoV143NpcFace(q, i)} \`${n.id}\` — **${n.name}** • Lv.${n.level || 1} • Power ${power}${n.locked ? " • 🔒" : ""}`;
    });

    return replyOt(message, { embeds: [new EmbedBuilder()
      .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setDescription(`${letter} ${q.toUpperCase()} NPC Collection\n\n${lines.length ? lines.join("\n") : "Belum punya NPC di rarity ini."}\n\nCommand: otcard <npcId> • otteam add <npcId> slot 1`)
      .setFooter({ text: "DESA TULUS • Hansip" })] });
  }

  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoV142NpcDescription(message.author.username, player))
    .setFooter({ text: "DESA TULUS • Hansip" });

  return replyOt(message, { embeds: [embed] });
}


/* =========================
   Hansip CLEAR FLOW SYSTEM v1.44.0
   Tujuan:
   - Semua alur game jelas dan nyambung.
   - oth menyimpan NPC -> otnpc menampilkan -> otteam add memasang -> otb battle.
   - Semua embed punya "Lanjut" agar member tidak bingung.
   - Tetap tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_FLOW_EMOJI_V144 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>"
};

function otoV144Footer(extra = "") {
  return extra || "DESA TULUS • Hansip";
}

function otoV144CleanEmbed({ description = "", title = "", color = null, footer = "" } = {}) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(description)
    .setFooter({ text: otoV144Footer(footer) });
  if (title) embed.setTitle(title);
  try {
    embed.setImage(null);
    embed.setThumbnail(null);
  } catch (_) {}
  return embed;
}

function otoV144Sup(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoV144LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV144Level(player) {
  try { return typeof otoLevel === "function" ? otoLevel(Number(player?.exp || 0)) : Math.max(1, Number(player?.level || 1)); }
  catch (_) { return Math.max(1, Number(player?.level || 1)); }
}

function otoV144Luck(player) {
  const level = otoV144Level(player);
  const base = Math.min(100, 8 + level * 2);
  const random = Math.floor(Math.random() * 15);
  return Math.max(1, Math.min(100, base + random));
}

function otoV144RarityEmoji(rarity = "common") {
  const r = String(rarity || "common").toLowerCase();
  return OTO_FLOW_EMOJI_V144[r] || OTO_FLOW_EMOJI_V144.common;
}

function otoV144Face(rarity = "common", i = 0) {
  const pool = {
    common: [":slight_smile:", ":upside_down:", ":smile:", ":slight_smile:", ":smile:"],
    uncommon: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    rare: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    epic: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    mythic: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"],
    secret: [":sunglasses:", ":slight_smile:", ":upside_down:", ":smile:", ":sunglasses:"]
  };
  const arr = pool[String(rarity || "common").toLowerCase()] || pool.common;
  return arr[i % arr.length];
}

function otoV144RarityCounts(player) {
  const counts = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const n of Object.values(player?.npcs || {})) {
    const r = String(n.rarity || "common").toLowerCase();
    if (counts[r] !== undefined) counts[r]++;
  }
  return counts;
}

function otoV144Points(counts) {
  return (
    Number(counts.common || 0) * 1 +
    Number(counts.uncommon || 0) * 3 +
    Number(counts.rare || 0) * 10 +
    Number(counts.epic || 0) * 25 +
    Number(counts.mythic || 0) * 75 +
    Number(counts.secret || 0) * 250
  );
}

function otoV144Split(total = 0, slots = 5) {
  const arr = Array(slots).fill(0);
  let left = Math.max(0, Number(total || 0));
  for (let i = 0; i < slots && left > 0; i++) {
    arr[i] = 1;
    left--;
  }
  if (left > 0) arr[slots - 1] += left;
  return arr;
}

function otoV144Row(letter, faces, values) {
  return `${letter} : ${faces.map((emoji, i) => `${emoji}${otoV144Sup((values || [])[i] || 0)}`).join(" ")}`;
}

function otoV144NpcCollectionDescription(username, player) {
  const counts = otoV144RarityCounts(player);
  const points = otoV144Points(counts);
  const luck = otoV144Luck(player);

  return [
    `${OTO_FLOW_EMOJI_V144.title} ${username}'s Hansip NPC Collection!`,
    "",
    otoV144Row(OTO_FLOW_EMOJI_V144.common, [":slight_smile:", ":upside_down:", ":smile:", ":grey_question:", ":grey_question:"], otoV144Split(counts.common)),
    otoV144Row(OTO_FLOW_EMOJI_V144.uncommon, [":sunglasses:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV144Split(counts.uncommon)),
    otoV144Row(OTO_FLOW_EMOJI_V144.rare, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV144Split(counts.rare)),
    otoV144Row(OTO_FLOW_EMOJI_V144.epic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV144Split(counts.epic)),
    otoV144Row(OTO_FLOW_EMOJI_V144.mythic, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV144Split(counts.mythic)),
    otoV144Row(OTO_FLOW_EMOJI_V144.secret, [":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:", ":grey_question:"], otoV144Split(counts.secret)),
    "",
    `NPC Points: ${points.toLocaleString("id-ID")}`,
    `M-${counts.mythic}, E-${counts.epic}, R-${counts.rare}, U-${counts.uncommon}, C-${counts.common}, S-${counts.secret}`,
    "",
    `${OTO_FLOW_EMOJI_V144.luck}Luck: ${luck} • ${otoV144LuckTier(luck)}`,
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

function otoV144PickNpc() {
  const fallback = [
    { id:"bang_jaga_sendal", name:"Bang Jaga Sendal", rarity:"common", element:"Tulus", power:120 },
    { id:"warga_senyum_tipis", name:"Warga Senyum Tipis", rarity:"common", element:"Tulus", power:130 },
    { id:"tukang_delay_battle", name:"Tukang Delay Battle", rarity:"common", element:"Tulus", power:135 },
    { id:"admin_ngopi", name:"Admin Ngopi", rarity:"uncommon", element:"Warung", power:220 },
    { id:"kucing_pajak", name:"Kucing Pajak", rarity:"rare", element:"Market", power:520 },
    { id:"ayam_cyber", name:"Ayam Cyber", rarity:"epic", element:"Cyber", power:880 },
    { id:"bekiw_mode_royale", name:"Bekiw Mode Royale", rarity:"mythic", element:"Royal", power:1500 },
    { id:"oto_secret_king", name:"Hansip Secret King", rarity:"secret", element:"Secret", power:2500 }
  ];

  const roll = Math.random();
  if (roll < 0.60) return fallback[Math.floor(Math.random() * 3)];
  if (roll < 0.80) return fallback[3];
  if (roll < 0.93) return fallback[4];
  if (roll < 0.985) return fallback[5];
  if (roll < 0.998) return fallback[6];
  return fallback[7];
}

function otoV144NpcId(npc) {
  return npc?.id || String(npc?.name || "npc").toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
}

function otoV144EnsureInventory(player) {
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.npcs = player.npcs || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 3) : [];
  while (player.team.length < 3) player.team.push("");
}

function otoV144AddNpc(player, npc) {
  otoV144EnsureInventory(player);
  const id = otoV144NpcId(npc);
  const rarity = String(npc.rarity || "common").toLowerCase();
  if (player.npcs[id]) {
    const fragId = `${rarity}_fragment`;
    const fragQty = 1 + Math.max(0, ["common","uncommon","rare","epic","mythic","secret"].indexOf(rarity));
    const dustQty = 3 + fragQty * 2;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + fragQty;
    player.dust = Number(player.dust || 0) + dustQty;
    player.npcs[id].duplicates = Number(player.npcs[id].duplicates || 0) + 1;
    return { id, duplicate: true, fragId, fragQty, dustQty };
  }

  player.npcs[id] = {
    id,
    name: npc.name,
    rarity,
    element: npc.element || "Tulus",
    level: 1,
    exp: 0,
    power: Number(npc.power || 100),
    locked: false,
    weapon: "",
    variant: "normal",
    obtainedAt: new Date().toISOString()
  };
  return { id, duplicate: false, fragId: "", fragQty: 0, dustQty: 0 };
}

function otoV144FindOwnedNpc(player, query) {
  otoV144EnsureInventory(player);
  const q = String(query || "").trim();
  if (!q) return null;
  const slug = q.toLowerCase().replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "");
  const owned = Object.values(player.npcs || {});
  return owned.find(n => n.id === q || n.id === slug || String(n.name || "").toLowerCase() === q.toLowerCase()) ||
         owned.find(n => String(n.name || "").toLowerCase().includes(q.toLowerCase()) || n.id.includes(slug)) ||
         null;
}

function otoV144NpcPower(npc) {
  return Number(npc?.power || 100) + Number(npc?.level || 1) * 25;
}

function otoV144TeamPower(player) {
  otoV144EnsureInventory(player);
  return (player.team || []).reduce((sum, id) => {
    const npc = player.npcs?.[id];
    return sum + (npc ? otoV144NpcPower(npc) : 0);
  }, 0);
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;

  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV144EnsureInventory(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: `❌ Coin kamu kurang.\n\nHunt butuh **${cost} Hansip Coin**.\n\nLanjut: \`otkerja\` buat cari coin, lalu \`oth\` lagi.`,
      footer: "DESA TULUS • Hansip"
    })] });
  }

  player.coin = Number(player.coin || 0) - cost;

  const fragmentTotal = Object.values(player.inventory.fragments || {}).reduce((a,b) => a + Number(b || 0), 0);
  const min = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMinNpc || 1) : Number(config.otoHuntWithoutFragmentMinNpc || 1);
  const max = fragmentTotal > 0 ? Number(config.otoHuntWithFragmentMaxNpc || 10) : Number(config.otoHuntWithoutFragmentMaxNpc || 3);
  const count = Math.max(min, Math.min(max, min + Math.floor(Math.random() * (max - min + 1))));

  const recent = [];
  const foundLines = [];
  let xp = 0, dupCount = 0, fragReward = 0, dust = 0;

  for (let i = 0; i < count; i++) {
    const npc = otoV144PickNpc();
    const add = otoV144AddNpc(player, npc);
    const rarity = String(npc.rarity || "common").toLowerCase();
    const expGain = { common:3, uncommon:7, rare:12, epic:24, mythic:55, secret:125 }[rarity] || 3;
    xp += expGain + Math.floor(Math.random() * Math.max(2, expGain));

    const face = otoV144Face(rarity, i);
    const letter = otoV144RarityEmoji(rarity);
    foundLines.push(`${letter} ${face} **${npc.name}**`);
    recent.push({ id:add.id, name:npc.name, rarity, duplicate:add.duplicate });

    if (add.duplicate) {
      dupCount++;
      fragReward += Number(add.fragQty || 0);
      dust += Number(add.dustQty || 0);
    }
  }

  player.exp = Number(player.exp || 0) + xp;
  player.level = otoV144Level(player);
  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dupCount, fragment: fragReward, dust };
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;

  otoSavePlayer(message.author, player);

  const iconLine = recent.map((n, i) => otoV144Face(n.rarity, i)).join(" ");
  const desc = [
    `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!`,
    `▫️ | ${iconLine || ":slight_smile:"} mendapat **${xp} XP**!`,
    `🎴 | ${foundLines.slice(0, 5).join(" • ")}${foundLines.length > 5 ? ` • +${foundLines.length - 5} NPC lain` : ""}`,
    fragReward ? `${OTO_FLOW_EMOJI_V144.rare} | Fragment bonus: **+${fragReward} Fragment**` : "",
    dupCount ? `🔁 | ${dupCount} duplicate berubah jadi ${OTO_FLOW_EMOJI_V144.rare} **${fragReward} Fragment** dan 🎴 **${dust} Dust**!` : "",
    `${OTO_FLOW_EMOJI_V144.luck}Luck: ${otoV144Luck(player)} • ${otoV144LuckTier(otoV144Luck(player))}`,
    "",
    "✅ NPC sudah tersimpan ke collection.",
    "━━━━━━━━━━━━━━━━━━━━",
    "**Alur lanjut:**",
    "1. `otnpc` — cek collection",
    "2. `otnpc recent` — cek hasil hunt terakhir",
    "3. `otteam add <npcId> slot 1` — pasang team",
    "4. `otb` — battle"
  ].filter(Boolean).join("\n");

  await replyOt(message, { embeds: [otoV144CleanEmbed({ description: desc, footer: "DESA TULUS • Hansip" })] });
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV144EnsureInventory(player);

  if (q === "recent") {
    const recent = player.lastHunt?.npcs || [];
    const lines = recent.length
      ? recent.map((n, i) => `${i+1}. ${otoV144RarityEmoji(n.rarity)} ${otoV144Face(n.rarity, i)} \`${n.id}\` — **${n.name}**${n.duplicate ? " • duplicate" : ""}`).join("\n")
      : "Belum ada hasil hunt terakhir. Gunakan `oth` dulu.";

    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: `🎴 Hasil Hunt Terakhir\n\n${lines}\n\nLanjut: \`otcard <npcId>\` • \`otteam add <npcId> slot 1\``,
      footer: "DESA TULUS • Hansip"
    })] });
  }

  const rarityKeys = ["common", "uncommon", "rare", "epic", "mythic", "secret"];
  if (rarityKeys.includes(q)) {
    const owned = Object.values(player.npcs || {}).filter(n => String(n.rarity || "common").toLowerCase() === q);
    const letter = otoV144RarityEmoji(q);
    const lines = owned.slice(0, 15).map((n, i) => `${i+1}. ${letter} ${otoV144Face(q, i)} \`${n.id}\` — **${n.name}** • Lv.${n.level || 1} • Power ${otoV144NpcPower(n).toLocaleString("id-ID")}${n.locked ? " • 🔒" : ""}`);

    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: `${letter} ${q.toUpperCase()} NPC Collection\n\n${lines.length ? lines.join("\n") : "Belum punya NPC di rarity ini."}\n\nLanjut: \`oth\` • \`otcard <npcId>\` • \`otteam add <npcId> slot 1\``,
      footer: "DESA TULUS • Hansip"
    })] });
  }

  return replyOt(message, { embeds: [otoV144CleanEmbed({
    description: otoV144NpcCollectionDescription(message.author.username, player),
    footer: "DESA TULUS • Hansip"
  })] });
}

async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV144EnsureInventory(player);

  const sub = String(args[0] || "view").toLowerCase();
  if (sub === "view") {
    const lines = [0,1,2].map(i => {
      const id = player.team[i] || "";
      const npc = id ? player.npcs[id] : null;
      return `Slot ${i+1}: ${npc ? `${otoV144RarityEmoji(npc.rarity)} ${otoV144Face(npc.rarity, i)} \`${npc.id}\` — **${npc.name}** • Power ${otoV144NpcPower(npc).toLocaleString("id-ID")}` : "Kosong"}`;
    });

    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: `⚔️ Hansip Team\n\n${lines.join("\n")}\n\nTeam Power: **${otoV144TeamPower(player).toLocaleString("id-ID")}**\n\nLanjut: \`otteam add <npcId> slot 1\` • \`otb\``,
      footer: "DESA TULUS • Hansip Team"
    })] });
  }

  if (sub === "add") {
    const slotIndex = args.findIndex(a => String(a).toLowerCase() === "slot");
    let slot = slotIndex >= 0 ? Number(args[slotIndex + 1]) : Number(args[args.length - 1]);
    if (!slot || slot < 1 || slot > 3) {
      return replyOt(message, { content: "⚠️ Format: `otteam add <npcId/nama> slot 1` sampai `slot 3`." });
    }
    const queryParts = slotIndex >= 0 ? args.slice(1, slotIndex) : args.slice(1, -1);
    const query = queryParts.join(" ");
    const npc = otoV144FindOwnedNpc(player, query);
    if (!npc) {
      return replyOt(message, { embeds: [otoV144CleanEmbed({
        description: `❌ NPC tidak ditemukan di collection kamu.\n\nCek dulu: \`otnpc\` atau \`otnpc recent\`.\nContoh: \`otteam add bang_jaga_sendal slot ${slot}\``,
        footer: "DESA TULUS • Hansip Team"
      })] });
    }

    if (player.team.includes(npc.id)) {
      return replyOt(message, { content: "⚠️ NPC itu sudah ada di team kamu." });
    }

    player.team[slot - 1] = npc.id;
    otoSavePlayer(message.author, player);

    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: `✅ ${otoV144RarityEmoji(npc.rarity)} ${otoV144Face(npc.rarity, slot-1)} **${npc.name}** masuk ke **slot ${slot}**.\n\nTeam Power sekarang: **${otoV144TeamPower(player).toLocaleString("id-ID")}**\n\nLanjut: \`otteam view\` • \`otb\``,
      footer: "DESA TULUS • Hansip Team"
    })] });
  }

  if (sub === "remove") {
    const slot = Number(args[1] || args[2] || 0);
    if (!slot || slot < 1 || slot > 3) return replyOt(message, { content: "⚠️ Format: `otteam remove 1` sampai `3`." });
    player.team[slot - 1] = "";
    otoSavePlayer(message.author, player);
    return replyOt(message, { content: `✅ Slot ${slot} dikosongkan.` });
  }

  return replyOt(message, { content: "⚠️ Command team: `otteam view` • `otteam add <npcId> slot 1` • `otteam remove 1`" });
}

async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV144EnsureInventory(player);

  const teamPower = otoV144TeamPower(player);
  if (teamPower <= 0) {
    return replyOt(message, { embeds: [otoV144CleanEmbed({
      description: "❌ Team kamu masih kosong.\n\nAlur yang benar:\n1. `oth` — cari NPC\n2. `otnpc` — cek NPC\n3. `otteam add <npcId> slot 1` — pasang team\n4. `otb` — battle",
      footer: "DESA TULUS • Hansip Battle"
    })] });
  }

  const luck = otoV144Luck(player);
  const enemy = Math.max(100, Math.floor(teamPower * (0.75 + Math.random() * 0.75)));
  const chance = Math.max(10, Math.min(90, Math.round((teamPower + luck * 10) / Math.max(1, teamPower + enemy) * 100)));
  const win = Math.random() * 100 < chance;
  const coin = win ? 120 + Math.floor(Math.random() * 220) : 30 + Math.floor(Math.random() * 60);
  const xp = win ? 40 + Math.floor(Math.random() * 80) : 15 + Math.floor(Math.random() * 35);

  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  player.stats = player.stats || {};
  if (win) player.stats.battleWin = Number(player.stats.battleWin || 0) + 1;
  else player.stats.battleLose = Number(player.stats.battleLose || 0) + 1;
  otoSavePlayer(message.author, player);

  const teamLines = player.team.map((id, i) => {
    const npc = id ? player.npcs[id] : null;
    return npc ? `${i+1}. ${otoV144RarityEmoji(npc.rarity)} ${otoV144Face(npc.rarity, i)} **${npc.name}**` : `${i+1}. Kosong`;
  }).join("\n");

  const desc = [
    `⚔️ Hansip Battle — ${win ? "MENANG" : "KALAH"}`,
    "",
    "**Team Kamu**",
    teamLines,
    "",
    `Power Team: **${teamPower.toLocaleString("id-ID")}**`,
    `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
    `${OTO_FLOW_EMOJI_V144.luck}Luck: ${luck} • ${otoV144LuckTier(luck)}`,
    `Chance: **${chance}%**`,
    "",
    win ? `💎 Kamu menang dan mendapat **${coin} Hansip Coin** + **${xp} XP**!` : `💨 Kamu kalah, tapi tetap mendapat **${coin} Hansip Coin** + **${xp} XP**.`,
    "",
    "Lanjut: `otprofile` • `otinv` • `oth` • `ottop`"
  ].join("\n");

  return replyOt(message, { embeds: [otoV144CleanEmbed({ description: desc, color: win ? "#0B5CFF" : "#FF4D6D", footer: "DESA TULUS • Hansip Battle" })] });
}

async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV144EnsureInventory(player);

  const counts = otoV144RarityCounts(player);
  const points = otoV144Points(counts);
  const level = otoV144Level(player);
  const luck = otoV144Luck(player);
  const teamPower = otoV144TeamPower(player);

  const desc = [
    `${OTO_FLOW_EMOJI_V144.title} **${message.author.username}'s Hansip Profile**`,
    "",
    `Level: **${level}**`,
    `XP: **${Number(player.exp || 0).toLocaleString("id-ID")}**`,
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    `${OTO_FLOW_EMOJI_V144.luck}Luck: ${luck} • ${otoV144LuckTier(luck)}`,
    "",
    `NPC Points: **${points.toLocaleString("id-ID")}**`,
    `NPC: **${Object.keys(player.npcs || {}).length}**`,
    `Team Power: **${teamPower.toLocaleString("id-ID")}**`,
    `Battle: **${Number(player.stats?.battleWin || 0)}W / ${Number(player.stats?.battleLose || 0)}L**`,
    "",
    "Alur main:",
    "1. `oth` → cari NPC",
    "2. `otnpc` → cek collection",
    "3. `otteam add <npcId> slot 1` → pasang team",
    "4. `otb` → battle"
  ].join("\n");

  return replyOt(message, { embeds: [otoV144CleanEmbed({ description: desc, footer: "DESA TULUS • Hansip Profile" })] });
}

async function otoCmdLuck(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const level = otoV144Level(player);
  const luck = otoV144Luck(player);
  return replyOt(message, { embeds: [otoV144CleanEmbed({
    description: `${OTO_FLOW_EMOJI_V144.luck}Luck kamu: ${luck} • ${otoV144LuckTier(luck)}\n\nLevel kamu: **${level}**\nSemakin tinggi level, peluang angka luck besar makin naik.\n\nLanjut: \`oth\` • \`otb\` • \`otprofile\``,
    footer: "DESA TULUS • Hansip Luck"
  })] });
}


/* =========================
   Hansip FIXED 5 NPC PER RARITY FLOW v1.45.0
   - Tiap rarity tepat 5 NPC.
   - Setiap NPC punya emoji dan nama berbeda.
   - otnpc menampilkan 5 slot per rarity dengan count superscript.
   - oth hanya memilih dari katalog fixed ini, lalu langsung masuk collection.
   - Alur dibuat jelas: oth -> otnpc -> otnpc recent -> otteam add -> otb.
   - Tetap tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_V145 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  letter: {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>"
  },
  luck: "<a:clover:1513671524949823639>",
  unknown: ":grey_question:"
};

const OTO_NPC_CATALOG_V145 = {
  common: [
    { id:"bang_jaga_sendal", emoji:"🙂", name:"Bang Jaga Sendal", rarity:"common", element:"Tulus", power:120 },
    { id:"warga_senyum_tipis", emoji:"🙃", name:"Warga Senyum Tipis", rarity:"common", element:"Tulus", power:130 },
    { id:"tukang_delay_battle", emoji:"😄", name:"Tukang Delay Battle", rarity:"common", element:"Tulus", power:135 },
    { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 },
    { id:"admin_lupa_kopi", emoji:"😅", name:"Admin Lupa Kopi", rarity:"common", element:"Tulus", power:145 }
  ],
  uncommon: [
    { id:"admin_ngopi", emoji:"😎", name:"Admin Ngopi", rarity:"uncommon", element:"Warung", power:230 },
    { id:"kurir_oto", emoji:"🧢", name:"Kurir Hansip", rarity:"uncommon", element:"Tulus", power:240 },
    { id:"chef_mie_tulus", emoji:"🧑‍🍳", name:"Chef Mie Tulus", rarity:"uncommon", element:"Warung", power:250 },
    { id:"tukang_event", emoji:"👱", name:"Tukang Event", rarity:"uncommon", element:"Event", power:260 },
    { id:"penjaga_panel", emoji:"🧑", name:"Penjaga Panel", rarity:"uncommon", element:"Tulus", power:270 }
  ],
  rare: [
    { id:"pak_rw_bluetooth", emoji:"🤓", name:"Pak RW Bluetooth", rarity:"rare", element:"Cyber", power:520 },
    { id:"staff_setengah_serius", emoji:"🕵️", name:"Staff Setengah Serius", rarity:"rare", element:"Tulus", power:545 },
    { id:"tukang_inspect_gear", emoji:"🧑‍🔧", name:"Tukang Inspect Gear", rarity:"rare", element:"Gear", power:570 },
    { id:"dukun_drop_rate", emoji:"🧑‍🎨", name:"Dukun Drop Rate", rarity:"rare", element:"Luck", power:595 },
    { id:"kurir_dimensi_biru", emoji:"🧑‍💻", name:"Kurir Dimensi Biru", rarity:"rare", element:"Blue Core", power:620 }
  ],
  epic: [
    { id:"moderator_senyum_tipis", emoji:"🥸", name:"Moderator Senyum Tipis", rarity:"epic", element:"Tulus", power:880 },
    { id:"penjaga_portal_afk", emoji:"🧙", name:"Penjaga Portal AFK", rarity:"epic", element:"AFK", power:920 },
    { id:"guard_ot_core", emoji:"🦸", name:"Guard OT Core", rarity:"epic", element:"Blue Core", power:960 },
    { id:"staff_mode_silent", emoji:"🥷", name:"Staff Mode Silent", rarity:"epic", element:"Shadow", power:1000 },
    { id:"captain_arena_ot", emoji:"🧑‍🚀", name:"Captain Arena OT", rarity:"epic", element:"Battle", power:1040 }
  ],
  mythic: [
    { id:"bekiw_mode_royale", emoji:"🤠", name:"Bekiw Mode Royale", rarity:"mythic", element:"Royal", power:1500 },
    { id:"guardian_DESA TULUS", emoji:"👑", name:"Guardian DESA TULUS", rarity:"mythic", element:"Tulus", power:1580 },
    { id:"raja_hoki_biru", emoji:"🧛", name:"Raja Hoki Biru", rarity:"mythic", element:"Luck", power:1660 },
    { id:"neon_emperor_ot", emoji:"🧞", name:"Neon Emperor OT", rarity:"mythic", element:"Neon", power:1740 },
    { id:"core_guardian_tulus", emoji:"🧝", name:"Core Guardian Tulus", rarity:"mythic", element:"Core", power:1820 }
  ],
  secret: [
    { id:"oto_secret_king", emoji:"🧙‍♂️", name:"Hansip Secret King", rarity:"secret", element:"Secret", power:2500 },
    { id:"entity_00e5ff", emoji:"🕴️", name:"Entity 00E5FF", rarity:"secret", element:"Blue Flame", power:2650 },
    { id:"npc_anti_reset", emoji:"🧟", name:"NPC Anti Reset", rarity:"secret", element:"Anti Reset", power:2800 },
    { id:"shadow_bekiw_core", emoji:"🥷", name:"Shadow Bekiw Core", rarity:"secret", element:"Shadow", power:2950 },
    { id:"the_silent_moderator", emoji:"👤", name:"The Silent Moderator", rarity:"secret", element:"Silent", power:3100 }
  ]
};

function otoV145AllNpcs() {
  return Object.values(OTO_NPC_CATALOG_V145).flat();
}

function otoV145NpcById(id) {
  const q = String(id || "").toLowerCase();
  return otoV145AllNpcs().find(n => n.id === q || n.name.toLowerCase() === q || n.name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") === q) || null;
}

function otoV145Sup(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoV145LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV145Level(player) {
  try { return typeof otoLevel === "function" ? otoLevel(Number(player?.exp || 0)) : Math.max(1, Number(player?.level || 1)); }
  catch (_) { return Math.max(1, Number(player?.level || 1)); }
}

function otoV145Luck(player) {
  const level = otoV145Level(player);
  return Math.max(1, Math.min(100, 8 + level * 2 + Math.floor(Math.random() * 15)));
}

function otoV145Ensure(player) {
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 3) : [];
  while (player.team.length < 3) player.team.push("");
  player.stats = player.stats || {};
}

function otoV145OwnedCount(player, id) {
  const n = player?.npcs?.[id];
  if (!n) return 0;
  return 1 + Number(n.duplicates || 0);
}

function otoV145RarityCounts(player) {
  const out = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const [rarity, list] of Object.entries(OTO_NPC_CATALOG_V145)) {
    out[rarity] = list.reduce((sum, npc) => sum + (player?.npcs?.[npc.id] ? 1 : 0), 0);
  }
  return out;
}

function otoV145Points(player) {
  const c = otoV145RarityCounts(player);
  return c.common * 1 + c.uncommon * 3 + c.rare * 10 + c.epic * 25 + c.mythic * 75 + c.secret * 250;
}

function otoV145Row(rarity, player) {
  const list = OTO_NPC_CATALOG_V145[rarity] || [];
  const letter = OTO_V145.letter[rarity] || OTO_V145.letter.common;
  const cells = list.map(npc => {
    const count = otoV145OwnedCount(player, npc.id);
    const emoji = count > 0 ? npc.emoji : OTO_V145.unknown;
    return `${emoji}${otoV145Sup(count)}`;
  });
  return `${letter} : ${cells.join(" ")}`;
}

function otoV145CollectionDesc(username, player) {
  const c = otoV145RarityCounts(player);
  const luck = otoV145Luck(player);
  return [
    `${OTO_V145.title} ${username}'s Hansip NPC Collection!`,
    "",
    otoV145Row("common", player),
    otoV145Row("uncommon", player),
    otoV145Row("rare", player),
    otoV145Row("epic", player),
    otoV145Row("mythic", player),
    otoV145Row("secret", player),
    "",
    `NPC Points: ${otoV145Points(player).toLocaleString("id-ID")}`,
    `M-${c.mythic}, E-${c.epic}, R-${c.rare}, U-${c.uncommon}, C-${c.common}, S-${c.secret}`,
    "",
    `${OTO_V145.luck}Luck: ${luck} • ${otoV145LuckTier(luck)}`,
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
}

function otoV145Embed(desc, footer = "DESA TULUS • Hansip", color = null) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(desc)
    .setFooter({ text: footer });
  try { embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoV145PickNpc() {
  const roll = Math.random();
  let rarity = "common";
  if (roll < 0.60) rarity = "common";
  else if (roll < 0.80) rarity = "uncommon";
  else if (roll < 0.93) rarity = "rare";
  else if (roll < 0.985) rarity = "epic";
  else if (roll < 0.998) rarity = "mythic";
  else rarity = "secret";
  const list = OTO_NPC_CATALOG_V145[rarity];
  return list[Math.floor(Math.random() * list.length)];
}

function otoV145AddNpc(player, npc) {
  otoV145Ensure(player);
  if (player.npcs[npc.id]) {
    const fragId = `${npc.rarity}_fragment`;
    const fragQty = 1 + Math.max(0, ["common","uncommon","rare","epic","mythic","secret"].indexOf(npc.rarity));
    const dustQty = 3 + fragQty * 2;
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + fragQty;
    player.dust = Number(player.dust || 0) + dustQty;
    return { duplicate:true, fragQty, dustQty };
  }
  player.npcs[npc.id] = {
    id: npc.id,
    name: npc.name,
    emoji: npc.emoji,
    rarity: npc.rarity,
    element: npc.element,
    power: npc.power,
    level: 1,
    exp: 0,
    locked: false,
    weapon: "",
    variant: "normal",
    duplicates: 0,
    obtainedAt: new Date().toISOString()
  };
  return { duplicate:false, fragQty:0, dustQty:0 };
}

function otoV145NpcPower(npc) {
  return Number(npc?.power || 100) + Number(npc?.level || 1) * 25;
}

function otoV145FindOwned(player, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return Object.values(player.npcs || {}).find(n =>
    n.id === q ||
    String(n.name || "").toLowerCase() === q ||
    String(n.name || "").toLowerCase().includes(q) ||
    String(n.emoji || "") === query
  ) || null;
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV145Ensure(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) return replyOt(message, { embeds: [otoV145Embed(`❌ Coin kamu kurang.\n\nHunt butuh **${cost} Hansip Coin**.\n\nAlur: \`otkerja\` → \`oth\` → \`otnpc\``)] });

  player.coin = Number(player.coin || 0) - cost;

  const count = 1 + Math.floor(Math.random() * 3);
  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [];
  const recent = [];

  for (let i = 0; i < count; i++) {
    const npc = otoV145PickNpc();
    const add = otoV145AddNpc(player, npc);
    const xpGain = { common:4, uncommon:8, rare:14, epic:28, mythic:65, secret:140 }[npc.rarity] + Math.floor(Math.random()*8);
    xp += xpGain;
    found.push(`${OTO_V145.letter[npc.rarity]} ${npc.emoji} **${npc.name}**`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji, rarity:npc.rarity, duplicate:add.duplicate });
    if (add.duplicate) { dup++; frag += add.fragQty; dust += add.dustQty; }
  }

  player.exp = Number(player.exp || 0) + xp;
  player.level = otoV145Level(player);
  player.lastHunt = { at:Date.now(), npcs:recent, xp, count, duplicate:dup, fragment:frag, dust };
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;
  otoSavePlayer(message.author, player);

  const desc = [
    `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!`,
    `▫️ | ${recent.map(n=>n.emoji).join(" ")} mendapat **${xp} XP**!`,
    `🎴 | ${found.join(" • ")}`,
    dup ? `🔁 | ${dup} duplicate berubah jadi ${OTO_V145.letter.rare} **${frag} Fragment** dan 🎴 **${dust} Dust**!` : "",
    `${OTO_V145.luck}Luck: ${otoV145Luck(player)} • ${otoV145LuckTier(otoV145Luck(player))}`,
    "",
    "✅ NPC sudah tersimpan ke collection.",
    "━━━━━━━━━━━━━━━━━━━━",
    "**Alur lanjut jelas:**",
    "1. `otnpc` — lihat semua 5 slot per rarity",
    "2. `otnpc recent` — lihat hasil hunt terakhir + npcId",
    "3. `otteam add <npcId> slot 1` — pasang ke team",
    "4. `otb` — battle"
  ].filter(Boolean).join("\n");

  return replyOt(message, { embeds: [otoV145Embed(desc)] });
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV145Ensure(player);

  const rarityKeys = ["common","uncommon","rare","epic","mythic","secret"];

  if (q === "recent") {
    const recent = player.lastHunt?.npcs || [];
    const lines = recent.length
      ? recent.map((n,i)=>`${i+1}. ${OTO_V145.letter[n.rarity]} ${n.emoji} \`${n.id}\` — **${n.name}**${n.duplicate ? " • duplicate" : ""}`).join("\n")
      : "Belum ada hunt terakhir. Jalankan `oth` dulu.";
    return replyOt(message, { embeds: [otoV145Embed(`🎴 Hasil Hunt Terakhir\n\n${lines}\n\nAlur: \`otteam add <npcId> slot 1\` → \`otteam view\` → \`otb\``)] });
  }

  if (rarityKeys.includes(q)) {
    const list = OTO_NPC_CATALOG_V145[q];
    const lines = list.map((npc, i) => {
      const owned = player.npcs[npc.id];
      const count = otoV145OwnedCount(player, npc.id);
      return `${i+1}. ${OTO_V145.letter[q]} ${count ? npc.emoji : OTO_V145.unknown}${otoV145Sup(count)} \`${npc.id}\` — **${npc.name}**${owned ? ` • Lv.${owned.level || 1} • Power ${otoV145NpcPower(owned).toLocaleString("id-ID")}` : " • Belum punya"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV145Embed(`${OTO_V145.letter[q]} ${q.toUpperCase()} NPC List — 5 Slot\n\n${lines}\n\nAlur: \`oth\` → \`otnpc recent\` → \`otteam add <npcId> slot 1\``)] });
  }

  return replyOt(message, { embeds: [otoV145Embed(otoV145CollectionDesc(message.author.username, player))] });
}

async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV145Ensure(player);

  const sub = String(args[0] || "view").toLowerCase();
  if (sub === "view") {
    const lines = [0,1,2].map(i => {
      const id = player.team[i] || "";
      const npc = id ? player.npcs[id] : null;
      return `Slot ${i+1}: ${npc ? `${OTO_V145.letter[npc.rarity]} ${npc.emoji} \`${npc.id}\` — **${npc.name}** • Power ${otoV145NpcPower(npc).toLocaleString("id-ID")}` : "Kosong"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV145Embed(`⚔️ Hansip Team\n\n${lines}\n\nAlur: \`otteam add <npcId> slot 1\` → \`otb\``)] });
  }

  if (sub === "add") {
    const slotIndex = args.findIndex(x => String(x).toLowerCase() === "slot");
    const slot = slotIndex >= 0 ? Number(args[slotIndex+1]) : Number(args[args.length-1]);
    const query = (slotIndex >= 0 ? args.slice(1, slotIndex) : args.slice(1, -1)).join(" ");
    if (!slot || slot < 1 || slot > 3) return replyOt(message, { content: "⚠️ Format jelas: `otteam add <npcId> slot 1` sampai `slot 3`." });

    const npc = otoV145FindOwned(player, query);
    if (!npc) return replyOt(message, { embeds: [otoV145Embed(`❌ NPC tidak ditemukan.\n\nCek ID dulu:\n1. \`otnpc recent\`\n2. \`otnpc common\`\n3. Baru pakai \`otteam add <npcId> slot ${slot}\``)] });

    if (player.team.includes(npc.id)) return replyOt(message, { content: "⚠️ NPC itu sudah ada di team." });
    player.team[slot-1] = npc.id;
    otoSavePlayer(message.author, player);
    return replyOt(message, { embeds: [otoV145Embed(`✅ ${OTO_V145.letter[npc.rarity]} ${npc.emoji} **${npc.name}** masuk ke **slot ${slot}**.\n\nAlur lanjut: \`otteam view\` → \`otb\``)] });
  }

  return replyOt(message, { content: "⚠️ Team: `otteam view` • `otteam add <npcId> slot 1` • `otteam remove 1`" });
}

async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV145Ensure(player);

  const teamNpcs = player.team.map(id => player.npcs[id]).filter(Boolean);
  if (!teamNpcs.length) {
    return replyOt(message, { embeds: [otoV145Embed("❌ Team kamu masih kosong.\n\n**Alur yang benar:**\n1. `oth` — dapat NPC\n2. `otnpc recent` — ambil npcId\n3. `otteam add <npcId> slot 1` — pasang team\n4. `otb` — battle")] });
  }

  const power = teamNpcs.reduce((sum,n)=>sum+otoV145NpcPower(n),0);
  const luck = otoV145Luck(player);
  const enemy = Math.max(100, Math.floor(power * (0.75 + Math.random()*0.75)));
  const chance = Math.max(10, Math.min(90, Math.round((power + luck*10) / Math.max(1, power+enemy) * 100)));
  const win = Math.random()*100 < chance;
  const coin = win ? 140+Math.floor(Math.random()*180) : 35+Math.floor(Math.random()*60);
  const xp = win ? 45+Math.floor(Math.random()*70) : 15+Math.floor(Math.random()*35);

  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  player.stats.battleWin = Number(player.stats.battleWin || 0) + (win ? 1 : 0);
  player.stats.battleLose = Number(player.stats.battleLose || 0) + (win ? 0 : 1);
  otoSavePlayer(message.author, player);

  const teamLines = teamNpcs.map((n,i)=>`${i+1}. ${OTO_V145.letter[n.rarity]} ${n.emoji} **${n.name}**`).join("\n");
  const desc = [
    `⚔️ Hansip Battle — ${win ? "MENANG" : "KALAH"}`,
    "",
    teamLines,
    "",
    `Power Team: **${power.toLocaleString("id-ID")}**`,
    `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
    `${OTO_V145.luck}Luck: ${luck} • ${otoV145LuckTier(luck)}`,
    `Chance: **${chance}%**`,
    "",
    win ? `💎 Menang! Reward **${coin} Hansip Coin** + **${xp} XP**.` : `💨 Kalah, tapi tetap dapat **${coin} Hansip Coin** + **${xp} XP**.`,
    "",
    "Alur lanjut: `otprofile` • `oth` • `ottop`"
  ].join("\n");

  return replyOt(message, { embeds: [otoV145Embed(desc, "DESA TULUS • Hansip Battle", win ? "#0B5CFF" : "#FF4D6D")] });
}


/* =========================
   GLOBAL FOOTER DESA TULUS EMOJI SYNC v1.46.0
   - Semua embed/footer wajib diawali:
     DESA TULUS •
   - Helper ini dipakai sebagai standar footer baru.
   - Tetap tanpa image/gambar/Canvas/AttachmentBuilder/setImage untuk Hansip.
========================= */

const OT_GLOBAL_FOOTER_EMOJI_V146 = "<a:Desa_Tulus:1516424353934348299>";
const OT_GLOBAL_FOOTER_PREFIX_V146 = "DESA TULUS •";

function otFooterV146(suffix = "") {
  const clean = String(suffix || "").trim();
  if (!clean) return OT_GLOBAL_FOOTER_PREFIX_V146;
  if (clean.startsWith(OT_GLOBAL_FOOTER_PREFIX_V146)) return clean;
  if (clean.startsWith("DESA TULUS •")) return `${OT_GLOBAL_FOOTER_EMOJI_V146} ${clean}`;
  return `${OT_GLOBAL_FOOTER_PREFIX_V146} ${clean}`;
}

function otApplyFooterV146(embed, suffix = "Hansip") {
  try {
    if (embed && typeof embed.setFooter === "function") {
      embed.setFooter({ text: otFooterV146(suffix) });
    }
  } catch (_) {}
  return embed;
}


/* =========================
   VISUAL FOOTER EMOJI RENDER FIX v1.47.0
   Penting:
   - Discord tidak merender custom/animated emoji di footer asli embed.
   - Karena itu emoji <a:Desa_Tulus:1516424353934348299> dipasang sebagai baris terakhir description.
   - Footer asli tetap plain text agar tidak muncul mentah.
========================= */

const OT_VISUAL_FOOTER_EMOJI_V147 = "<a:Desa_Tulus:1516424353934348299>";
const OT_VISUAL_FOOTER_PREFIX_V147 = "<a:Desa_Tulus:1516424353934348299> DESA TULUS •";

function otPlainFooterV147(suffix = "Hansip") {
  const clean = String(suffix || "").trim();
  if (!clean) return "DESA TULUS";
  if (clean.startsWith("DESA TULUS •")) return clean;
  return `DESA TULUS • ${clean}`;
}

function otVisualFooterLineV147(suffix = "Hansip") {
  const clean = String(suffix || "").trim();
  if (!clean) return OT_VISUAL_FOOTER_PREFIX_V147;
  if (clean.startsWith(OT_VISUAL_FOOTER_PREFIX_V147)) return clean;
  if (clean.startsWith("DESA TULUS •")) return `${OT_VISUAL_FOOTER_EMOJI_V147} ${clean}`;
  return `${OT_VISUAL_FOOTER_PREFIX_V147} ${clean}`;
}

function otAppendVisualFooterV147(description = "", suffix = "Hansip") {
  const desc = String(description || "").trimEnd();
  const line = otVisualFooterLineV147(suffix);
  if (desc.includes(line)) return desc;
  return `${desc}\n\n${line}`;
}

function otApplyVisualFooterV147(embed, suffix = "Hansip") {
  try {
    const data = embed?.data || {};
    const oldDesc = data.description || "";
    if (typeof embed.setDescription === "function") {
      embed.setDescription(otAppendVisualFooterV147(oldDesc, suffix));
    }
    if (typeof embed.setFooter === "function") {
      embed.setFooter({ text: otPlainFooterV147(suffix) });
    }
  } catch (_) {}
  return embed;
}

function otoV147Embed(description = "", suffix = "Hansip", color = null) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otAppendVisualFooterV147(description, suffix))
    .setFooter({ text: otPlainFooterV147(suffix) });
  try { embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

// Override common clean embed helpers so Hansip embeds get rendered emoji line.
if (typeof otoV145Embed === "function") {
  const otoV145EmbedOld = otoV145Embed;
  otoV145Embed = function(desc, footer = "DESA TULUS • Hansip", color = null) {
    const suffix = String(footer || "Hansip").replace(/^DESA TULUS\s*•\s*/i, "").trim() || "Hansip";
    return otoV147Embed(desc, suffix, color);
  };
}

if (typeof otoV144CleanEmbed === "function") {
  const otoV144CleanEmbedOld = otoV144CleanEmbed;
  otoV144CleanEmbed = function({ description = "", title = "", color = null, footer = "" } = {}) {
    const suffix = String(footer || "Hansip").replace(/^DESA TULUS\s*•\s*/i, "").trim() || "Hansip";
    const embed = otoV147Embed(description, suffix, color);
    if (title) embed.setTitle(title);
    return embed;
  };
}


/* =========================
   SINGLE VISUAL FOOTER / NO DOUBLE FOOTER v1.48.0
   Fix:
   - Tampilkan <a:Desa_Tulus:1516424353934348299> DESA TULUS • ... hanya 1x.
   - Baris visual footer ada di description.
   - Footer asli embed dikosongkan/dihapus supaya tidak muncul dobel.
========================= */

const OT_SINGLE_VISUAL_FOOTER_EMOJI_V148 = "<a:Desa_Tulus:1516424353934348299>";
const OT_SINGLE_VISUAL_FOOTER_PREFIX_V148 = "<a:Desa_Tulus:1516424353934348299> DESA TULUS •";

function otSuffixFromFooterV148(footer = "Hansip") {
  const clean = String(footer || "Hansip")
    .replace(/<a:Desa_Tulus:1516424353934348299>\s*/g, "")
    .replace(/^DESA TULUS\s*•\s*/i, "")
    .trim();
  return clean || "Hansip";
}

function otVisualFooterLineV148(suffix = "Hansip") {
  const clean = otSuffixFromFooterV148(suffix);
  return `${OT_SINGLE_VISUAL_FOOTER_PREFIX_V148} ${clean}`;
}

function otRemoveRealFooterV148(embed) {
  try {
    if (embed && typeof embed.clearFooter === "function") embed.clearFooter();
    else if (embed && embed.data) delete embed.data.footer;
  } catch (_) {}
  return embed;
}

function otAppendSingleVisualFooterV148(description = "", suffix = "Hansip") {
  let desc = String(description || "").trimEnd();

  // Remove old visual footer lines to prevent duplicates.
  desc = desc
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•\s*Hansip[^\n]*/g, "")
    .trimEnd();

  return `${desc}\n\n${otVisualFooterLineV148(suffix)}`;
}

function otApplySingleVisualFooterV148(embed, suffix = "Hansip") {
  try {
    const oldDesc = embed?.data?.description || "";
    if (typeof embed.setDescription === "function") embed.setDescription(otAppendSingleVisualFooterV148(oldDesc, suffix));
    otRemoveRealFooterV148(embed);
  } catch (_) {}
  return embed;
}

function otoV148Embed(description = "", suffix = "Hansip", color = null) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otAppendSingleVisualFooterV148(description, suffix));
  otRemoveRealFooterV148(embed);
  try { embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

// Override Hansip embed helpers from previous versions.
if (typeof otoV145Embed === "function") {
  otoV145Embed = function(desc, footer = "Hansip", color = null) {
    return otoV148Embed(desc, otSuffixFromFooterV148(footer), color);
  };
}

if (typeof otoV144CleanEmbed === "function") {
  otoV144CleanEmbed = function({ description = "", title = "", color = null, footer = "" } = {}) {
    const embed = otoV148Embed(description, otSuffixFromFooterV148(footer || "Hansip"), color);
    if (title) embed.setTitle(title);
    return embed;
  };
}

if (typeof otoV147Embed === "function") {
  otoV147Embed = function(description = "", suffix = "Hansip", color = null) {
    return otoV148Embed(description, suffix, color);
  };
}

if (typeof otoBaseEmbed === "function") {
  const otoBaseEmbedOldV148 = otoBaseEmbed;
  otoBaseEmbed = function(title, description, color) {
    const embed = otoBaseEmbedOldV148(title, description, color);
    return otApplySingleVisualFooterV148(embed, "Hansip");
  };
}


/* =========================
   GLOBAL VISUAL FOOTER ALL FEATURES v1.49.0
   Target:
   - Semua embed di Hansip punya 1 baris visual footer:
     <a:Desa_Tulus:1516424353934348299> DESA TULUS • <suffix>
   - Custom emoji render karena ada di description, bukan footer asli.
   - Footer asli embed dihapus agar tidak dobel.
   - Berlaku untuk Hansip, AFK, Mabar, Sambung Kata, Anti-Scam, Dashboard/Panel, dan fitur embed lain.
========================= */

const OT_GLOBAL_VISUAL_FOOTER_EMOJI_V149 = "<a:Desa_Tulus:1516424353934348299>";
const OT_GLOBAL_VISUAL_FOOTER_PREFIX_V149 = "<a:Desa_Tulus:1516424353934348299> DESA TULUS •";

function otFooterSuffixV149(input = "Hansip") {
  let text = "";
  if (typeof input === "string") text = input;
  else if (input && typeof input === "object") text = input.text || "";
  text = String(text || "Hansip")
    .replace(/<a:Desa_Tulus:1516424353934348299>\s*/g, "")
    .replace(/^DESA TULUS\s*•\s*/i, "")
    .trim();
  return text || "Hansip";
}

function otVisualFooterLineV149(input = "Hansip") {
  return `${OT_GLOBAL_VISUAL_FOOTER_PREFIX_V149} ${otFooterSuffixV149(input)}`;
}

function otStripFooterLinesV149(description = "") {
  return String(description || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
}

function otAppendVisualFooterV149(description = "", suffix = "Hansip") {
  const clean = otStripFooterLinesV149(description);
  return `${clean}\n\n${otVisualFooterLineV149(suffix)}`;
}

function otRemoveRealFooterV149(embed) {
  try {
    if (embed && typeof embed.clearFooter === "function") embed.clearFooter();
    else if (embed && embed.data) delete embed.data.footer;
  } catch (_) {}
  return embed;
}

function otApplyGlobalVisualFooterV149(embed, suffix = "Hansip") {
  try {
    if (!embed) return embed;
    const oldDesc = embed?.data?.description || "";
    if (typeof embed.setDescription === "function") {
      embed.setDescription(otAppendVisualFooterV149(oldDesc, suffix));
    }
    otRemoveRealFooterV149(embed);
  } catch (_) {}
  return embed;
}

// Monkey patch EmbedBuilder so every future .setFooter() becomes visual footer in description.
try {
  if (typeof EmbedBuilder !== "undefined" && EmbedBuilder.prototype && !EmbedBuilder.prototype.__otGlobalVisualFooterV149) {
    const oldSetFooter = EmbedBuilder.prototype.setFooter;
    const oldSetDescription = EmbedBuilder.prototype.setDescription;
    const oldToJSON = EmbedBuilder.prototype.toJSON;

    EmbedBuilder.prototype.setFooter = function(options) {
      const suffix = otFooterSuffixV149(options);
      const currentDesc = this?.data?.description || "";
      if (oldSetDescription) oldSetDescription.call(this, otAppendVisualFooterV149(currentDesc, suffix));
      if (typeof this.clearFooter === "function") this.clearFooter();
      else if (this.data) delete this.data.footer;
      return this;
    };

    EmbedBuilder.prototype.setDescription = function(description) {
      const currentFooterText = this?.data?.footer?.text || "";
      const suffix = currentFooterText ? otFooterSuffixV149(currentFooterText) : null;
      const cleanDesc = suffix ? otAppendVisualFooterV149(description, suffix) : String(description || "");
      return oldSetDescription.call(this, cleanDesc);
    };

    EmbedBuilder.prototype.toJSON = function(...args) {
      const data = oldToJSON ? oldToJSON.apply(this, args) : (this.data || {});
      if (data && data.footer && data.footer.text) {
        data.description = otAppendVisualFooterV149(data.description || "", data.footer.text);
        delete data.footer;
      }
      return data;
    };

    EmbedBuilder.prototype.__otGlobalVisualFooterV149 = true;
  }
} catch (err) {
  console.error("Global visual footer patch gagal:", err);
}

// Override common helpers from previous updates so old features also use the one-line visual footer.
if (typeof otoV145Embed === "function") {
  otoV145Embed = function(desc, footer = "Hansip", color = null) {
    return new EmbedBuilder()
      .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setDescription(otAppendVisualFooterV149(desc, footer));
  };
}

if (typeof otoV148Embed === "function") {
  otoV148Embed = function(description = "", suffix = "Hansip", color = null) {
    return new EmbedBuilder()
      .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
      .setDescription(otAppendVisualFooterV149(description, suffix));
  };
}

if (typeof gameBaseEmbed === "function") {
  const gameBaseEmbedOldV149 = gameBaseEmbed;
  gameBaseEmbed = function(title, description, color) {
    const embed = gameBaseEmbedOldV149(title, description, color);
    return otApplyGlobalVisualFooterV149(embed, "Hansip");
  };
}


/* =========================
   Hansip UNIFIED LUCK FLOW v1.50.0
   Tujuan:
   - Luck tidak beda-beda antar embed.
   - `otluck` roll satu angka random, lalu disimpan ke player.currentLuck.
   - Semua embed memakai angka luck tersimpan yang sama.
   - Level tinggi memperbesar peluang angka luck tinggi.
   - Display: <a:clover:1513671524949823639>Luck: 24 • Normal
     BUKAN 24.
========================= */

const OTO_LUCK_EMOJI_V150 = "<a:clover:1513671524949823639>";

function otoV150Level(player) {
  try {
    if (typeof otoLevel === "function") return otoLevel(Number(player?.exp || 0));
  } catch (_) {}
  return Math.max(1, Number(player?.level || 1));
}

function otoV150LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV150RollLuckByLevel(level = 1) {
  const lv = Math.max(1, Number(level || 1));
  const min = Number(config.otoLuckMin || 1);
  const max = Number(config.otoLuckMax || 100);
  const base = Number(config.otoLuckBase || 8);
  const levelMul = Number(config.otoLuckLevelMultiplier || 2);
  const randomRange = Number(config.otoLuckRandomRange || 20);
  const bonusEvery = Number(config.otoLuckHighLevelBonusEvery || 10);
  const bonusValue = Number(config.otoLuckHighLevelBonus || 5);

  const levelBonus = Math.floor(lv / Math.max(1, bonusEvery)) * bonusValue;
  const floor = Math.min(max, base + lv * levelMul + levelBonus);
  const random = Math.floor(Math.random() * (randomRange + 1));
  return Math.max(min, Math.min(max, floor + random));
}

function otoV150EnsureLuck(player, force = false) {
  if (!player) return { luck: 1, tier: "Normal", level: 1 };
  const level = otoV150Level(player);
  const now = Date.now();
  const cacheMs = Math.max(1, Number(config.otoLuckCacheMinutes || 30)) * 60 * 1000;

  if (!force && player.currentLuck && Number(player.currentLuck.value || 0) > 0 && (now - Number(player.currentLuck.rolledAt || 0)) < cacheMs) {
    return {
      luck: Number(player.currentLuck.value),
      tier: player.currentLuck.tier || otoV150LuckTier(player.currentLuck.value),
      level: Number(player.currentLuck.level || level),
      expiresAt: Number(player.currentLuck.expiresAt || (Number(player.currentLuck.rolledAt || now) + cacheMs))
    };
  }

  const luck = otoV150RollLuckByLevel(level);
  const tier = otoV150LuckTier(luck);
  player.currentLuck = {
    value: luck,
    tier,
    level,
    rolledAt: now,
    expiresAt: now + cacheMs
  };

  return { luck, tier, level, expiresAt: now + cacheMs };
}

function otoV150LuckText(player, force = false) {
  const state = otoV150EnsureLuck(player, force);
  return {
    luck: state.luck,
    tier: state.tier,
    line: `${OTO_LUCK_EMOJI_V150}Luck: ${state.luck} • ${state.tier}`,
    level: state.level
  };
}

// Override old luck helpers so they all return the same stored value.
function otoV145Luck(player) {
  return otoV150EnsureLuck(player, false).luck;
}

function otoV144Luck(player) {
  return otoV150EnsureLuck(player, false).luck;
}

function otoV142LuckByLevel(level = 1) {
  return otoV150RollLuckByLevel(level);
}

function otoV136LuckText(levelOrPlayer = 1) {
  if (typeof levelOrPlayer === "object") return otoV150LuckText(levelOrPlayer, false);
  const luck = otoV150RollLuckByLevel(levelOrPlayer);
  return { luck, tier: otoV150LuckTier(luck), line: `${OTO_LUCK_EMOJI_V150}Luck: ${luck} • ${otoV150LuckTier(luck)}` };
}

function otoLuckLine(levelOrPlayer = 1) {
  if (typeof levelOrPlayer === "object") return otoV150LuckText(levelOrPlayer, false).line;
  const luck = otoV150RollLuckByLevel(levelOrPlayer);
  return `${OTO_LUCK_EMOJI_V150}Luck: ${luck} • ${otoV150LuckTier(luck)}`;
}

async function otoCmdLuck(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  const state = otoV150LuckText(player, true);
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `${OTO_LUCK_EMOJI_V150}Luck kamu sekarang: **${state.luck}** • ${state.tier}`,
    "",
    `Level kamu: **${state.level}**`,
    "Semakin tinggi level, peluang dapat angka luck besar makin tinggi.",
    "",
    "Luck ini dipakai sama untuk:",
    "• `oth` hunt",
    "• `otb` battle",
    "• `otnpc` collection",
    "• `otprofile` profile",
    "",
    "Lanjut: `oth` • `otb` • `otprofile`"
  ].join("\n");

  const embed = (typeof otoV145Embed === "function")
    ? otoV145Embed(desc, "Hansip Luck")
    : new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc);

  return replyOt(message, { embeds: [embed] });
}

// Override otnpc collection description from v1.45 to use one stored luck and no .
if (typeof otoV145CollectionDesc === "function") {
  otoV145CollectionDesc = function(username, player) {
    const c = otoV145RarityCounts(player);
    const luckState = otoV150LuckText(player, false);
    return [
      `${OTO_V145.title} ${username}'s Hansip NPC Collection!`,
      "",
      otoV145Row("common", player),
      otoV145Row("uncommon", player),
      otoV145Row("rare", player),
      otoV145Row("epic", player),
      otoV145Row("mythic", player),
      otoV145Row("secret", player),
      "",
      `NPC Points: ${otoV145Points(player).toLocaleString("id-ID")}`,
      `M-${c.mythic}, E-${c.epic}, R-${c.rare}, U-${c.uncommon}, C-${c.common}, S-${c.secret}`,
      "",
      luckState.line,
      "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
    ].join("\n");
  };
}

// Override profile to make luck consistent.
async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  if (typeof otoV145Ensure === "function") otoV145Ensure(player);

  const level = otoV150Level(player);
  const luckState = otoV150LuckText(player, false);
  const teamPower = typeof otoV145TeamPower === "function" ? otoV145TeamPower(player) : 0;
  const npcCount = Object.keys(player.npcs || {}).length;
  const points = typeof otoV145Points === "function" ? otoV145Points(player) : npcCount;

  const desc = [
    `<:glowing_dot_blue:1513670991056736408> **${message.author.username}'s Hansip Profile**`,
    "",
    `Level: **${level}**`,
    `XP: **${Number(player.exp || 0).toLocaleString("id-ID")}**`,
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    luckState.line,
    "",
    `NPC Points: **${points.toLocaleString("id-ID")}**`,
    `NPC: **${npcCount}**`,
    `Team Power: **${Number(teamPower || 0).toLocaleString("id-ID")}**`,
    `Battle: **${Number(player.stats?.battleWin || 0)}W / ${Number(player.stats?.battleLose || 0)}L**`,
    "",
    "Alur main:",
    "1. `oth` → cari NPC",
    "2. `otnpc` → cek collection",
    "3. `otteam add <npcId> slot 1` → pasang team",
    "4. `otb` → battle"
  ].join("\n");

  const embed = (typeof otoV145Embed === "function")
    ? otoV145Embed(desc, "Hansip Profile")
    : new EmbedBuilder().setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF").setDescription(desc);

  return replyOt(message, { embeds: [embed] });
}


/* =========================
   Hansip SMART BIG BOT FLOW v1.51.0
   Target:
   - Semua fitur game Hansip rapi seperti bot besar.
   - Alur jelas dan tidak berantakan.
   - Tidak mengubah fitur lama Hansip lain.
   - Emoji-only, tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
   - NPC tetap fixed 5 per rarity, nama/emoji beda.
   - Luck unified: 1 angka tersimpan, display tanpa /100.
========================= */

const OTO_BIG_V151 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>",
  footer: "<a:Desa_Tulus:1516424353934348299> DESA TULUS • Hansip"
};

const OTO_CATALOG_V151 = {
  common: [
    { id:"bang_jaga_sendal", emoji:"🙂", name:"Bang Jaga Sendal", rarity:"common", element:"Tulus", power:120 },
    { id:"warga_senyum_tipis", emoji:"🙃", name:"Warga Senyum Tipis", rarity:"common", element:"Tulus", power:130 },
    { id:"tukang_delay_battle", emoji:"😄", name:"Tukang Delay Battle", rarity:"common", element:"Tulus", power:135 },
    { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 },
    { id:"admin_lupa_kopi", emoji:"😅", name:"Admin Lupa Kopi", rarity:"common", element:"Tulus", power:145 }
  ],
  uncommon: [
    { id:"admin_ngopi", emoji:"😎", name:"Admin Ngopi", rarity:"uncommon", element:"Warung", power:230 },
    { id:"kurir_oto", emoji:"🧢", name:"Kurir Hansip", rarity:"uncommon", element:"Tulus", power:240 },
    { id:"chef_mie_tulus", emoji:"🧑‍🍳", name:"Chef Mie Tulus", rarity:"uncommon", element:"Warung", power:250 },
    { id:"tukang_event", emoji:"👱", name:"Tukang Event", rarity:"uncommon", element:"Event", power:260 },
    { id:"penjaga_panel", emoji:"🧑", name:"Penjaga Panel", rarity:"uncommon", element:"Tulus", power:270 }
  ],
  rare: [
    { id:"pak_rw_bluetooth", emoji:"🤓", name:"Pak RW Bluetooth", rarity:"rare", element:"Cyber", power:520 },
    { id:"staff_setengah_serius", emoji:"🕵️", name:"Staff Setengah Serius", rarity:"rare", element:"Tulus", power:545 },
    { id:"tukang_inspect_gear", emoji:"🧑‍🔧", name:"Tukang Inspect Gear", rarity:"rare", element:"Gear", power:570 },
    { id:"dukun_drop_rate", emoji:"🧑‍🎨", name:"Dukun Drop Rate", rarity:"rare", element:"Luck", power:595 },
    { id:"kurir_dimensi_biru", emoji:"🧑‍💻", name:"Kurir Dimensi Biru", rarity:"rare", element:"Blue Core", power:620 }
  ],
  epic: [
    { id:"moderator_senyum_tipis", emoji:"🥸", name:"Moderator Senyum Tipis", rarity:"epic", element:"Tulus", power:880 },
    { id:"penjaga_portal_afk", emoji:"🧙", name:"Penjaga Portal AFK", rarity:"epic", element:"AFK", power:920 },
    { id:"guard_ot_core", emoji:"🦸", name:"Guard OT Core", rarity:"epic", element:"Blue Core", power:960 },
    { id:"staff_mode_silent", emoji:"🥷", name:"Staff Mode Silent", rarity:"epic", element:"Shadow", power:1000 },
    { id:"captain_arena_ot", emoji:"🧑‍🚀", name:"Captain Arena OT", rarity:"epic", element:"Battle", power:1040 }
  ],
  mythic: [
    { id:"bekiw_mode_royale", emoji:"🤠", name:"Bekiw Mode Royale", rarity:"mythic", element:"Royal", power:1500 },
    { id:"guardian_DESA TULUS", emoji:"👑", name:"Guardian DESA TULUS", rarity:"mythic", element:"Tulus", power:1580 },
    { id:"raja_hoki_biru", emoji:"🧛", name:"Raja Hoki Biru", rarity:"mythic", element:"Luck", power:1660 },
    { id:"neon_emperor_ot", emoji:"🧞", name:"Neon Emperor OT", rarity:"mythic", element:"Neon", power:1740 },
    { id:"core_guardian_tulus", emoji:"🧝", name:"Core Guardian Tulus", rarity:"mythic", element:"Core", power:1820 }
  ],
  secret: [
    { id:"oto_secret_king", emoji:"🧙‍♂️", name:"Hansip Secret King", rarity:"secret", element:"Secret", power:2500 },
    { id:"entity_00e5ff", emoji:"🕴️", name:"Entity 00E5FF", rarity:"secret", element:"Blue Flame", power:2650 },
    { id:"npc_anti_reset", emoji:"🧟", name:"NPC Anti Reset", rarity:"secret", element:"Anti Reset", power:2800 },
    { id:"shadow_bekiw_core", emoji:"🥷", name:"Shadow Bekiw Core", rarity:"secret", element:"Shadow", power:2950 },
    { id:"the_silent_moderator", emoji:"👤", name:"The Silent Moderator", rarity:"secret", element:"Silent", power:3100 }
  ]
};

function otoV151Footer(desc = "", suffix = "Hansip") {
  let clean = String(desc || "").trimEnd()
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  const end = suffix && suffix !== "Hansip" ? `<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}` : OTO_BIG_V151.footer;
  return `${clean}\n\n${end}`;
}

function otoV151Embed(desc, suffix = "Hansip", color = null) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoV151Footer(desc, suffix));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoV151Sup(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoV151Level(player) {
  try { if (typeof otoLevel === "function") return otoLevel(Number(player?.exp || 0)); } catch (_) {}
  return Math.max(1, Number(player?.level || 1));
}

function otoV151LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV151EnsureLuck(player, force = false) {
  const level = otoV151Level(player);
  const now = Date.now();
  const cacheMs = Math.max(1, Number(config.otoLuckCacheMinutes || 30)) * 60 * 1000;
  if (!force && player.currentLuck && Number(player.currentLuck.value || 0) > 0 && (now - Number(player.currentLuck.rolledAt || 0)) < cacheMs) {
    return player.currentLuck;
  }
  const base = Math.min(100, 8 + level * 2 + Math.floor(level / 10) * 5);
  const luck = Math.max(1, Math.min(100, base + Math.floor(Math.random() * 21)));
  player.currentLuck = { value: luck, tier: otoV151LuckTier(luck), level, rolledAt: now, expiresAt: now + cacheMs };
  return player.currentLuck;
}

function otoV151LuckLine(player, force = false) {
  const l = otoV151EnsureLuck(player, force);
  return `${OTO_BIG_V151.luck}Luck: ${l.value} • ${l.tier}`;
}

function otoV151Ensure(player) {
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 3) : [];
  while (player.team.length < 3) player.team.push("");
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoV151Letter(rarity = "common") {
  return OTO_BIG_V151[String(rarity || "common").toLowerCase()] || OTO_BIG_V151.common;
}

function otoV151AllNpcs() {
  return Object.values(OTO_CATALOG_V151).flat();
}

function otoV151OwnedCount(player, id) {
  const n = player?.npcs?.[id];
  return n ? 1 + Number(n.duplicates || 0) : 0;
}

function otoV151Counts(player) {
  const out = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const [rarity, list] of Object.entries(OTO_CATALOG_V151)) {
    out[rarity] = list.reduce((sum, npc) => sum + (player?.npcs?.[npc.id] ? 1 : 0), 0);
  }
  return out;
}

function otoV151Points(player) {
  const c = otoV151Counts(player);
  return c.common * 1 + c.uncommon * 3 + c.rare * 10 + c.epic * 25 + c.mythic * 75 + c.secret * 250;
}

function otoV151Row(rarity, player) {
  const list = OTO_CATALOG_V151[rarity] || [];
  const cells = list.map(npc => {
    const count = otoV151OwnedCount(player, npc.id);
    return `${count ? npc.emoji : ":grey_question:"}${otoV151Sup(count)}`;
  });
  return `${otoV151Letter(rarity)} : ${cells.join(" ")}`;
}

function otoV151PickNpc() {
  const roll = Math.random();
  let rarity = "common";
  if (roll < 0.60) rarity = "common";
  else if (roll < 0.80) rarity = "uncommon";
  else if (roll < 0.93) rarity = "rare";
  else if (roll < 0.985) rarity = "epic";
  else if (roll < 0.998) rarity = "mythic";
  else rarity = "secret";
  const list = OTO_CATALOG_V151[rarity];
  return list[Math.floor(Math.random() * list.length)];
}

function otoV151AddNpc(player, npc) {
  otoV151Ensure(player);
  if (player.npcs[npc.id]) {
    const frag = `${npc.rarity}_fragment`;
    const fragQty = 1 + Math.max(0, ["common","uncommon","rare","epic","mythic","secret"].indexOf(npc.rarity));
    const dustQty = 3 + fragQty * 2;
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    player.inventory.fragments[frag] = Number(player.inventory.fragments[frag] || 0) + fragQty;
    player.dust = Number(player.dust || 0) + dustQty;
    return { duplicate: true, fragQty, dustQty };
  }
  player.npcs[npc.id] = { ...npc, level: 1, exp: 0, locked: false, weapon: "", variant: "normal", duplicates: 0, obtainedAt: new Date().toISOString() };
  return { duplicate: false, fragQty: 0, dustQty: 0 };
}

function otoV151FindOwned(player, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return Object.values(player.npcs || {}).find(n =>
    n.id === q ||
    String(n.name || "").toLowerCase() === q ||
    String(n.name || "").toLowerCase().includes(q) ||
    String(n.emoji || "") === query
  ) || null;
}

function otoV151Power(npc) {
  return Number(npc?.power || 100) + Number(npc?.level || 1) * 25;
}

function otoV151TeamPower(player) {
  otoV151Ensure(player);
  return player.team.reduce((sum, id) => sum + (player.npcs[id] ? otoV151Power(player.npcs[id]) : 0), 0);
}

function otoV151FlowText() {
  return [
    "🚦 **Alur Hansip yang benar:**",
    "1. `otprofile` — cek akun",
    "2. `otdaily` — ambil modal harian",
    "3. `oth` — hunt NPC",
    "4. `otnpc` — cek collection",
    "5. `otnpc recent` — ambil npcId terakhir",
    "6. `otteam add <npcId> slot 1` — pasang team",
    "7. `otteam view` — cek team",
    "8. `otb` — battle",
    "9. `otinv` / `otopen all` / `ottop` — lanjut progress"
  ].join("\n");
}

async function otoCmdFlow(message) {
  if (!(await otoEnsureChannel(message))) return;
  return replyOt(message, { embeds: [otoV151Embed(otoV151FlowText(), "Hansip Flow")] });
}

function otoHelpEmbed() {
  return otoV151Embed([
    "💠 **Hansip Help Center**",
    "",
    "**Mulai Main**",
    "`otflow` — alur main paling jelas",
    "`otprofile` — profile dan progress",
    "`otdaily` — hadiah harian",
    "`oth` — hunt NPC",
    "`otnpc` — collection 5 slot per rarity",
    "`otnpc recent` — hasil hunt terakhir",
    "",
    "**Team & Battle**",
    "`otteam add <npcId> slot 1` — pasang NPC",
    "`otteam view` — lihat team",
    "`otb` — battle",
    "",
    "**Reward & Progress**",
    "`otinv` — inventory ringkas",
    "`otopen all` — buka semua crate",
    "`otquest` — misi harian",
    "`ottop` — leaderboard",
    "",
    otoV151FlowText()
  ].join("\n"), "Hansip Help");
}

async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const level = otoV151Level(player);
  const desc = [
    `${OTO_BIG_V151.title} **${message.author.username}'s Hansip Profile**`,
    "",
    `Level: **${level}**`,
    `XP: **${Number(player.exp || 0).toLocaleString("id-ID")}**`,
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    otoV151LuckLine(player),
    "",
    `NPC Points: **${otoV151Points(player).toLocaleString("id-ID")}**`,
    `NPC Owned: **${Object.keys(player.npcs || {}).length}/30**`,
    `Team Power: **${otoV151TeamPower(player).toLocaleString("id-ID")}**`,
    `Battle: **${Number(player.stats.battleWin || 0)}W / ${Number(player.stats.battleLose || 0)}L**`,
    "",
    "Lanjut: `oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip Profile")] });
}

async function otoCmdLuck(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const l = otoV151EnsureLuck(player, true);
  otoSavePlayer(message.author, player);
  return replyOt(message, { embeds: [otoV151Embed([
    `${OTO_BIG_V151.luck}Luck kamu sekarang: **${l.value}** • ${l.tier}`,
    "",
    `Level kamu: **${l.level}**`,
    "Semakin tinggi level, peluang luck besar makin naik.",
    "",
    "Luck ini dipakai sama di `oth`, `otnpc`, `otprofile`, dan `otb`.",
    "",
    "Lanjut: `oth` • `otb` • `otprofile`"
  ].join("\n"), "Hansip Luck")] });
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return replyOt(message, { embeds: [otoV151Embed(`❌ Coin kamu kurang.\n\nHunt butuh **${cost} Hansip Coin**.\n\nLanjut: \`otdaily\` atau \`otkerja\`, lalu \`oth\`.`, "Hansip Hunt")] });
  }
  player.coin = Number(player.coin || 0) - cost;
  const count = 1 + Math.floor(Math.random() * 3);
  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [], recent = [];
  for (let i=0; i<count; i++) {
    const npc = otoV151PickNpc();
    const add = otoV151AddNpc(player, npc);
    const xpGain = ({common:4,uncommon:8,rare:14,epic:28,mythic:65,secret:140}[npc.rarity] || 4) + Math.floor(Math.random() * 8);
    xp += xpGain;
    found.push(`${otoV151Letter(npc.rarity)} ${npc.emoji} **${npc.name}**`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji, rarity:npc.rarity, duplicate:add.duplicate });
    if (add.duplicate) { dup++; frag += add.fragQty; dust += add.dustQty; }
  }
  player.exp = Number(player.exp || 0) + xp;
  player.level = otoV151Level(player);
  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust };
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;
  otoV151EnsureLuck(player, false);
  otoSavePlayer(message.author, player);
  const desc = [
    `🌱 | ${message.author.username} memakai **${cost} Hansip Coin** dan menangkap **${count} NPC**!`,
    `▫️ | ${recent.map(n=>n.emoji).join(" ")} mendapat **${xp} XP**!`,
    `🎴 | ${found.join(" • ")}`,
    dup ? `🔁 | ${dup} duplicate berubah jadi ${OTO_BIG_V151.rare} **${frag} Fragment** dan 🎴 **${dust} Dust**!` : "",
    otoV151LuckLine(player),
    "",
    "✅ NPC sudah tersimpan ke collection.",
    "",
    "**Lanjut jelas:**",
    "1. `otnpc` — cek collection",
    "2. `otnpc recent` — ambil npcId",
    "3. `otteam add <npcId> slot 1` — pasang team",
    "4. `otb` — battle"
  ].filter(Boolean).join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip Hunt")] });
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const rarityKeys = ["common","uncommon","rare","epic","mythic","secret"];
  if (q === "recent") {
    const recent = player.lastHunt?.npcs || [];
    const lines = recent.length ? recent.map((n,i)=>`${i+1}. ${otoV151Letter(n.rarity)} ${n.emoji} \`${n.id}\` — **${n.name}**${n.duplicate ? " • duplicate" : ""}`).join("\n") : "Belum ada hasil hunt. Jalankan `oth` dulu.";
    return replyOt(message, { embeds: [otoV151Embed(`🎴 **Hasil Hunt Terakhir**\n\n${lines}\n\nLanjut: \`otteam add <npcId> slot 1\` → \`otteam view\` → \`otb\``, "Hansip NPC")] });
  }
  if (rarityKeys.includes(q)) {
    const list = OTO_CATALOG_V151[q];
    const lines = list.map((npc,i)=>{
      const count = otoV151OwnedCount(player, npc.id);
      const owned = player.npcs[npc.id];
      return `${i+1}. ${otoV151Letter(q)} ${count ? npc.emoji : ":grey_question:"}${otoV151Sup(count)} \`${npc.id}\` — **${npc.name}**${owned ? ` • Lv.${owned.level || 1} • Power ${otoV151Power(owned).toLocaleString("id-ID")}` : " • Belum punya"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV151Embed(`${otoV151Letter(q)} **${q.toUpperCase()} NPC List — 5 Slot**\n\n${lines}\n\nLanjut: \`oth\` → \`otnpc recent\` → \`otteam add <npcId> slot 1\``, "Hansip NPC")] });
  }
  const c = otoV151Counts(player);
  const desc = [
    `${OTO_BIG_V151.title} ${message.author.username}'s Hansip NPC Collection!`,
    "",
    `${otoV151Row("common", player)}`,
    `${otoV151Row("uncommon", player)}`,
    `${otoV151Row("rare", player)}`,
    `${otoV151Row("epic", player)}`,
    `${otoV151Row("mythic", player)}`,
    `${otoV151Row("secret", player)}`,
    "",
    `NPC Points: ${otoV151Points(player).toLocaleString("id-ID")}`,
    `M-${c.mythic}, E-${c.epic}, R-${c.rare}, U-${c.uncommon}, C-${c.common}, S-${c.secret}`,
    "",
    otoV151LuckLine(player),
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip NPC")] });
}

async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const sub = String(args[0] || "view").toLowerCase();
  if (sub === "view") {
    const lines = [0,1,2].map(i => {
      const id = player.team[i] || "";
      const npc = id ? player.npcs[id] : null;
      return `Slot ${i+1}: ${npc ? `${otoV151Letter(npc.rarity)} ${npc.emoji} \`${npc.id}\` — **${npc.name}** • Power ${otoV151Power(npc).toLocaleString("id-ID")}` : "Kosong"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV151Embed(`⚔️ **Hansip Team**\n\n${lines}\n\nTeam Power: **${otoV151TeamPower(player).toLocaleString("id-ID")}**\n\nLanjut: \`otteam add <npcId> slot 1\` → \`otb\``, "Hansip Team")] });
  }
  if (sub === "add") {
    const slotIndex = args.findIndex(x => String(x).toLowerCase() === "slot");
    const slot = slotIndex >= 0 ? Number(args[slotIndex+1]) : Number(args[args.length-1]);
    const query = (slotIndex >= 0 ? args.slice(1, slotIndex) : args.slice(1, -1)).join(" ");
    if (!slot || slot < 1 || slot > 3) return replyOt(message, { content: "⚠️ Format: `otteam add <npcId> slot 1` sampai `slot 3`." });
    const npc = otoV151FindOwned(player, query);
    if (!npc) return replyOt(message, { embeds: [otoV151Embed("❌ NPC tidak ditemukan.\n\nCek ID dengan `otnpc recent` atau `otnpc common` dulu.", "Hansip Team")] });
    if (player.team.includes(npc.id)) return replyOt(message, { content: "⚠️ NPC itu sudah ada di team." });
    player.team[slot-1] = npc.id;
    otoSavePlayer(message.author, player);
    return replyOt(message, { embeds: [otoV151Embed(`✅ ${otoV151Letter(npc.rarity)} ${npc.emoji} **${npc.name}** masuk ke **slot ${slot}**.\n\nLanjut: \`otteam view\` → \`otb\``, "Hansip Team")] });
  }
  return replyOt(message, { content: "⚠️ Team: `otteam view` • `otteam add <npcId> slot 1` • `otteam remove 1`" });
}

async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const team = player.team.map(id => player.npcs[id]).filter(Boolean);
  if (!team.length) return replyOt(message, { embeds: [otoV151Embed("❌ Team masih kosong.\n\nAlur:\n1. `oth`\n2. `otnpc recent`\n3. `otteam add <npcId> slot 1`\n4. `otb`", "Hansip Battle")] });
  const power = team.reduce((s,n)=>s+otoV151Power(n),0);
  const luck = otoV151EnsureLuck(player, false);
  const enemy = Math.max(100, Math.floor(power * (0.75 + Math.random()*0.75)));
  const chance = Math.max(10, Math.min(90, Math.round((power + luck.value*10) / Math.max(1, power+enemy) * 100)));
  const win = Math.random()*100 < chance;
  const coin = win ? 140+Math.floor(Math.random()*180) : 35+Math.floor(Math.random()*60);
  const xp = win ? 45+Math.floor(Math.random()*70) : 15+Math.floor(Math.random()*35);
  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  player.stats.battleWin = Number(player.stats.battleWin || 0) + (win ? 1 : 0);
  player.stats.battleLose = Number(player.stats.battleLose || 0) + (win ? 0 : 1);
  otoSavePlayer(message.author, player);
  const teamLines = team.map((n,i)=>`${i+1}. ${otoV151Letter(n.rarity)} ${n.emoji} **${n.name}**`).join("\n");
  const desc = [
    `⚔️ **Hansip Battle — ${win ? "MENANG" : "KALAH"}**`,
    "",
    teamLines,
    "",
    `Power Team: **${power.toLocaleString("id-ID")}**`,
    `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
    `${OTO_BIG_V151.luck}Luck: ${luck.value} • ${luck.tier}`,
    `Chance: **${chance}%**`,
    "",
    win ? `💎 Menang! Reward **${coin} Hansip Coin** + **${xp} XP**.` : `💨 Kalah, tapi tetap dapat **${coin} Hansip Coin** + **${xp} XP**.`,
    "",
    "Lanjut: `otprofile` • `oth` • `ottop`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip Battle", win ? "#0B5CFF" : "#FF4D6D")] });
}

async function otoCmdInv(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const crates = Object.entries(player.inventory.crates || {}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${k}: **${v}**`).join("\n") || "Belum ada crate.";
  const frags = Object.entries(player.inventory.fragments || {}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${k}: **${v}**`).join("\n") || "Belum ada fragment.";
  const desc = [
    "🎒 **Hansip Inventory**",
    "",
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    `Dust: **${Number(player.dust || 0).toLocaleString("id-ID")}**`,
    "",
    "**Crate**",
    crates,
    "",
    "**Fragment**",
    frags,
    "",
    "Lanjut: `otopen all` • `oth` • `otteam view`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip Inventory")] });
}

async function otoCmdDaily(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV151Ensure(player);
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (player.lastDaily && now - Number(player.lastDaily) < day) return replyOt(message, { content: "⏳ Daily sudah diambil. Coba lagi besok." });
  player.lastDaily = now;
  player.coin = Number(player.coin || 0) + 500;
  player.exp = Number(player.exp || 0) + 50;
  player.inventory.crates.basic = Number(player.inventory.crates.basic || 0) + 1;
  otoSavePlayer(message.author, player);
  return replyOt(message, { embeds: [otoV151Embed("🎁 **Hansip Daily Claimed**\n\nReward:\n🪙 Coin **+500**\n⭐ XP **+50**\n📦 Basic Crate **+1**\n\nLanjut: `oth` • `otopen all` • `otquest`", "Hansip Daily")] });
}

async function otoCmdQuest(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  const hunts = Number(player.stats?.hunts || 0);
  const wins = Number(player.stats?.battleWin || 0);
  const desc = [
    "🎯 **Hansip Quest Harian**",
    "",
    `🌱 Hunt NPC: **${hunts}/5**`,
    `⚔️ Menang Battle: **${wins}/3**`,
    "📦 Buka Crate: **0/1**",
    "",
    "Reward quest mengikuti progress harian.",
    "",
    "Alur: `oth` → `otteam add <npcId> slot 1` → `otb` → `otopen all`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV151Embed(desc, "Hansip Quest")] });
}

async function otoCmdTop(message) {
  if (!(await otoEnsureChannel(message))) return;
  const players = typeof otoReadPlayers === "function" ? otoReadPlayers() : {};
  const rows = Object.entries(players).slice(0, 10).map(([id, p], i) => `${i+1}. <@${id}> — Level **${otoV151Level(p)}** • Coin **${Number(p.coin || 0).toLocaleString("id-ID")}** • NPC **${Object.keys(p.npcs || {}).length}**`);
  return replyOt(message, { embeds: [otoV151Embed(`🏆 **Hansip Leaderboard**\n\n${rows.length ? rows.join("\n") : "Belum ada data leaderboard."}\n\nLanjut: \`oth\` • \`otb\` • \`otprofile\``, "Hansip Top")] });
}


/* =========================
   Hansip SMART FLOW + NEON COLORS v1.52.0
   Aturan:
   - Semua embed normal Hansip: biru neon terang DESA TULUS.
   - Embed menang: hijau.
   - Embed kalah/error: merah.
   - Alur tetap Smart Big Bot Flow v1.51.
   - Tidak mengubah fitur lama Hansip selain Hansip game flow.
   - Tetap emoji-only, tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_COLOR_V152 = {
  normal: "#00E5FF",
  blue: "#00E5FF",
  darkBlue: "#0B5CFF",
  win: "#22C55E",
  success: "#22C55E",
  lose: "#EF4444",
  error: "#EF4444",
  danger: "#EF4444",
  draw: "#FACC15"
};

function otoColorV152(type = "normal") {
  const key = String(type || "normal").toLowerCase();
  if (["win", "menang", "success", "green"].includes(key)) return config.otoEmbedWinColor || OTO_COLOR_V152.win;
  if (["lose", "kalah", "error", "danger", "red"].includes(key)) return config.otoEmbedLoseColor || OTO_COLOR_V152.lose;
  if (["draw", "seri", "warning", "yellow"].includes(key)) return config.otoEmbedDrawColor || OTO_COLOR_V152.draw;
  return config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || OTO_COLOR_V152.normal;
}

// Override embed helper utama Hansip supaya warna normal selalu neon biru terang.
if (typeof otoV151Embed === "function") {
  otoV151Embed = function(desc, suffix = "Hansip", color = null) {
    let chosen = color || otoColorV152("normal");
    const lower = String(desc || "").toLowerCase();
    if (!color && (lower.includes("menang") || lower.includes("win") || lower.includes("claimed") || lower.includes("✅"))) chosen = otoColorV152("success");
    if (!color && (lower.includes("kalah") || lower.includes("lose") || lower.includes("❌") || lower.includes("error"))) chosen = otoColorV152("error");

    const embed = new EmbedBuilder()
      .setColor(chosen)
      .setDescription(typeof otoV151Footer === "function" ? otoV151Footer(desc, suffix) : String(desc || ""));
    try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
    return embed;
  };
}

if (typeof otoV145Embed === "function") {
  otoV145Embed = function(desc, footer = "Hansip", color = null) {
    return new EmbedBuilder()
      .setColor(color || otoColorV152("normal"))
      .setDescription(typeof otAppendVisualFooterV149 === "function" ? otAppendVisualFooterV149(desc, footer) : String(desc || ""));
  };
}

if (typeof otoBaseEmbed === "function") {
  const otoBaseEmbedOldV152 = otoBaseEmbed;
  otoBaseEmbed = function(title, description, color) {
    const embed = otoBaseEmbedOldV152(title, description, color || otoColorV152("normal"));
    try {
      embed.setColor(color || otoColorV152("normal"));
      embed.setImage(null);
      embed.setThumbnail(null);
    } catch (_) {}
    return embed;
  };
}

// Battle override warna: menang hijau, kalah merah.
if (typeof otoCmdBattle === "function") {
  const otoCmdBattleOldV152 = otoCmdBattle;
  // v1.51 sudah punya battle rapi. Wrapper ini menjaga kalau handler lama masih kepakai tetap pakai warna rules.
}

// Helper untuk command baru/fitur lain jika butuh:
function otoWinEmbedV152(desc, suffix = "Hansip") {
  return typeof otoV151Embed === "function"
    ? otoV151Embed(desc, suffix, otoColorV152("win"))
    : new EmbedBuilder().setColor(otoColorV152("win")).setDescription(String(desc || ""));
}

function otoLoseEmbedV152(desc, suffix = "Hansip") {
  return typeof otoV151Embed === "function"
    ? otoV151Embed(desc, suffix, otoColorV152("lose"))
    : new EmbedBuilder().setColor(otoColorV152("lose")).setDescription(String(desc || ""));
}

function otoNormalEmbedV152(desc, suffix = "Hansip") {
  return typeof otoV151Embed === "function"
    ? otoV151Embed(desc, suffix, otoColorV152("normal"))
    : new EmbedBuilder().setColor(otoColorV152("normal")).setDescription(String(desc || ""));
}


/* =========================
   Hansip FLOW COMMAND REGISTER FIX v1.53.0
   Fix:
   - `otflow` masuk OTO_DIRECT_COMMANDS.
   - `otflow` masuk OTO_COMMAND_SET.
   - `otflow` masuk OT_COMMAND_MAP.
   - processOtoCommand di-wrap agar `otflow` langsung memanggil otoCmdFlow().
========================= */

try {
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) OTO_DIRECT_COMMANDS.add("otflow");
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) OTO_COMMAND_SET.add("otflow");
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    OT_COMMAND_MAP.set("otflow", {
      name: "otflow",
      category: "member",
      permission: "member",
      usage: "otflow",
      description: "Lihat alur main Hansip dari awal sampai battle."
    });
  }
} catch (err) {
  console.error("Gagal register otflow:", err);
}

if (typeof processOtoCommand === "function" && !processOtoCommand.__otflowFixV153) {
  const processOtoCommandOldV153 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    if (command?.name === "otflow") {
      if (typeof otoCmdFlow === "function") return otoCmdFlow(message), true;
      if (!(await otoEnsureChannel(message))) return true;
      const desc = [
        "🚦 **Alur Hansip yang benar:**",
        "1. `otprofile` — cek akun",
        "2. `otdaily` — ambil modal harian",
        "3. `oth` — hunt NPC",
        "4. `otnpc` — cek collection",
        "5. `otnpc recent` — ambil npcId terakhir",
        "6. `otteam add <npcId> slot 1` — pasang team",
        "7. `otteam view` — cek team",
        "8. `otb` — battle",
        "9. `otinv` / `otopen all` / `ottop` — lanjut progress"
      ].join("\n");
      const embed = typeof otoV151Embed === "function"
        ? otoV151Embed(desc, "Hansip Flow")
        : new EmbedBuilder().setColor(config.otoEmbedNormalColor || "#00E5FF").setDescription(desc);
      await replyOt(message, { embeds: [embed] });
      return true;
    }
    return processOtoCommandOldV153(message, parsed, command);
  };
  processOtoCommand.__otflowFixV153 = true;
}


/* =========================
   Hansip CLEAN HUNT EMBED v1.54.0
   Target format `oth`:
   🌱 | username memakai 5 Hansip Coin dan menangkap 1 NPC!
   ▫️ | 😊 mendapat 7 XP!
   🎴 | <:LetterC:...> 😊 Penjaga Warung OT

   🔁 | 1 duplicate berubah jadi <:PurpleR:...> 1 Fragment dan 🎴 5 Dust!
   <a:clover:...>Luck: 31 • Normal
   ✅ NPC sudah tersimpan ke collection.

   <a:DESA TULUS:...> DESA TULUS • Hansip Hunt
========================= */

function otoV154CleanFooter(desc = "", suffix = "Hansip Hunt") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}

function otoV154CleanEmbed(desc, suffix = "Hansip Hunt", color = null) {
  const embed = new EmbedBuilder()
    .setColor(color || config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(otoV154CleanFooter(desc, suffix));
  try {
    embed.clearFooter();
    embed.setImage(null);
    embed.setThumbnail(null);
  } catch (_) {}
  return embed;
}

function otoV154RarityLetter(rarity = "common") {
  const map = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>"
  };
  return map[String(rarity || "common").toLowerCase()] || map.common;
}

function otoV154LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV154Luck(player) {
  try {
    if (typeof otoV151EnsureLuck === "function") {
      const l = otoV151EnsureLuck(player, false);
      return { value: Number(l.value || 1), tier: l.tier || otoV154LuckTier(l.value || 1) };
    }
    if (typeof otoV150EnsureLuck === "function") {
      const l = otoV150EnsureLuck(player, false);
      return { value: Number(l.luck || l.value || 1), tier: l.tier || otoV154LuckTier(l.luck || l.value || 1) };
    }
  } catch (_) {}
  const fallback = 10 + Math.floor(Math.random() * 31);
  return { value: fallback, tier: otoV154LuckTier(fallback) };
}

function otoV154EnsurePlayer(player) {
  if (typeof otoV151Ensure === "function") return otoV151Ensure(player);
  if (typeof otoV145Ensure === "function") return otoV145Ensure(player);
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 3) : [];
  while (player.team.length < 3) player.team.push("");
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoV154PickNpc() {
  if (typeof otoV151PickNpc === "function") return otoV151PickNpc();
  if (typeof otoV145PickNpc === "function") return otoV145PickNpc();
  return { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 };
}

function otoV154AddNpc(player, npc) {
  if (typeof otoV151AddNpc === "function") return otoV151AddNpc(player, npc);
  if (typeof otoV145AddNpc === "function") return otoV145AddNpc(player, npc);

  player.npcs = player.npcs || {};
  if (player.npcs[npc.id]) {
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    const fragId = `${npc.rarity}_fragment`;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + 1;
    player.dust = Number(player.dust || 0) + 5;
    return { duplicate: true, fragQty: 1, dustQty: 5 };
  }

  player.npcs[npc.id] = {
    ...npc,
    level: 1,
    exp: 0,
    locked: false,
    weapon: "",
    variant: "normal",
    duplicates: 0,
    obtainedAt: new Date().toISOString()
  };
  return { duplicate: false, fragQty: 0, dustQty: 0 };
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;

  const wait = typeof otoCooldown === "function"
    ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000))
    : 0;

  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV154EnsurePlayer(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return replyOt(message, {
      embeds: [otoV154CleanEmbed(`❌ Coin kamu kurang.\n\nButuh ${cost} Hansip Coin buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "Hansip Hunt", "#EF4444")]
    });
  }

  player.coin = Number(player.coin || 0) - cost;

  // Clean style: tetap 1-3 NPC, tapi tampilan ringkas.
  const count = 1 + Math.floor(Math.random() * 3);
  let xp = 0;
  let dupCount = 0;
  let fragTotal = 0;
  let dustTotal = 0;
  const foundParts = [];
  const recent = [];

  for (let i = 0; i < count; i++) {
    const npc = otoV154PickNpc();
    const add = otoV154AddNpc(player, npc);
    const rarity = String(npc.rarity || "common").toLowerCase();
    const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[rarity] || 7) + Math.floor(Math.random() * 5);
    xp += xpGain;

    foundParts.push(`${otoV154RarityLetter(rarity)} ${npc.emoji || "🙂"} ${npc.name}`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji || "🙂", rarity, duplicate:add.duplicate });

    if (add.duplicate) {
      dupCount++;
      fragTotal += Number(add.fragQty || 1);
      dustTotal += Number(add.dustQty || 5);
    }
  }

  player.exp = Number(player.exp || 0) + xp;
  if (typeof otoV151Level === "function") player.level = otoV151Level(player);
  else if (typeof otoV145Level === "function") player.level = otoV145Level(player);
  else player.level = Math.max(1, Number(player.level || 1));

  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dupCount, fragment: fragTotal, dust: dustTotal };
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;

  const luck = otoV154Luck(player);

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
    `▫️ | ${recent.map(n => n.emoji || "🙂").join(" ")} mendapat ${xp} XP!`,
    `🎴 | ${foundParts.join(" • ")}`,
    "",
    dupCount ? `🔁 | ${dupCount} duplicate berubah jadi <:PurpleR:1513668875189878785> ${fragTotal} Fragment dan 🎴 ${dustTotal} Dust!` : "",
    `<a:clover:1513671524949823639>Luck: ${luck.value} • ${luck.tier}`,
    "✅ NPC sudah tersimpan ke collection."
  ].filter(line => line !== "").join("\n");

  return replyOt(message, {
    embeds: [otoV154CleanEmbed(desc, "Hansip Hunt", config.otoEmbedNormalColor || "#00E5FF")]
  });
}


/* =========================
   Hansip PREMIUM STABILITY SUITE v1.55.0
   Tujuan:
   - Semua fitur game Hansip rapi, jelas, dan tidak bikin member pusing.
   - Safe router: error command Hansip tidak crash, dibalas fallback rapi.
   - Premium embed: normal biru neon, menang hijau, kalah/error merah.
   - Alur bot besar: othelp -> otflow -> otprofile -> otdaily -> oth -> otnpc -> otnpc recent -> otteam -> otb.
   - Dashboard all-in-one `/dashboard/oto` sebagai pusat kontrol/guide Hansip.
   - Tidak mengubah fitur lama Hansip di luar Hansip.
   - Tetap emoji-only, tanpa image/gambar/Canvas/AttachmentBuilder/setImage.
========================= */

const OTO_V155 = {
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>",
  footer: "<a:Desa_Tulus:1516424353934348299> DESA TULUS • Hansip"
};

const OTO_COLORS_V155 = {
  normal: "#00E5FF",
  win: "#22C55E",
  success: "#22C55E",
  lose: "#EF4444",
  error: "#EF4444",
  warning: "#FACC15",
  draw: "#FACC15"
};

const OTO_NPC_CATALOG_V155 = {
  common: [
    { id:"bang_jaga_sendal", emoji:"🙂", name:"Bang Jaga Sendal", rarity:"common", element:"Tulus", power:120 },
    { id:"warga_senyum_tipis", emoji:"🙃", name:"Warga Senyum Tipis", rarity:"common", element:"Tulus", power:130 },
    { id:"tukang_delay_battle", emoji:"😄", name:"Tukang Delay Battle", rarity:"common", element:"Tulus", power:135 },
    { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 },
    { id:"admin_lupa_kopi", emoji:"😅", name:"Admin Lupa Kopi", rarity:"common", element:"Tulus", power:145 }
  ],
  uncommon: [
    { id:"admin_ngopi", emoji:"😎", name:"Admin Ngopi", rarity:"uncommon", element:"Warung", power:230 },
    { id:"kurir_oto", emoji:"🧢", name:"Kurir Hansip", rarity:"uncommon", element:"Tulus", power:240 },
    { id:"chef_mie_tulus", emoji:"🧑‍🍳", name:"Chef Mie Tulus", rarity:"uncommon", element:"Warung", power:250 },
    { id:"tukang_event", emoji:"👱", name:"Tukang Event", rarity:"uncommon", element:"Event", power:260 },
    { id:"penjaga_panel", emoji:"🧑", name:"Penjaga Panel", rarity:"uncommon", element:"Tulus", power:270 }
  ],
  rare: [
    { id:"pak_rw_bluetooth", emoji:"🤓", name:"Pak RW Bluetooth", rarity:"rare", element:"Cyber", power:520 },
    { id:"staff_setengah_serius", emoji:"🕵️", name:"Staff Setengah Serius", rarity:"rare", element:"Tulus", power:545 },
    { id:"tukang_inspect_gear", emoji:"🧑‍🔧", name:"Tukang Inspect Gear", rarity:"rare", element:"Gear", power:570 },
    { id:"dukun_drop_rate", emoji:"🧑‍🎨", name:"Dukun Drop Rate", rarity:"rare", element:"Luck", power:595 },
    { id:"kurir_dimensi_biru", emoji:"🧑‍💻", name:"Kurir Dimensi Biru", rarity:"rare", element:"Blue Core", power:620 }
  ],
  epic: [
    { id:"moderator_senyum_tipis", emoji:"🥸", name:"Moderator Senyum Tipis", rarity:"epic", element:"Tulus", power:880 },
    { id:"penjaga_portal_afk", emoji:"🧙", name:"Penjaga Portal AFK", rarity:"epic", element:"AFK", power:920 },
    { id:"guard_ot_core", emoji:"🦸", name:"Guard OT Core", rarity:"epic", element:"Blue Core", power:960 },
    { id:"staff_mode_silent", emoji:"🥷", name:"Staff Mode Silent", rarity:"epic", element:"Shadow", power:1000 },
    { id:"captain_arena_ot", emoji:"🧑‍🚀", name:"Captain Arena OT", rarity:"epic", element:"Battle", power:1040 }
  ],
  mythic: [
    { id:"bekiw_mode_royale", emoji:"🤠", name:"Bekiw Mode Royale", rarity:"mythic", element:"Royal", power:1500 },
    { id:"guardian_DESA TULUS", emoji:"👑", name:"Guardian DESA TULUS", rarity:"mythic", element:"Tulus", power:1580 },
    { id:"raja_hoki_biru", emoji:"🧛", name:"Raja Hoki Biru", rarity:"mythic", element:"Luck", power:1660 },
    { id:"neon_emperor_ot", emoji:"🧞", name:"Neon Emperor OT", rarity:"mythic", element:"Neon", power:1740 },
    { id:"core_guardian_tulus", emoji:"🧝", name:"Core Guardian Tulus", rarity:"mythic", element:"Core", power:1820 }
  ],
  secret: [
    { id:"oto_secret_king", emoji:"🧙‍♂️", name:"Hansip Secret King", rarity:"secret", element:"Secret", power:2500 },
    { id:"entity_00e5ff", emoji:"🕴️", name:"Entity 00E5FF", rarity:"secret", element:"Blue Flame", power:2650 },
    { id:"npc_anti_reset", emoji:"🧟", name:"NPC Anti Reset", rarity:"secret", element:"Anti Reset", power:2800 },
    { id:"shadow_bekiw_core", emoji:"🥷", name:"Shadow Bekiw Core", rarity:"secret", element:"Shadow", power:2950 },
    { id:"the_silent_moderator", emoji:"👤", name:"The Silent Moderator", rarity:"secret", element:"Silent", power:3100 }
  ]
};

function otoV155Color(type = "normal") {
  const t = String(type || "normal").toLowerCase();
  if (["win", "success", "menang", "green"].includes(t)) return config.otoEmbedWinColor || OTO_COLORS_V155.win;
  if (["lose", "kalah", "error", "danger", "red"].includes(t)) return config.otoEmbedLoseColor || OTO_COLORS_V155.lose;
  if (["warning", "draw", "yellow", "seri"].includes(t)) return config.otoEmbedWarningColor || OTO_COLORS_V155.warning;
  return config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || OTO_COLORS_V155.normal;
}

function otoV155Footer(desc = "", suffix = "Hansip") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix || "Hansip"}`;
}

function otoV155Embed(desc = "", suffix = "Hansip", type = "normal") {
  const embed = new EmbedBuilder()
    .setColor(otoV155Color(type))
    .setDescription(otoV155Footer(desc, suffix));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoV155Sup(n = 0) {
  const map = { "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹" };
  return String(Math.max(0, Number(n || 0))).padStart(2, "0").split("").map(x => map[x] || x).join("");
}

function otoV155Level(player) {
  try { if (typeof otoLevel === "function") return otoLevel(Number(player?.exp || 0)); } catch (_) {}
  return Math.max(1, Number(player?.level || 1));
}

function otoV155LuckTier(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoV155EnsureLuck(player, force = false) {
  const level = otoV155Level(player);
  const now = Date.now();
  const cacheMs = Math.max(1, Number(config.otoLuckCacheMinutes || 30)) * 60 * 1000;
  if (!force && player.currentLuck && Number(player.currentLuck.value || 0) > 0 && (now - Number(player.currentLuck.rolledAt || 0)) < cacheMs) return player.currentLuck;
  const luck = Math.max(1, Math.min(100, 8 + level * 2 + Math.floor(level / 10) * 5 + Math.floor(Math.random() * 21)));
  player.currentLuck = { value: luck, tier: otoV155LuckTier(luck), level, rolledAt: now, expiresAt: now + cacheMs };
  return player.currentLuck;
}

function otoV155LuckLine(player, force = false) {
  const luck = otoV155EnsureLuck(player, force);
  return `${OTO_V155.luck}Luck: ${luck.value} • ${luck.tier}`;
}

function otoV155Ensure(player) {
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team.slice(0, 3) : [];
  while (player.team.length < 3) player.team.push("");
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoV155Letter(rarity = "common") {
  return OTO_V155[String(rarity || "common").toLowerCase()] || OTO_V155.common;
}

function otoV155AllNpcs() { return Object.values(OTO_NPC_CATALOG_V155).flat(); }

function otoV155OwnedCount(player, id) {
  const n = player?.npcs?.[id];
  return n ? 1 + Number(n.duplicates || 0) : 0;
}

function otoV155Counts(player) {
  const out = { common:0, uncommon:0, rare:0, epic:0, mythic:0, secret:0 };
  for (const [rarity, list] of Object.entries(OTO_NPC_CATALOG_V155)) {
    out[rarity] = list.reduce((sum, npc) => sum + (player?.npcs?.[npc.id] ? 1 : 0), 0);
  }
  return out;
}

function otoV155Points(player) {
  const c = otoV155Counts(player);
  return c.common*1 + c.uncommon*3 + c.rare*10 + c.epic*25 + c.mythic*75 + c.secret*250;
}

function otoV155Row(rarity, player) {
  const list = OTO_NPC_CATALOG_V155[rarity] || [];
  const cells = list.map(npc => {
    const count = otoV155OwnedCount(player, npc.id);
    return `${count ? npc.emoji : ":grey_question:"}${otoV155Sup(count)}`;
  });
  return `${otoV155Letter(rarity)} : ${cells.join(" ")}`;
}

function otoV155PickNpc() {
  const roll = Math.random();
  let rarity = "common";
  if (roll < 0.60) rarity = "common";
  else if (roll < 0.80) rarity = "uncommon";
  else if (roll < 0.93) rarity = "rare";
  else if (roll < 0.985) rarity = "epic";
  else if (roll < 0.998) rarity = "mythic";
  else rarity = "secret";
  const list = OTO_NPC_CATALOG_V155[rarity];
  return list[Math.floor(Math.random() * list.length)];
}

function otoV155AddNpc(player, npc) {
  otoV155Ensure(player);
  if (player.npcs[npc.id]) {
    const fragId = `${npc.rarity}_fragment`;
    const fragQty = 1 + Math.max(0, ["common","uncommon","rare","epic","mythic","secret"].indexOf(npc.rarity));
    const dustQty = 3 + fragQty * 2;
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + fragQty;
    player.dust = Number(player.dust || 0) + dustQty;
    return { duplicate:true, fragQty, dustQty };
  }
  player.npcs[npc.id] = { ...npc, level:1, exp:0, locked:false, weapon:"", variant:"normal", duplicates:0, obtainedAt:new Date().toISOString() };
  return { duplicate:false, fragQty:0, dustQty:0 };
}

function otoV155FindOwned(player, query) {
  const q = String(query || "").trim().toLowerCase();
  if (!q) return null;
  return Object.values(player.npcs || {}).find(n => n.id === q || String(n.name || "").toLowerCase() === q || String(n.name || "").toLowerCase().includes(q) || String(n.emoji || "") === query) || null;
}

function otoV155Power(npc) { return Number(npc?.power || 100) + Number(npc?.level || 1) * 25; }
function otoV155TeamPower(player) { otoV155Ensure(player); return player.team.reduce((s,id)=>s+(player.npcs[id] ? otoV155Power(player.npcs[id]) : 0),0); }

function otoV155FlowText() {
  return [
    "🚦 **Alur Hansip Premium**",
    "",
    "1. `otprofile` — cek akun dan progress",
    "2. `otdaily` — ambil modal harian",
    "3. `oth` — hunt NPC",
    "4. `otnpc` — cek collection 5 slot per rarity",
    "5. `otnpc recent` — ambil npcId terakhir",
    "6. `otteam add <npcId> slot 1` — pasang team",
    "7. `otteam view` — cek team",
    "8. `otb` — battle",
    "9. `otinv` / `otquest` / `ottop` — lanjut progress",
    "",
    "Semua command Hansip dibuat pendek, jelas, dan saling nyambung."
  ].join("\n");
}

function otoV155ErrorEmbed(command = "Hansip") {
  return otoV155Embed([
    "⚠️ **Hansip sedang merapikan command ini.**",
    "",
    "Biar tidak bikin bingung, pakai alur aman ini dulu:",
    "`otflow` → `otprofile` → `otdaily` → `oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`",
    "",
    `Command bermasalah: \`${command}\``
  ].join("\n"), "Hansip Safety", "error");
}

async function otoV155SafeRun(message, name, fn) {
  try {
    return await fn();
  } catch (err) {
    console.error(`[Hansip v1.55] Command error ${name}:`, err);
    try { return await replyOt(message, { embeds: [otoV155ErrorEmbed(name)] }); } catch (_) {}
    return true;
  }
}

async function otoCmdFlow(message) {
  if (!(await otoEnsureChannel(message))) return;
  return replyOt(message, { embeds: [otoV155Embed(otoV155FlowText(), "Hansip Flow")] });
}

function otoHelpEmbed() {
  return otoV155Embed([
    "💠 **Hansip Help Center**",
    "",
    "**Wajib tahu:**",
    "`otflow` — alur main paling jelas",
    "`otprofile` — profile dan progress",
    "`otdaily` — hadiah harian",
    "",
    "**Main:**",
    "`oth` — hunt NPC",
    "`otnpc` — collection",
    "`otnpc recent` — hasil hunt terakhir",
    "`otteam add <npcId> slot 1` — pasang team",
    "`otteam view` — lihat team",
    "`otb` — battle",
    "",
    "**Progress:**",
    "`otinv` — inventory",
    "`otquest` — quest",
    "`ottop` — leaderboard",
    "",
    otoV155FlowText()
  ].join("\n"), "Hansip Help");
}

async function otoCmdProfile(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV155Ensure(player);
  const desc = [
    `${OTO_V155.title} **${message.author.username}'s Hansip Profile**`,
    "",
    `Level: **${otoV155Level(player)}**`,
    `XP: **${Number(player.exp || 0).toLocaleString("id-ID")}**`,
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    otoV155LuckLine(player),
    "",
    `NPC Points: **${otoV155Points(player).toLocaleString("id-ID")}**`,
    `NPC Owned: **${Object.keys(player.npcs || {}).length}/30**`,
    `Team Power: **${otoV155TeamPower(player).toLocaleString("id-ID")}**`,
    `Battle: **${Number(player.stats.battleWin || 0)}W / ${Number(player.stats.battleLose || 0)}L**`,
    "",
    "Lanjut: `oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV155Embed(desc, "Hansip Profile")] });
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV155Ensure(player);
  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) return replyOt(message, { embeds: [otoV155Embed(`❌ Coin kamu kurang.\n\nButuh ${cost} Hansip Coin buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "Hansip Hunt", "error")] });
  player.coin = Number(player.coin || 0) - cost;
  const count = 1 + Math.floor(Math.random() * 3);
  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [], recent = [];
  for (let i=0; i<count; i++) {
    const npc = otoV155PickNpc();
    const add = otoV155AddNpc(player, npc);
    const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[npc.rarity] || 7) + Math.floor(Math.random()*5);
    xp += xpGain;
    found.push(`${otoV155Letter(npc.rarity)} ${npc.emoji} ${npc.name}`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji, rarity:npc.rarity, duplicate:add.duplicate });
    if (add.duplicate) { dup++; frag += add.fragQty; dust += add.dustQty; }
  }
  player.exp = Number(player.exp || 0) + xp;
  player.level = otoV155Level(player);
  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust };
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;
  otoV155EnsureLuck(player, false);
  otoSavePlayer(message.author, player);
  const desc = [
    `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
    `▫️ | ${recent.map(n=>n.emoji).join(" ")} mendapat ${xp} XP!`,
    `🎴 | ${found.join(" • ")}`,
    "",
    dup ? `🔁 | ${dup} duplicate berubah jadi ${OTO_V155.rare} ${frag} Fragment dan 🎴 ${dust} Dust!` : "",
    otoV155LuckLine(player),
    "✅ NPC sudah tersimpan ke collection."
  ].filter(Boolean).join("\n");
  return replyOt(message, { embeds: [otoV155Embed(desc, "Hansip Hunt")] });
}

async function otoCmdNpc(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const q = String(args[0] || "").toLowerCase();
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV155Ensure(player);
  const rarityKeys = ["common","uncommon","rare","epic","mythic","secret"];
  if (q === "recent") {
    const recent = player.lastHunt?.npcs || [];
    const lines = recent.length ? recent.map((n,i)=>`${i+1}. ${otoV155Letter(n.rarity)} ${n.emoji} \`${n.id}\` — **${n.name}**${n.duplicate ? " • duplicate" : ""}`).join("\n") : "Belum ada hasil hunt. Jalankan `oth` dulu.";
    return replyOt(message, { embeds: [otoV155Embed(`🎴 **Hasil Hunt Terakhir**\n\n${lines}\n\nLanjut: \`otteam add <npcId> slot 1\` → \`otteam view\` → \`otb\``, "Hansip NPC")] });
  }
  if (rarityKeys.includes(q)) {
    const list = OTO_NPC_CATALOG_V155[q];
    const lines = list.map((npc,i)=> {
      const count = otoV155OwnedCount(player, npc.id);
      const owned = player.npcs[npc.id];
      return `${i+1}. ${otoV155Letter(q)} ${count ? npc.emoji : ":grey_question:"}${otoV155Sup(count)} \`${npc.id}\` — **${npc.name}**${owned ? ` • Lv.${owned.level || 1} • Power ${otoV155Power(owned).toLocaleString("id-ID")}` : " • Belum punya"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV155Embed(`${otoV155Letter(q)} **${q.toUpperCase()} NPC List — 5 Slot**\n\n${lines}\n\nLanjut: \`oth\` → \`otnpc recent\` → \`otteam add <npcId> slot 1\``, "Hansip NPC")] });
  }
  const c = otoV155Counts(player);
  const desc = [
    `${OTO_V155.title} ${message.author.username}'s Hansip NPC Collection!`,
    "",
    otoV155Row("common", player),
    otoV155Row("uncommon", player),
    otoV155Row("rare", player),
    otoV155Row("epic", player),
    otoV155Row("mythic", player),
    otoV155Row("secret", player),
    "",
    `NPC Points: ${otoV155Points(player).toLocaleString("id-ID")}`,
    `M-${c.mythic}, E-${c.epic}, R-${c.rare}, U-${c.uncommon}, C-${c.common}, S-${c.secret}`,
    "",
    otoV155LuckLine(player),
    "Command: otnpc rare • otcard <npcId> • otteam add <npcId> slot 1"
  ].join("\n");
  return replyOt(message, { embeds: [otoV155Embed(desc, "Hansip NPC")] });
}

async function otoCmdTeam(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV155Ensure(player);
  const sub = String(args[0] || "view").toLowerCase();
  if (sub === "view") {
    const lines = [0,1,2].map(i => {
      const id = player.team[i] || "";
      const npc = id ? player.npcs[id] : null;
      return `Slot ${i+1}: ${npc ? `${otoV155Letter(npc.rarity)} ${npc.emoji} \`${npc.id}\` — **${npc.name}** • Power ${otoV155Power(npc).toLocaleString("id-ID")}` : "Kosong"}`;
    }).join("\n");
    return replyOt(message, { embeds: [otoV155Embed(`⚔️ **Hansip Team**\n\n${lines}\n\nTeam Power: **${otoV155TeamPower(player).toLocaleString("id-ID")}**\n\nLanjut: \`otteam add <npcId> slot 1\` → \`otb\``, "Hansip Team")] });
  }
  if (sub === "add") {
    const slotIndex = args.findIndex(x => String(x).toLowerCase() === "slot");
    const slot = slotIndex >= 0 ? Number(args[slotIndex+1]) : Number(args[args.length-1]);
    const query = (slotIndex >= 0 ? args.slice(1, slotIndex) : args.slice(1, -1)).join(" ");
    if (!slot || slot < 1 || slot > 3) return replyOt(message, { content: "⚠️ Format: `otteam add <npcId> slot 1` sampai `slot 3`." });
    const npc = otoV155FindOwned(player, query);
    if (!npc) return replyOt(message, { embeds: [otoV155Embed("❌ NPC tidak ditemukan.\n\nCek ID dengan `otnpc recent` atau `otnpc common` dulu.", "Hansip Team", "error")] });
    if (player.team.includes(npc.id)) return replyOt(message, { content: "⚠️ NPC itu sudah ada di team." });
    player.team[slot-1] = npc.id;
    otoSavePlayer(message.author, player);
    return replyOt(message, { embeds: [otoV155Embed(`✅ ${otoV155Letter(npc.rarity)} ${npc.emoji} **${npc.name}** masuk ke **slot ${slot}**.\n\nLanjut: \`otteam view\` → \`otb\``, "Hansip Team", "success")] });
  }
  return replyOt(message, { content: "⚠️ Team: `otteam view` • `otteam add <npcId> slot 1` • `otteam remove 1`" });
}

async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoV155Ensure(player);
  const team = player.team.map(id => player.npcs[id]).filter(Boolean);
  if (!team.length) return replyOt(message, { embeds: [otoV155Embed("❌ Team masih kosong.\n\nAlur aman:\n1. `oth`\n2. `otnpc recent`\n3. `otteam add <npcId> slot 1`\n4. `otb`", "Hansip Battle", "error")] });
  const power = team.reduce((s,n)=>s+otoV155Power(n),0);
  const luck = otoV155EnsureLuck(player, false);
  const enemy = Math.max(100, Math.floor(power * (0.75 + Math.random()*0.75)));
  const chance = Math.max(10, Math.min(90, Math.round((power + luck.value*10) / Math.max(1, power+enemy) * 100)));
  const win = Math.random()*100 < chance;
  const coin = win ? 140+Math.floor(Math.random()*180) : 35+Math.floor(Math.random()*60);
  const xp = win ? 45+Math.floor(Math.random()*70) : 15+Math.floor(Math.random()*35);
  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + xp;
  player.stats.battleWin = Number(player.stats.battleWin || 0) + (win ? 1 : 0);
  player.stats.battleLose = Number(player.stats.battleLose || 0) + (win ? 0 : 1);
  otoSavePlayer(message.author, player);
  const teamLines = team.map((n,i)=>`${i+1}. ${otoV155Letter(n.rarity)} ${n.emoji} **${n.name}**`).join("\n");
  const desc = [
    `⚔️ **Hansip Battle — ${win ? "MENANG" : "KALAH"}**`,
    "",
    teamLines,
    "",
    `Power Team: **${power.toLocaleString("id-ID")}**`,
    `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
    `${OTO_V155.luck}Luck: ${luck.value} • ${luck.tier}`,
    `Chance: **${chance}%**`,
    "",
    win ? `💎 Menang! Reward **${coin} Hansip Coin** + **${xp} XP**.` : `💨 Kalah, tapi tetap dapat **${coin} Hansip Coin** + **${xp} XP**.`,
    "",
    "Lanjut: `otprofile` • `oth` • `ottop`"
  ].join("\n");
  return replyOt(message, { embeds: [otoV155Embed(desc, "Hansip Battle", win ? "success" : "error")] });
}

// Safe router wrapper: kalau command Hansip error, bot balas rapi dan tidak bikin member pusing.
if (typeof processOtoCommand === "function" && !processOtoCommand.__otoPremiumStabilityV155) {
  const processOtoCommandOldV155 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    return otoV155SafeRun(message, command?.name || "unknown", async () => processOtoCommandOldV155(message, parsed, command));
  };
  processOtoCommand.__otoPremiumStabilityV155 = true;
}

// Dashboard all-in-one Hansip. Aman: read-only guide/control overview, tidak expose secret.
try {
  if (typeof app !== "undefined" && app.get && !app.__otoPremiumDashboardV155) {
    app.get("/dashboard/oto", (req, res) => {
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Hansip Premium Control Center</title>
      <style>
      body{margin:0;background:#07111f;color:#eaf7ff;font-family:Inter,Arial,sans-serif}
      .wrap{max-width:1180px;margin:0 auto;padding:28px}
      .hero{background:linear-gradient(135deg,#07111f,#0B5CFF33,#00E5FF22);border:1px solid #00E5FF55;border-radius:22px;padding:24px;box-shadow:0 0 28px #00E5FF22}
      h1{margin:0;font-size:32px} .sub{opacity:.82;margin-top:8px}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:18px}
      .card{background:#0b1729;border:1px solid #163c68;border-radius:18px;padding:16px}
      .card b{color:#7ee7ff} code{background:#06101d;border:1px solid #17446f;border-radius:8px;padding:2px 6px;color:#d6fbff}
      .ok{color:#22C55E} .warn{color:#FACC15} .bad{color:#EF4444}
      </style></head><body><div class="wrap">
      <div class="hero"><h1>💠 Hansip Premium Control Center</h1><div class="sub">All-in-One Game Hub • HANSIP DESA TULUS • Emoji-only • No image mode</div></div>
      <div class="grid">
      <div class="card"><b>🚦 Alur Utama</b><p><code>otflow</code> → <code>otprofile</code> → <code>otdaily</code> → <code>oth</code> → <code>otnpc recent</code> → <code>otteam add &lt;npcId&gt; slot 1</code> → <code>otb</code></p></div>
      <div class="card"><b>🎴 NPC</b><p>Fixed 5 NPC per rarity. Common sampai Secret punya emoji dan nama beda.</p></div>
      <div class="card"><b>🍀 Luck</b><p>Unified luck. Satu angka dipakai di semua embed, tanpa <code>/100</code>.</p></div>
      <div class="card"><b>🎨 Warna</b><p>Normal <span class="warn">biru neon</span>, menang <span class="ok">hijau</span>, kalah/error <span class="bad">merah</span>.</p></div>
      <div class="card"><b>🛡️ Safety</b><p>Error command Hansip dibalas fallback rapi, tidak bikin member bingung.</p></div>
      <div class="card"><b>🖼️ Visual</b><p>Emoji-only. Tidak pakai image/gambar/Canvas/AttachmentBuilder/setImage.</p></div>
      </div></div></body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      return res.send(html);
    });

    app.get("/api/oto/premium-status", (req, res) => {
      return res.json({
        ok: true,
        version: "5.9.99",
        name: "Hansip Premium Stability Suite",
        noImage: true,
        emojiOnly: true,
        flow: ["otflow","otprofile","otdaily","oth","otnpc recent","otteam add <npcId> slot 1","otb"],
        colors: OTO_COLORS_V155
      });
    });

    app.__otoPremiumDashboardV155 = true;
  }
} catch (err) {
  console.error("Hansip premium dashboard route gagal dibuat:", err);
}


/* =========================
   Hansip EMOJI ANIMATION SUITE v1.56.0
   - Semua command action penting Hansip diberi animasi 2 detik sebelum hasil.
   - Animasi pakai edit pesan emoji/embed, bukan image/gambar/GIF file.
   - Tetap no image mode: tidak pakai Canvas, AttachmentBuilder, setImage.
   - Target: oth, otopen, otopen all, otb, otcf, otbj, otdaily, otquest, otluck.
========================= */

const OTO_ANIM_V156 = {
  delay: Number(config.otoActionAnimationMs || config.otoAnimationDelayMs || 2000),
  frames: {
    hunt: ["🌱", "🔎", "🎴", "✨"],
    crate: ["📦", "🔓", "✨", "🎁"],
    battle: ["⚔️", "💥", "🛡️", "🏆"],
    coinflip: ["🪙", "🔄", "✨", "👑"],
    blackjack: ["🃏", "🎴", "✨", "🏆"],
    daily: ["🎁", "✨", "💰", "⭐"],
    quest: ["🎯", "📜", "✨", "✅"],
    luck: ["<a:clover:1513671524949823639>", "✨", "<a:clover:1513671524949823639>", "💠"]
  }
};

function sleepV156(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function otoAnimFooterV156(desc = "", suffix = "Hansip") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix || "Hansip"}`;
}

function otoAnimEmbedV156(desc = "", suffix = "Hansip", type = "normal") {
  let color = config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || "#00E5FF";
  const t = String(type || "normal").toLowerCase();
  if (["win", "success", "menang"].includes(t)) color = config.otoEmbedWinColor || "#22C55E";
  if (["lose", "error", "kalah", "danger"].includes(t)) color = config.otoEmbedLoseColor || "#EF4444";
  if (["warning", "draw", "seri"].includes(t)) color = config.otoEmbedWarningColor || "#FACC15";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(otoAnimFooterV156(desc, suffix));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

async function otoSendAnimationV156(message, type = "hunt", title = "Hansip sedang memproses...") {
  const frames = OTO_ANIM_V156.frames[type] || OTO_ANIM_V156.frames.hunt;
  const frameText = frames.join(" ");
  const desc = [
    `${frameText}`,
    "",
    `**${title}**`,
    "Tunggu **2 detik**..."
  ].join("\n");

  const payload = { embeds: [otoAnimEmbedV156(desc, "Hansip Animation")] };

  let sent = null;
  try {
    sent = await replyOt(message, payload);
  } catch (_) {
    try { sent = await message.reply(payload); } catch (__) {}
  }

  await sleepV156(OTO_ANIM_V156.delay);
  return sent;
}

async function otoEditAnimationResultV156(sent, finalPayload) {
  try {
    if (sent && typeof sent.edit === "function") {
      await sent.edit(finalPayload);
      return true;
    }
  } catch (_) {}
  return false;
}

function otoPayloadFromEmbedV156(embed) {
  return { embeds: [embed] };
}

function otoSimpleResultEmbedV156(desc, suffix = "Hansip", type = "normal") {
  return otoAnimEmbedV156(desc, suffix, type);
}

// Wrap command processor for animation on commands that already exist.
// This is safe because it does not change old feature logic. It only shows a 2s animation before action result.
// If a command has its own override below, that override wins.
if (typeof processOtoCommand === "function" && !processOtoCommand.__otoAnimV156) {
  const processOtoCommandOldV156 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const animMap = {
      oth: ["hunt", "Mencari NPC di Hansip..."],
      othunt: ["hunt", "Mencari NPC di Hansip..."],
      otopen: ["crate", "Membuka crate Hansip..."],
      otb: ["battle", "Battle Hansip dimulai..."],
      otbattle: ["battle", "Battle Hansip dimulai..."],
      otcf: ["coinflip", "Koin Hansip sedang berputar..."],
      otbj: ["blackjack", "Meja kartu Hansip sedang dibuka..."],
      otdaily: ["daily", "Mengambil daily Hansip..."],
      otquest: ["quest", "Mengecek quest Hansip..."],
      otluck: ["luck", "Menghitung luck Hansip..."]
    };

    if (animMap[name]) {
      await otoSendAnimationV156(message, animMap[name][0], animMap[name][1]);
    }

    return processOtoCommandOldV156(message, parsed, command);
  };
  processOtoCommand.__otoAnimV156 = true;
}

/* 
   Clean command overrides with built-in 2s animation.
   These overrides cover the commands most sering dipakai:
   oth, otopen, otb, otcf, otbj, otdaily, otquest, otluck.
   Kalau command lama sudah ada, logic tetap dipakai/ditiru, tapi alurnya dibuat tidak bikin bingung.
*/

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;

  const anim = await otoSendAnimationV156(message, "hunt", "Mencari NPC di Hansip...");

  const wait = typeof otoCooldown === "function"
    ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000))
    : 0;

  if (wait) {
    const payload = { embeds: [otoAnimEmbedV156(`⏳ Hunt cooldown **${wait} detik**.`, "Hansip Hunt", "warning")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  if (typeof otoV155Ensure === "function") otoV155Ensure(player);
  else if (typeof otoV151Ensure === "function") otoV151Ensure(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    const payload = { embeds: [otoAnimEmbedV156(`❌ Coin kamu kurang.\n\nButuh ${cost} Hansip Coin buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "Hansip Hunt", "error")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  player.coin = Number(player.coin || 0) - cost;

  const pickNpc = typeof otoV155PickNpc === "function" ? otoV155PickNpc : (typeof otoV151PickNpc === "function" ? otoV151PickNpc : null);
  const addNpc = typeof otoV155AddNpc === "function" ? otoV155AddNpc : (typeof otoV151AddNpc === "function" ? otoV151AddNpc : null);
  const letter = typeof otoV155Letter === "function" ? otoV155Letter : (typeof otoV154RarityLetter === "function" ? otoV154RarityLetter : (r => "<:LetterC:1513669277759176704>"));
  const luckLine = typeof otoV155LuckLine === "function" ? otoV155LuckLine : (typeof otoV151LuckLine === "function" ? otoV151LuckLine : (() => "<a:clover:1513671524949823639>Luck: 24 • Normal"));

  const fallbackNpc = { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 };

  const count = 1 + Math.floor(Math.random() * 3);
  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [], recent = [];

  for (let i = 0; i < count; i++) {
    const npc = pickNpc ? pickNpc() : fallbackNpc;
    const add = addNpc ? addNpc(player, npc) : { duplicate:false, fragQty:0, dustQty:0 };
    const rarity = String(npc.rarity || "common").toLowerCase();
    const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[rarity] || 7) + Math.floor(Math.random() * 5);
    xp += xpGain;
    found.push(`${letter(rarity)} ${npc.emoji || "🙂"} ${npc.name}`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji || "🙂", rarity, duplicate:add.duplicate });
    if (add.duplicate) { dup++; frag += Number(add.fragQty || 1); dust += Number(add.dustQty || 5); }
  }

  player.exp = Number(player.exp || 0) + xp;
  if (typeof otoV155Level === "function") player.level = otoV155Level(player);
  else if (typeof otoV151Level === "function") player.level = otoV151Level(player);
  else player.level = Math.max(1, Number(player.level || 1));

  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust };
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
    `▫️ | ${recent.map(n => n.emoji || "🙂").join(" ")} mendapat ${xp} XP!`,
    `🎴 | ${found.join(" • ")}`,
    "",
    dup ? `🔁 | ${dup} duplicate berubah jadi <:PurpleR:1513668875189878785> ${frag} Fragment dan 🎴 ${dust} Dust!` : "",
    luckLine(player),
    "✅ NPC sudah tersimpan ke collection."
  ].filter(Boolean).join("\n");

  const payload = { embeds: [otoAnimEmbedV156(desc, "Hansip Hunt")] };
  if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
}

async function otoCmdOpen(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoSendAnimationV156(message, "crate", "Membuka crate Hansip...");

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  if (typeof otoV155Ensure === "function") otoV155Ensure(player);
  else if (typeof otoV151Ensure === "function") otoV151Ensure(player);

  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.weapons = player.inventory.weapons || {};

  const crateArg = String(args[0] || "all").toLowerCase();
  const openAll = crateArg === "all" || !crateArg;
  const crates = Object.entries(player.inventory.crates).filter(([,v]) => Number(v || 0) > 0);

  if (!crates.length) {
    const payload = { embeds: [otoAnimEmbedV156("📦 Kamu belum punya crate.\n\nLanjut: `oth` atau `otdaily` buat cari crate.", "Hansip Crate", "warning")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  let opened = 0, coin = 0, frag = 0, dust = 0;
  const weaponDrops = [];
  const crateLines = [];

  for (const [name, qtyRaw] of crates) {
    let qty = Number(qtyRaw || 0);
    if (!openAll && name.toLowerCase() !== crateArg) continue;
    const openQty = openAll ? qty : 1;
    if (openQty <= 0) continue;

    player.inventory.crates[name] = Math.max(0, qty - openQty);
    opened += openQty;
    crateLines.push(`${name} x${openQty}`);

    for (let i = 0; i < openQty; i++) {
      coin += 50 + Math.floor(Math.random() * 180);
      frag += 1 + Math.floor(Math.random() * 3);
      dust += 2 + Math.floor(Math.random() * 5);
      if (Math.random() < 0.20) weaponDrops.push(["⚔️ Sendal Neon", "🗡️ Pedang Biru", "🛡️ Shield Tulus"][Math.floor(Math.random() * 3)]);
    }
  }

  if (opened <= 0) {
    const payload = { embeds: [otoAnimEmbedV156(`📦 Crate \`${crateArg}\` tidak ada atau kosong.`, "Hansip Crate", "warning")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  player.coin = Number(player.coin || 0) + coin;
  player.dust = Number(player.dust || 0) + dust;
  player.inventory.fragments.common_fragment = Number(player.inventory.fragments.common_fragment || 0) + frag;
  for (const w of weaponDrops) player.inventory.weapons[w] = Number(player.inventory.weapons[w] || 0) + 1;
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    "📦 **Hansip Crate Open Result**",
    "",
    `Crate dibuka: **${opened}**`,
    crateLines.join("\n"),
    "",
    `💰 Coin +${coin}`,
    `<:PurpleR:1513668875189878785> Fragment +${frag}`,
    `🎴 Dust +${dust}`,
    weaponDrops.length ? `⚔️ Weapon: ${weaponDrops.join(" • ")}` : "⚔️ Weapon: belum dapat",
    "",
    "Lanjut: `otinv` • `oth` • `otteam view`"
  ].join("\n");

  const payload = { embeds: [otoAnimEmbedV156(desc, "Hansip Crate", "success")] };
  if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
}

async function otoCmdCoinFlip(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoSendAnimationV156(message, "coinflip", "Koin Hansip sedang berputar...");

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  if (typeof otoV155Ensure === "function") otoV155Ensure(player);

  const raw = String(args[0] || "").toLowerCase();
  let bet = raw === "all" ? Number(player.coin || 0) : Number(raw);
  if (!bet || bet <= 0) {
    const payload = { embeds: [otoAnimEmbedV156("🪙 Format: `otcf <jumlah>` atau `otcf all`.", "Hansip Coin Flip", "warning")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  bet = Math.floor(bet);
  const maxBet = Number(config.otoCoinFlipMaxBet || config.otoMaxBet || 9999);
  if (bet > Number(player.coin || 0)) {
    const payload = { embeds: [otoAnimEmbedV156("❌ Coin kamu tidak cukup.", "Hansip Coin Flip", "error")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }
  if (bet > maxBet && raw !== "all") {
    const payload = { embeds: [otoAnimEmbedV156(`⚠️ Max bet saat ini **${maxBet}** Hansip Coin.`, "Hansip Coin Flip", "warning")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  const win = Math.random() < 0.50;
  player.coin = Number(player.coin || 0) + (win ? bet : -bet);
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `🪙 **Hansip Coin Flip — ${win ? "MENANG" : "KALAH"}**`,
    "",
    `Bet: **${bet} Hansip Coin**`,
    win ? `Hadiah: **+${bet} Hansip Coin**` : `Hilang: **-${bet} Hansip Coin**`,
    `Saldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    "",
    "Coin ini hanya coin game Hansip, bukan uang asli."
  ].join("\n");

  const payload = { embeds: [otoAnimEmbedV156(desc, "Hansip Coin Flip", win ? "success" : "error")] };
  if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
}

async function otoCmdBlackjack(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoSendAnimationV156(message, "blackjack", "Meja kartu Hansip sedang dibuka...");

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  if (typeof otoV155Ensure === "function") otoV155Ensure(player);

  const raw = String(args[0] || "").toLowerCase();
  let bet = raw === "all" ? Number(player.coin || 0) : Number(raw || 100);
  bet = Math.floor(bet);
  if (!bet || bet <= 0) bet = 100;
  if (bet > Number(player.coin || 0)) {
    const payload = { embeds: [otoAnimEmbedV156("❌ Coin kamu tidak cukup buat `otbj`.", "Hansip Blackjack", "error")] };
    if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
    return;
  }

  const card = () => 2 + Math.floor(Math.random() * 10);
  let playerTotal = card() + card();
  let dealerTotal = card() + card();
  while (dealerTotal < 17) dealerTotal += card();
  const win = playerTotal <= 21 && (dealerTotal > 21 || playerTotal > dealerTotal);
  const draw = playerTotal === dealerTotal && playerTotal <= 21 && dealerTotal <= 21;

  if (win) player.coin = Number(player.coin || 0) + bet;
  else if (!draw) player.coin = Number(player.coin || 0) - bet;
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const result = draw ? "SERI" : (win ? "MENANG" : "KALAH");
  const desc = [
    `🃏 **Hansip Blackjack — ${result}**`,
    "",
    `Bet: **${bet} Hansip Coin**`,
    `Kartu kamu: **${playerTotal}**`,
    `Kartu dealer: **${dealerTotal}**`,
    draw ? "Hasil: Bet kembali." : (win ? `Hadiah: **+${bet} Hansip Coin**` : `Hilang: **-${bet} Hansip Coin**`),
    `Saldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    "",
    "Coin ini hanya coin game Hansip, bukan uang asli."
  ].join("\n");

  const payload = { embeds: [otoAnimEmbedV156(desc, "Hansip Blackjack", draw ? "warning" : (win ? "success" : "error"))] };
  if (!(await otoEditAnimationResultV156(anim, payload))) await replyOt(message, payload);
}

// Aliases/wrappers for names that router may call.
async function otoCmdCf(message, args = []) { return otoCmdCoinFlip(message, args); }
async function otoCmdBJ(message, args = []) { return otoCmdBlackjack(message, args); }

// Register / wrap router names.
try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    for (const [name, desc] of [
      ["otopen", "Buka crate Hansip dengan animasi 2 detik."],
      ["otcf", "Coin flip Hansip animasi 2 detik."],
      ["otbj", "Blackjack Hansip animasi 2 detik."],
      ["otflow", "Alur main Hansip."]
    ]) {
      OT_COMMAND_MAP.set(name, { name, category:"member", permission:"member", usage:name, description:desc });
    }
  }
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) {
    ["otopen","otcf","otbj","otflow"].forEach(x => OTO_DIRECT_COMMANDS.add(x));
  }
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) {
    ["otopen","otcf","otbj","otflow"].forEach(x => OTO_COMMAND_SET.add(x));
  }
} catch (err) {
  console.error("Hansip animation register gagal:", err);
}

if (typeof processOtoCommand === "function" && !processOtoCommand.__otoAnimationDirectV156) {
  const processOtoCommandOldDirectV156 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];
    if (name === "otopen") return otoCmdOpen(message, args), true;
    if (name === "otcf") return otoCmdCoinFlip(message, args), true;
    if (name === "otbj") return otoCmdBlackjack(message, args), true;
    return processOtoCommandOldDirectV156(message, parsed, command);
  };
  processOtoCommand.__otoAnimationDirectV156 = true;
}


/* =========================
   Hansip BLACKJACK LIVE BUTTONS v1.57.0
   Fix:
   - `otbj` tidak langsung menang/kalah.
   - Muncul tombol: Tambahin dan Stop.
   - Dealer/musuh hidup: ikut nambah kartu otomatis random saat player klik Tambahin/Stop.
   - Kalau total di atas 21:
     player bust = kalah, dealer bust = player menang, dua-duanya bust = seri.
   - Luck scaling by level:
     Level 1-3 = luck 1-10
     Level 4-6 = luck 1-20
     Level 7-9 = luck 1-30
     dst sampai max 100.
   - Display luck tetap: Luck: 8 • Normal, tanpa /100.
   - Animasi emoji tetap 2 detik.
   - Hanya coin virtual game, bukan uang asli.
========================= */

const OTO_BJ_SESSIONS_V157 = new Map();

function otoBjLevelV157(player) {
  try { if (typeof otoV155Level === "function") return otoV155Level(player); } catch (_) {}
  try { if (typeof otoV151Level === "function") return otoV151Level(player); } catch (_) {}
  try { if (typeof otoLevel === "function") return otoLevel(Number(player?.exp || 0)); } catch (_) {}
  return Math.max(1, Number(player?.level || 1));
}

function otoBjLuckTierV157(luck = 1) {
  const n = Number(luck || 1);
  if (n >= 90) return "God";
  if (n >= 75) return "Mythic";
  if (n >= 60) return "High";
  if (n >= 40) return "Good";
  return "Normal";
}

function otoBjLuckCapV157(level = 1) {
  const lv = Math.max(1, Number(level || 1));
  return Math.max(10, Math.min(100, Math.ceil(lv / 3) * 10));
}

function otoBjRollLuckV157(player, force = false) {
  const level = otoBjLevelV157(player);
  const now = Date.now();
  const cacheMs = Math.max(1, Number(config.otoLuckCacheMinutes || 30)) * 60 * 1000;
  const cap = otoBjLuckCapV157(level);

  if (!force && player.currentLuck && Number(player.currentLuck.value || 0) > 0 && (now - Number(player.currentLuck.rolledAt || 0)) < cacheMs) {
    const oldValue = Number(player.currentLuck.value || 1);
    if (oldValue <= cap) return player.currentLuck;
  }

  const value = 1 + Math.floor(Math.random() * cap);
  const tier = otoBjLuckTierV157(value);
  player.currentLuck = { value, tier, level, cap, rolledAt: now, expiresAt: now + cacheMs };
  return player.currentLuck;
}

// Override luck helpers globally so level 1 tidak kebanyakan luck.
function otoV155EnsureLuck(player, force = false) { return otoBjRollLuckV157(player, force); }
function otoV151EnsureLuck(player, force = false) { return otoBjRollLuckV157(player, force); }
function otoV150EnsureLuck(player, force = false) { return otoBjRollLuckV157(player, force); }
function otoV155LuckLine(player, force = false) {
  const l = otoBjRollLuckV157(player, force);
  return `<a:clover:1513671524949823639>Luck: ${l.value} • ${l.tier}`;
}
function otoV151LuckLine(player, force = false) {
  const l = otoBjRollLuckV157(player, force);
  return `<a:clover:1513671524949823639>Luck: ${l.value} • ${l.tier}`;
}

function otoBjCardV157() {
  const ranks = [
    { r:"A", v:11 }, { r:"2", v:2 }, { r:"3", v:3 }, { r:"4", v:4 }, { r:"5", v:5 },
    { r:"6", v:6 }, { r:"7", v:7 }, { r:"8", v:8 }, { r:"9", v:9 }, { r:"10", v:10 },
    { r:"J", v:10 }, { r:"Q", v:10 }, { r:"K", v:10 }
  ];
  const suits = ["♠️", "♥️", "♦️", "♣️"];
  const rank = ranks[Math.floor(Math.random() * ranks.length)];
  const suit = suits[Math.floor(Math.random() * suits.length)];
  return { rank: rank.r, suit, value: rank.v, text: `${rank.r}${suit}` };
}

function otoBjTotalV157(cards = []) {
  let total = cards.reduce((sum, c) => sum + Number(c.value || 0), 0);
  let aces = cards.filter(c => c.rank === "A").length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

function otoBjFormatCardsV157(cards = []) {
  return cards.map(c => `[${c.text}]`).join(" ");
}

function otoBjEnsurePlayerV157(player) {
  if (typeof otoV155Ensure === "function") return otoV155Ensure(player);
  if (typeof otoV151Ensure === "function") return otoV151Ensure(player);
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || { crates:{}, weapons:{}, fragments:{}, items:{} };
  player.team = Array.isArray(player.team) ? player.team : ["", "", ""];
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoBjFooterV157(desc = "", suffix = "Hansip Blackjack") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}

function otoBjEmbedV157(desc, type = "normal") {
  let color = config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF";
  const t = String(type || "normal").toLowerCase();
  if (["win", "success", "menang"].includes(t)) color = config.otoEmbedWinColor || "#22C55E";
  if (["lose", "error", "kalah"].includes(t)) color = config.otoEmbedLoseColor || "#EF4444";
  if (["draw", "warning", "seri"].includes(t)) color = config.otoEmbedWarningColor || "#FACC15";
  const embed = new EmbedBuilder().setColor(color).setDescription(otoBjFooterV157(desc, "Hansip Blackjack"));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoBjButtonsV157(session, disabled = false) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`oto_bj_hit:${session.id}`)
        .setLabel("Tambahin")
        .setEmoji("➕")
        .setStyle(ButtonStyle.Primary)
        .setDisabled(disabled),
      new ButtonBuilder()
        .setCustomId(`oto_bj_stand:${session.id}`)
        .setLabel("Stop")
        .setEmoji("🛑")
        .setStyle(ButtonStyle.Danger)
        .setDisabled(disabled)
    )
  ];
}

function otoBjDrawDealerAliveV157(session, mode = "hit") {
  let dealerTotal = otoBjTotalV157(session.dealerCards);
  if (dealerTotal >= 21) return false;

  // Dealer terasa hidup: kadang ikut nambah saat player klik Tambahin,
  // dan saat Stop dealer nambah sampai target random 16-20.
  if (mode === "hit") {
    let chance = 0.45;
    if (dealerTotal <= 11) chance = 0.95;
    else if (dealerTotal <= 14) chance = 0.70;
    else if (dealerTotal <= 16) chance = 0.55;
    else if (dealerTotal >= 19) chance = 0.12;

    if (Math.random() < chance) {
      session.dealerCards.push(otoBjCardV157());
      return true;
    }
    return false;
  }

  const target = 16 + Math.floor(Math.random() * 5); // 16-20
  while (otoBjTotalV157(session.dealerCards) < target && otoBjTotalV157(session.dealerCards) < 21) {
    session.dealerCards.push(otoBjCardV157());
    if (Math.random() < 0.20) break; // random biar tidak kaku
  }
  return true;
}

function otoBjPayoutV157(session, result) {
  if (result === "draw") return 0;
  if (result !== "win") return -session.bet;

  const luck = Number(session.luck || 1);
  let multiplier = 1;
  if (session.playerBlackjack) multiplier = 1.5;
  if (luck >= 60) multiplier += 0.10;
  if (luck >= 80) multiplier += 0.15;
  if (luck >= 95) multiplier += 0.25;

  return Math.max(1, Math.floor(session.bet * multiplier));
}

function otoBjResultV157(session, forceStand = false) {
  const pv = otoBjTotalV157(session.playerCards);
  const dv = otoBjTotalV157(session.dealerCards);

  const playerBust = pv > 21;
  const dealerBust = dv > 21;
  session.playerBlackjack = session.playerCards.length === 2 && pv === 21;

  if (playerBust && dealerBust) return "draw";
  if (playerBust) return "lose";
  if (dealerBust) return "win";
  if (session.playerBlackjack && pv > dv) return "win";

  if (!forceStand) return "playing";

  if (pv > dv) return "win";
  if (pv < dv) return "lose";
  return "draw";
}

function otoBjBuildDescV157(session, status = "playing", note = "") {
  const pv = otoBjTotalV157(session.playerCards);
  const dv = otoBjTotalV157(session.dealerCards);
  const statusTitle = status === "playing" ? "BERJALAN" : status === "win" ? "MENANG" : status === "lose" ? "KALAH" : "SERI";
  const actionLine = status === "playing"
    ? "Pilih tombol: **Tambahin** buat ambil kartu, atau **Stop** buat selesai."
    : "Game selesai. Coin ini hanya coin game Hansip, bukan uang asli.";

  return [
    `🃏 **Hansip Blackjack — ${statusTitle}**`,
    "",
    `Bet: **${session.bet.toLocaleString("id-ID")} Hansip Coin**`,
    `<a:clover:1513671524949823639>Luck: ${session.luck} • ${session.luckTier}`,
    "",
    `Dealer: ${otoBjFormatCardsV157(session.dealerCards)} = **${dv}**`,
    `Kamu: ${otoBjFormatCardsV157(session.playerCards)} = **${pv}**`,
    "",
    note ? `Info: ${note}` : "",
    actionLine
  ].filter(Boolean).join("\n");
}

async function otoBjFinishV157(session, interaction = null, reason = "") {
  const result = otoBjResultV157(session, true);
  const payout = otoBjPayoutV157(session, result);

  const user = session.user;
  const { player } = otoGetPlayer(user);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoBjEnsurePlayerV157(player);

  player.coin = Number(player.coin || 0) + payout;
  player.stats = player.stats || {};
  player.stats.blackjack = Number(player.stats.blackjack || 0) + 1;
  if (result === "win") player.stats.blackjackWin = Number(player.stats.blackjackWin || 0) + 1;
  if (result === "lose") player.stats.blackjackLose = Number(player.stats.blackjackLose || 0) + 1;
  if (result === "draw") player.stats.blackjackDraw = Number(player.stats.blackjackDraw || 0) + 1;
  if (typeof otoSavePlayer === "function") otoSavePlayer(user, player);

  session.status = result;
  session.finished = true;
  session.coinAfter = player.coin;
  OTO_BJ_SESSIONS_V157.delete(session.id);

  const payoutLine = result === "draw"
    ? "Hasil seri, bet kembali."
    : result === "win"
      ? `Kamu menang **+${payout.toLocaleString("id-ID")} Hansip Coin**.`
      : `Kamu kalah **-${Math.abs(payout).toLocaleString("id-ID")} Hansip Coin**.`;

  const desc = [
    otoBjBuildDescV157(session, result, reason),
    "",
    payoutLine,
    `Saldo sekarang: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`
  ].join("\n");

  const payload = { embeds: [otoBjEmbedV157(desc, result)], components: otoBjButtonsV157(session, true) };

  if (interaction) return interaction.update(payload);
  if (session.message && typeof session.message.edit === "function") return session.message.edit(payload);
}

async function otoCmdBlackjack(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  if (config.otoBlackjackEnabled === false) return replyOt(message, { content: "🃏 Hansip Blackjack sedang OFF." });

  const anim = typeof otoSendAnimationV156 === "function"
    ? await otoSendAnimationV156(message, "blackjack", "Meja kartu Hansip sedang dibuka...")
    : null;

  const wait = typeof otoCooldown === "function"
    ? otoCooldown(message.author.id, "blackjack", Number(config.otoRoyaleCooldownMs || 10000))
    : 0;

  if (wait) {
    const payload = { embeds: [otoBjEmbedV157(`⏳ Tunggu **${wait} detik** sebelum blackjack lagi.`, "warning")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoBjEnsurePlayerV157(player);

  const raw = String(args[0] || "").toLowerCase();
  let bet = raw === "all" ? Number(player.coin || 0) : Number(raw || 0);
  const min = Number(config.otoMinBet || 10);
  const max = Number(config.otoBlackjackMaxBet || config.otoMaxBet || 50000);

  if (!bet || bet < min) {
    const payload = { embeds: [otoBjEmbedV157(`⚠️ Format: \`otbj ${min}\` atau \`otbj all\`.\nMin bet **${min} Hansip Coin**.`, "warning")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  bet = Math.floor(bet);
  if (bet > max && raw !== "all") {
    const payload = { embeds: [otoBjEmbedV157(`❌ Max bet blackjack **${max.toLocaleString("id-ID")} Hansip Coin**.`, "error")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  if (bet > Number(player.coin || 0)) {
    const payload = { embeds: [otoBjEmbedV157("❌ Coin kamu kurang. Pakai `otkerja` atau `otdaily` dulu.", "error")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  const luckState = otoBjRollLuckV157(player, false);
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const id = `${message.author.id}_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const session = {
    id,
    userId: message.author.id,
    user: message.author,
    bet,
    luck: Number(luckState.value || 1),
    luckTier: luckState.tier || otoBjLuckTierV157(luckState.value || 1),
    playerCards: [otoBjCardV157(), otoBjCardV157()],
    dealerCards: [otoBjCardV157(), otoBjCardV157()],
    createdAt: Date.now(),
    finished: false
  };

  OTO_BJ_SESSIONS_V157.set(id, session);

  let initialStatus = otoBjResultV157(session, false);
  let payload;
  if (initialStatus !== "playing") {
    session.message = anim || null;
    return otoBjFinishV157(session, null, "Kartu awal langsung menentukan hasil.");
  }

  payload = {
    embeds: [otoBjEmbedV157(otoBjBuildDescV157(session, "playing", "Dealer siap. Musuh bisa nambah kartu otomatis."), "normal")],
    components: otoBjButtonsV157(session, false)
  };

  if (anim && typeof anim.edit === "function") {
    session.message = anim;
    await anim.edit(payload);
  } else {
    session.message = await replyOt(message, payload);
  }
}

async function otoHandleBlackjackButtonV157(interaction) {
  if (!interaction.isButton()) return false;
  const id = String(interaction.customId || "");
  if (!id.startsWith("oto_bj_hit:") && !id.startsWith("oto_bj_stand:")) return false;

  const [action, sessionId] = id.split(":");
  const session = OTO_BJ_SESSIONS_V157.get(sessionId);

  if (!session) {
    await interaction.reply({ content: "⚠️ Sesi blackjack ini sudah selesai atau expired. Mulai lagi dengan `otbj <jumlah>`.", ephemeral: true });
    return true;
  }

  if (interaction.user.id !== session.userId) {
    await interaction.reply({ content: "⚠️ Tombol ini cuma buat pemain yang mulai game blackjack ini.", ephemeral: true });
    return true;
  }

  if (session.finished) {
    await interaction.reply({ content: "⚠️ Game ini sudah selesai.", ephemeral: true });
    return true;
  }

  if (action === "oto_bj_hit") {
    session.playerCards.push(otoBjCardV157());
    const dealerDrew = otoBjDrawDealerAliveV157(session, "hit");
    const result = otoBjResultV157(session, false);
    const note = dealerDrew ? "Kamu ambil kartu, dealer juga ikut nambah kartu." : "Kamu ambil kartu, dealer memilih tahan dulu.";

    if (result !== "playing") return otoBjFinishV157(session, interaction, note);

    return interaction.update({
      embeds: [otoBjEmbedV157(otoBjBuildDescV157(session, "playing", note), "normal")],
      components: otoBjButtonsV157(session, false)
    });
  }

  if (action === "oto_bj_stand") {
    otoBjDrawDealerAliveV157(session, "stand");
    return otoBjFinishV157(session, interaction, "Kamu stop. Dealer jalan otomatis sampai berhenti.");
  }

  return false;
}

// Button listener khusus blackjack live.
try {
  if (typeof client !== "undefined" && client.on && !client.__otoBlackjackButtonsV157) {
    client.on("interactionCreate", async (interaction) => {
      try {
        const handled = await otoHandleBlackjackButtonV157(interaction);
        if (handled) return;
      } catch (err) {
        console.error("Hansip blackjack button error:", err);
        try {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Blackjack error sebentar. Coba `otbj <jumlah>` lagi.", ephemeral: true });
          }
        } catch (_) {}
      }
    });
    client.__otoBlackjackButtonsV157 = true;
  }
} catch (err) {
  console.error("Gagal pasang Hansip blackjack button listener:", err);
}

// Register command otbj agar router pasti kenal.
try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    OT_COMMAND_MAP.set("otbj", { name:"otbj", category:"member", permission:"member", usage:"otbj <jumlah/all>", description:"Blackjack Hansip live pakai tombol Tambahin dan Stop." });
  }
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) OTO_DIRECT_COMMANDS.add("otbj");
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) OTO_COMMAND_SET.add("otbj");
} catch (_) {}

if (typeof processOtoCommand === "function" && !processOtoCommand.__otoBjLiveButtonsV157) {
  const processOtoCommandOldBjV157 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];
    if (name === "otbj") return otoCmdBlackjack(message, args), true;
    return processOtoCommandOldBjV157(message, parsed, command);
  };
  processOtoCommand.__otoBjLiveButtonsV157 = true;
}


/* =========================
   Hansip FRAGMENT BOOSTER SUITE v1.58.0
   Fitur:
   - Command: otuse fragmen c/u/r/e/m/s
   - Alias: otuse fragment c, otuse c, otuse common
   - Fragment dipakai untuk boost hunt berikutnya.
   - Rarity kecil: random, bisa exp lumayan atau NPC lumayan.
   - Rarity besar: NPC dan EXP jauh lebih besar.
   - Alur premium jelas, tidak bikin member pusing.
   - Dashboard /dashboard/oto diperbarui dengan Fragment Booster Guide.
   - Tetap original Hansip, tidak copy asset/teks bot lain, hanya kualitas premium collection game.
========================= */

const OTO_FRAGMENT_V158 = {
  c: {
    aliases: ["c", "common", "com"],
    id: "common_fragment",
    label: "Common Fragment",
    letter: "<:LetterC:1513669277759176704>",
    emoji: "🙂",
    minNpc: 1,
    maxNpc: 3,
    minExp: 15,
    maxExp: 60,
    note: "Random ringan. Bisa nambah NPC atau EXP kecil."
  },
  u: {
    aliases: ["u", "uncommon", "unc"],
    id: "uncommon_fragment",
    label: "Uncommon Fragment",
    letter: "<:PastelGreenU:1513669101640482907>",
    emoji: "😎",
    minNpc: 2,
    maxNpc: 4,
    minExp: 40,
    maxExp: 120,
    note: "Boost menengah awal. NPC dan EXP lebih enak."
  },
  r: {
    aliases: ["r", "rare"],
    id: "rare_fragment",
    label: "Rare Fragment",
    letter: "<:PurpleR:1513668875189878785>",
    emoji: "🤓",
    minNpc: 3,
    maxNpc: 5,
    minExp: 100,
    maxExp: 260,
    note: "Boost rare. Cocok buat farming collection."
  },
  e: {
    aliases: ["e", "epic"],
    id: "epic_fragment",
    label: "Epic Fragment",
    letter: "<:letter_E:1513668672609189888>",
    emoji: "🥸",
    minNpc: 4,
    maxNpc: 7,
    minExp: 220,
    maxExp: 520,
    note: "Boost besar. NPC dan EXP naik jauh."
  },
  m: {
    aliases: ["m", "mythic"],
    id: "mythic_fragment",
    label: "Mythic Fragment",
    letter: "<a:LetterM:1513668125638398262>",
    emoji: "👑",
    minNpc: 6,
    maxNpc: 10,
    minExp: 500,
    maxExp: 1200,
    note: "Boost premium. Hasil hunt terasa mahal."
  },
  s: {
    aliases: ["s", "secret"],
    id: "secret_fragment",
    label: "Secret Fragment",
    letter: "<a:Alphabet_S:1513667784519712769>",
    emoji: "🧙‍♂️",
    minNpc: 8,
    maxNpc: 15,
    minExp: 1200,
    maxExp: 3000,
    note: "Boost tertinggi. Untuk hunt besar-besaran."
  }
};

function otoFragKeyV158(raw = "") {
  const q = String(raw || "").toLowerCase().trim();
  for (const [key, data] of Object.entries(OTO_FRAGMENT_V158)) {
    if (data.aliases.includes(q)) return key;
  }
  return "";
}

function otoFragEnsureV158(player) {
  if (typeof otoV155Ensure === "function") otoV155Ensure(player);
  else if (typeof otoV151Ensure === "function") otoV151Ensure(player);
  else {
    player.npcs = player.npcs || {};
    player.inventory = player.inventory || {};
    player.inventory.fragments = player.inventory.fragments || {};
    player.inventory.crates = player.inventory.crates || {};
    player.inventory.weapons = player.inventory.weapons || {};
    player.inventory.items = player.inventory.items || {};
    player.team = Array.isArray(player.team) ? player.team : ["", "", ""];
    player.stats = player.stats || {};
    if (player.coin === undefined) player.coin = 100;
  }

  player.inventory = player.inventory || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.otoActiveFragmentBoost = player.otoActiveFragmentBoost || null;
}

function otoFragRandV158(min, max) {
  return Math.max(min, Math.floor(min + Math.random() * (max - min + 1)));
}

function otoFragEmbedV158(desc = "", suffix = "Hansip Fragment", type = "normal") {
  if (typeof otoV155Embed === "function") return otoV155Embed(desc, suffix, type);
  if (typeof otoAnimEmbedV156 === "function") return otoAnimEmbedV156(desc, suffix, type);

  let color = config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF";
  if (type === "success") color = config.otoEmbedWinColor || "#22C55E";
  if (type === "error") color = config.otoEmbedLoseColor || "#EF4444";
  if (type === "warning") color = config.otoEmbedWarningColor || "#FACC15";

  const clean = String(desc || "").trimEnd();
  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(`${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`);
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoFragInventoryLinesV158(player) {
  otoFragEnsureV158(player);
  return Object.entries(OTO_FRAGMENT_V158).map(([key, data]) => {
    const qty = Number(player.inventory.fragments[data.id] || 0);
    return `${data.letter} ${data.emoji} ${key.toUpperCase()} — **${qty}** ${data.label}`;
  }).join("\n");
}

function otoFragGuideV158(player = null) {
  const inv = player ? `\n\n**Fragment Kamu**\n${otoFragInventoryLinesV158(player)}` : "";
  return [
    "🧩 **Hansip Fragment Booster**",
    "",
    "Fragment bisa dipakai untuk memperkuat **hunt berikutnya**.",
    "Semakin tinggi rarity fragment, semakin besar peluang dapat **NPC lebih banyak** dan **EXP lebih besar**.",
    "",
    "**Command:**",
    "`otuse fragmen c` — pakai Common Fragment",
    "`otuse fragmen u` — pakai Uncommon Fragment",
    "`otuse fragmen r` — pakai Rare Fragment",
    "`otuse fragmen e` — pakai Epic Fragment",
    "`otuse fragmen m` — pakai Mythic Fragment",
    "`otuse fragmen s` — pakai Secret Fragment",
    "",
    "**Alur:**",
    "`otinv` → `otuse fragmen <c/u/r/e/m/s>` → `oth` → hasil hunt naik",
    inv
  ].join("\n");
}

async function otoCmdUseFragmentV158(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;

  const anim = typeof otoSendAnimationV156 === "function"
    ? await otoSendAnimationV156(message, "luck", "Mengaktifkan fragment booster...")
    : null;

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoFragEnsureV158(player);

  let typeArg = "";
  const first = String(args[0] || "").toLowerCase();
  if (["fragmen", "fragment", "frag", "fragments"].includes(first)) typeArg = args[1] || "";
  else typeArg = args[0] || "";

  const key = otoFragKeyV158(typeArg);

  if (!key) {
    const payload = { embeds: [otoFragEmbedV158(otoFragGuideV158(player), "Hansip Fragment", "warning")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  const data = OTO_FRAGMENT_V158[key];
  const qty = Number(player.inventory.fragments[data.id] || 0);

  if (qty <= 0) {
    const payload = { embeds: [otoFragEmbedV158([
      `❌ Kamu belum punya ${data.letter} **${data.label}**.`,
      "",
      "Cari fragment dari duplicate NPC saat `oth`, crate, atau reward event.",
      "",
      "**Cek fragment:** `otinv`",
      "**Lanjut:** `oth` → dapat duplicate → fragment bertambah"
    ].join("\n"), "Hansip Fragment", "error")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  if (player.otoActiveFragmentBoost && player.otoActiveFragmentBoost.key) {
    const old = OTO_FRAGMENT_V158[player.otoActiveFragmentBoost.key] || null;
    const payload = { embeds: [otoFragEmbedV158([
      "⚠️ Kamu masih punya fragment boost aktif.",
      "",
      old ? `Aktif sekarang: ${old.letter} **${old.label}**` : "Aktif sekarang: fragment boost",
      "Pakai `oth` dulu untuk menghabiskan boost itu.",
      "",
      "Setelah `oth`, kamu bisa pakai fragment lagi."
    ].join("\n"), "Hansip Fragment", "warning")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  }

  player.inventory.fragments[data.id] = qty - 1;
  const npcBonus = otoFragRandV158(data.minNpc, data.maxNpc);
  const expBonus = otoFragRandV158(data.minExp, data.maxExp);

  player.otoActiveFragmentBoost = {
    key,
    id: data.id,
    label: data.label,
    letter: data.letter,
    emoji: data.emoji,
    npcBonus,
    expBonus,
    usedAt: Date.now(),
    usedBy: message.author.id
  };

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `🧩 ${data.letter} ${data.emoji} **${data.label} aktif!**`,
    "",
    `Boost hunt berikutnya:`,
    `🎴 NPC tambahan: **+${npcBonus}**`,
    `⭐ EXP tambahan: **+${expBonus}**`,
    "",
    `Sisa ${data.label}: **${Math.max(0, qty - 1)}**`,
    "",
    "✅ Sekarang pakai `oth` untuk mengaktifkan hasil boost.",
    "",
    `Catatan: ${data.note}`
  ].join("\n");

  const payload = { embeds: [otoFragEmbedV158(desc, "Hansip Fragment", "success")] };
  if (anim && typeof anim.edit === "function") return anim.edit(payload);
  return replyOt(message, payload);
}

// Override hunt supaya fragment boost masuk ke hasil `oth`.
if (typeof otoCmdHunt === "function" && !otoCmdHunt.__fragmentBoostV158) {
  const otoCmdHuntOldV158 = otoCmdHunt;

  otoCmdHunt = async function(message) {
    if (!(await otoEnsureChannel(message))) return;

    const wait = typeof otoCooldown === "function"
      ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000))
      : 0;

    if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

    const anim = typeof otoSendAnimationV156 === "function"
      ? await otoSendAnimationV156(message, "hunt", "Mencari NPC dengan Hansip boost...")
      : null;

    const { player } = otoGetPlayer(message.author);
    if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
    otoFragEnsureV158(player);

    const cost = Number(config.otoHuntCost || 5);
    if (Number(player.coin || 0) < cost) {
      const payload = { embeds: [otoFragEmbedV158(`❌ Coin kamu kurang.\n\nButuh **${cost} Hansip Coin** buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "Hansip Hunt", "error")] };
      if (anim && typeof anim.edit === "function") return anim.edit(payload);
      return replyOt(message, payload);
    }

    player.coin = Number(player.coin || 0) - cost;

    const boost = player.otoActiveFragmentBoost || null;
    const baseCount = 1 + Math.floor(Math.random() * 3);
    const extraNpc = boost ? Number(boost.npcBonus || 0) : 0;
    const count = Math.max(1, Math.min(18, baseCount + extraNpc));

    let xp = 0, dup = 0, frag = 0, dust = 0;
    const found = [], recent = [];

    const pickNpc = typeof otoV155PickNpc === "function" ? otoV155PickNpc : (typeof otoV151PickNpc === "function" ? otoV151PickNpc : null);
    const addNpc = typeof otoV155AddNpc === "function" ? otoV155AddNpc : (typeof otoV151AddNpc === "function" ? otoV151AddNpc : null);
    const letter = typeof otoV155Letter === "function" ? otoV155Letter : (r => (OTO_FRAGMENT_V158[r?.[0]]?.letter || "<:LetterC:1513669277759176704>"));
    const fallbackNpc = { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 };

    for (let i = 0; i < count; i++) {
      const npc = pickNpc ? pickNpc() : fallbackNpc;
      const add = addNpc ? addNpc(player, npc) : { duplicate:false, fragQty:0, dustQty:0 };
      const rarity = String(npc.rarity || "common").toLowerCase();
      const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[rarity] || 7) + Math.floor(Math.random() * 5);
      xp += xpGain;
      found.push(`${letter(rarity)} ${npc.emoji || "🙂"} ${npc.name}`);
      recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji || "🙂", rarity, duplicate:add.duplicate });
      if (add.duplicate) { dup++; frag += Number(add.fragQty || 1); dust += Number(add.dustQty || 5); }
    }

    const expBoost = boost ? Number(boost.expBonus || 0) : 0;
    xp += expBoost;

    player.exp = Number(player.exp || 0) + xp;
    if (typeof otoV155Level === "function") player.level = otoV155Level(player);
    else if (typeof otoV151Level === "function") player.level = otoV151Level(player);
    else player.level = Math.max(1, Number(player.level || 1));

    player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust, fragmentBoost: boost };
    player.stats = player.stats || {};
    player.stats.hunts = Number(player.stats.hunts || 0) + 1;
    player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;
    if (boost) {
      player.stats.fragmentBoostUsed = Number(player.stats.fragmentBoostUsed || 0) + 1;
      player.otoActiveFragmentBoost = null;
    }

    if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

    const luckLine = typeof otoV155LuckLine === "function"
      ? otoV155LuckLine(player)
      : "<a:clover:1513671524949823639>Luck: 24 • Normal";

    const foundText = found.length > 5
      ? `${found.slice(0, 5).join(" • ")} • +${found.length - 5} NPC lain`
      : found.join(" • ");

    const desc = [
      `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
      `▫️ | ${recent.slice(0, 10).map(n => n.emoji || "🙂").join(" ")} mendapat ${xp} XP!`,
      `🎴 | ${foundText}`,
      "",
      boost ? `🧩 | Boost: ${boost.letter} ${boost.label} memberi +${extraNpc} NPC dan +${expBoost} EXP!` : "",
      dup ? `🔁 | ${dup} duplicate berubah jadi <:PurpleR:1513668875189878785> ${frag} Fragment dan 🎴 ${dust} Dust!` : "",
      luckLine,
      "✅ NPC sudah tersimpan ke collection."
    ].filter(Boolean).join("\n");

    const payload = { embeds: [otoFragEmbedV158(desc, "Hansip Hunt", "normal")] };
    if (anim && typeof anim.edit === "function") return anim.edit(payload);
    return replyOt(message, payload);
  };

  otoCmdHunt.__fragmentBoostV158 = true;
}

// Override inventory supaya fragment terlihat jelas.
if (typeof otoCmdInv === "function" && !otoCmdInv.__fragmentV158) {
  const otoCmdInvOldV158 = otoCmdInv;
  otoCmdInv = async function(message, args = []) {
    if (!(await otoEnsureChannel(message))) return;
    const { player } = otoGetPlayer(message.author);
    if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
    otoFragEnsureV158(player);

    const crates = Object.entries(player.inventory.crates || {})
      .filter(([,v]) => Number(v) > 0)
      .map(([k,v]) => `${k}: **${v}**`)
      .join("\n") || "Belum ada crate.";

    const active = player.otoActiveFragmentBoost
      ? `${player.otoActiveFragmentBoost.letter} **${player.otoActiveFragmentBoost.label}** aktif untuk hunt berikutnya.`
      : "Tidak ada fragment boost aktif.";

    const desc = [
      "🎒 **Hansip Inventory**",
      "",
      `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
      `Dust: **${Number(player.dust || 0).toLocaleString("id-ID")}**`,
      "",
      "**Crate**",
      crates,
      "",
      "**Fragment**",
      otoFragInventoryLinesV158(player),
      "",
      "**Boost Aktif**",
      active,
      "",
      "Pakai: `otuse fragmen c/u/r/e/m/s`",
      "Lanjut: `otuse fragmen r` → `oth`"
    ].join("\n");

    return replyOt(message, { embeds: [otoFragEmbedV158(desc, "Hansip Inventory")] });
  };
  otoCmdInv.__fragmentV158 = true;
}

// Register command otuse.
try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    OT_COMMAND_MAP.set("otuse", {
      name: "otuse",
      category: "member",
      permission: "member",
      usage: "otuse fragmen c/u/r/e/m/s",
      description: "Pakai fragment untuk boost hunt Hansip berikutnya."
    });
  }
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) OTO_DIRECT_COMMANDS.add("otuse");
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) OTO_COMMAND_SET.add("otuse");
} catch (err) {
  console.error("Register otuse gagal:", err);
}

if (typeof processOtoCommand === "function" && !processOtoCommand.__otoUseFragmentV158) {
  const processOtoCommandOldUseV158 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];
    if (name === "otuse") return otoCmdUseFragmentV158(message, args), true;
    return processOtoCommandOldUseV158(message, parsed, command);
  };
  processOtoCommand.__otoUseFragmentV158 = true;
}

// Dashboard patch: add fragment booster route/status if express app exists.
try {
  if (typeof app !== "undefined" && app.get && !app.__otoFragmentDashboardV158) {
    app.get("/api/oto/fragment-guide", (req, res) => {
      res.json({
        ok: true,
        version: "5.9.99",
        command: "otuse fragmen c/u/r/e/m/s",
        appliesTo: "next oth",
        table: OTO_FRAGMENT_V158,
        flow: ["otinv", "otuse fragmen r", "oth", "otnpc recent", "otteam add <npcId> slot 1"]
      });
    });

    app.get("/dashboard/oto/fragments", (req, res) => {
      const rows = Object.entries(OTO_FRAGMENT_V158).map(([key, f]) =>
        `<tr><td>${key.toUpperCase()}</td><td>${f.letter} ${f.emoji} ${f.label}</td><td>+${f.minNpc}-${f.maxNpc} NPC</td><td>+${f.minExp}-${f.maxExp} EXP</td><td><code>otuse fragmen ${key}</code></td></tr>`
      ).join("");

      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Hansip Fragment Booster</title>
      <style>
      body{margin:0;background:#07111f;color:#eaf7ff;font-family:Inter,Arial,sans-serif}
      .wrap{max-width:1100px;margin:0 auto;padding:28px}
      .hero{background:linear-gradient(135deg,#07111f,#0B5CFF33,#00E5FF22);border:1px solid #00E5FF55;border-radius:22px;padding:24px}
      table{width:100%;border-collapse:collapse;margin-top:18px;background:#0b1729;border-radius:16px;overflow:hidden}
      th,td{padding:12px;border-bottom:1px solid #163c68;text-align:left}
      th{color:#7ee7ff;background:#091426}
      code{background:#06101d;border:1px solid #17446f;border-radius:8px;padding:2px 6px;color:#d6fbff}
      a{color:#7ee7ff}
      </style></head><body><div class="wrap">
      <div class="hero"><h1>🧩 Hansip Fragment Booster</h1><p>Fragment dipakai untuk memperkuat hunt berikutnya. Semakin tinggi rarity, semakin besar NPC dan EXP.</p><p><a href="/dashboard/oto">← Kembali ke Hansip Dashboard</a></p></div>
      <table><thead><tr><th>Rarity</th><th>Fragment</th><th>NPC Boost</th><th>EXP Boost</th><th>Command</th></tr></thead><tbody>${rows}</tbody></table>
      </div></body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });

    app.__otoFragmentDashboardV158 = true;
  }
} catch (err) {
  console.error("Hansip fragment dashboard gagal:", err);
}


/* =========================
   Hansip NPC LEVEL EXP SYSTEM v1.59.0
   Fitur:
   - Setiap NPC punya level dan EXP sendiri.
   - NPC level naik dari NPC EXP, bukan asal level random.
   - Battle memberi EXP ke NPC yang ada di team.
   - Power NPC naik mengikuti level.
   - otnpc, otnpc recent, otteam, otb menampilkan level dan EXP NPC dengan jelas.
   - Tidak reset data lama: NPC lama yang belum punya exp/level akan diberi default aman.
========================= */

function otoNpcMaxLevelV159() {
  return Number(config.otoNpcLevelMax || 100);
}

function otoNpcExpRequiredV159(level = 1) {
  const lv = Math.max(1, Number(level || 1));
  const base = Number(config.otoNpcBaseExpRequired || 100);
  const growth = Number(config.otoNpcExpGrowth || 1.18);
  return Math.max(50, Math.floor(base * Math.pow(growth, lv - 1)));
}

function otoNpcNormalizeV159(npc) {
  if (!npc) return npc;
  npc.level = Math.max(1, Math.min(otoNpcMaxLevelV159(), Number(npc.level || 1)));
  npc.exp = Math.max(0, Number(npc.exp || 0));
  npc.power = Number(npc.power || 100);
  npc.duplicates = Number(npc.duplicates || 0);
  npc.locked = Boolean(npc.locked || false);
  return npc;
}

function otoNpcNormalizePlayerV159(player) {
  if (typeof otoFragEnsureV158 === "function") otoFragEnsureV158(player);
  else if (typeof otoV155Ensure === "function") otoV155Ensure(player);
  else if (typeof otoV151Ensure === "function") otoV151Ensure(player);

  player.npcs = player.npcs || {};
  for (const npc of Object.values(player.npcs)) otoNpcNormalizeV159(npc);
  return player;
}

function otoNpcPowerV159(npc) {
  otoNpcNormalizeV159(npc);
  const perLevel = Number(config.otoNpcPowerPerLevel || 25);
  return Number(npc.power || 100) + (Number(npc.level || 1) - 1) * perLevel;
}

function otoNpcExpBarV159(npc) {
  otoNpcNormalizeV159(npc);
  const need = otoNpcExpRequiredV159(npc.level);
  return `Lv.${npc.level} • EXP ${npc.exp}/${need}`;
}

function otoNpcAddExpV159(npc, amount = 0) {
  otoNpcNormalizeV159(npc);
  const before = Number(npc.level || 1);
  let gained = Math.max(0, Number(amount || 0));
  npc.exp += gained;

  const max = otoNpcMaxLevelV159();
  while (npc.level < max && npc.exp >= otoNpcExpRequiredV159(npc.level)) {
    npc.exp -= otoNpcExpRequiredV159(npc.level);
    npc.level += 1;
  }

  return {
    before,
    after: npc.level,
    leveled: npc.level > before,
    gained
  };
}

function otoNpcLetterV159(rarity = "common") {
  if (typeof otoV155Letter === "function") return otoV155Letter(rarity);
  const map = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>"
  };
  return map[String(rarity || "common").toLowerCase()] || map.common;
}

function otoNpcEmbedV159(desc = "", suffix = "Hansip NPC", type = "normal") {
  if (typeof otoFragEmbedV158 === "function") return otoFragEmbedV158(desc, suffix, type);
  if (typeof otoV155Embed === "function") return otoV155Embed(desc, suffix, type);
  const embed = new EmbedBuilder()
    .setColor(config.otoEmbedNormalColor || config.otoEmbedAccent || "#00E5FF")
    .setDescription(`${String(desc || "").trimEnd()}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`);
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

// Override add NPC supaya NPC baru selalu punya level/exp.
if (typeof otoV155AddNpc === "function" && !otoV155AddNpc.__npcLevelV159) {
  const otoV155AddNpcOldV159 = otoV155AddNpc;
  otoV155AddNpc = function(player, npc) {
    const result = otoV155AddNpcOldV159(player, npc);
    otoNpcNormalizePlayerV159(player);
    if (player.npcs && player.npcs[npc.id]) {
      player.npcs[npc.id].level = Math.max(1, Number(player.npcs[npc.id].level || config.otoNpcHuntStartLevel || 1));
      player.npcs[npc.id].exp = Math.max(0, Number(player.npcs[npc.id].exp || config.otoNpcHuntStartExp || 0));
    }
    return result;
  };
  otoV155AddNpc.__npcLevelV159 = true;
}

if (typeof otoV151AddNpc === "function" && !otoV151AddNpc.__npcLevelV159) {
  const otoV151AddNpcOldV159 = otoV151AddNpc;
  otoV151AddNpc = function(player, npc) {
    const result = otoV151AddNpcOldV159(player, npc);
    otoNpcNormalizePlayerV159(player);
    if (player.npcs && player.npcs[npc.id]) {
      player.npcs[npc.id].level = Math.max(1, Number(player.npcs[npc.id].level || config.otoNpcHuntStartLevel || 1));
      player.npcs[npc.id].exp = Math.max(0, Number(player.npcs[npc.id].exp || config.otoNpcHuntStartExp || 0));
    }
    return result;
  };
  otoV151AddNpc.__npcLevelV159 = true;
}

// Override power helper supaya power memakai NPC level.
function otoV155Power(npc) { return otoNpcPowerV159(npc); }
function otoV151Power(npc) { return otoNpcPowerV159(npc); }
function otoV145NpcPower(npc) { return otoNpcPowerV159(npc); }

// Override otnpc agar level/EXP jelas.
if (typeof otoCmdNpc === "function" && !otoCmdNpc.__npcLevelV159) {
  const otoCmdNpcOldV159 = otoCmdNpc;

  otoCmdNpc = async function(message, args = []) {
    if (!(await otoEnsureChannel(message))) return;
    const q = String(args[0] || "").toLowerCase();
    const { player } = otoGetPlayer(message.author);
    if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
    otoNpcNormalizePlayerV159(player);

    const rarityKeys = ["common","uncommon","rare","epic","mythic","secret"];

    if (q === "recent") {
      const recent = player.lastHunt?.npcs || [];
      const lines = recent.length ? recent.map((n, i) => {
        const owned = player.npcs[n.id] || n;
        otoNpcNormalizeV159(owned);
        return `${i+1}. ${otoNpcLetterV159(n.rarity)} ${n.emoji || owned.emoji || "🙂"} \`${n.id}\` — **${n.name || owned.name}** • ${otoNpcExpBarV159(owned)} • Power ${otoNpcPowerV159(owned).toLocaleString("id-ID")}${n.duplicate ? " • duplicate" : ""}`;
      }).join("\n") : "Belum ada hasil hunt. Jalankan `oth` dulu.";

      return replyOt(message, {
        embeds: [otoNpcEmbedV159(`🎴 **Hasil Hunt Terakhir**\n\n${lines}\n\nLanjut: \`otteam add <npcId> slot 1\` → \`otteam view\` → \`otb\``, "Hansip NPC")]
      });
    }

    if (rarityKeys.includes(q)) {
      const catalog = typeof OTO_NPC_CATALOG_V155 !== "undefined" ? OTO_NPC_CATALOG_V155 : (typeof OTO_CATALOG_V151 !== "undefined" ? OTO_CATALOG_V151 : {});
      const list = catalog[q] || [];
      if (list.length) {
        const lines = list.map((npc, i) => {
          const owned = player.npcs[npc.id];
          if (!owned) return `${i+1}. ${otoNpcLetterV159(q)} :grey_question:⁰⁰ \`${npc.id}\` — **${npc.name}** • Belum punya`;
          otoNpcNormalizeV159(owned);
          const count = 1 + Number(owned.duplicates || 0);
          const sup = typeof otoV155Sup === "function" ? otoV155Sup(count) : String(count);
          return `${i+1}. ${otoNpcLetterV159(q)} ${owned.emoji || npc.emoji || "🙂"}${sup} \`${owned.id}\` — **${owned.name}** • ${otoNpcExpBarV159(owned)} • Power ${otoNpcPowerV159(owned).toLocaleString("id-ID")}`;
        }).join("\n");

        return replyOt(message, {
          embeds: [otoNpcEmbedV159(`${otoNpcLetterV159(q)} **${q.toUpperCase()} NPC List — Level & EXP**\n\n${lines}\n\nLanjut: \`oth\` → \`otteam add <npcId> slot 1\` → \`otb\``, "Hansip NPC")]
        });
      }
    }

    return otoCmdNpcOldV159(message, args);
  };

  otoCmdNpc.__npcLevelV159 = true;
}

// Override team view/add agar level/EXP tampil.
if (typeof otoCmdTeam === "function" && !otoCmdTeam.__npcLevelV159) {
  const otoCmdTeamOldV159 = otoCmdTeam;

  otoCmdTeam = async function(message, args = []) {
    if (!(await otoEnsureChannel(message))) return;
    const sub = String(args[0] || "view").toLowerCase();
    const { player } = otoGetPlayer(message.author);
    if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
    otoNpcNormalizePlayerV159(player);

    if (sub === "view") {
      const lines = [0,1,2].map(i => {
        const id = player.team?.[i] || "";
        const npc = id ? player.npcs[id] : null;
        if (!npc) return `Slot ${i+1}: Kosong`;
        return `Slot ${i+1}: ${otoNpcLetterV159(npc.rarity)} ${npc.emoji || "🙂"} \`${npc.id}\` — **${npc.name}** • ${otoNpcExpBarV159(npc)} • Power ${otoNpcPowerV159(npc).toLocaleString("id-ID")}`;
      }).join("\n");

      return replyOt(message, {
        embeds: [otoNpcEmbedV159(`⚔️ **Hansip Team**\n\n${lines}\n\nTeam Power: **${(player.team || []).reduce((s,id)=>s+(player.npcs[id] ? otoNpcPowerV159(player.npcs[id]) : 0),0).toLocaleString("id-ID")}**\n\nNPC team dapat EXP dari battle.`, "Hansip Team")]
      });
    }

    return otoCmdTeamOldV159(message, args);
  };

  otoCmdTeam.__npcLevelV159 = true;
}

// Override battle: NPC team dapat EXP dan bisa level up.
if (typeof otoCmdBattle === "function" && !otoCmdBattle.__npcLevelV159) {
  const otoCmdBattleOldV159 = otoCmdBattle;

  otoCmdBattle = async function(message) {
    if (!(await otoEnsureChannel(message))) return;
    const { player } = otoGetPlayer(message.author);
    if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
    otoNpcNormalizePlayerV159(player);

    const team = (player.team || []).map(id => player.npcs[id]).filter(Boolean);
    if (!team.length) {
      return replyOt(message, {
        embeds: [otoNpcEmbedV159("❌ Team masih kosong.\n\nAlur aman:\n1. `oth`\n2. `otnpc recent`\n3. `otteam add <npcId> slot 1`\n4. `otb`", "Hansip Battle", "error")]
      });
    }

    const power = team.reduce((s,n)=>s+otoNpcPowerV159(n),0);
    const luck = typeof otoV155EnsureLuck === "function" ? otoV155EnsureLuck(player, false) : { value: 10, tier: "Normal" };
    const enemy = Math.max(100, Math.floor(power * (0.75 + Math.random()*0.75)));
    const chance = Math.max(10, Math.min(90, Math.round((power + Number(luck.value || 1)*10) / Math.max(1, power+enemy) * 100)));
    const win = Math.random()*100 < chance;

    const coin = win ? 140+Math.floor(Math.random()*180) : 35+Math.floor(Math.random()*60);
    const playerXp = win ? 45+Math.floor(Math.random()*70) : 15+Math.floor(Math.random()*35);
    const npcExp = win
      ? Number(config.otoNpcBattleExpWinMin || 30) + Math.floor(Math.random() * (Number(config.otoNpcBattleExpWinMax || 80) - Number(config.otoNpcBattleExpWinMin || 30) + 1))
      : Number(config.otoNpcBattleExpLoseMin || 10) + Math.floor(Math.random() * (Number(config.otoNpcBattleExpLoseMax || 35) - Number(config.otoNpcBattleExpLoseMin || 10) + 1));

    const levelLines = [];
    for (const npc of team) {
      const res = otoNpcAddExpV159(npc, npcExp);
      if (res.leveled) levelLines.push(`✨ ${npc.emoji || "🙂"} **${npc.name}** naik Lv.${res.before} → **Lv.${res.after}**`);
    }

    player.coin = Number(player.coin || 0) + coin;
    player.exp = Number(player.exp || 0) + playerXp;
    player.stats = player.stats || {};
    player.stats.battleWin = Number(player.stats.battleWin || 0) + (win ? 1 : 0);
    player.stats.battleLose = Number(player.stats.battleLose || 0) + (win ? 0 : 1);

    // Reward kecil kalau ada NPC level up
    if (levelLines.length) {
      player.coin += Number(config.otoNpcLevelUpCoinReward || 50) * levelLines.length;
      player.dust = Number(player.dust || 0) + Number(config.otoNpcLevelUpDustReward || 3) * levelLines.length;
    }

    if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

    const teamLines = team.map((n,i)=>`${i+1}. ${otoNpcLetterV159(n.rarity)} ${n.emoji || "🙂"} **${n.name}** • ${otoNpcExpBarV159(n)}`).join("\n");

    const desc = [
      `⚔️ **Hansip Battle — ${win ? "MENANG" : "KALAH"}**`,
      "",
      teamLines,
      "",
      `Power Team: **${power.toLocaleString("id-ID")}**`,
      `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
      `<a:clover:1513671524949823639>Luck: ${luck.value} • ${luck.tier}`,
      `Chance: **${chance}%**`,
      "",
      win ? `💎 Menang! Reward **${coin} Hansip Coin** + **${playerXp} Player XP**.` : `💨 Kalah, tapi tetap dapat **${coin} Hansip Coin** + **${playerXp} Player XP**.`,
      `🎴 NPC Team EXP: **+${npcExp}**`,
      levelLines.length ? "" : "",
      ...levelLines,
      "",
      "Lanjut: `otteam view` • `otprofile` • `oth`"
    ].filter(Boolean).join("\n");

    return replyOt(message, {
      embeds: [otoNpcEmbedV159(desc, "Hansip Battle", win ? "success" : "error")]
    });
  };

  otoCmdBattle.__npcLevelV159 = true;
}

// New command: otcard <npcId> for detailed NPC level card without image.
async function otoCmdCardV159(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoNpcNormalizePlayerV159(player);

  const query = args.join(" ").trim();
  if (!query) {
    return replyOt(message, {
      embeds: [otoNpcEmbedV159("⚠️ Format: `otcard <npcId>`\n\nContoh: `otcard penjaga_warung_ot`\nCek ID dari `otnpc recent`.", "Hansip Card", "warning")]
    });
  }

  const q = query.toLowerCase();
  const npc = Object.values(player.npcs || {}).find(n =>
    n.id === q ||
    String(n.name || "").toLowerCase() === q ||
    String(n.name || "").toLowerCase().includes(q)
  );

  if (!npc) {
    return replyOt(message, {
      embeds: [otoNpcEmbedV159("❌ NPC tidak ditemukan di collection kamu.\n\nCek dulu dengan `otnpc` atau `otnpc recent`.", "Hansip Card", "error")]
    });
  }

  otoNpcNormalizeV159(npc);
  const need = otoNpcExpRequiredV159(npc.level);

  const desc = [
    `${otoNpcLetterV159(npc.rarity)} ${npc.emoji || "🙂"} **${npc.name}**`,
    "",
    `ID: \`${npc.id}\``,
    `Rarity: **${String(npc.rarity || "common").toUpperCase()}**`,
    `Element: **${npc.element || "Tulus"}**`,
    "",
    `Level: **${npc.level}**`,
    `EXP: **${npc.exp}/${need}**`,
    `Power: **${otoNpcPowerV159(npc).toLocaleString("id-ID")}**`,
    `Duplicate: **${Number(npc.duplicates || 0)}**`,
    `Status: ${npc.locked ? "🔒 Locked" : "🔓 Unlocked"}`,
    "",
    "Cara naik level:",
    "`otteam add <npcId> slot 1` → `otb`",
    "NPC yang ikut battle akan mendapat NPC EXP."
  ].join("\n");

  return replyOt(message, { embeds: [otoNpcEmbedV159(desc, "Hansip Card")] });
}

// Register otcard command if not already.
try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    OT_COMMAND_MAP.set("otcard", {
      name: "otcard",
      category: "member",
      permission: "member",
      usage: "otcard <npcId>",
      description: "Lihat detail level dan EXP NPC."
    });
  }
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) OTO_DIRECT_COMMANDS.add("otcard");
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) OTO_COMMAND_SET.add("otcard");
} catch (_) {}

if (typeof processOtoCommand === "function" && !processOtoCommand.__npcLevelV159) {
  const processOtoCommandOldNpcLevelV159 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];
    if (name === "otcard") return otoCmdCardV159(message, args), true;
    return processOtoCommandOldNpcLevelV159(message, parsed, command);
  };
  processOtoCommand.__npcLevelV159 = true;
}

// Dashboard/API guide for NPC level system.
try {
  if (typeof app !== "undefined" && app.get && !app.__otoNpcLevelDashboardV159) {
    app.get("/api/oto/npc-level-guide", (req, res) => {
      res.json({
        ok: true,
        version: "5.9.99",
        system: "NPC Level EXP",
        rules: {
          maxLevel: otoNpcMaxLevelV159(),
          baseExpRequired: Number(config.otoNpcBaseExpRequired || 100),
          expGrowth: Number(config.otoNpcExpGrowth || 1.18),
          powerPerLevel: Number(config.otoNpcPowerPerLevel || 25)
        },
        flow: ["oth", "otnpc recent", "otteam add <npcId> slot 1", "otb", "otteam view", "otcard <npcId>"]
      });
    });

    app.get("/dashboard/oto/npc-level", (req, res) => {
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Hansip NPC Level EXP</title>
      <style>
      body{margin:0;background:#07111f;color:#eaf7ff;font-family:Inter,Arial,sans-serif}
      .wrap{max-width:1050px;margin:0 auto;padding:28px}
      .hero{background:linear-gradient(135deg,#07111f,#0B5CFF33,#00E5FF22);border:1px solid #00E5FF55;border-radius:22px;padding:24px}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:18px}
      .card{background:#0b1729;border:1px solid #163c68;border-radius:18px;padding:16px}
      code{background:#06101d;border:1px solid #17446f;border-radius:8px;padding:2px 6px;color:#d6fbff}
      a{color:#7ee7ff}
      </style></head><body><div class="wrap">
      <div class="hero"><h1>🎴 Hansip NPC Level EXP</h1><p>Setiap NPC punya level dan EXP sendiri. NPC naik level dari battle.</p><p><a href="/dashboard/oto">← Kembali ke Hansip Dashboard</a></p></div>
      <div class="grid">
      <div class="card"><b>Alur</b><p><code>oth</code> → <code>otnpc recent</code> → <code>otteam add &lt;npcId&gt; slot 1</code> → <code>otb</code></p></div>
      <div class="card"><b>Level</b><p>NPC mulai Lv.1 dan naik otomatis saat EXP cukup.</p></div>
      <div class="card"><b>Power</b><p>Power NPC naik setiap level. Makin tinggi level, makin kuat di battle.</p></div>
      <div class="card"><b>Card</b><p>Pakai <code>otcard &lt;npcId&gt;</code> untuk lihat detail level dan EXP.</p></div>
      </div></div></body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });

    app.__otoNpcLevelDashboardV159 = true;
  }
} catch (err) {
  console.error("Hansip NPC level dashboard gagal:", err);
}


/* =========================
   Hansip BLACKJACK DEALER LIVE AI v1.60.0
   Fix:
   - Dealer/musuh tidak ngestuck.
   - Saat player klik Tambahin, dealer ikut mikir dan bisa nambah kartu random.
   - Saat player klik Stop, dealer jalan otomatis sampai target random / mengejar player.
   - Dealer tidak selalu diam di angka besar seperti 20; dia punya keputusan hidup.
   - Tetap tombol Tambahin + Stop, animasi 2 detik, emoji-only.
========================= */

function otoBjSleepV160(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function otoBjDealerTargetV160(session) {
  const min = Number(config.otoBlackjackDealerRandomTargetMin || 16);
  const max = Number(config.otoBlackjackDealerRandomTargetMax || 21);
  const playerTotal = otoBjTotalV157(session.playerCards);
  const base = min + Math.floor(Math.random() * (max - min + 1));
  // Dealer hidup: kadang ngejar angka player kalau player tinggi.
  if (playerTotal >= 18 && Math.random() < 0.65) return Math.min(21, Math.max(base, playerTotal));
  return base;
}

function otoBjDealerDecisionV160(session, mode = "hit") {
  const dealerTotal = otoBjTotalV157(session.dealerCards);
  const playerTotal = otoBjTotalV157(session.playerCards);

  if (dealerTotal >= 21) return false;

  if (mode === "hit") {
    // Dealer tidak diem: kalau dealer kecil, pasti/sering nambah.
    if (dealerTotal <= 11) return true;
    if (dealerTotal <= 14) return Math.random() < 0.85;
    if (dealerTotal <= 16) return Math.random() < 0.65;

    // Kalau player lebih tinggi, dealer kadang ngejar.
    if (playerTotal > dealerTotal && dealerTotal <= 19) return Math.random() < 0.55;

    // Biar tidak stuck di 20 terus: 20 biasanya tahan, tapi 19/20 masih bisa risk kecil.
    if (dealerTotal === 19) return Math.random() < 0.18;
    if (dealerTotal === 20) return Math.random() < 0.05;

    return Math.random() < 0.12;
  }

  // Saat Stop: dealer auto jalan lebih agresif sampai target random.
  const target = otoBjDealerTargetV160(session);
  if (dealerTotal < 16) return true;
  if (dealerTotal < target && dealerTotal <= 20) return Math.random() < 0.85;
  if (playerTotal > dealerTotal && dealerTotal <= 20) return Math.random() < 0.55;
  return false;
}

function otoBjDrawDealerAliveV157(session, mode = "hit") {
  let drew = false;
  const maxDraw = mode === "stand"
    ? Number(config.otoBlackjackDealerMaxTurnDraw || 6)
    : Number(config.otoBlackjackDealerMaxExtraDrawPerClick || 2);

  for (let i = 0; i < maxDraw; i++) {
    if (!otoBjDealerDecisionV160(session, mode)) break;
    session.dealerCards.push(otoBjCardV157());
    drew = true;

    const total = otoBjTotalV157(session.dealerCards);
    if (total >= 21) break;

    // Mode hit cukup 1-2 kartu, mode stand bisa lanjut.
    if (mode === "hit" && Math.random() < 0.55) break;
  }

  return drew;
}

function otoBjBuildDescV157(session, status = "playing", note = "") {
  const pv = otoBjTotalV157(session.playerCards);
  const dv = otoBjTotalV157(session.dealerCards);
  const statusTitle = status === "playing" ? "BERJALAN" : status === "win" ? "MENANG" : status === "lose" ? "KALAH" : "SERI";
  const actionLine = status === "playing"
    ? "Pilih tombol: **Tambahin** buat ambil kartu, atau **Stop** buat selesai."
    : "Game selesai. Coin ini hanya coin game Hansip, bukan uang asli.";

  const dealerMood =
    dv <= 11 ? "Dealer masih agresif." :
    dv <= 16 ? "Dealer lagi mikir buat ngejar." :
    dv <= 19 ? "Dealer mulai hati-hati." :
    dv === 20 ? "Dealer tinggi, tapi masih bisa nekat tipis." :
    dv === 21 ? "Dealer kena 21." :
    "Dealer kebanyakan ambil kartu.";

  return [
    `🃏 **Hansip Blackjack — ${statusTitle}**`,
    "",
    `Bet: **${session.bet.toLocaleString("id-ID")} Hansip Coin**`,
    `<a:clover:1513671524949823639>Luck: ${session.luck} • ${session.luckTier}`,
    "",
    `Dealer: ${otoBjFormatCardsV157(session.dealerCards)} = **${dv}**`,
    `Kamu: ${otoBjFormatCardsV157(session.playerCards)} = **${pv}**`,
    "",
    `🤖 ${dealerMood}`,
    note ? `Info: ${note}` : "",
    actionLine
  ].filter(Boolean).join("\n");
}

async function otoHandleBlackjackButtonV157(interaction) {
  if (!interaction.isButton()) return false;
  const id = String(interaction.customId || "");
  if (!id.startsWith("oto_bj_hit:") && !id.startsWith("oto_bj_stand:")) return false;

  const [action, sessionId] = id.split(":");
  const session = OTO_BJ_SESSIONS_V157.get(sessionId);

  if (!session) {
    await interaction.reply({ content: "⚠️ Sesi blackjack ini sudah selesai atau expired. Mulai lagi dengan `otbj <jumlah>`.", ephemeral: true });
    return true;
  }

  if (interaction.user.id !== session.userId) {
    await interaction.reply({ content: "⚠️ Tombol ini cuma buat pemain yang mulai game blackjack ini.", ephemeral: true });
    return true;
  }

  if (session.finished) {
    await interaction.reply({ content: "⚠️ Game ini sudah selesai.", ephemeral: true });
    return true;
  }

  if (action === "oto_bj_hit") {
    session.playerCards.push(otoBjCardV157());

    // Update awal: player ambil kartu, dealer sedang mikir.
    await interaction.update({
      embeds: [otoBjEmbedV157(otoBjBuildDescV157(session, "playing", "Kamu ambil kartu. Dealer sedang mikir..."), "normal")],
      components: otoBjButtonsV157(session, true)
    });

    await otoBjSleepV160(Number(config.otoBlackjackDealerThinkingMs || 2000));

    const dealerDrew = otoBjDrawDealerAliveV157(session, "hit");
    const result = otoBjResultV157(session, false);
    const note = dealerDrew
      ? "Dealer ikut nambah kartu random. Musuh tidak diam."
      : "Dealer memilih tahan dulu, tapi ronde masih berjalan.";

    if (result !== "playing") {
      return otoBjFinishV157(session, null, note);
    }

    if (session.message && typeof session.message.edit === "function") {
      return session.message.edit({
        embeds: [otoBjEmbedV157(otoBjBuildDescV157(session, "playing", note), "normal")],
        components: otoBjButtonsV157(session, false)
      });
    }
    return true;
  }

  if (action === "oto_bj_stand") {
    await interaction.update({
      embeds: [otoBjEmbedV157(otoBjBuildDescV157(session, "playing", "Kamu stop. Dealer mulai jalan otomatis..."), "normal")],
      components: otoBjButtonsV157(session, true)
    });

    await otoBjSleepV160(Number(config.otoBlackjackDealerThinkingMs || 2000));

    const dealerDrew = otoBjDrawDealerAliveV157(session, "stand");
    return otoBjFinishV157(session, null, dealerDrew ? "Dealer auto draw sampai berhenti." : "Dealer memilih tidak nambah kartu.");
  }

  return false;
}

// Extra anti-expire cleanup for old blackjack sessions.
try {
  if (typeof setInterval !== "undefined" && !global.__otoBjCleanupV160) {
    setInterval(() => {
      const now = Date.now();
      for (const [id, session] of OTO_BJ_SESSIONS_V157.entries()) {
        if (now - Number(session.createdAt || 0) > 5 * 60 * 1000) {
          OTO_BJ_SESSIONS_V157.delete(id);
          try {
            if (session.message && typeof session.message.edit === "function") {
              session.message.edit({
                embeds: [otoBjEmbedV157("⏳ Sesi blackjack expired karena terlalu lama tidak ditekan.\n\nMulai lagi dengan `otbj <jumlah>`.", "warning")],
                components: otoBjButtonsV157(session, true)
              }).catch(() => {});
            }
          } catch (_) {}
        }
      }
    }, 60 * 1000);
    global.__otoBjCleanupV160 = true;
  }
} catch (_) {}


/* =========================
   Hansip HUNT ANTI-SPAM FIX v1.61.0
   Fix:
   - `oth` tidak spam/dobel pesan.
   - Tidak ada double animation dari wrapper lama.
   - Satu pesan animasi 2 detik -> diedit jadi hasil hunt.
   - Hasil hunt dibuat compact: maksimal 5 NPC ditampilkan, sisanya diringkas.
========================= */

function otoHuntSleepV161(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function otoHuntFooterV161(desc = "", suffix = "Hansip Hunt") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}

function otoHuntEmbedV161(desc = "", type = "normal") {
  let color = config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || "#00E5FF";
  const t = String(type || "normal").toLowerCase();
  if (["success", "win", "menang"].includes(t)) color = config.otoEmbedWinColor || "#22C55E";
  if (["error", "lose", "kalah"].includes(t)) color = config.otoEmbedLoseColor || "#EF4444";
  if (["warning", "draw"].includes(t)) color = config.otoEmbedWarningColor || "#FACC15";

  const embed = new EmbedBuilder()
    .setColor(color)
    .setDescription(otoHuntFooterV161(desc, "Hansip Hunt"));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

async function otoHuntSendSingleAnimationV161(message) {
  const desc = [
    "🌱 🔎 🎴 ✨",
    "",
    "**Mencari NPC di Hansip...**",
    "Tunggu **2 detik**..."
  ].join("\n");

  const payload = { embeds: [otoHuntEmbedV161(desc, "normal")] };

  try {
    const sent = await replyOt(message, payload);
    await otoHuntSleepV161(2000);
    return sent;
  } catch (_) {
    try {
      const sent = await message.reply(payload);
      await otoHuntSleepV161(2000);
      return sent;
    } catch (__) {
      await otoHuntSleepV161(2000);
      return null;
    }
  }
}

async function otoHuntEditOrSendV161(sent, message, payload) {
  try {
    if (sent && typeof sent.edit === "function") {
      await sent.edit(payload);
      return;
    }
  } catch (_) {}
  return replyOt(message, payload);
}

function otoHuntEnsurePlayerV161(player) {
  if (typeof otoNpcNormalizePlayerV159 === "function") return otoNpcNormalizePlayerV159(player);
  if (typeof otoFragEnsureV158 === "function") return otoFragEnsureV158(player);
  if (typeof otoV155Ensure === "function") return otoV155Ensure(player);
  if (typeof otoV151Ensure === "function") return otoV151Ensure(player);

  player.npcs = player.npcs || {};
  player.inventory = player.inventory || {};
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team : ["", "", ""];
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoHuntPickNpcV161() {
  if (typeof otoV155PickNpc === "function") return otoV155PickNpc();
  if (typeof otoV151PickNpc === "function") return otoV151PickNpc();
  return { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 };
}

function otoHuntAddNpcV161(player, npc) {
  if (typeof otoV155AddNpc === "function") return otoV155AddNpc(player, npc);
  if (typeof otoV151AddNpc === "function") return otoV151AddNpc(player, npc);

  player.npcs = player.npcs || {};
  if (player.npcs[npc.id]) {
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    const fragId = `${npc.rarity}_fragment`;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + 1;
    player.dust = Number(player.dust || 0) + 5;
    return { duplicate:true, fragQty:1, dustQty:5 };
  }

  player.npcs[npc.id] = { ...npc, level:1, exp:0, locked:false, weapon:"", duplicates:0, obtainedAt:new Date().toISOString() };
  return { duplicate:false, fragQty:0, dustQty:0 };
}

function otoHuntLetterV161(rarity = "common") {
  if (typeof otoNpcLetterV159 === "function") return otoNpcLetterV159(rarity);
  if (typeof otoV155Letter === "function") return otoV155Letter(rarity);
  const map = {
    common: "<:LetterC:1513669277759176704>",
    uncommon: "<:PastelGreenU:1513669101640482907>",
    rare: "<:PurpleR:1513668875189878785>",
    epic: "<:letter_E:1513668672609189888>",
    mythic: "<a:LetterM:1513668125638398262>",
    secret: "<a:Alphabet_S:1513667784519712769>"
  };
  return map[String(rarity || "common").toLowerCase()] || map.common;
}

function otoHuntLuckLineV161(player) {
  if (typeof otoV155LuckLine === "function") return otoV155LuckLine(player);
  if (typeof otoV151LuckLine === "function") return otoV151LuckLine(player);
  return "<a:clover:1513671524949823639>Luck: 8 • Normal";
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;

  const wait = typeof otoCooldown === "function"
    ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000))
    : 0;

  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  // Hanya 1 pesan animasi. Hasil akhir diedit ke pesan ini.
  const animMsg = await otoHuntSendSingleAnimationV161(message);

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoHuntEnsurePlayerV161(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return otoHuntEditOrSendV161(animMsg, message, {
      embeds: [otoHuntEmbedV161(`❌ Coin kamu kurang.\n\nButuh **${cost} Hansip Coin** buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "error")]
    });
  }

  player.coin = Number(player.coin || 0) - cost;

  const boost = player.otoActiveFragmentBoost || null;
  const baseCount = 1 + Math.floor(Math.random() * 3);
  const extraNpc = boost ? Number(boost.npcBonus || 0) : 0;
  const count = Math.max(1, Math.min(18, baseCount + extraNpc));

  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [], recent = [];

  for (let i = 0; i < count; i++) {
    const npc = otoHuntPickNpcV161();
    const add = otoHuntAddNpcV161(player, npc);
    const rarity = String(npc.rarity || "common").toLowerCase();
    const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[rarity] || 7) + Math.floor(Math.random() * 5);
    xp += xpGain;

    found.push(`${otoHuntLetterV161(rarity)} ${npc.emoji || "🙂"} ${npc.name}`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji || "🙂", rarity, duplicate:add.duplicate });

    if (add.duplicate) {
      dup++;
      frag += Number(add.fragQty || 1);
      dust += Number(add.dustQty || 5);
    }
  }

  const expBoost = boost ? Number(boost.expBonus || 0) : 0;
  xp += expBoost;

  player.exp = Number(player.exp || 0) + xp;
  if (typeof otoV155Level === "function") player.level = otoV155Level(player);
  else if (typeof otoV151Level === "function") player.level = otoV151Level(player);
  else player.level = Math.max(1, Number(player.level || 1));

  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust, fragmentBoost: boost };
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;

  if (boost) {
    player.stats.fragmentBoostUsed = Number(player.stats.fragmentBoostUsed || 0) + 1;
    player.otoActiveFragmentBoost = null;
  }

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const maxShow = Number(config.otoHuntMaxShownNpc || 5);
  const foundText = found.length > maxShow
    ? `${found.slice(0, maxShow).join(" • ")} • +${found.length - maxShow} NPC lain`
    : found.join(" • ");

  const emojiText = recent.length > 10
    ? `${recent.slice(0, 10).map(n => n.emoji || "🙂").join(" ")} +${recent.length - 10}`
    : recent.map(n => n.emoji || "🙂").join(" ");

  const desc = [
    `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
    `▫️ | ${emojiText} mendapat ${xp} XP!`,
    `🎴 | ${foundText}`,
    "",
    boost ? `🧩 | Boost: ${boost.letter} ${boost.label} memberi +${extraNpc} NPC dan +${expBoost} EXP!` : "",
    dup ? `🔁 | ${dup} duplicate berubah jadi <:PurpleR:1513668875189878785> ${frag} Fragment dan 🎴 ${dust} Dust!` : "",
    otoHuntLuckLineV161(player),
    "✅ NPC sudah tersimpan ke collection."
  ].filter(Boolean).join("\n");

  return otoHuntEditOrSendV161(animMsg, message, {
    embeds: [otoHuntEmbedV161(desc, "normal")]
  });
}

// Intercept `oth` paling akhir supaya tidak lewat wrapper animasi lama yang bikin dobel/spam.
if (typeof processOtoCommand === "function" && !processOtoCommand.__otoHuntAntiSpamV161) {
  const processOtoCommandOldHuntV161 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    if (name === "oth" || name === "othunt") return otoCmdHunt(message), true;
    return processOtoCommandOldHuntV161(message, parsed, command);
  };
  processOtoCommand.__otoHuntAntiSpamV161 = true;
}


/* =========================
   Hansip GLOBAL ONE MESSAGE MODE v1.62.0
   Fix global:
   - Semua command Hansip cukup 1 pesan.
   - Action command: kirim animasi 2 detik, lalu edit pesan yang sama jadi hasil.
   - Info command: langsung kirim 1 embed.
   - Button game seperti otbj tetap edit message yang sama.
   - Router paling akhir intercept command penting supaya tidak lewat wrapper lama yang bikin double reply/double animation.
========================= */

const OTO_ONE_MSG_V162 = {
  action: new Set(["oth","othunt","otopen","otcf","otbj","otb","otbattle","otdaily","otquest","otluck","otuse"]),
  info: new Set(["othelp","otflow","otprofile","otnpc","otteam","otinv","ottop","otcard","otshop"])
};

function otoOneFooterV162(desc = "", suffix = "Hansip") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}

function otoOneEmbedV162(desc = "", suffix = "Hansip", type = "normal") {
  let color = config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || "#00E5FF";
  const t = String(type || "normal").toLowerCase();
  if (["success","win","menang"].includes(t)) color = config.otoEmbedWinColor || "#22C55E";
  if (["error","lose","kalah","danger"].includes(t)) color = config.otoEmbedLoseColor || "#EF4444";
  if (["warning","draw","seri"].includes(t)) color = config.otoEmbedWarningColor || "#FACC15";
  const embed = new EmbedBuilder().setColor(color).setDescription(otoOneFooterV162(desc, suffix));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoOneSleepV162(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

async function otoOneSendAnimationV162(message, kind = "action", title = "Hansip sedang memproses...") {
  const frames = {
    hunt: "🌱 🔎 🎴 ✨",
    crate: "📦 🔓 ✨ 🎁",
    battle: "⚔️ 💥 🛡️ 🏆",
    coinflip: "🪙 🔄 ✨ 👑",
    blackjack: "🃏 🎴 ✨ 🛑",
    daily: "🎁 ✨ 💰 ⭐",
    quest: "🎯 📜 ✨ ✅",
    luck: "<a:clover:1513671524949823639> ✨ <a:clover:1513671524949823639> 💠",
    use: "🧩 ✨ 🎴 🌱",
    action: "💠 ✨ 🔄 ✅"
  };

  const desc = [
    frames[kind] || frames.action,
    "",
    `**${title}**`,
    "Tunggu **2 detik**..."
  ].join("\n");

  const payload = { embeds: [otoOneEmbedV162(desc, "Hansip Animation")] };

  try {
    const sent = await replyOt(message, payload);
    await otoOneSleepV162(Number(config.otoAnimationDelayMs || config.otoActionAnimationMs || 2000));
    return sent;
  } catch (_) {
    try {
      const sent = await message.reply(payload);
      await otoOneSleepV162(Number(config.otoAnimationDelayMs || config.otoActionAnimationMs || 2000));
      return sent;
    } catch (__) {
      await otoOneSleepV162(Number(config.otoAnimationDelayMs || config.otoActionAnimationMs || 2000));
      return null;
    }
  }
}

async function otoOneEditOrSendV162(sent, message, payload) {
  try {
    if (sent && typeof sent.edit === "function") {
      await sent.edit(payload);
      return true;
    }
  } catch (_) {}
  await replyOt(message, payload);
  return false;
}

function otoOneEnsurePlayerV162(player) {
  if (typeof otoNpcNormalizePlayerV159 === "function") return otoNpcNormalizePlayerV159(player);
  if (typeof otoFragEnsureV158 === "function") return otoFragEnsureV158(player);
  if (typeof otoV155Ensure === "function") return otoV155Ensure(player);
  if (typeof otoV151Ensure === "function") return otoV151Ensure(player);
  player.npcs = player.npcs || {};
  player.inventory = player.inventory || { crates:{}, weapons:{}, fragments:{}, items:{} };
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team : ["", "", ""];
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoOneLetterV162(rarity = "common") {
  if (typeof otoNpcLetterV159 === "function") return otoNpcLetterV159(rarity);
  if (typeof otoV155Letter === "function") return otoV155Letter(rarity);
  const map = { common:"<:LetterC:1513669277759176704>", uncommon:"<:PastelGreenU:1513669101640482907>", rare:"<:PurpleR:1513668875189878785>", epic:"<:letter_E:1513668672609189888>", mythic:"<a:LetterM:1513668125638398262>", secret:"<a:Alphabet_S:1513667784519712769>" };
  return map[String(rarity || "common").toLowerCase()] || map.common;
}

function otoOnePickNpcV162() {
  if (typeof otoV155PickNpc === "function") return otoV155PickNpc();
  if (typeof otoV151PickNpc === "function") return otoV151PickNpc();
  return { id:"penjaga_warung_ot", emoji:"😊", name:"Penjaga Warung OT", rarity:"common", element:"Tulus", power:140 };
}

function otoOneAddNpcV162(player, npc) {
  if (typeof otoV155AddNpc === "function") return otoV155AddNpc(player, npc);
  if (typeof otoV151AddNpc === "function") return otoV151AddNpc(player, npc);
  player.npcs = player.npcs || {};
  if (player.npcs[npc.id]) {
    player.npcs[npc.id].duplicates = Number(player.npcs[npc.id].duplicates || 0) + 1;
    const fragId = `${npc.rarity}_fragment`;
    player.inventory.fragments[fragId] = Number(player.inventory.fragments[fragId] || 0) + 1;
    player.dust = Number(player.dust || 0) + 5;
    return { duplicate:true, fragQty:1, dustQty:5 };
  }
  player.npcs[npc.id] = { ...npc, level:1, exp:0, locked:false, weapon:"", duplicates:0, obtainedAt:new Date().toISOString() };
  return { duplicate:false, fragQty:0, dustQty:0 };
}

function otoOneLuckLineV162(player) {
  if (typeof otoV155LuckLine === "function") return otoV155LuckLine(player);
  if (typeof otoV151LuckLine === "function") return otoV151LuckLine(player);
  return "<a:clover:1513671524949823639>Luck: 8 • Normal";
}

async function otoCmdHunt(message) {
  if (!(await otoEnsureChannel(message))) return;
  const wait = typeof otoCooldown === "function" ? otoCooldown(message.author.id, "hunt", Number(config.otoHuntCooldownMs || 10000)) : 0;
  if (wait) return replyOt(message, { content: `⏳ Hunt cooldown **${wait} detik**.` });

  const anim = await otoOneSendAnimationV162(message, "hunt", "Mencari NPC di Hansip...");

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoOneEnsurePlayerV162(player);

  const cost = Number(config.otoHuntCost || 5);
  if (Number(player.coin || 0) < cost) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(`❌ Coin kamu kurang.\n\nButuh **${cost} Hansip Coin** buat hunt.\nPakai \`otdaily\` atau \`otkerja\` dulu.`, "Hansip Hunt", "error")] });
  }

  player.coin = Number(player.coin || 0) - cost;

  const boost = player.otoActiveFragmentBoost || null;
  const baseCount = 1 + Math.floor(Math.random() * 3);
  const extraNpc = boost ? Number(boost.npcBonus || 0) : 0;
  const count = Math.max(1, Math.min(18, baseCount + extraNpc));

  let xp = 0, dup = 0, frag = 0, dust = 0;
  const found = [], recent = [];

  for (let i = 0; i < count; i++) {
    const npc = otoOnePickNpcV162();
    const add = otoOneAddNpcV162(player, npc);
    const rarity = String(npc.rarity || "common").toLowerCase();
    const xpGain = ({ common:7, uncommon:10, rare:15, epic:25, mythic:50, secret:100 }[rarity] || 7) + Math.floor(Math.random() * 5);
    xp += xpGain;
    found.push(`${otoOneLetterV162(rarity)} ${npc.emoji || "🙂"} ${npc.name}`);
    recent.push({ id:npc.id, name:npc.name, emoji:npc.emoji || "🙂", rarity, duplicate:add.duplicate });
    if (add.duplicate) { dup++; frag += Number(add.fragQty || 1); dust += Number(add.dustQty || 5); }
  }

  const expBoost = boost ? Number(boost.expBonus || 0) : 0;
  xp += expBoost;

  player.exp = Number(player.exp || 0) + xp;
  if (typeof otoV155Level === "function") player.level = otoV155Level(player);
  else if (typeof otoV151Level === "function") player.level = otoV151Level(player);
  else player.level = Math.max(1, Number(player.level || 1));

  player.lastHunt = { at: Date.now(), npcs: recent, xp, count, duplicate: dup, fragment: frag, dust, fragmentBoost: boost };
  player.stats = player.stats || {};
  player.stats.hunts = Number(player.stats.hunts || 0) + 1;
  player.stats.huntNpcFound = Number(player.stats.huntNpcFound || 0) + count;

  if (boost) {
    player.stats.fragmentBoostUsed = Number(player.stats.fragmentBoostUsed || 0) + 1;
    player.otoActiveFragmentBoost = null;
  }

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const maxShow = Number(config.otoMaxShownNpc || config.otoHuntMaxShownNpc || 5);
  const foundText = found.length > maxShow ? `${found.slice(0, maxShow).join(" • ")} • +${found.length - maxShow} NPC lain` : found.join(" • ");
  const emojiText = recent.length > 10 ? `${recent.slice(0, 10).map(n => n.emoji || "🙂").join(" ")} +${recent.length - 10}` : recent.map(n => n.emoji || "🙂").join(" ");

  const desc = [
    `🌱 | ${message.author.username} memakai ${cost} Hansip Coin dan menangkap ${count} NPC!`,
    `▫️ | ${emojiText} mendapat ${xp} XP!`,
    `🎴 | ${foundText}`,
    "",
    boost ? `🧩 | Boost: ${boost.letter} ${boost.label} memberi +${extraNpc} NPC dan +${expBoost} EXP!` : "",
    dup ? `🔁 | ${dup} duplicate berubah jadi <:PurpleR:1513668875189878785> ${frag} Fragment dan 🎴 ${dust} Dust!` : "",
    otoOneLuckLineV162(player),
    "✅ NPC sudah tersimpan ke collection."
  ].filter(Boolean).join("\n");

  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(desc, "Hansip Hunt")] });
}

async function otoCmdOpenOneMessageV162(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "crate", "Membuka crate Hansip...");

  if (typeof otoCmdOpen === "function" && !otoCmdOpen.__oneMessageFallbackV162) {
    // Tidak panggil otoCmdOpen lama supaya tidak reply dobel.
  }

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoOneEnsurePlayerV162(player);

  const crates = Object.entries(player.inventory.crates || {}).filter(([,v]) => Number(v || 0) > 0);
  if (!crates.length) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162("📦 Kamu belum punya crate.\n\nLanjut: `oth` atau `otdaily` buat cari crate.", "Hansip Crate", "warning")] });
  }

  const arg = String(args[0] || "all").toLowerCase();
  let opened = 0, coin = 0, frag = 0, dust = 0;
  const lines = [];

  for (const [name, qtyRaw] of crates) {
    const qty = Number(qtyRaw || 0);
    if (arg !== "all" && !name.toLowerCase().includes(arg)) continue;
    const openQty = arg === "all" ? qty : 1;
    if (openQty <= 0) continue;
    player.inventory.crates[name] = Math.max(0, qty - openQty);
    opened += openQty;
    lines.push(`${name} x${openQty}`);
    coin += openQty * (50 + Math.floor(Math.random() * 150));
    frag += openQty * (1 + Math.floor(Math.random() * 3));
    dust += openQty * (2 + Math.floor(Math.random() * 5));
  }

  if (!opened) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(`📦 Crate \`${arg}\` tidak ada atau kosong.`, "Hansip Crate", "warning")] });
  }

  player.coin = Number(player.coin || 0) + coin;
  player.dust = Number(player.dust || 0) + dust;
  player.inventory.fragments.common_fragment = Number(player.inventory.fragments.common_fragment || 0) + frag;
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    "📦 **Hansip Crate Open Result**",
    "",
    `Crate dibuka: **${opened}**`,
    lines.slice(0, 8).join("\n"),
    lines.length > 8 ? `+${lines.length - 8} crate lain` : "",
    "",
    `💰 Coin +${coin}`,
    `<:PurpleR:1513668875189878785> Fragment +${frag}`,
    `🎴 Dust +${dust}`,
    "",
    "Lanjut: `otinv` • `oth`"
  ].filter(Boolean).join("\n");

  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(desc, "Hansip Crate", "success")] });
}

async function otoCmdDailyOneMessageV162(message) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "daily", "Mengambil daily Hansip...");
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoOneEnsurePlayerV162(player);

  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  if (player.lastDaily && now - Number(player.lastDaily) < day) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162("⏳ Daily sudah diambil. Coba lagi besok.", "Hansip Daily", "warning")] });
  }

  player.lastDaily = now;
  player.coin = Number(player.coin || 0) + 500;
  player.exp = Number(player.exp || 0) + 50;
  player.inventory.crates.basic = Number(player.inventory.crates.basic || 0) + 1;
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162("🎁 **Hansip Daily Claimed**\n\n🪙 Coin **+500**\n⭐ XP **+50**\n📦 Basic Crate **+1**\n\nLanjut: `oth` • `otopen all`", "Hansip Daily", "success")] });
}

async function otoCmdQuestOneMessageV162(message) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "quest", "Mengecek quest Hansip...");
  const { player } = otoGetPlayer(message.author);
  otoOneEnsurePlayerV162(player);
  const desc = [
    "🎯 **Hansip Quest Harian**",
    "",
    `🌱 Hunt NPC: **${Number(player.stats?.hunts || 0)}/5**`,
    `⚔️ Menang Battle: **${Number(player.stats?.battleWin || 0)}/3**`,
    "📦 Buka Crate: **0/1**",
    "",
    "Alur: `oth` → `otteam add <npcId> slot 1` → `otb`"
  ].join("\n");
  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(desc, "Hansip Quest")] });
}

async function otoCmdLuckOneMessageV162(message) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "luck", "Menghitung luck Hansip...");
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoOneEnsurePlayerV162(player);
  let line = otoOneLuckLineV162(player);
  if (typeof otoBjRollLuckV157 === "function") {
    const l = otoBjRollLuckV157(player, true);
    line = `<a:clover:1513671524949823639>Luck: ${l.value} • ${l.tier}`;
  }
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);
  const desc = [
    `${line}`,
    "",
    `Level kamu: **${player.level || 1}**`,
    "Semakin tinggi level, peluang luck besar makin naik.",
    "",
    "Luck ini dipakai untuk hunt, battle, dan game coin Hansip."
  ].join("\n");
  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(desc, "Hansip Luck")] });
}

async function otoCmdCoinFlipOneMessageV162(message, args = []) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "coinflip", "Koin Hansip sedang berputar...");
  if (typeof otoCmdCoinFlip === "function") {
    // Gunakan logic compact sendiri agar tidak dobel.
  }
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoOneEnsurePlayerV162(player);

  const raw = String(args[0] || "").toLowerCase();
  let bet = raw === "all" ? Number(player.coin || 0) : Number(raw);
  if (!bet || bet <= 0) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162("🪙 Format: `otcf <jumlah>` atau `otcf all`.", "Hansip Coin Flip", "warning")] });
  }
  bet = Math.floor(bet);
  if (bet > Number(player.coin || 0)) {
    return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162("❌ Coin kamu tidak cukup.", "Hansip Coin Flip", "error")] });
  }
  const win = Math.random() < 0.5;
  player.coin = Number(player.coin || 0) + (win ? bet : -bet);
  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const desc = [
    `🪙 **Hansip Coin Flip — ${win ? "MENANG" : "KALAH"}**`,
    "",
    `Bet: **${bet} Hansip Coin**`,
    win ? `Hadiah: **+${bet} Hansip Coin**` : `Hilang: **-${bet} Hansip Coin**`,
    `Saldo: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    "",
    "Coin ini hanya coin game Hansip, bukan uang asli."
  ].join("\n");

  return otoOneEditOrSendV162(anim, message, { embeds: [otoOneEmbedV162(desc, "Hansip Coin Flip", win ? "success" : "error")] });
}

async function otoCmdUseOneMessageV162(message, args = []) {
  if (typeof otoCmdUseFragmentV158 === "function") {
    // Direct old function might animate/reply. To avoid double, simple route can still use old if no active custom.
  }
  return otoCmdUseFragmentV158 ? otoCmdUseFragmentV158(message, args) : replyOt(message, { embeds: [otoOneEmbedV162("🧩 Format: `otuse fragmen c/u/r/e/m/s`", "Hansip Fragment", "warning")] });
}

// Final router hard intercept. This must be last so old animation wrapper does not run.
if (typeof processOtoCommand === "function" && !processOtoCommand.__otoGlobalOneMsgV162) {
  const processOtoCommandOldOneV162 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];

    if (name === "oth" || name === "othunt") return otoCmdHunt(message), true;
    if (name === "otopen") return otoCmdOpenOneMessageV162(message, args), true;
    if (name === "otdaily") return otoCmdDailyOneMessageV162(message), true;
    if (name === "otquest") return otoCmdQuestOneMessageV162(message), true;
    if (name === "otluck") return otoCmdLuckOneMessageV162(message), true;
    if (name === "otcf") return otoCmdCoinFlipOneMessageV162(message, args), true;

    // otbj already edits same message and button interactions edit same message.
    if (name === "otbj" && typeof otoCmdBlackjack === "function") return otoCmdBlackjack(message, args), true;

    // battle may not use animation here, but must only reply once.
    if ((name === "otb" || name === "otbattle") && typeof otoCmdBattle === "function") return otoCmdBattle(message), true;

    // otuse can have its own 1 animation + edit; leave direct.
    if (name === "otuse" && typeof otoCmdUseFragmentV158 === "function") return otoCmdUseFragmentV158(message, args), true;

    // Info commands should be one direct reply, no animation wrapper.
    if (name === "otflow" && typeof otoCmdFlow === "function") return otoCmdFlow(message), true;
    if (name === "otprofile" && typeof otoCmdProfile === "function") return otoCmdProfile(message), true;
    if (name === "otnpc" && typeof otoCmdNpc === "function") return otoCmdNpc(message, args), true;
    if (name === "otteam" && typeof otoCmdTeam === "function") return otoCmdTeam(message, args), true;
    if (name === "otinv" && typeof otoCmdInv === "function") return otoCmdInv(message, args), true;
    if (name === "otcard" && typeof otoCmdCardV159 === "function") return otoCmdCardV159(message, args), true;
    if (name === "ottop" && typeof otoCmdTop === "function") return otoCmdTop(message), true;
    if (name === "othelp") {
      if (!(await otoEnsureChannel(message))) return true;
      const embed = typeof otoHelpEmbed === "function" ? otoHelpEmbed() : otoOneEmbedV162("💠 **Hansip Help**\n\n`otflow` untuk alur main.", "Hansip Help");
      await replyOt(message, { embeds: [embed] });
      return true;
    }

    return processOtoCommandOldOneV162(message, parsed, command);
  };
  processOtoCommand.__otoGlobalOneMsgV162 = true;
}


/* =========================
   Hansip PREMIUM EXPERIENCE SUITE v1.63.0
   Fokus:
   - Animasi premium 3 detik.
   - Semua command Hansip tetap 1 pesan/no spam.
   - Alur lebih jelas, lucu, seru, premium, dan tidak kaku.
   - Tambah command: otguide, otprogress, otstatus, otbonus.
   - Dashboard premium all-in-one.
   - Tidak reset data member, tidak ubah fitur lama Hansip.
   - Original Hansip, tidak copy asset/teks bot lain.
========================= */

const OTO_PREMIUM_V163 = {
  version: "5.9.99",
  title: "<:glowing_dot_blue:1513670991056736408>",
  common: "<:LetterC:1513669277759176704>",
  uncommon: "<:PastelGreenU:1513669101640482907>",
  rare: "<:PurpleR:1513668875189878785>",
  epic: "<:letter_E:1513668672609189888>",
  mythic: "<a:LetterM:1513668125638398262>",
  secret: "<a:Alphabet_S:1513667784519712769>",
  luck: "<a:clover:1513671524949823639>",
  ot: "<a:Desa_Tulus:1516424353934348299>"
};

function otoPremiumSleepV163(ms) {
  return new Promise(resolve => setTimeout(resolve, Math.max(0, Number(ms || 0))));
}

function otoPremiumColorV163(type = "normal") {
  const t = String(type || "normal").toLowerCase();
  if (["success","win","menang","green"].includes(t)) return config.otoEmbedWinColor || "#22C55E";
  if (["error","lose","kalah","danger","red"].includes(t)) return config.otoEmbedLoseColor || "#EF4444";
  if (["warning","draw","seri","yellow"].includes(t)) return config.otoEmbedWarningColor || "#FACC15";
  return config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || "#00E5FF";
}

function otoPremiumFooterV163(desc = "", suffix = "Hansip") {
  const clean = String(desc || "")
    .replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g, "")
    .replace(/\n*DESA TULUS\s*•[^\n]*/g, "")
    .trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}

function otoPremiumEmbedV163(desc = "", suffix = "Hansip", type = "normal") {
  const embed = new EmbedBuilder()
    .setColor(otoPremiumColorV163(type))
    .setDescription(otoPremiumFooterV163(desc, suffix));
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function otoPremiumFramesV163(kind = "action") {
  const frames = {
    hunt: [
      "🌱 <:glowing_dot_blue:1513670991056736408> 🔎",
      "🌱 🔎 🎴",
      "🌱 🎴 ✨",
      "🌱 ✨ <a:Desa_Tulus:1516424353934348299>"
    ],
    crate: [
      "📦 🔒 <:glowing_dot_blue:1513670991056736408>",
      "📦 🔓 ✨",
      "🎁 ✨ <:PurpleR:1513668875189878785>",
      "🎁 💠 <a:Desa_Tulus:1516424353934348299>"
    ],
    battle: [
      "⚔️ 🛡️ <:glowing_dot_blue:1513670991056736408>",
      "⚔️ 💥 🛡️",
      "💥 🏆 ✨",
      "🏆 <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    coinflip: [
      "🪙 🔄 <:glowing_dot_blue:1513670991056736408>",
      "🪙 🔄 ✨",
      "🪙 👑 ✨",
      "👑 <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    blackjack: [
      "🃏 🎴 <:glowing_dot_blue:1513670991056736408>",
      "🃏 🎴 ✨",
      "🃏 🛑 ➕",
      "🃏 <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    luck: [
      "<a:clover:1513671524949823639> ✨ <:glowing_dot_blue:1513670991056736408>",
      "<a:clover:1513671524949823639> 💠 ✨",
      "<a:clover:1513671524949823639> ✨ <a:Desa_Tulus:1516424353934348299>",
      "<a:clover:1513671524949823639> Luck loading..."
    ],
    use: [
      "🧩 ✨ <:PurpleR:1513668875189878785>",
      "🧩 🎴 ✨",
      "🧩 🌱 💠",
      "🧩 <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    daily: [
      "🎁 ✨ 💰",
      "🎁 ⭐ ✨",
      "💰 ⭐ 💠",
      "🎁 <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    quest: [
      "🎯 📜 ✨",
      "📜 🔎 💠",
      "🎯 ✅ ✨",
      "✅ <a:Desa_Tulus:1516424353934348299> ✨"
    ],
    action: [
      "💠 ✨ <a:Desa_Tulus:1516424353934348299>",
      "🔄 💠 ✨",
      "✨ ✅ 💠",
      "✅ <a:Desa_Tulus:1516424353934348299> ✨"
    ]
  };
  return frames[kind] || frames.action;
}

// Override animation global: 3 detik dan tetap 1 pesan.
async function otoOneSendAnimationV162(message, kind = "action", title = "Hansip sedang memproses...") {
  const frames = otoPremiumFramesV163(kind);
  const desc = [
    frames.join("\n"),
    "",
    `**${title}**`,
    "Animasi premium **3 detik**..."
  ].join("\n");

  const payload = { embeds: [otoPremiumEmbedV163(desc, "Hansip Animation")] };

  let sent = null;
  try { sent = await replyOt(message, payload); }
  catch (_) {
    try { sent = await message.reply(payload); } catch (__) {}
  }

  await otoPremiumSleepV163(Number(config.otoPremiumAnimationMs || config.otoAnimationDelayMs || config.otoActionAnimationMs || 3000));
  return sent;
}

// Override old animation helper used by otbj/otuse.
async function otoSendAnimationV156(message, type = "action", title = "Hansip sedang memproses...") {
  return otoOneSendAnimationV162(message, type, title);
}

function otoPremiumEnsurePlayerV163(player) {
  if (typeof otoNpcNormalizePlayerV159 === "function") return otoNpcNormalizePlayerV159(player);
  if (typeof otoFragEnsureV158 === "function") return otoFragEnsureV158(player);
  if (typeof otoV155Ensure === "function") return otoV155Ensure(player);
  if (typeof otoV151Ensure === "function") return otoV151Ensure(player);

  player.npcs = player.npcs || {};
  player.inventory = player.inventory || { crates:{}, weapons:{}, fragments:{}, items:{} };
  player.inventory.crates = player.inventory.crates || {};
  player.inventory.weapons = player.inventory.weapons || {};
  player.inventory.fragments = player.inventory.fragments || {};
  player.inventory.items = player.inventory.items || {};
  player.team = Array.isArray(player.team) ? player.team : ["", "", ""];
  player.stats = player.stats || {};
  if (player.coin === undefined) player.coin = 100;
}

function otoPremiumLevelV163(player) {
  try { if (typeof otoV155Level === "function") return otoV155Level(player); } catch (_) {}
  try { if (typeof otoLevel === "function") return otoLevel(Number(player?.exp || 0)); } catch (_) {}
  return Math.max(1, Number(player?.level || 1));
}

function otoPremiumLuckLineV163(player) {
  try { if (typeof otoV155LuckLine === "function") return otoV155LuckLine(player); } catch (_) {}
  return "<a:clover:1513671524949823639>Luck: 8 • Normal";
}

function otoPremiumNpcPointsV163(player) {
  try { if (typeof otoV155Points === "function") return otoV155Points(player); } catch (_) {}
  return Object.keys(player?.npcs || {}).length;
}

function otoPremiumTeamPowerV163(player) {
  try { if (typeof otoV155TeamPower === "function") return otoV155TeamPower(player); } catch (_) {}
  try { return (player.team || []).reduce((s,id)=>s+(player.npcs[id] ? otoNpcPowerV159(player.npcs[id]) : 0),0); } catch (_) {}
  return 0;
}

function otoPremiumFlowTextV163() {
  return [
    "💠 **Hansip Premium Flow**",
    "",
    "Ini alur main yang paling aman dan jelas:",
    "",
    "1. `otprofile` — cek akun, coin, level, luck",
    "2. `otdaily` — ambil modal harian",
    "3. `oth` — hunt NPC",
    "4. `otnpc recent` — ambil `npcId` terbaru",
    "5. `otcard <npcId>` — cek level/EXP NPC",
    "6. `otteam add <npcId> slot 1` — pasang team",
    "7. `otteam view` — cek power team",
    "8. `otb` — battle dan kasih NPC EXP",
    "9. `otinv` → `otuse fragmen r` → `oth` — boost hunt",
    "10. `otopen all` / `ottop` — lanjut progress",
    "",
    "Tips: jangan bingung. Kalau lupa, ketik `otguide`."
  ].join("\n");
}

async function otoCmdGuideV163(message) {
  if (!(await otoEnsureChannel(message))) return;
  const desc = [
    "📘 **Hansip Premium Guide**",
    "",
    "**Main cepat:**",
    "`otdaily` → `oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`",
    "",
    "**NPC & Progress:**",
    "`otnpc` — collection",
    "`otcard <npcId>` — detail NPC",
    "`otteam view` — team",
    "`otprogress` — cek langkah berikutnya",
    "",
    "**Item & Booster:**",
    "`otinv` — inventory",
    "`otuse fragmen c/u/r/e/m/s` — boost hunt berikutnya",
    "`otopen all` — buka crate",
    "",
    "**Seru-seruan virtual coin:**",
    "`otcf <jumlah/all>` — coin flip",
    "`otbj <jumlah/all>` — blackjack tombol Tambahin/Stop",
    "",
    "Semua coin cuma coin game Hansip, bukan uang asli."
  ].join("\n");
  return replyOt(message, { embeds: [otoPremiumEmbedV163(desc, "Hansip Guide")] });
}

async function otoCmdProgressV163(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoPremiumEnsurePlayerV163(player);

  const npcCount = Object.keys(player.npcs || {}).length;
  const hasTeam = (player.team || []).some(id => id && player.npcs[id]);
  const last = player.lastHunt?.npcs?.[0]?.id || "";
  const next =
    !player.lastDaily ? "`otdaily` dulu buat ambil modal." :
    npcCount <= 0 ? "`oth` dulu buat dapat NPC." :
    !hasTeam ? (last ? `Pakai \`otteam add ${last} slot 1\`.` : "Pakai `otnpc recent`, lalu `otteam add <npcId> slot 1`.") :
    "`otb` untuk battle dan naikin EXP NPC.";

  const desc = [
    `${OTO_PREMIUM_V163.title} **${message.author.username}'s Hansip Progress**`,
    "",
    `Level: **${otoPremiumLevelV163(player)}**`,
    `Coin: **${Number(player.coin || 0).toLocaleString("id-ID")} Hansip Coin**`,
    `NPC Owned: **${npcCount}/30**`,
    `NPC Points: **${Number(otoPremiumNpcPointsV163(player)).toLocaleString("id-ID")}**`,
    `Team Power: **${Number(otoPremiumTeamPowerV163(player)).toLocaleString("id-ID")}**`,
    otoPremiumLuckLineV163(player),
    "",
    "**Langkah berikutnya:**",
    next,
    "",
    "Command bantuan: `otguide` • `otflow`"
  ].join("\n");

  return replyOt(message, { embeds: [otoPremiumEmbedV163(desc, "Hansip Progress")] });
}

async function otoCmdStatusV163(message) {
  if (!(await otoEnsureChannel(message))) return;
  const desc = [
    "🛡️ **Hansip Premium Status**",
    "",
    "✅ One-message mode aktif",
    "✅ Animasi premium 3 detik aktif",
    "✅ No image mode aktif",
    "✅ NPC Level EXP aktif",
    "✅ Fragment Booster aktif",
    "✅ Blackjack live button aktif",
    "✅ Dealer live AI aktif",
    "✅ Data member aman / tidak reset",
    "",
    "Dashboard: `/dashboard/oto/premium`"
  ].join("\n");
  return replyOt(message, { embeds: [otoPremiumEmbedV163(desc, "Hansip Status", "success")] });
}

async function otoCmdBonusV163(message) {
  if (!(await otoEnsureChannel(message))) return;
  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoPremiumEnsurePlayerV163(player);

  const desc = [
    "🎁 **Hansip Bonus Center**",
    "",
    "Bonus yang bisa kamu cari:",
    "• `otdaily` — hadiah harian",
    "• `oth` — NPC, EXP, fragment dari duplicate",
    "• `otuse fragmen r` — boost hunt berikutnya",
    "• `otopen all` — reward crate",
    "• `otb` — coin, player XP, NPC EXP",
    "",
    "**Saran hari ini:**",
    Object.keys(player.npcs || {}).length <= 0 ? "`oth` dulu supaya punya NPC." : "`otteam view` lalu `otb` buat naikin NPC EXP.",
    "",
    "Semua reward hanya item/coin game Hansip."
  ].join("\n");

  return replyOt(message, { embeds: [otoPremiumEmbedV163(desc, "Hansip Bonus")] });
}

// Upgrade help/flow to more premium.
async function otoCmdFlow(message) {
  if (!(await otoEnsureChannel(message))) return;
  return replyOt(message, { embeds: [otoPremiumEmbedV163(otoPremiumFlowTextV163(), "Hansip Flow")] });
}

function otoHelpEmbed() {
  return otoPremiumEmbedV163([
    "💠 **Hansip Help Center Premium**",
    "",
    "`otguide` — panduan paling lengkap",
    "`otflow` — alur main",
    "`otprogress` — cek langkah berikutnya",
    "`otstatus` — cek sistem Hansip",
    "`otbonus` — pusat bonus/reward",
    "",
    "**Core:**",
    "`otprofile` • `otdaily` • `oth` • `otnpc` • `otcard <npcId>`",
    "`otteam add <npcId> slot 1` • `otteam view` • `otb`",
    "",
    "**Item:**",
    "`otinv` • `otuse fragmen c/u/r/e/m/s` • `otopen all`",
    "",
    "**Virtual coin game:**",
    "`otcf <jumlah/all>` • `otbj <jumlah/all>`",
    "",
    "Semua dibuat ringkas, premium, dan satu pesan agar channel tetap rapi."
  ].join("\n"), "Hansip Help");
}

// Premium battle one-message with 3s animation.
async function otoCmdBattle(message) {
  if (!(await otoEnsureChannel(message))) return;
  const anim = await otoOneSendAnimationV162(message, "battle", "Battle Hansip dimulai...");

  const { player } = otoGetPlayer(message.author);
  if (typeof otoNormalizePlayer === "function") otoNormalizePlayer(player);
  otoPremiumEnsurePlayerV163(player);

  const team = (player.team || []).map(id => player.npcs[id]).filter(Boolean);
  if (!team.length) {
    return otoOneEditOrSendV162(anim, message, {
      embeds: [otoPremiumEmbedV163("❌ Team masih kosong.\n\nAlur aman:\n`oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`", "Hansip Battle", "error")]
    });
  }

  const npcPower = n => {
    try { if (typeof otoNpcPowerV159 === "function") return otoNpcPowerV159(n); } catch (_) {}
    return Number(n.power || 100) + (Number(n.level || 1) - 1) * 25;
  };

  const power = team.reduce((s,n)=>s+npcPower(n),0);
  const luck = (() => {
    try { if (typeof otoV155EnsureLuck === "function") return otoV155EnsureLuck(player, false); } catch (_) {}
    return { value: 8, tier: "Normal" };
  })();

  const enemyName = ["Guard Warung Neon", "Dealer Kursi Plastik", "Shadow Admin OT", "Pak RW Arena", "NPC Blue Core"][Math.floor(Math.random()*5)];
  const enemy = Math.max(100, Math.floor(power * (0.75 + Math.random()*0.75)));
  const chance = Math.max(10, Math.min(90, Math.round((power + Number(luck.value || 1)*10) / Math.max(1, power+enemy) * 100)));
  const win = Math.random()*100 < chance;

  const coin = win ? 180+Math.floor(Math.random()*220) : 45+Math.floor(Math.random()*80);
  const playerXp = win ? 60+Math.floor(Math.random()*90) : 20+Math.floor(Math.random()*45);
  const npcExp = win ? 45+Math.floor(Math.random()*75) : 15+Math.floor(Math.random()*35);

  const levelLines = [];
  for (const npc of team) {
    try {
      if (typeof otoNpcAddExpV159 === "function") {
        const up = otoNpcAddExpV159(npc, npcExp);
        if (up.leveled) levelLines.push(`✨ ${npc.emoji || "🙂"} **${npc.name}** naik Lv.${up.before} → **Lv.${up.after}**`);
      } else {
        npc.exp = Number(npc.exp || 0) + npcExp;
      }
    } catch (_) {}
  }

  player.coin = Number(player.coin || 0) + coin;
  player.exp = Number(player.exp || 0) + playerXp;
  player.stats = player.stats || {};
  player.stats.battleWin = Number(player.stats.battleWin || 0) + (win ? 1 : 0);
  player.stats.battleLose = Number(player.stats.battleLose || 0) + (win ? 0 : 1);

  if (typeof otoSavePlayer === "function") otoSavePlayer(message.author, player);

  const teamLine = team.map((n,i) => {
    const lv = Number(n.level || 1);
    const exp = Number(n.exp || 0);
    return `${i+1}. ${n.emoji || "🙂"} **${n.name}** • Lv.${lv} • EXP ${exp}`;
  }).join("\n");

  const desc = [
    `⚔️ **Hansip Battle — ${win ? "MENANG" : "KALAH"}**`,
    "",
    teamLine,
    "",
    `Enemy: **${enemyName}**`,
    `Power Team: **${power.toLocaleString("id-ID")}**`,
    `Power Musuh: **${enemy.toLocaleString("id-ID")}**`,
    `<a:clover:1513671524949823639>Luck: ${luck.value} • ${luck.tier}`,
    `Chance: **${chance}%**`,
    "",
    win ? `💎 Menang! Reward **${coin} Hansip Coin** + **${playerXp} Player XP**.` : `💨 Kalah, tapi tetap dapat **${coin} Hansip Coin** + **${playerXp} Player XP**.`,
    `🎴 NPC Team EXP: **+${npcExp}**`,
    levelLines.length ? "" : "",
    ...levelLines,
    "",
    "Lanjut: `otteam view` • `otprogress`"
  ].filter(Boolean).join("\n");

  return otoOneEditOrSendV162(anim, message, {
    embeds: [otoPremiumEmbedV163(desc, "Hansip Battle", win ? "success" : "error")]
  });
}

// Register new commands.
try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.set) {
    [
      ["otguide", "Panduan premium Hansip."],
      ["otprogress", "Cek progress dan langkah berikutnya."],
      ["otstatus", "Cek status sistem Hansip."],
      ["otbonus", "Lihat pusat bonus dan reward Hansip."]
    ].forEach(([name, description]) => {
      OT_COMMAND_MAP.set(name, { name, category:"member", permission:"member", usage:name, description });
    });
  }
  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS.add) {
    ["otguide","otprogress","otstatus","otbonus"].forEach(x => OTO_DIRECT_COMMANDS.add(x));
  }
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET.add) {
    ["otguide","otprogress","otstatus","otbonus"].forEach(x => OTO_COMMAND_SET.add(x));
  }
} catch (err) {
  console.error("Hansip premium command register gagal:", err);
}

// Final safe router after old routers: no double, one message, helpful fallback.
if (typeof processOtoCommand === "function" && !processOtoCommand.__otoPremiumV163) {
  const processOtoCommandOldPremiumV163 = processOtoCommand;
  processOtoCommand = async function(message, parsed, command) {
    const name = String(command?.name || "").toLowerCase();
    const args = parsed?.args || [];

    try {
      if (name === "otguide") return otoCmdGuideV163(message), true;
      if (name === "otprogress") return otoCmdProgressV163(message), true;
      if (name === "otstatus") return otoCmdStatusV163(message), true;
      if (name === "otbonus") return otoCmdBonusV163(message), true;
      if (name === "othelp") { if (!(await otoEnsureChannel(message))) return true; return replyOt(message, { embeds: [otoHelpEmbed()] }), true; }
      if (name === "otflow") return otoCmdFlow(message), true;
      if (name === "otb" || name === "otbattle") return otoCmdBattle(message), true;

      // Keep v1.62 one-message action router for others.
      return processOtoCommandOldPremiumV163(message, parsed, command);
    } catch (err) {
      console.error("[Hansip v1.63] Safe router error:", err);
      const fallback = [
        "⚠️ **Hansip lagi merapikan command ini.**",
        "",
        "Biar aman, pakai alur ini dulu:",
        "`otguide` → `otprogress` → `oth` → `otnpc recent` → `otteam add <npcId> slot 1` → `otb`",
        "",
        `Command: \`${name || "unknown"}\``
      ].join("\n");
      try { await replyOt(message, { embeds: [otoPremiumEmbedV163(fallback, "Hansip Safety", "warning")] }); } catch (_) {}
      return true;
    }
  };
  processOtoCommand.__otoPremiumV163 = true;
}

// Premium dashboard all-in-one.
try {
  if (typeof app !== "undefined" && app.get && !app.__otoPremiumExperienceV163) {
    app.get("/api/oto/premium-v163", (req, res) => {
      res.json({
        ok: true,
        version: "5.9.99",
        suite: "Hansip Premium Experience Suite",
        animationMs: Number(config.otoPremiumAnimationMs || config.otoAnimationDelayMs || 3000),
        oneMessage: true,
        noImage: true,
        dataSafe: true,
        newCommands: ["otguide","otprogress","otstatus","otbonus"],
        flow: ["otguide","otprogress","otdaily","oth","otnpc recent","otteam add <npcId> slot 1","otb","otopen all","ottop"],
        colors: {
          normal: config.otoEmbedNormalColor || "#00E5FF",
          win: config.otoEmbedWinColor || "#22C55E",
          lose: config.otoEmbedLoseColor || "#EF4444"
        }
      });
    });

    app.get("/dashboard/oto/premium", (req, res) => {
      const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
      <title>Hansip Premium Experience Suite</title>
      <style>
      :root{--bg:#07111f;--card:#0b1729;--line:#17446f;--cyan:#00E5FF;--blue:#0B5CFF;--green:#22C55E;--red:#EF4444;--yellow:#FACC15}
      body{margin:0;background:radial-gradient(circle at top,#0B5CFF33,#07111f 42%,#050b14);color:#eaf7ff;font-family:Inter,Arial,sans-serif}
      .wrap{max-width:1180px;margin:0 auto;padding:28px}
      .hero{background:linear-gradient(135deg,#07111f,#0B5CFF44,#00E5FF22);border:1px solid #00E5FF66;border-radius:26px;padding:26px;box-shadow:0 0 38px #00E5FF22}
      h1{margin:0;font-size:34px}.sub{opacity:.85;margin-top:8px}.pill{display:inline-block;border:1px solid #00E5FF55;border-radius:999px;padding:6px 10px;margin:8px 6px 0 0;background:#06101d}
      .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(245px,1fr));gap:14px;margin-top:18px}
      .card{background:linear-gradient(180deg,#0b1729,#081321);border:1px solid #163c68;border-radius:20px;padding:16px;box-shadow:0 0 16px #0005}
      .card b{color:#7ee7ff} code{background:#06101d;border:1px solid #17446f;border-radius:8px;padding:2px 6px;color:#d6fbff}
      .ok{color:var(--green)}.bad{color:var(--red)}.warn{color:var(--yellow)} a{color:#7ee7ff}
      </style></head><body><div class="wrap">
      <div class="hero">
        <h1>💠 Hansip Premium Experience Suite</h1>
        <div class="sub">HANSIP DESA TULUS • v1.63.0 • Premium one-message game flow</div>
        <span class="pill">✨ 3s Animation</span><span class="pill">🛡️ No Spam</span><span class="pill">🎴 NPC Level EXP</span><span class="pill">🧩 Fragment Booster</span><span class="pill">🃏 Live Blackjack</span>
      </div>
      <div class="grid">
        <div class="card"><b>🚦 Alur Member</b><p><code>otguide</code> → <code>otprogress</code> → <code>otdaily</code> → <code>oth</code> → <code>otnpc recent</code> → <code>otteam add &lt;npcId&gt; slot 1</code> → <code>otb</code></p></div>
        <div class="card"><b>✨ Animasi</b><p>Semua action command memakai animasi premium <b>3 detik</b>, lalu pesan yang sama berubah jadi hasil.</p></div>
        <div class="card"><b>🛡️ Safety</b><p class="ok">No reset data member, no overwrite .env/config aktif, no image mode.</p></div>
        <div class="card"><b>🎨 Warna</b><p>Normal <span class="warn">biru neon</span>, menang <span class="ok">hijau</span>, kalah/error <span class="bad">merah</span>.</p></div>
        <div class="card"><b>🎴 NPC</b><p>NPC punya level/EXP sendiri. Battle memberi NPC EXP dan bisa level up.</p></div>
        <div class="card"><b>🧩 Fragment</b><p><code>otuse fragmen c/u/r/e/m/s</code> untuk boost hunt berikutnya.</p></div>
        <div class="card"><b>🃏 Blackjack</b><p><code>otbj &lt;jumlah/all&gt;</code> pakai tombol Tambahin/Stop dan dealer live AI.</p></div>
        <div class="card"><b>🔎 API</b><p><a href="/api/oto/premium-v163">/api/oto/premium-v163</a></p></div>
      </div></div></body></html>`;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.send(html);
    });

    app.__otoPremiumExperienceV163 = true;
  }
} catch (err) {
  console.error("Hansip premium dashboard v1.63 gagal:", err);
}


/* =========================
   Hansip PREMIUM SMOOTH COMPACT UI v1.64.0
   - Smooth emoji animation: 4 frame edit, total 3 detik, tetap 1 pesan.
   - Embed compact: lebih pendek, rapi, tidak kebanyakan text.
   - Flow jelas dan premium, tanpa reset data dan tanpa ubah fitur lama.
========================= */

const OTO_SMOOTH_V164 = {
  ot: "<a:Desa_Tulus:1516424353934348299>",
  dot: "<:glowing_dot_blue:1513670991056736408>",
  luck: "<a:clover:1513671524949823639>"
};

function otoSmoothSleepV164(ms){ return new Promise(r=>setTimeout(r, Math.max(0, Number(ms||0)))); }
function otoSmoothColorV164(type="normal"){
  const t=String(type||"normal").toLowerCase();
  if(["success","win","menang","green"].includes(t)) return config.otoEmbedWinColor || "#22C55E";
  if(["error","lose","kalah","danger","red"].includes(t)) return config.otoEmbedLoseColor || "#EF4444";
  if(["warning","draw","seri","yellow"].includes(t)) return config.otoEmbedWarningColor || "#FACC15";
  return config.otoEmbedNormalColor || config.otoEmbedAccent || config.otoEmbedColor || "#00E5FF";
}
function otoSmoothFooterV164(desc="", suffix="Hansip"){
  const clean=String(desc||"").replace(/\n*<a:Desa_Tulus:1516424353934348299>\s*DESA TULUS\s*•[^\n]*/g,"").replace(/\n*DESA TULUS\s*•[^\n]*/g,"").trimEnd();
  return `${clean}\n\n<a:Desa_Tulus:1516424353934348299> DESA TULUS • ${suffix}`;
}
function otoSmoothEmbedV164(desc="", suffix="Hansip", type="normal"){
  const embed=new EmbedBuilder().setColor(otoSmoothColorV164(type)).setDescription(otoSmoothFooterV164(desc,suffix));
  try{ embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); }catch(_){ }
  return embed;
}
function otoSmoothFramesV164(kind="action"){
  const f={
    hunt:[`${OTO_SMOOTH_V164.dot} 🌱`,`${OTO_SMOOTH_V164.dot} 🌱 🔎`,`${OTO_SMOOTH_V164.dot} 🎴 ✨`,`${OTO_SMOOTH_V164.ot} 🎴`],
    crate:[`${OTO_SMOOTH_V164.dot} 📦`,`${OTO_SMOOTH_V164.dot} 📦 🔓`,`${OTO_SMOOTH_V164.dot} 🎁 ✨`,`${OTO_SMOOTH_V164.ot} 🎁`],
    battle:[`${OTO_SMOOTH_V164.dot} ⚔️`,`${OTO_SMOOTH_V164.dot} ⚔️ 💥`,`${OTO_SMOOTH_V164.dot} 🛡️ 🏆`,`${OTO_SMOOTH_V164.ot} 🏆`],
    coinflip:[`${OTO_SMOOTH_V164.dot} 🪙`,`${OTO_SMOOTH_V164.dot} 🪙 🔄`,`${OTO_SMOOTH_V164.dot} 🪙 ✨`,`${OTO_SMOOTH_V164.ot} 👑`],
    blackjack:[`${OTO_SMOOTH_V164.dot} 🃏`,`${OTO_SMOOTH_V164.dot} 🃏 🎴`,`${OTO_SMOOTH_V164.dot} ➕ 🛑`,`${OTO_SMOOTH_V164.ot} 🃏`],
    daily:[`${OTO_SMOOTH_V164.dot} 🎁`,`${OTO_SMOOTH_V164.dot} 💰`,`${OTO_SMOOTH_V164.dot} ⭐`,`${OTO_SMOOTH_V164.ot} 🎁`],
    quest:[`${OTO_SMOOTH_V164.dot} 🎯`,`${OTO_SMOOTH_V164.dot} 📜`,`${OTO_SMOOTH_V164.dot} ✅`,`${OTO_SMOOTH_V164.ot} 🎯`],
    luck:[`${OTO_SMOOTH_V164.luck}`,`${OTO_SMOOTH_V164.luck} ✨`,`${OTO_SMOOTH_V164.luck} 💠`,`${OTO_SMOOTH_V164.ot} ${OTO_SMOOTH_V164.luck}`],
    use:[`${OTO_SMOOTH_V164.dot} 🧩`,`🧩 ✨`,`🧩 🌱`,`${OTO_SMOOTH_V164.ot} 🧩`],
    action:[`${OTO_SMOOTH_V164.dot} 💠`,`${OTO_SMOOTH_V164.dot} ✨`,`${OTO_SMOOTH_V164.dot} ✅`,`${OTO_SMOOTH_V164.ot} 💠`]
  };
  return f[kind]||f.action;
}
async function otoSmoothSendAnimationV164(message, kind="action", title="Hansip"){
  const frames=otoSmoothFramesV164(kind); const frameMs=Number(config.otoSmoothAnimationFrameMs||750); const total=Math.min(frames.length, Number(config.otoSmoothAnimationFrames||4));
  const payload=i=>({embeds:[otoSmoothEmbedV164([frames[i],"",`**${title}**`,`Frame ${i+1}/${total}`].join("\n"),"Hansip Animation")]});
  let sent=null; try{ sent=await replyOt(message,payload(0)); }catch(_){ try{ sent=await message.reply(payload(0)); }catch(__){} }
  for(let i=1;i<total;i++){ await otoSmoothSleepV164(frameMs); try{ if(sent&&typeof sent.edit==="function") await sent.edit(payload(i)); }catch(_){} }
  await otoSmoothSleepV164(frameMs); return sent;
}
async function otoOneSendAnimationV162(message, kind="action", title="Hansip sedang memproses..."){ return otoSmoothSendAnimationV164(message, kind, title); }
async function otoSendAnimationV156(message, type="action", title="Hansip sedang memproses..."){ return otoSmoothSendAnimationV164(message, type, title); }

function otoSmoothEnsurePlayerV164(player){
  if(typeof otoNpcNormalizePlayerV159==="function") return otoNpcNormalizePlayerV159(player);
  if(typeof otoFragEnsureV158==="function") return otoFragEnsureV158(player);
  if(typeof otoV155Ensure==="function") return otoV155Ensure(player);
  player.npcs=player.npcs||{}; player.inventory=player.inventory||{crates:{},weapons:{},fragments:{},items:{}}; player.team=Array.isArray(player.team)?player.team:["","",""]; player.stats=player.stats||{}; if(player.coin===undefined) player.coin=100;
}
function otoSmoothLevelV164(player){ try{ if(typeof otoV155Level==="function") return otoV155Level(player); }catch(_){} return Math.max(1,Number(player?.level||1)); }
function otoSmoothLuckLineV164(player){ try{ if(typeof otoV155LuckLine==="function") return otoV155LuckLine(player); }catch(_){} return `${OTO_SMOOTH_V164.luck}Luck: 8 • Normal`; }
function otoSmoothPointsV164(player){ try{ if(typeof otoV155Points==="function") return otoV155Points(player); }catch(_){} return Object.keys(player?.npcs||{}).length; }
function otoSmoothTeamPowerV164(player){ try{ if(typeof otoV155TeamPower==="function") return otoV155TeamPower(player); }catch(_){} return 0; }

async function otoCmdGuideV163(message){ if(!(await otoEnsureChannel(message))) return; return replyOt(message,{embeds:[otoSmoothEmbedV164(["📘 **Hansip Guide**","","`otprogress` — cek langkah","`oth` — cari NPC","`otnpc recent` — ambil npcId","`otteam add <npcId> slot 1`","`otb` — battle","","Bonus: `otinv` • `otopen all`"].join("\n"),"Hansip Guide")]}); }
async function otoCmdFlow(message){ if(!(await otoEnsureChannel(message))) return; return replyOt(message,{embeds:[otoSmoothEmbedV164(["💠 **Hansip Flow**","","1. `otdaily`","2. `oth`","3. `otnpc recent`","4. `otteam add <npcId> slot 1`","5. `otb`","","Bingung? `otprogress`"].join("\n"),"Hansip Flow")]}); }
function otoHelpEmbed(){ return otoSmoothEmbedV164(["💠 **Hansip Help**","","`otguide` • `otprogress` • `otflow`","`oth` • `otnpc` • `otcard <npcId>`","`otteam view` • `otb`","`otinv` • `otopen all`","`otcf 100` • `otbj 100`","","Ringkas. 1 pesan. No spam."].join("\n"),"Hansip Help"); }
async function otoCmdProgressV163(message){
  if(!(await otoEnsureChannel(message))) return; const {player}=otoGetPlayer(message.author); if(typeof otoNormalizePlayer==="function") otoNormalizePlayer(player); otoSmoothEnsurePlayerV164(player);
  const npcCount=Object.keys(player.npcs||{}).length; const hasTeam=(player.team||[]).some(id=>id&&player.npcs[id]); const last=player.lastHunt?.npcs?.[0]?.id||"";
  const next=npcCount<=0?"`oth`":!hasTeam?(last?`\`otteam add ${last} slot 1\``:"`otnpc recent`"):"`otb`";
  const desc=[`${OTO_SMOOTH_V164.dot} **Progress**`,"",`Lv: **${otoSmoothLevelV164(player)}**`,`Coin: **${Number(player.coin||0).toLocaleString("id-ID")}**`,`NPC: **${npcCount}/30**`,`Power: **${Number(otoSmoothTeamPowerV164(player)).toLocaleString("id-ID")}**`,otoSmoothLuckLineV164(player),"",`Next: ${next}`].join("\n");
  return replyOt(message,{embeds:[otoSmoothEmbedV164(desc,"Hansip Progress")]});
}
async function otoCmdStatusV163(message){ if(!(await otoEnsureChannel(message))) return; return replyOt(message,{embeds:[otoSmoothEmbedV164(["🛡️ **Hansip Status**","","✅ Smooth animation 3s","✅ One-message mode","✅ No image mode","✅ Data aman","","`otguide` untuk mulai"].join("\n"),"Hansip Status","success")]}); }
async function otoCmdBonusV163(message){ if(!(await otoEnsureChannel(message))) return; return replyOt(message,{embeds:[otoSmoothEmbedV164(["🎁 **Hansip Bonus**","","`otdaily` — modal","`oth` — NPC/fragment","`otuse fragmen r` — boost","`otopen all` — crate","`otb` — NPC EXP","","Next: `otprogress`"].join("\n"),"Hansip Bonus")]}); }
async function otoCmdProfile(message){
  if(!(await otoEnsureChannel(message))) return; const {player}=otoGetPlayer(message.author); if(typeof otoNormalizePlayer==="function") otoNormalizePlayer(player); otoSmoothEnsurePlayerV164(player);
  const desc=[`${OTO_SMOOTH_V164.dot} **${message.author.username}'s Profile**`,"",`Lv: **${otoSmoothLevelV164(player)}** • Coin: **${Number(player.coin||0).toLocaleString("id-ID")}**`,`NPC: **${Object.keys(player.npcs||{}).length}/30** • Points: **${Number(otoSmoothPointsV164(player)).toLocaleString("id-ID")}**`,`Power: **${Number(otoSmoothTeamPowerV164(player)).toLocaleString("id-ID")}**`,otoSmoothLuckLineV164(player),"","Next: `otprogress`"].join("\n");
  return replyOt(message,{embeds:[otoSmoothEmbedV164(desc,"Hansip Profile")]});
}

async function otoCmdBattle(message){
  if(!(await otoEnsureChannel(message))) return; const anim=await otoOneSendAnimationV162(message,"battle","Battle Hansip...");
  const {player}=otoGetPlayer(message.author); if(typeof otoNormalizePlayer==="function") otoNormalizePlayer(player); otoSmoothEnsurePlayerV164(player);
  const team=(player.team||[]).map(id=>player.npcs[id]).filter(Boolean);
  if(!team.length) return otoOneEditOrSendV162(anim,message,{embeds:[otoSmoothEmbedV164("❌ Team kosong.\n\n`oth` → `otnpc recent` → `otteam add <npcId> slot 1`","Hansip Battle","error")]});
  const powerFn=n=>{ try{ if(typeof otoNpcPowerV159==="function") return otoNpcPowerV159(n); }catch(_){} return Number(n.power||100)+(Number(n.level||1)-1)*25; };
  const power=team.reduce((s,n)=>s+powerFn(n),0); const luck=(()=>{ try{ if(typeof otoV155EnsureLuck==="function") return otoV155EnsureLuck(player,false); }catch(_){} return {value:8,tier:"Normal"}; })();
  const enemies=["Guard Neon","Pak RW Arena","Dealer Blue","Shadow OT","Core NPC"]; const enemy=enemies[Math.floor(Math.random()*enemies.length)];
  const enemyPower=Math.max(100,Math.floor(power*(0.75+Math.random()*0.75))); const chance=Math.max(10,Math.min(90,Math.round((power+Number(luck.value||1)*10)/Math.max(1,power+enemyPower)*100))); const win=Math.random()*100<chance;
  const coin=win?180+Math.floor(Math.random()*220):45+Math.floor(Math.random()*80); const playerXp=win?60+Math.floor(Math.random()*90):20+Math.floor(Math.random()*45); const npcExp=win?45+Math.floor(Math.random()*75):15+Math.floor(Math.random()*35);
  const upLines=[]; for(const npc of team){ try{ if(typeof otoNpcAddExpV159==="function"){ const up=otoNpcAddExpV159(npc,npcExp); if(up.leveled) upLines.push(`✨ ${npc.emoji||"🙂"} Lv.${up.before}→${up.after}`); } else npc.exp=Number(npc.exp||0)+npcExp; }catch(_){} }
  player.coin=Number(player.coin||0)+coin; player.exp=Number(player.exp||0)+playerXp; player.stats=player.stats||{}; player.stats.battleWin=Number(player.stats.battleWin||0)+(win?1:0); player.stats.battleLose=Number(player.stats.battleLose||0)+(win?0:1); if(typeof otoSavePlayer==="function") otoSavePlayer(message.author,player);
  const teamShort=team.map(n=>`${n.emoji||"🙂"} Lv.${Number(n.level||1)}`).join(" ");
  const desc=[`⚔️ **Battle — ${win?"MENANG":"KALAH"}**`,"",`Team: ${teamShort}`,`Enemy: **${enemy}**`,`Power: **${power.toLocaleString("id-ID")}** vs **${enemyPower.toLocaleString("id-ID")}**`,`<a:clover:1513671524949823639>Luck: ${luck.value} • ${luck.tier}`,"",`${win?"💎":"💨"} Coin **+${coin}** • XP **+${playerXp}** • NPC EXP **+${npcExp}**`,upLines.length?upLines.slice(0,3).join(" • "):"Next: `otteam view`"].join("\n");
  return otoOneEditOrSendV162(anim,message,{embeds:[otoSmoothEmbedV164(desc,"Hansip Battle",win?"success":"error")]});
}

if(typeof processOtoCommand==="function"&&!processOtoCommand.__otoSmoothCompactV164){
  const old=processOtoCommand; processOtoCommand=async function(message,parsed,command){ const name=String(command?.name||"").toLowerCase();
    try{
      if(name==="otguide") return otoCmdGuideV163(message),true; if(name==="otprogress") return otoCmdProgressV163(message),true; if(name==="otstatus") return otoCmdStatusV163(message),true; if(name==="otbonus") return otoCmdBonusV163(message),true;
      if(name==="othelp"){ if(!(await otoEnsureChannel(message))) return true; await replyOt(message,{embeds:[otoHelpEmbed()]}); return true; }
      if(name==="otflow") return otoCmdFlow(message),true; if(name==="otprofile") return otoCmdProfile(message),true; if(name==="otb"||name==="otbattle") return otoCmdBattle(message),true;
      return old(message,parsed,command);
    }catch(err){ console.error("[Hansip v1.64] router error:",err); try{ await replyOt(message,{embeds:[otoSmoothEmbedV164("⚠️ Command belum mulus.\n\nCoba `otguide` atau `otprogress`.","Hansip Safety","warning")]}); }catch(_){} return true; }
  }; processOtoCommand.__otoSmoothCompactV164=true;
}

try{
  if(typeof app!=="undefined"&&app.get&&!app.__otoSmoothCompactV164){
    app.get("/api/oto/smooth-compact-v164",(req,res)=>res.json({ok:true,version:"1.64.0",suite:"Hansip Premium Smooth Compact UI",animation:{enabled:true,totalMs:3000,frames:4,frameMs:750},oneMessage:true,compactText:true,noImage:true,dataSafe:true}));
    app.get("/dashboard/oto/compact",(req,res)=>{ const html=`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hansip Smooth Compact UI</title><style>body{margin:0;background:radial-gradient(circle at top,#0B5CFF33,#07111f 46%,#050b14);color:#eaf7ff;font-family:Inter,Arial,sans-serif}.wrap{max-width:1080px;margin:0 auto;padding:28px}.hero{background:linear-gradient(135deg,#07111f,#0B5CFF44,#00E5FF22);border:1px solid #00E5FF66;border-radius:26px;padding:24px;box-shadow:0 0 36px #00E5FF22}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin-top:18px}.card{background:#0b1729;border:1px solid #163c68;border-radius:20px;padding:16px}code{background:#06101d;border:1px solid #17446f;border-radius:8px;padding:2px 6px;color:#d6fbff}</style></head><body><div class="wrap"><div class="hero"><h1>💠 Hansip Smooth Compact UI</h1><p>v1.64.0 • Smooth 3s animation • Compact premium embeds • One-message mode</p></div><div class="grid"><div class="card"><b>✨ Smooth</b><p>4 frame edit, total <code>3 detik</code>.</p></div><div class="card"><b>🧼 Compact</b><p>Embed pendek dan rapi.</p></div><div class="card"><b>🚦 Flow</b><p><code>otprogress</code> → <code>oth</code> → <code>otnpc recent</code> → <code>otb</code></p></div><div class="card"><b>🛡️ Safe</b><p>Tidak reset data dan tidak ubah fitur lama.</p></div></div></div></body></html>`; res.setHeader("Content-Type","text/html; charset=utf-8"); res.send(html); });
    app.__otoSmoothCompactV164=true;
  }
}catch(err){ console.error("Hansip compact dashboard v1.64 gagal:",err); }




/* =========================
   HANSIP DESA TULUS NO GAME v1.70.0
   Fokus:
   - Prefix utama diganti menjadi: h
   - Semua game/OtO/Hansip Desa Tulus dimatikan.
   - Bot fokus ke Hansip Desa Tulus: anti-scam, AFK, mabar, truth/dare, sambung kata, logs, server safety.
   - Data lama game tidak dihapus dari server/user, tapi file data aktif tidak ikut ZIP dan command game tidak jalan.
========================= */

const HANSIP_NO_GAME_BUILD = "5.9.99-hansip-desa-tulus-premium";

function applyHansipNoGameV170() {
  try {
    config.serverName = "DESA TULUS";
    config.botName = "Hansip";
    config.personaName = "Hansip Desa Tulus";
    config.theme = "perdesaan_hansip_desa_tulus";

    config.prefix = "h";
    config.commandPrefix = "h";
    config.defaultPrefix = "h";
    config.otoPrefix = "h";

    config.gameEnabled = false;
    config.otoEnabled = false;
    config.otoGameEnabled = false;
    config.otoDisabled = true;
    config.disableOtoCommands = true;
    config.removeOtoGame = true;

    config.features = config.features || {};
    config.features.oto = false;
    config.features.otoGame = false;
    config.features.game = false;
    config.features.adventureHub = false;

    config.features.antiScam = true;
    config.features.antiLink = true;
    config.features.afk = config.features.afk !== false;
    config.features.mabar = config.features.mabar !== false;
    config.features.truthOrDare = config.features.truthOrDare !== false;
    config.features.sambungKata = config.features.sambungKata !== false;

    const disabled = [
      "oth","othunt","otnpc","otcard","otteam","otb","otbattle","otinv","otopen",
      "otcf","otbj","otdaily","otquest","otluck","otuse","otprofile","otprogress",
      "otguide","otbonus","otboss","otdungeon","ottreasure","otcraft","otevent",
      "ottitle","otrank","otadventure","otadv","otjob","otkerja","otrep","otachieve",
      "otachievement","otstreak","ottop","otshop","otflow","othelp"
    ];

    try {
      if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP && OT_COMMAND_MAP.delete) {
        for (const name of disabled) OT_COMMAND_MAP.delete(name);
      }
    } catch (_) {}

    try {
      if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS && OTO_DIRECT_COMMANDS.delete) {
        for (const name of disabled) OTO_DIRECT_COMMANDS.delete(name);
      }
    } catch (_) {}

    try {
      if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET && OTO_COMMAND_SET.delete) {
        for (const name of disabled) OTO_COMMAND_SET.delete(name);
      }
    } catch (_) {}

    console.log("🛡️ Hansip Desa Tulus v1.70.0 aktif: prefix h, semua game/OtO dimatikan.");
  } catch (err) {
    console.error("Hansip no-game patch gagal:", err);
  }
}
applyHansipNoGameV170();

function hansipIsDisabledGameCommandV170(name = "") {
  const cmd = String(name || "").toLowerCase().trim();
  return [
    "oth","othunt","otnpc","otcard","otteam","otb","otbattle","otinv","otopen",
    "otcf","otbj","otdaily","otquest","otluck","otuse","otprofile","otprogress",
    "otguide","otbonus","otboss","otdungeon","ottreasure","otcraft","otevent",
    "ottitle","otrank","otadventure","otadv","otjob","otkerja","otrep","otachieve",
    "otachievement","otstreak","ottop","otshop","otflow","othelp"
  ].includes(cmd);
}

try {
  if (typeof processOtoCommand === "function" && !processOtoCommand.__hansipNoGameV170) {
    processOtoCommand = async function(message, parsed, command) {
      const name = String(command?.name || parsed?.command || "").toLowerCase();
      if (hansipIsDisabledGameCommandV170(name)) {
        try {
          await message.reply("🛡️ Fitur game sudah dimatikan. Hansip sekarang fokus jaga DESA TULUS.");
        } catch (_) {}
        return true;
      }
      return true;
    };
    processOtoCommand.__hansipNoGameV170 = true;
  }
} catch (_) {}

try {
  if (typeof client !== "undefined" && client.on && !client.__hansipNoGameMessageGuardV170) {
    client.on("messageCreate", async (message) => {
      try {
        if (!message || message.author?.bot) return;
        const content = String(message.content || "").trim();
        const first = content.split(/\s+/)[0].toLowerCase();
        if (first.startsWith("ot") && hansipIsDisabledGameCommandV170(first)) {
          await message.reply("🛡️ Fitur game sudah dimatikan. Prefix Hansip sekarang `h`.");
        }
      } catch (_) {}
    });
    client.__hansipNoGameMessageGuardV170 = true;
  }
} catch (_) {}




/* =========================
   HANSIP DESA TULUS PREMIUM DESA MODE v5.9.99
   Fokus:
   - Prefix tetap: h
   - Game/OtO/Hansip Desa Tulus tetap OFF
   - Semua embed baru pakai footer:
     <a:Desa_Tulus:1516424353934348299> DESA TULUS • ...
   - Bot terasa seperti bot server besar: command center, security, staff tools, log, report, automod, notes, reminder, poll, announcement, welcome.
   - Tema tetap perdesaan dan DESA TULUS.
   - Tidak reset data member dan tidak overwrite config aktif.
========================= */

const HANSIP_PREMIUM_BUILD = "5.9.99-hansip-desa-tulus-premium";
const HANSIP_PREFIX_V5999 = "h";
const HANSIP_FOOTER_V5999 = "<a:Desa_Tulus:1516424353934348299> DESA TULUS •";

function hansipPremiumApplyV5999() {
  try {
    config.serverName = "DESA TULUS";
    config.botName = "Hansip";
    config.personaName = "Hansip Desa Tulus";
    config.theme = "perdesaan_desa_tulus_premium";
    config.prefix = "h";
    config.commandPrefix = "h";
    config.defaultPrefix = "h";

    config.gameEnabled = false;
    config.otoEnabled = false;
    config.otoGameEnabled = false;
    config.otoDisabled = true;
    config.disableOtoCommands = true;
    config.hansipPremiumModeEnabled = true;
    config.hansipPremiumVersion = "5.9.99";
    config.hansipEmbedFooter = HANSIP_FOOTER_V5999 + " ...";

    config.features = config.features || {};
    config.features.oto = false;
    config.features.otoGame = false;
    config.features.game = false;
    config.features.adventureHub = false;
    config.features.hansipPremium = true;
    config.features.antiScam = true;
    config.features.antiLink = true;

    console.log("🛡️ Hansip Desa Tulus Premium Desa Mode v5.9.99 aktif. Prefix h, game OFF.");
  } catch (err) {
    console.error("Hansip Premium apply gagal:", err);
  }
}
hansipPremiumApplyV5999();

function hpPathV5999(name) {
  try {
    const fs = require("fs");
    const path = require("path");
    const dir = path.join(process.cwd(), "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, name);
  } catch (_) {
    return name;
  }
}

function hpReadV5999(name, fallback) {
  try {
    const fs = require("fs");
    const file = hpPathV5999(name);
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (_) {
    return fallback;
  }
}

function hpWriteV5999(name, data) {
  try {
    const fs = require("fs");
    fs.writeFileSync(hpPathV5999(name), JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Hansip Premium write gagal:", err.message || err);
  }
}

function hpSettingsV5999(guildId) {
  const all = hpReadV5999("hansip-premium-settings.json", {});
  all[guildId] = all[guildId] || {};
  return { all, s: all[guildId] };
}

function hpColorV5999(type = "normal") {
  const t = String(type || "normal").toLowerCase();
  if (["success","green"].includes(t)) return "#22C55E";
  if (["error","red"].includes(t)) return "#EF4444";
  if (["warning","yellow"].includes(t)) return "#FACC15";
  return config.embedColor || "#0B5CFF";
}

function hpEmbedV5999(desc = "", suffix = "Hansip", type = "normal") {
  const embed = new EmbedBuilder()
    .setColor(hpColorV5999(type))
    .setDescription(`${String(desc || "").trim()}\n\n${HANSIP_FOOTER_V5999} ${suffix}`);
  try { embed.clearFooter(); embed.setImage(null); embed.setThumbnail(null); } catch (_) {}
  return embed;
}

function hpStaffV5999(member) {
  if (!member) return false;
  if (member.permissions?.has?.("Administrator")) return true;
  if (member.permissions?.has?.("ManageMessages")) return true;
  const { s } = hpSettingsV5999(member.guild.id);
  const roleId = s.staffRoleId || config.hansipStaffRoleId || config.staffRoleId || config.adminRoleId || "";
  if (roleId && member.roles?.cache?.has?.(roleId)) return true;
  return false;
}

async function hpChannelV5999(guild, key) {
  try {
    const { s } = hpSettingsV5999(guild.id);
    const id = s[key] || config[key] || config.hansipLogChannelId || config.ownerLogChannelId || "";
    if (!id) return null;
    return guild.channels.cache.get(id) || await guild.channels.fetch(id).catch(() => null);
  } catch (_) {
    return null;
  }
}

async function hpLogV5999(guild, desc, type = "normal") {
  try {
    const ch = await hpChannelV5999(guild, "logChannelId");
    if (ch?.send) await ch.send({ embeds: [hpEmbedV5999(desc, "Log", type)] });
  } catch (_) {}
}

function hpDisabledGameV5999(name = "") {
  return [
    "oth","othunt","otnpc","otcard","otteam","otb","otbattle","otinv","otopen","otcf","otbj",
    "otdaily","otquest","otluck","otuse","otprofile","otprogress","otguide","otbonus","otboss",
    "otdungeon","ottreasure","otcraft","otevent","ottitle","otrank","otadventure","otadv","otjob",
    "otkerja","otrep","otachieve","otachievement","otstreak","ottop","otshop","otflow","othelp"
  ].includes(String(name || "").toLowerCase());
}

async function hpHandleV5999(message) {
  if (!message || message.author?.bot || !message.guild) return false;
  const content = String(message.content || "").trim();
  if (!content) return false;

  const first = content.split(/\s+/)[0].toLowerCase();
  if (hpDisabledGameV5999(first)) {
    await message.reply({ embeds: [hpEmbedV5999("Fitur game sudah dimatikan. Hansip sekarang fokus menjaga DESA TULUS.", "No Game", "warning")] });
    return true;
  }

  if (!content.toLowerCase().startsWith(HANSIP_PREFIX_V5999)) return false;

  const parts = content.slice(HANSIP_PREFIX_V5999.length).trim().split(/\s+/).filter(Boolean);
  const cmd = String(parts.shift() || "").toLowerCase();
  const args = parts;
  if (!cmd) return false;

  const replyEmbed = (desc, suffix = "Hansip", type = "normal") => message.reply({ embeds: [hpEmbedV5999(desc, suffix, type)] });

  if (cmd === "help" || cmd === "menu" || cmd === "cmd" || cmd === "panel") {
    return replyEmbed([
      "📘 **Command Center Hansip**",
      "",
      "**Warga**",
      "`hping` `hstatus` `hdesa` `haturan` `hid` `huser` `havatar`",
      "`hlapor <isi>` `hsaran <isi>` `hpoll <pertanyaan>` `hremind <menit> <pesan>`",
      "",
      "**Staff**",
      "`hsetlog #channel` `hsetreport #channel` `hsetstaff @role` `hsetwelcome #channel`",
      "`hclear <1-100>` `hwarn @user <alasan>` `hwarnings @user`",
      "`hnote @user <catatan>` `hnotes @user` `hannounce #channel <pesan>`",
      "`hslowmode <detik>` `hlock` `hunlock` `hsay <pesan>`",
      "",
      "**Sistem**",
      "`hconfig` `hmodules` `hhealth` `hstats`",
      "",
      "Game OFF. Hansip fokus keamanan dan ketertiban DESA TULUS."
    ].join("\n"), "Command Center");
  }

  if (cmd === "ping") {
    return replyEmbed(`🏓 Pong.\nWS: **${client.ws?.ping ?? 0}ms**\nMode: **Premium Desa v5.9.99**`, "Ping", "success");
  }

  if (cmd === "status" || cmd === "health") {
    const uptime = Math.floor(process.uptime());
    const mem = Math.round(process.memoryUsage().rss / 1024 / 1024);
    return replyEmbed([
      "🛡️ **Status Hansip**",
      "",
      "Prefix: **h**",
      "Game: **OFF**",
      "Anti-scam: **ON**",
      "Premium Desa Mode: **ON**",
      `Uptime: **${uptime}s**`,
      `Memory: **${mem}MB**`
    ].join("\n"), "Status", "success");
  }

  if (cmd === "desa" || cmd === "server") {
    const g = message.guild;
    return replyEmbed([
      "🏡 **Info Desa Tulus**",
      "",
      `Nama: **${g.name}**`,
      `Warga: **${g.memberCount}**`,
      `Channel: **${g.channels.cache.size}**`,
      `Role: **${g.roles.cache.size}**`,
      `Boost: **${g.premiumSubscriptionCount || 0}**`
    ].join("\n"), "Desa");
  }

  if (cmd === "modules" || cmd === "stats") {
    const { s } = hpSettingsV5999(message.guild.id);
    return replyEmbed([
      "📊 **Modul Hansip**",
      "",
      "✅ Anti-scam",
      "✅ Anti-spam ringan",
      "✅ Report warga",
      "✅ Saran warga",
      "✅ Staff tools",
      "✅ Notes & warnings",
      "✅ Reminder & poll",
      "✅ Auto-log edit/delete",
      "❌ Game/OtO",
      "",
      `Log: ${s.logChannelId ? `<#${s.logChannelId}>` : "belum diset"}`,
      `Report: ${s.reportChannelId ? `<#${s.reportChannelId}>` : "belum diset"}`,
      `Welcome: ${s.welcomeChannelId ? `<#${s.welcomeChannelId}>` : "belum diset"}`,
      `Staff: ${s.staffRoleId ? `<@&${s.staffRoleId}>` : "permission staff"}`
    ].join("\n"), "Modules");
  }

  if (cmd === "config") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Config", "error");
    const { s } = hpSettingsV5999(message.guild.id);
    return replyEmbed([
      "⚙️ **Config Hansip**",
      "",
      "Prefix: `h`",
      "Game: `OFF`",
      `Log: ${s.logChannelId ? `<#${s.logChannelId}>` : "belum diset"}`,
      `Report: ${s.reportChannelId ? `<#${s.reportChannelId}>` : "belum diset"}`,
      `Welcome: ${s.welcomeChannelId ? `<#${s.welcomeChannelId}>` : "belum diset"}`,
      `Staff: ${s.staffRoleId ? `<@&${s.staffRoleId}>` : "belum diset"}`
    ].join("\n"), "Config");
  }

  if (["setlog","setreport","setwelcome","setstaff"].includes(cmd)) {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Setup", "error");
    const { all, s } = hpSettingsV5999(message.guild.id);

    if (cmd === "setstaff") {
      const role = message.mentions.roles.first();
      if (!role) return replyEmbed("Format: `hsetstaff @role`", "Setup", "warning");
      s.staffRoleId = role.id;
      hpWriteV5999("hansip-premium-settings.json", all);
      return replyEmbed(`Staff role diset ke ${role}.`, "Setup", "success");
    }

    const ch = message.mentions.channels.first();
    if (!ch) return replyEmbed(`Format: \`h${cmd} #channel\``, "Setup", "warning");
    if (cmd === "setlog") s.logChannelId = ch.id;
    if (cmd === "setreport") s.reportChannelId = ch.id;
    if (cmd === "setwelcome") s.welcomeChannelId = ch.id;
    hpWriteV5999("hansip-premium-settings.json", all);
    return replyEmbed(`${cmd.replace("set","")} channel diset ke ${ch}.`, "Setup", "success");
  }

  if (cmd === "aturan") {
    return replyEmbed([
      "📜 **Aturan Desa Tulus**",
      "",
      "1. Saling hormat.",
      "2. Jangan spam.",
      "3. Jangan scam/phishing.",
      "4. Jangan sebar data pribadi.",
      "5. Pakai channel sesuai tempatnya.",
      "",
      "Lapor masalah: `hlapor <isi>`"
    ].join("\n"), "Aturan");
  }

  if (cmd === "lapor" || cmd === "report") {
    const isi = args.join(" ").trim();
    if (!isi) return replyEmbed("Format: `hlapor <isi laporan>`", "Lapor", "warning");
    const embed = hpEmbedV5999([
      "🚨 **Laporan Warga**",
      "",
      `Pelapor: ${message.author}`,
      `Channel: ${message.channel}`,
      `Isi: ${isi}`
    ].join("\n"), "Laporan", "warning");
    const ch = await hpChannelV5999(message.guild, "reportChannelId");
    if (ch?.send) await ch.send({ embeds: [embed] });
    else await hpLogV5999(message.guild, embed.data.description || "Laporan masuk.", "warning");
    return replyEmbed("Laporan diterima. Hansip akan teruskan ke staff.", "Lapor", "success");
  }

  if (cmd === "saran" || cmd === "suggest") {
    const isi = args.join(" ").trim();
    if (!isi) return replyEmbed("Format: `hsaran <isi saran>`", "Saran", "warning");
    await hpLogV5999(message.guild, `💬 **Saran Warga**\n\nDari: ${message.author}\nSaran: ${isi}`, "normal");
    return replyEmbed("Saran dicatat. Nuhun, warga.", "Saran", "success");
  }

  if (cmd === "poll" || cmd === "voting") {
    const q = args.join(" ").trim();
    if (!q) return replyEmbed("Format: `hpoll <pertanyaan>`", "Poll", "warning");
    const poll = await message.reply({ embeds: [hpEmbedV5999(`📊 **Poll Warga**\n\n${q}\n\n✅ Setuju • ❌ Tidak`, "Poll")] });
    await poll.react("✅").catch(() => null);
    await poll.react("❌").catch(() => null);
    return true;
  }

  if (cmd === "remind" || cmd === "reminder") {
    const minutes = Math.max(1, Math.min(1440, Number(args.shift() || 0)));
    const reminder = args.join(" ").trim();
    if (!minutes || !reminder) return replyEmbed("Format: `hremind <menit> <pesan>`", "Reminder", "warning");
    await replyEmbed(`Oke, Hansip ingetin dalam **${minutes} menit**.\nPesan: ${reminder}`, "Reminder", "success");
    setTimeout(() => {
      message.channel.send({ content: `⏰ ${message.author} pengingat dari Hansip: ${reminder}` }).catch(() => null);
    }, minutes * 60 * 1000);
    return true;
  }

  if (cmd === "avatar") {
    const user = message.mentions.users.first() || message.author;
    const url = user.displayAvatarURL({ size: 1024 });
    return message.reply({ embeds: [hpEmbedV5999(`🖼️ Avatar ${user}\n${url}`, "Avatar")] });
  }

  if (cmd === "id") {
    const target = message.mentions.users.first() || message.author;
    return replyEmbed(`User: ${target}\nID: \`${target.id}\`\nChannel: ${message.channel}\nChannel ID: \`${message.channel.id}\``, "ID");
  }

  if (cmd === "user" || cmd === "userinfo") {
    const member = message.mentions.members.first() || message.member;
    return replyEmbed([
      "👤 **Info Warga**",
      "",
      `User: ${member.user}`,
      `ID: \`${member.id}\``,
      `Join: <t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
      `Akun: <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
      `Role: **${member.roles.cache.size - 1}**`
    ].join("\n"), "Warga");
  }

  if (["clear","purge"].includes(cmd)) {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Staff", "error");
    const amount = Math.max(1, Math.min(100, Number(args[0] || 0)));
    if (!amount) return replyEmbed("Format: `hclear <1-100>`", "Clear", "warning");
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);
    await hpLogV5999(message.guild, `${message.author} membersihkan **${deleted?.size || 0}** pesan di ${message.channel}.`, "normal");
    return message.channel.send(`🧹 Hansip membersihkan ${deleted?.size || 0} pesan.`).then(m => setTimeout(() => m.delete().catch(() => null), 5000)).catch(() => null);
  }

  if (cmd === "warn") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Warn", "error");
    const target = message.mentions.users.first();
    const reason = args.slice(1).join(" ").trim() || "Tidak ada alasan.";
    if (!target) return replyEmbed("Format: `hwarn @user <alasan>`", "Warn", "warning");
    const data = hpReadV5999("hansip-premium-warnings.json", {});
    data[target.id] = data[target.id] || [];
    data[target.id].push({ by: message.author.id, reason, at: Date.now(), channelId: message.channel.id });
    hpWriteV5999("hansip-premium-warnings.json", data);
    const desc = `${target} mendapat warning.\nAlasan: **${reason}**\nTotal: **${data[target.id].length}**`;
    await hpLogV5999(message.guild, desc, "warning");
    return replyEmbed(desc, "Warn", "warning");
  }

  if (cmd === "warnings" || cmd === "warns") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Warnings", "error");
    const target = message.mentions.users.first() || message.author;
    const data = hpReadV5999("hansip-premium-warnings.json", {});
    const list = data[target.id] || [];
    const lines = list.slice(-8).map((w, i) => `${i+1}. ${w.reason} • <t:${Math.floor(w.at/1000)}:R>`).join("\n") || "Belum ada warning.";
    return replyEmbed(`⚠️ **Warning ${target.username}**\n\n${lines}`, "Warnings");
  }

  if (cmd === "note") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Note", "error");
    const target = message.mentions.users.first();
    const note = args.slice(1).join(" ").trim();
    if (!target || !note) return replyEmbed("Format: `hnote @user <catatan>`", "Note", "warning");
    const data = hpReadV5999("hansip-premium-notes.json", {});
    data[target.id] = data[target.id] || [];
    data[target.id].push({ by: message.author.id, note, at: Date.now() });
    hpWriteV5999("hansip-premium-notes.json", data);
    await hpLogV5999(message.guild, `Note untuk ${target}: ${note}`, "normal");
    return replyEmbed("Note warga disimpan.", "Note", "success");
  }

  if (cmd === "notes") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Notes", "error");
    const target = message.mentions.users.first() || message.author;
    const data = hpReadV5999("hansip-premium-notes.json", {});
    const list = data[target.id] || [];
    const lines = list.slice(-8).map((n, i) => `${i+1}. ${n.note} • <t:${Math.floor(n.at/1000)}:R>`).join("\n") || "Belum ada note.";
    return replyEmbed(`📝 **Notes ${target.username}**\n\n${lines}`, "Notes");
  }

  if (cmd === "announce" || cmd === "pengumuman") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Announce", "error");
    const ch = message.mentions.channels.first();
    const msg = args.slice(ch ? 1 : 0).join(" ").trim();
    if (!ch || !msg) return replyEmbed("Format: `hannounce #channel <pesan>`", "Announce", "warning");
    await ch.send({ embeds: [hpEmbedV5999(`📣 **Pengumuman Desa**\n\n${msg}`, "Pengumuman")] }).catch(() => null);
    await hpLogV5999(message.guild, `${message.author} kirim pengumuman ke ${ch}.`, "normal");
    return replyEmbed("Pengumuman dikirim.", "Announce", "success");
  }

  if (cmd === "slowmode") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Slowmode", "error");
    const sec = Math.max(0, Math.min(21600, Number(args[0] || 0)));
    await message.channel.setRateLimitPerUser(sec, `Hansip slowmode by ${message.author.tag}`).catch(() => null);
    await hpLogV5999(message.guild, `Slowmode ${message.channel} diatur ke **${sec} detik** oleh ${message.author}.`, "normal");
    return replyEmbed(`Slowmode channel ini sekarang **${sec} detik**.`, "Slowmode", "success");
  }

  if (cmd === "lock" || cmd === "unlock") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Channel", "error");
    const locked = cmd === "lock";
    const everyone = message.guild.roles.everyone;
    await message.channel.permissionOverwrites.edit(everyone, { SendMessages: locked ? false : null }).catch(() => null);
    await hpLogV5999(message.guild, `${message.channel} ${locked ? "dikunci" : "dibuka"} oleh ${message.author}.`, locked ? "warning" : "success");
    return replyEmbed(`${locked ? "Channel dikunci." : "Channel dibuka lagi."}`, "Channel", locked ? "warning" : "success");
  }

  if (cmd === "say") {
    if (!hpStaffV5999(message.member)) return replyEmbed("Ini khusus staff pos ronda.", "Say", "error");
    const msg = args.join(" ").trim();
    if (!msg) return replyEmbed("Format: `hsay <pesan>`", "Say", "warning");
    await message.delete().catch(() => null);
    await message.channel.send(msg).catch(() => null);
    await hpLogV5999(message.guild, `${message.author} memakai hsay di ${message.channel}.`, "normal");
    return true;
  }

  return false;
}

const hpSpamMapV5999 = new Map();

async function hpAutoModV5999(message) {
  try {
    if (!message || message.author?.bot || !message.guild) return false;
    if (hpStaffV5999(message.member)) return false;
    if (config.hansipAntiSpamEnabled === false) return false;

    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const old = hpSpamMapV5999.get(key) || [];
    const recent = old.filter(t => now - t < 7000);
    recent.push(now);
    hpSpamMapV5999.set(key, recent);

    if (recent.length >= 6) {
      await message.delete().catch(() => null);
      await hpLogV5999(message.guild, `Anti-spam: pesan dari ${message.author} dihapus di ${message.channel}.`, "warning");
      await message.channel.send({ content: `🛡️ ${message.author}, jangan spam di DESA TULUS ya.`, allowedMentions: { users: [message.author.id] } })
        .then(m => setTimeout(() => m.delete().catch(() => null), 6000)).catch(() => null);
      return true;
    }
  } catch (_) {}
  return false;
}

try {
  if (typeof client !== "undefined" && client.on && !client.__hansipPremiumV5999) {
    client.on("messageCreate", async (message) => {
      try {
        if (await hpAutoModV5999(message)) return;
        if (await hpHandleV5999(message)) return;
      } catch (err) {
        console.error("Hansip Premium command error:", err);
      }
    });

    client.on("messageDelete", async (message) => {
      try {
        if (!message?.guild || message.author?.bot) return;
        await hpLogV5999(message.guild, `Pesan dihapus di ${message.channel}\nUser: ${message.author || "unknown"}\nIsi: ${String(message.content || "").slice(0, 800) || "-"}`, "warning");
      } catch (_) {}
    });

    client.on("messageUpdate", async (oldMsg, newMsg) => {
      try {
        if (!newMsg?.guild || newMsg.author?.bot) return;
        const before = String(oldMsg.content || "");
        const after = String(newMsg.content || "");
        if (before === after) return;
        await hpLogV5999(newMsg.guild, `Pesan diedit di ${newMsg.channel}\nUser: ${newMsg.author}\nSebelum: ${before.slice(0, 400) || "-"}\nSesudah: ${after.slice(0, 400) || "-"}`, "normal");
      } catch (_) {}
    });

    client.on("guildMemberAdd", async (member) => {
      try {
        const { s } = hpSettingsV5999(member.guild.id);
        const id = s.welcomeChannelId || config.hansipWelcomeChannelId || "";
        if (!id) return;
        const ch = member.guild.channels.cache.get(id) || await member.guild.channels.fetch(id).catch(() => null);
        if (!ch?.send) return;
        await ch.send({ embeds: [hpEmbedV5999(`Wilujeung sumping ${member} di **DESA TULUS**.\nJaga sopan, jangan spam, dan nikmati suasana desa.`, "Welcome", "success")] });
      } catch (_) {}
    });

    client.__hansipPremiumV5999 = true;
  }
} catch (err) {
  console.error("Hansip Premium listener gagal:", err);
}


/* =========================
   HANSIP FINAL RESTORE ALL COMMAND H ONLY FOOTER FIX v6.1.0
   Tujuan:
   - Semua command lama tetap ada.
   - Prefix publik menjadi h.
   - Contoh: otafk -> hafk, othelp -> hhelp, otbj -> hbj, otcf -> hcf.
   - Footer embed tidak double.
   - Footer bawah semua embed memakai icon emoji GIF DESA TULUS + text DESA TULUS • + timestamp.
========================= */

const HANSIP_FINAL_PUBLIC_PREFIX_V610 = "h";
const HANSIP_FINAL_SERVER_V610 = "DESA TULUS";
const HANSIP_FINAL_FOOTER_TEXT_V610 = "DESA TULUS •";
const HANSIP_FINAL_FOOTER_ICON_V610 = "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless";

function hansipFinalApplyConfigV610() {
  try {
    config.serverName = HANSIP_FINAL_SERVER_V610;
    config.botName = "Hansip";
    config.personaName = "Hansip Desa Tulus";
    config.prefix = "h";
    config.commandPrefix = "h";
    config.defaultPrefix = "h";
    config.otoPrefix = "h";

    config.gameEnabled = true;
    config.otoEnabled = true;
    config.otoGameEnabled = true;
    config.otoDisabled = false;
    config.disableOtoCommands = false;
    config.removeOtoGame = false;

    config.features = config.features || {};
    config.features.afk = config.features.afk !== false;
    config.features.mabar = config.features.mabar !== false;
    config.features.truthOrDare = config.features.truthOrDare !== false;
    config.features.sambungKata = config.features.sambungKata !== false;
    config.features.antiScam = true;
    config.features.antiLink = true;
    config.features.oto = true;
    config.features.otoGame = true;
    config.features.game = true;
    config.features.adventureHub = true;

    config.hansipEmbedFooter = HANSIP_FINAL_FOOTER_TEXT_V610;
  } catch (err) {
    console.error("Hansip final config gagal:", err?.message || err);
  }
}
hansipFinalApplyConfigV610();

function hansipFinalKnownOtCommandsV610() {
  const set = new Set([
    "othelp","otping","otinfo","otafk","otmabar","otsaran","otgame","otprofile","otprofil","otdaily","otshop",
    "otinventory","otinv","otmission","otquest","ottop","otlb","otrank","otevent","otstaff","otcekfitur",
    "otcekpanel","otkirimpanel","otlog","otstatus","otreload","otbackup","otrestore","otpanel","otsetchannel",
    "otsetrole","otfitur","ottest","otmaintenance","otowner","otsendpanel","otupdatepanel","otsetlog","otgivecoin",
    "otgivexp","otgiveitem","otresetuser","otcheckdata","otfixdata","otstart","otmap","oth","othunt","otbattle",
    "otb","otdungeon","otraid","otpet","otcraft","otupgrade","otseason","otcollection","otguild","otstory",
    "otbasecamp","otfarm","otfish","otcook","otrace","otrisk","otlucky","otchaos","otrest","otweather","otnpc",
    "otzoo","otcard","otteam","otluck","otopen","otevolve","otequip","otweapon","otlock","otunlock","otrelease",
    "otkerja","otwork","otslots","otgive","otcash","otbal","otcoin","otbj","otblackjack","othoki","otcf",
    "otroyale","otkartu","otbuy","otchannel","otsetup","otregenimage","otimage","otgivecrate","otgiveweapon",
    "otgivenpc","otresetplayer","otsetevent","otsetmaxbet","otassetcheck","otnpcimagecheck","otflow",
    "otstartevent","otstopevent","otspawnboss","otforcebackup","otdisablemodule","otenablemodule","otgamelog"
  ]);
  try {
    if (typeof OT_COMMANDS !== "undefined" && Array.isArray(OT_COMMANDS)) {
      for (const c of OT_COMMANDS) if (c?.name) set.add(c.name);
    }
  } catch (_) {}
  try {
    if (typeof OTO_COMMANDS !== "undefined" && Array.isArray(OTO_COMMANDS)) {
      for (const c of OTO_COMMANDS) if (c?.name) set.add(c.name);
    }
  } catch (_) {}
  return Array.from(set).sort((a, b) => b.length - a.length);
}

function hansipFinalPublicNameV610(internalName = "") {
  const name = String(internalName || "").toLowerCase();
  if (name.startsWith("ot")) return "h" + name.slice(2);
  return name;
}

function hansipFinalInternalNameV610(publicName = "") {
  const raw = String(publicName || "").toLowerCase().trim();
  if (!raw.startsWith("h")) return "";
  return "ot" + raw.slice(1);
}

function hansipFinalCleanTextV610(input = "") {
  let text = String(input ?? "");

  text = text
    .replace(/<a:DESA TULUS:\d+>/gi, "<a:Desa_Tulus:1516424353934348299>")
    .replace(/<a:Desa_Tulus:1516424353934348299>\s*:Desa_Tulus:/gi, "<a:Desa_Tulus:1516424353934348299>")
    .replace(/:Desa_Tulus:\s*/gi, "")
    .replace(/ORANG\s*TULUS/gi, "DESA TULUS")
    .replace(/\bOtO\b/g, "Hansip")
    .replace(/\bOTO\b/g, "Hansip")
    .replace(/\boto\b/g, "Hansip")
    .replace(/Game\s*OFF/gi, "Game aktif")
    .replace(/Game\/Hansip/gi, "Game Hansip")
    .replace(/Game\/OtO/gi, "Game Hansip")
    .replace(/Game\s+sudah\s+dimatikan/gi, "Game sudah aktif")
    .replace(/Fitur\s+game\s+sudah\s+dimatikan/gi, "Fitur game sudah aktif")
    .replace(/semua\s+game.*?dimatikan/gi, "semua command memakai prefix h")
    .replace(/tanpa\s+game/gi, "semua command aktif")
    .replace(/No\s+Game/gi, "Hansip");

  for (const cmd of hansipFinalKnownOtCommandsV610()) {
    const pub = hansipFinalPublicNameV610(cmd);
    if (!pub || pub === cmd) continue;
    const escaped = cmd.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}\\b`, "gi"), pub);
  }

  text = text.replace(/\bh\s+Hansip\b/gi, "hansip");
  return text;
}

function hansipFinalStripVisualFooterV610(description = "") {
  const lines = String(description || "").split(/\n/);
  const filtered = lines.filter(line => {
    const clean = String(line || "").trim();
    if (!clean) return true;
    if (/^<a:Desa_Tulus:1516424353934348299>\s*DESA\s*TULUS\s*•/i.test(clean)) return false;
    if (/^:Desa_Tulus:\s*DESA\s*TULUS\s*•/i.test(clean)) return false;
    if (/^DESA\s*TULUS\s*•/i.test(clean)) return false;
    if (/^<a:DESA TULUS:\d+>\s*DESA\s*TULUS\s*•/i.test(clean)) return false;
    return true;
  });
  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function hansipFinalCleanEmbedJsonV610(data) {
  if (!data || typeof data !== "object") return data;

  if (typeof data.title === "string") data.title = hansipFinalCleanTextV610(data.title);
  if (typeof data.description === "string") {
    data.description = hansipFinalStripVisualFooterV610(hansipFinalCleanTextV610(data.description));
  }

  if (Array.isArray(data.fields)) {
    data.fields = data.fields.map(field => ({
      ...field,
      name: typeof field.name === "string" ? hansipFinalCleanTextV610(field.name) : field.name,
      value: typeof field.value === "string" ? hansipFinalCleanTextV610(field.value) : field.value
    }));
  }

  data.footer = {
    text: HANSIP_FINAL_FOOTER_TEXT_V610,
    icon_url: HANSIP_FINAL_FOOTER_ICON_V610
  };

  if (!data.timestamp) data.timestamp = new Date().toISOString();
  return data;
}

function hansipFinalCleanPayloadV610(payload) {
  if (typeof payload === "string") return hansipFinalCleanTextV610(payload);
  if (!payload || typeof payload !== "object") return payload;

  const copy = Array.isArray(payload) ? [...payload] : { ...payload };

  if (typeof copy.content === "string") copy.content = hansipFinalCleanTextV610(copy.content);

  if (Array.isArray(copy.embeds)) {
    copy.embeds = copy.embeds.map(embed => {
      try {
        if (embed && typeof embed.toJSON === "function") return embed;
        return hansipFinalCleanEmbedJsonV610({ ...embed });
      } catch (_) {
        return embed;
      }
    });
  }

  return copy;
}

try {
  if (typeof EmbedBuilder !== "undefined" && EmbedBuilder.prototype && !EmbedBuilder.prototype.__hansipFinalFooterV610) {
    const prevToJSON = EmbedBuilder.prototype.toJSON;
    EmbedBuilder.prototype.toJSON = function(...args) {
      const raw = prevToJSON ? prevToJSON.apply(this, args) : (this.data || {});
      return hansipFinalCleanEmbedJsonV610(raw);
    };
    EmbedBuilder.prototype.__hansipFinalFooterV610 = true;
  }
} catch (err) {
  console.error("Hansip final footer patch gagal:", err?.message || err);
}

try {
  const DiscordJsForPatch = require("discord.js");
  if (DiscordJsForPatch.Message?.prototype && !DiscordJsForPatch.Message.prototype.__hansipFinalReplyCleanV610) {
    const oldReplyV610 = DiscordJsForPatch.Message.prototype.reply;
    const oldEditV610 = DiscordJsForPatch.Message.prototype.edit;
    DiscordJsForPatch.Message.prototype.reply = function(payload, ...rest) {
      return oldReplyV610.call(this, hansipFinalCleanPayloadV610(payload), ...rest);
    };
    DiscordJsForPatch.Message.prototype.edit = function(payload, ...rest) {
      return oldEditV610.call(this, hansipFinalCleanPayloadV610(payload), ...rest);
    };
    DiscordJsForPatch.Message.prototype.__hansipFinalReplyCleanV610 = true;
  }

  const channelClasses = [
    DiscordJsForPatch.TextChannel,
    DiscordJsForPatch.NewsChannel,
    DiscordJsForPatch.ThreadChannel,
    DiscordJsForPatch.DMChannel,
    DiscordJsForPatch.VoiceChannel
  ].filter(Boolean);

  for (const Klass of channelClasses) {
    if (Klass?.prototype?.send && !Klass.prototype.__hansipFinalSendCleanV610) {
      const oldSendV610 = Klass.prototype.send;
      Klass.prototype.send = function(payload, ...rest) {
        return oldSendV610.call(this, hansipFinalCleanPayloadV610(payload), ...rest);
      };
      Klass.prototype.__hansipFinalSendCleanV610 = true;
    }
  }
} catch (err) {
  console.error("Hansip final payload patch gagal:", err?.message || err);
}

try {
  if (typeof AFK_TRIGGERS !== "undefined" && Array.isArray(AFK_TRIGGERS)) {
    AFK_TRIGGERS.splice(0, AFK_TRIGGERS.length, "hafk");
  }
} catch (_) {}

try {
  if (typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP?.set) {
    if (typeof OT_COMMANDS !== "undefined" && Array.isArray(OT_COMMANDS)) {
      for (const cmd of OT_COMMANDS) if (cmd?.name) OT_COMMAND_MAP.set(cmd.name, cmd);
    }
    if (typeof OTO_COMMANDS !== "undefined" && Array.isArray(OTO_COMMANDS)) {
      for (const cmd of OTO_COMMANDS) if (cmd?.name) OT_COMMAND_MAP.set(cmd.name, cmd);
    }
  }

  const direct = ["otflow","oth","othunt","otzoo","otnpc","otcollection","otcard","otinv","otprofil","otprofile","otteam","otb","otbattle","otluck","otopen","otupgrade","otevolve","otequip","otweapon","otlock","otunlock","otrelease","otkerja","otwork","otslots","otgive","otcash","otbal","otcoin","otbj","otblackjack","othoki","otcf","otroyale","otkartu","otquest","otlb","otrank","otchannel","otsetup","otregenimage","otimage","otgivecrate","otgiveweapon","otgivenpc","otresetplayer","otsetevent","otsetmaxbet","otassetcheck","otnpcimagecheck"];
  const overlap = ["othelp","otpanel","otdaily","otshop","otbuy","ottop","otsetchannel","otsendpanel","otupdatepanel","otgivecoin","otgivexp","otbackup"];
  const owner = ["otchannel","otsetup","otregenimage","otimage","otgivecoin","otgivexp","otgivecrate","otgiveweapon","otgivenpc","otresetplayer","otbackup","otsetevent","otsetmaxbet","otassetcheck","otnpcimagecheck"];

  if (typeof OTO_DIRECT_COMMANDS !== "undefined" && OTO_DIRECT_COMMANDS?.add) direct.forEach(x => OTO_DIRECT_COMMANDS.add(x));
  if (typeof OTO_OVERLAP_COMMANDS !== "undefined" && OTO_OVERLAP_COMMANDS?.add) overlap.forEach(x => OTO_OVERLAP_COMMANDS.add(x));
  if (typeof OTO_OWNER_COMMANDS !== "undefined" && OTO_OWNER_COMMANDS?.add) owner.forEach(x => OTO_OWNER_COMMANDS.add(x));
  if (typeof OTO_COMMAND_SET !== "undefined" && OTO_COMMAND_SET?.add) [...direct, ...overlap].forEach(x => OTO_COMMAND_SET.add(x));
} catch (err) {
  console.error("Hansip command restore gagal:", err?.message || err);
}

try {
  parseOtCommand = function(content) {
    const text = String(content || "").trim();
    if (!text) return null;

    const parts = text.split(/\s+/);
    let raw = String(parts.shift() || "").toLowerCase();

    if (raw === "h" && parts[0]) {
      raw = `h${String(parts.shift()).toLowerCase()}`;
    }

    if (!raw.startsWith("h")) return null;

    const mapped = hansipFinalInternalNameV610(raw);
    if (!mapped) return null;

    if (typeof OT_COMMAND_MAP === "undefined" || !OT_COMMAND_MAP.has(mapped)) return null;
    return { name: mapped, raw, publicName: raw, args: parts, argText: parts.join(" ") };
  };
} catch (err) {
  console.error("Hansip parse h command gagal:", err?.message || err);
}

try {
  processOtoCommand = async function(message, parsed, command) {
    if (!OTO_COMMAND_SET.has(command.name) && !OTO_OVERLAP_COMMANDS.has(command.name)) return false;
    if (!otoShouldHandle(message, command.name, parsed.args)) return false;

    const isOwner = command.permission === "owner" || OTO_OWNER_COMMANDS.has(command.name) || (command.name === "otsendpanel" && parsed.args[0] === "hansip") || (command.name === "otupdatepanel" && parsed.args[0] === "hansip") || (command.name === "otsetchannel" && parsed.args[0] === "hansip");
    if (isOwner && !isHansipwner(message.member || message.author, message.guild)) {
      await replyOt(message, { content: "❌ Command ini khusus owner Hansip." });
      return true;
    }

    try {
      if (command.name === "otsetchannel" && ["hansip","game"].includes(String(parsed.args[0] || "").toLowerCase())) return otoCmdSetChannel(message, parsed.args.slice(1)), true;
      if (command.name === "otchannel") { if (String(parsed.args[0] || "").toLowerCase() === "log") return otoCmdSetLog(message, parsed.args.slice(1)), true; return otoCmdSetChannel(message, parsed.args.filter(a => !["hansip","game"].includes(String(a).toLowerCase()))), true; }
      if (command.name === "otsendpanel" && ["hansip","game"].includes(String(parsed.args[0] || "").toLowerCase())) return otoSendPanel(message, false), true;
      if (command.name === "otupdatepanel" && ["hansip","game"].includes(String(parsed.args[0] || "").toLowerCase())) return otoSendPanel(message, true), true;
      if (command.name === "otpanel" && (["hansip","game"].includes(String(parsed.args[0] || "").toLowerCase()) || otoIsChannel(message))) return otoSendPanel(message, true), true;
      if (command.name === "otsetup") { await otoCmdSetChannel(message, parsed.args); await otoSendPanel(message, true); return true; }
      if (command.name === "otregenimage") return otoCmdImage(message, ["generate", "allnpc"]), true;
      if (command.name === "otflow") return otoCmdFlow(message), true;
      if (command.name === "othelp") { if (!(await otoEnsureChannel(message))) return true; return otoReply(message, otoHelpEmbed(), otoGetOrCreateAsset("banner", "hansip-panel", { title: "HANSIP HELP", icon: "💠", rarity: "rare" })), true; }
      if (command.name === "oth" || command.name === "othunt") return otoCmdHunt(message), true;
      if (command.name === "otinv") return otoCmdInv(message, parsed.args), true;
      if (command.name === "otprofil" || command.name === "otprofile") return otoCmdProfile(message), true;
      if (command.name === "otzoo" || command.name === "otnpc" || command.name === "otcollection") return otoCmdNpc(message, parsed.args), true;
      if (command.name === "otcard") return otoCmdCard(message, parsed.args), true;
      if (command.name === "otteam") return otoCmdTeam(message, parsed.args), true;
      if (command.name === "otb" || command.name === "otbattle") return otoCmdBattle(message), true;
      if (command.name === "otluck") return otoCmdLuck(message), true;
      if (command.name === "otopen") return otoCmdOpen(message, parsed.args), true;
      if (command.name === "otkerja" || command.name === "otwork") return otoCmdWork(message), true;
      if (command.name === "otslots") return otoCmdSlots(message, parsed.args), true;
      if (command.name === "otgive") return otoCmdGive(message, parsed.args), true;
      if (command.name === "otcash" || command.name === "otbal" || command.name === "otcoin") return otoCmdBal(message), true;
      if (command.name === "otbj" || command.name === "otblackjack") return otoCmdBlackjack(message, parsed.args), true;
      if (command.name === "othoki" || command.name === "otroyale") return otoCmdRoyale(message, parsed.args, "flip"), true;
      if (command.name === "otcf") return otoCmdRoyale(message, parsed.args, "coinflip"), true;
      if (command.name === "otkartu") return otoCmdRoyale(message, parsed.args, "card"), true;
      if (command.name === "otdaily") return otoCmdDaily(message), true;
      if (command.name === "otquest") return otoCmdQuest(message), true;
      if (command.name === "otshop") return otoCmdShop(message), true;
      if (command.name === "otbuy") return otoCmdBuy(message, parsed.args), true;
      if (command.name === "ottop" || command.name === "otlb" || command.name === "otrank") return otoCmdTop(message), true;
      if (command.name === "otupgrade") return otoCmdUpgrade(message, parsed.args), true;
      if (command.name === "otequip") return otoCmdEquip(message, parsed.args), true;
      if (command.name === "otweapon") return otoCmdWeapon(message, parsed.args), true;
      if (command.name === "otevolve") return otoCmdEvolve(message, parsed.args), true;
      if (command.name === "otlock") return otoCmdLockRelease(message, parsed.args, true), true;
      if (command.name === "otunlock") return otoCmdLockRelease(message, parsed.args, false), true;
      if (command.name === "otrelease") return otoCmdRelease(message, parsed.args), true;
      if (command.name === "otgivecoin") return otoCmdOwnerGive(message, parsed.args, "coin"), true;
      if (command.name === "otgivexp") return otoCmdOwnerGive(message, parsed.args, "xp"), true;
      if (command.name === "otgivecrate") return otoCmdOwnerGive(message, parsed.args, "crate"), true;
      if (command.name === "otgiveweapon") return otoCmdOwnerGive(message, parsed.args, "weapon"), true;
      if (command.name === "otgivenpc") return otoCmdOwnerGive(message, parsed.args, "npc"), true;
      if (command.name === "otsetmaxbet") { const amount = Number(parsed.args[0] || 0); if (!amount) return replyOt(message, { content: "⚠️ Format: `hsetmaxbet 50000`" }), true; config.otoMaxBet = amount; saveConfig(config); await replyOt(message, { content: `✅ Max bet Hansip jadi ${amount.toLocaleString("id-ID")} coin game.` }); return true; }
      if (command.name === "otassetcheck") return otoCmdAssetCheck(message), true;
      if (command.name === "otnpcimagecheck") return otoCmdNpcImageCheck(message), true;
      if (command.name === "otimage") return otoCmdImage(message, parsed.args), true;
      if (command.name === "otbackup") return otoCmdBackup(message), true;
      if (command.name === "otresetplayer") { const member = message.mentions.members.first(); if (!member || !parsed.args.includes("confirm")) return replyOt(message, { content: "⚠️ Format: `hresetplayer @user confirm`" }), true; const players = otoReadPlayers(); delete players[member.id]; otoWritePlayers(players); await replyOt(message, { content: `✅ Data Hansip ${member} direset aman. Data Hansip lain tidak disentuh.` }); return true; }
      if (command.name === "otsetevent") return replyOt(message, { content: `✅ Event Hansip diset: **${parsed.argText || "Festival Desa"}**.` }), true;
      return false;
    } catch (error) {
      console.error("❌ Hansip command error:", error);
      await replyOt(message, { content: "❌ Command Hansip gagal diproses, tapi data tetap aman dan tidak direset." });
      return true;
    }
  };
} catch (err) {
  console.error("Hansip process command restore gagal:", err?.message || err);
}

try {
  const oldReplyOtFinalV610 = replyOt;
  replyOt = function(message, payload) {
    return oldReplyOtFinalV610(message, hansipFinalCleanPayloadV610(payload));
  };
} catch (_) {}

try {
  if (typeof hpDisabledGameV5999 !== "undefined") hpDisabledGameV5999 = function() { return false; };
  if (typeof hpHandleV5999 !== "undefined") {
    const oldHpHandleV5999 = hpHandleV5999;
    hpHandleV5999 = async function(message) {
      const content = String(message?.content || "").trim().toLowerCase();
      if (!content.startsWith("h")) return false;
      const cmd = content.slice(1).split(/\s+/)[0] || "";
      const internal = "ot" + cmd;
      if (internal && typeof OT_COMMAND_MAP !== "undefined" && OT_COMMAND_MAP.has(internal)) return false;
      if (cmd === "afk") return false;
      return oldHpHandleV5999(message);
    };
  }
} catch (_) {}

console.log("✅ Hansip final v6.1.0 aktif: semua command lama balik, prefix publik h, footer embed tidak double.");
/* END HANSIP FINAL RESTORE ALL COMMAND H ONLY FOOTER FIX v6.1.0 */


/* HANSIP V6.2.0 REMOVE SELECTED GAME COMMANDS + GLOBAL COLOR
   - Hapus command publik: hbj, hcf, hnpc, hteam, hdaily, hshop
   - Warna semua embed dipaksa #7DBD77
   - Footer tetap satu, di bawah, pakai icon GIF DESA TULUS
*/
const HANSIP_V620_COLOR = 0x7DBD77;
const HANSIP_V620_COLOR_HEX = "#7DBD77";
const HANSIP_V620_BLOCKED_PUBLIC = new Set(["hbj", "hblackjack", "hcf", "hnpc", "hteam", "hdaily", "hshop"]);
const HANSIP_V620_BLOCKED_INTERNAL = new Set(["otbj", "otblackjack", "otcf", "otnpc", "otteam", "otdaily", "otshop"]);

try {
  if (typeof config !== "undefined") {
    config.embedColor = HANSIP_V620_COLOR_HEX;
    config.color = HANSIP_V620_COLOR_HEX;
    config.themeColor = HANSIP_V620_COLOR_HEX;
    config.accentColor = HANSIP_V620_COLOR_HEX;
    config.prefix = "h";
    config.commandPrefix = "h";
    config.defaultPrefix = "h";
    config.otoPrefix = "h";
    if (config.features) {
      config.features.blackjack = false;
      config.features.coinflip = false;
      config.features.npc = false;
      config.features.team = false;
      config.features.daily = false;
      config.features.shop = false;
    }
  }
} catch (_) {}

function hansipV620IsBlockedCommand(content = "") {
  const text = String(content || "").trim().toLowerCase();
  if (!text.startsWith("h")) return false;
  let first = text.split(/\s+/)[0] || "";
  if (first === "h") {
    const parts = text.split(/\s+/);
    first = parts[1] ? "h" + parts[1] : first;
  }
  return HANSIP_V620_BLOCKED_PUBLIC.has(first);
}

function hansipV620BlockedEmbed() {
  try {
    return new EmbedBuilder()
      .setColor(HANSIP_V620_COLOR)
      .setTitle("Command dihapus")
      .setDescription("Command itu sudah dihapus dari Hansip.\n\nGunakan **hhelp** untuk melihat command yang masih aktif.")
      .setFooter({ text: "DESA TULUS •", iconURL: "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless" })
      .setTimestamp();
  } catch (_) {
    return null;
  }
}

try {
  if (typeof EmbedBuilder !== "undefined" && EmbedBuilder.prototype && !EmbedBuilder.prototype.__hansipV620ColorPatch) {
    const prevToJSONV620 = EmbedBuilder.prototype.toJSON;
    EmbedBuilder.prototype.toJSON = function(...args) {
      const raw = prevToJSONV620 ? prevToJSONV620.apply(this, args) : (this.data || {});
      raw.color = HANSIP_V620_COLOR;
      if (!raw.footer) raw.footer = {};
      raw.footer.text = "DESA TULUS •";
      raw.footer.icon_url = "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless";
      if (!raw.timestamp) raw.timestamp = new Date().toISOString();
      if (typeof raw.description === "string") {
        raw.description = raw.description
          .split(/\n/)
          .filter(line => {
            const clean = String(line || "").trim();
            if (/^:Desa_Tulus:\s*DESA\s*TULUS\s*•/i.test(clean)) return false;
            if (/^<a:Desa_Tulus:1516424353934348299>\s*DESA\s*TULUS\s*•/i.test(clean)) return false;
            return true;
          })
          .join("\n")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      }
      return raw;
    };
    EmbedBuilder.prototype.__hansipV620ColorPatch = true;
  }
} catch (err) {
  console.error("Hansip v6.2 color patch gagal:", err?.message || err);
}

try {
  const oldParseOtCommandV620 = typeof parseOtCommand !== "undefined" ? parseOtCommand : null;
  if (oldParseOtCommandV620) {
    parseOtCommand = function(content) {
      const parsed = oldParseOtCommandV620(content);
      if (!parsed) return parsed;
      const publicRaw = String(parsed.raw || "").toLowerCase();
      const internalName = String(parsed.name || "").toLowerCase();
      if (HANSIP_V620_BLOCKED_PUBLIC.has(publicRaw) || HANSIP_V620_BLOCKED_INTERNAL.has(internalName)) {
        return { ...parsed, name: "__hansip_removed_v620__", removedCommand: true };
      }
      return parsed;
    };
  }
} catch (err) {
  console.error("Hansip v6.2 parse patch gagal:", err?.message || err);
}

try {
  const oldProcessOtoCommandV620 = typeof processOtoCommand !== "undefined" ? processOtoCommand : null;
  if (oldProcessOtoCommandV620) {
    processOtoCommand = async function(message, parsed, command) {
      const publicRaw = String(parsed?.raw || "").toLowerCase();
      const internalName = String(command?.name || parsed?.name || "").toLowerCase();

      if (parsed?.removedCommand || HANSIP_V620_BLOCKED_PUBLIC.has(publicRaw) || HANSIP_V620_BLOCKED_INTERNAL.has(internalName)) {
        const embed = hansipV620BlockedEmbed();
        if (embed) await message.reply({ embeds: [embed] }).catch(() => {});
        else await message.reply("Command itu sudah dihapus dari Hansip.").catch(() => {});
        return true;
      }

      return oldProcessOtoCommandV620(message, parsed, command);
    };
  }
} catch (err) {
  console.error("Hansip v6.2 process patch gagal:", err?.message || err);
}

try {
  const DiscordJsForV620 = require("discord.js");

  if (DiscordJsForV620.Message?.prototype && !DiscordJsForV620.Message.prototype.__hansipV620BlockedReply) {
    const oldMessageReplyV620 = DiscordJsForV620.Message.prototype.reply;
    DiscordJsForV620.Message.prototype.reply = function(payload, ...rest) {
      if (hansipV620IsBlockedCommand(this.content)) {
        const embed = hansipV620BlockedEmbed();
        if (embed) return oldMessageReplyV620.call(this, { embeds: [embed] }, ...rest);
      }
      return oldMessageReplyV620.call(this, payload, ...rest);
    };
    DiscordJsForV620.Message.prototype.__hansipV620BlockedReply = true;
  }

  if (DiscordJsForV620.Client?.prototype && !DiscordJsForV620.Client.prototype.__hansipV620MessageCreatePatch) {
    const oldEmitV620 = DiscordJsForV620.Client.prototype.emit;
    DiscordJsForV620.Client.prototype.emit = function(eventName, ...args) {
      try {
        if (eventName === "messageCreate") {
          const msg = args[0];
          if (msg && !msg.__hansipV620BlockedHandled && hansipV620IsBlockedCommand(msg.content)) {
            msg.__hansipV620BlockedHandled = true;
            const embed = hansipV620BlockedEmbed();
            setTimeout(() => {
              if (embed) msg.reply({ embeds: [embed] }).catch(() => {});
              else msg.reply("Command itu sudah dihapus dari Hansip.").catch(() => {});
            }, 0);
            return true;
          }
        }
      } catch (_) {}
      return oldEmitV620.call(this, eventName, ...args);
    };
    DiscordJsForV620.Client.prototype.__hansipV620MessageCreatePatch = true;
  }
} catch (err) {
  console.error("Hansip v6.2 blocked command patch gagal:", err?.message || err);
}

console.log("✅ Hansip v6.2.0 aktif: hbj/hcf/hnpc/hteam/hdaily/hshop dihapus, semua embed warna #7DBD77.");
/* END HANSIP V6.2.0 REMOVE SELECTED GAME COMMANDS */


/* HANSIP V6.2.1 FINAL FOOTER SINGLE CLEAN
   Output embed dipaksa bersih:
   - tidak ada footer dobel di description
   - footer Discord hanya text DESA TULUS •
   - icon footer memakai emoji GIF DESA TULUS
   - warna tetap #7DBD77
*/
const HANSIP_V621_FINAL_FOOTER_TEXT = "DESA TULUS •";
const HANSIP_V621_FINAL_FOOTER_ICON = "https://cdn.discordapp.com/emojis/1516424353934348299.gif?size=64&quality=lossless";
const HANSIP_V621_FINAL_COLOR = 0x7DBD77;

function hansipV621FinalCleanText(input = "") {
  let text = String(input ?? "");

  text = text
    .replace(/<a1516424353934348299>\s*/gi, "")
    .replace(/<a:Desa_Tulus:1516424353934348299>\s*/gi, "")
    .replace(/:Desa_Tulus:\s*/gi, "")
    .replace(/DESA\s*TULUS\s*•\s*DESA\s*TULUS\s*•/gi, "DESA TULUS •");

  const lines = text.split(/\n/).filter((line) => {
    const clean = String(line || "").trim();
    if (!clean) return true;
    if (/^DESA\s*TULUS\s*•$/i.test(clean)) return false;
    if (/^DESA\s*TULUS\s*•\s*Prefix\s*h$/i.test(clean)) return false;
    if (/^DESA\s*TULUS\s*•\s*Hansip$/i.test(clean)) return false;
    if (/^DESA\s*TULUS\s*•/i.test(clean)) return false;
    return true;
  });

  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function hansipV621FinalCleanEmbed(data) {
  if (!data || typeof data !== "object") return data;

  if (typeof data.title === "string") data.title = hansipV621FinalCleanText(data.title);
  if (typeof data.description === "string") data.description = hansipV621FinalCleanText(data.description);

  if (Array.isArray(data.fields)) {
    data.fields = data.fields.map((field) => ({
      ...field,
      name: typeof field.name === "string" ? hansipV621FinalCleanText(field.name) : field.name,
      value: typeof field.value === "string" ? hansipV621FinalCleanText(field.value) : field.value
    }));
  }

  data.color = HANSIP_V621_FINAL_COLOR;
  data.footer = {
    text: HANSIP_V621_FINAL_FOOTER_TEXT,
    icon_url: HANSIP_V621_FINAL_FOOTER_ICON
  };
  if (!data.timestamp) data.timestamp = new Date().toISOString();

  return data;
}

function hansipV621FinalCleanPayload(payload) {
  if (typeof payload === "string") return hansipV621FinalCleanText(payload);
  if (!payload || typeof payload !== "object") return payload;

  const copy = Array.isArray(payload) ? [...payload] : { ...payload };
  if (typeof copy.content === "string") copy.content = hansipV621FinalCleanText(copy.content);

  if (Array.isArray(copy.embeds)) {
    copy.embeds = copy.embeds.map((embed) => {
      try {
        if (embed && typeof embed.toJSON === "function") return embed;
        return hansipV621FinalCleanEmbed({ ...embed });
      } catch (_) {
        return embed;
      }
    });
  }

  return copy;
}

try {
  if (typeof EmbedBuilder !== "undefined" && EmbedBuilder.prototype && !EmbedBuilder.prototype.__hansipV621FinalFooterSingle) {
    const oldToJSONV621Final = EmbedBuilder.prototype.toJSON;
    EmbedBuilder.prototype.toJSON = function(...args) {
      const raw = oldToJSONV621Final ? oldToJSONV621Final.apply(this, args) : (this.data || {});
      return hansipV621FinalCleanEmbed(raw);
    };
    EmbedBuilder.prototype.__hansipV621FinalFooterSingle = true;
  }
} catch (err) {
  console.error("Hansip footer single patch gagal:", err?.message || err);
}

try {
  const DiscordJsV621Final = require("discord.js");

  if (DiscordJsV621Final.Message?.prototype && !DiscordJsV621Final.Message.prototype.__hansipV621FinalPayloadClean) {
    const oldReplyV621Final = DiscordJsV621Final.Message.prototype.reply;
    const oldEditV621Final = DiscordJsV621Final.Message.prototype.edit;

    DiscordJsV621Final.Message.prototype.reply = function(payload, ...rest) {
      return oldReplyV621Final.call(this, hansipV621FinalCleanPayload(payload), ...rest);
    };

    DiscordJsV621Final.Message.prototype.edit = function(payload, ...rest) {
      return oldEditV621Final.call(this, hansipV621FinalCleanPayload(payload), ...rest);
    };

    DiscordJsV621Final.Message.prototype.__hansipV621FinalPayloadClean = true;
  }

  for (const Klass of [DiscordJsV621Final.TextChannel, DiscordJsV621Final.NewsChannel, DiscordJsV621Final.ThreadChannel, DiscordJsV621Final.DMChannel, DiscordJsV621Final.VoiceChannel].filter(Boolean)) {
    if (Klass?.prototype?.send && !Klass.prototype.__hansipV621FinalPayloadClean) {
      const oldSendV621Final = Klass.prototype.send;
      Klass.prototype.send = function(payload, ...rest) {
        return oldSendV621Final.call(this, hansipV621FinalCleanPayload(payload), ...rest);
      };
      Klass.prototype.__hansipV621FinalPayloadClean = true;
    }
  }
} catch (err) {
  console.error("Hansip payload single patch gagal:", err?.message || err);
}

try {
  if (typeof config !== "undefined") {
    config.embedColor = "#7DBD77";
    config.color = "#7DBD77";
    config.themeColor = "#7DBD77";
    config.accentColor = "#7DBD77";
    config.hansipEmbedFooter = HANSIP_V621_FINAL_FOOTER_TEXT;
  }
} catch (_) {}

console.log("✅ Hansip v6.2.1 final: footer dobel hilang, footer tinggal satu di bawah.");
/* END HANSIP V6.2.1 FINAL FOOTER SINGLE CLEAN */

/* =========================
   PAK HANSIP V6.5.0
   Modul anti-scam lama sudah dihapus.
   Bot tidak lagi memeriksa atau menghapus pesan/gambar melalui modul tersebut.
   Fitur lain dan data lama tetap dipertahankan.
========================= */

/* =========================
   PAK HANSIP V7.0.0 — DESA TULUS MABAR BESAR
   - Branding lama dibersihkan.
   - Embed Cari Mabar dibuat compact seperti kartu referensi.
   - Tombol: Join Voice, DM Host, Cari Mabar.
   - Katalog 25 game Mobile dan 25 game PC.
   - Thread diskusi otomatis tetap dipertahankan.
   - Data mabar/member tidak direset.
========================= */

