# Pak Hansip — DESA TULUS

Update besar sistem Cari Mabar DESA TULUS.

## Tampilan post mabar

Post mabar sekarang dibuat ringkas:
- mention host dan role game
- Game
- Mode
- Slot
- Waktu
- Voice
- tombol `Join Voice`
- tombol `DM Host`
- tombol `Cari Mabar`
- thread diskusi otomatis

## Katalog game

- 25 pilihan Mobile
- 25 pilihan PC
- role game dapat diatur melalui `gameRoleIds`
- dashboard Cari Mabar menampilkan seluruh katalog

## Fitur yang tetap aman

- Prefix `h`
- AFK
- Mabar dan data mabar lama
- Sambung Kata
- Custom Status otomatis
- Warna embed `#7DBD77`
- Dashboard
- Database dan data member

## Test

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
