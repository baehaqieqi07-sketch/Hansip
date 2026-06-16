# Hansip — DESA TULUS

Update v6.2.1 final:
- Footer dobel sudah dibersihkan.
- Footer salah sudah dibuang dari output embed.
- Footer final hanya satu di bawah embed.
- Warna semua embed tetap `#7DBD77`.
- Command yang dihapus tetap: `hbj`, `hcf`, `hnpc`, `hteam`, `hdaily`, `hshop`.

## Test lokal

```bat
cd /d "D:\Hansip"
node --check index.js
npm install
npm start
```

## Railway Variables

```env
DISCORD_TOKEN=ISI_TOKEN_BOT_DISCORD_KAMU
CLIENT_ID=ISI_CLIENT_ID_BOT_KAMU
GUILD_ID=ISI_ID_SERVER_DESA_TULUS
NODE_ENV=production
DASHBOARD_ENABLED=false
```
