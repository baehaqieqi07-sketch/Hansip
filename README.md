# Pak Hansip — DESA TULUS

Update v9.3.0: clean security center.

Fokus bot:
- Keamanan server
- Audit Role Cepat
- AFK Voice 24/7
- Mute / Unmute voice khusus owner
- AFK member
- Cari Mabar
- Sambung Kata
- Laporan dan saran warga
- Alat staff
- Custom Status otomatis
- Dashboard read-only memakai `process.env.PORT`

## Command member

- `hhelp`
- `hping`
- `hstatus`
- `hafk alasan`
- `hmabar`
- `hsambungkata`
- `hlapor isi laporan`
- `hsaran isi saran`

## Command staff

- `hsetlog #channel`
- `hsetreport #channel`
- `hsetsaran #channel`
- `hsetmabar #channel`
- `hsetsambung #channel`
- `hsetstaff @role`
- `hconfig`
- `hclear 1-100`
- `hslowmode detik`
- `hlock`
- `hunlock`
- `hsay isi pesan`
- `hnote @user catatan`
- `hnotes @user`
- `hwarn @user alasan`
- `hwarnings @user`
- `hauditrole setup/status/now/on/off`

## Command owner voice

- `h24/7 #voice`
- `h24/7 status`
- `h24/7 reconnect`
- `h24/7 on`
- `h24/7 off`
- `hmute`
- `hunmute`

## Test

```bat
node --check index.js
node --check services\afkVoiceManager.js
npm install
npm start
```
