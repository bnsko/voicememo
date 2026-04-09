# VoiceMemo Web

Moderná webová aplikácia na zdieľanie myšlienok a zaujímavostí s hlasovým vstupom a prekladom.

## Funkcie

- 💭 **Zdieľanie myšlienok** - Napíš alebo diktuj svoju myšlienku
- 🎤 **Hlasový vstup** - Utilizuj hlasové rozpoznávanie (webkitSpeechRecognition)
- 🌐 **Automatický preklad** - Prekladaj text do angličtiny alebo iných jazykov
- 💬 **Komentáre** - Pridávaj a komentuj príspevky
- 🗑️ **Správa** - Vymazávaj príspevky a komentáre s potvrdzovaním
- 📅 **Časovanie** - Každý príspevok má presný dátum a čas
- 🎨 **Moderný UI/UX** - Krásny design s gradientmi a animáciami
- 🔄 **Neobmedzená história** - Všetky príspevky sa ukladajú navždy

## Technológie

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Upstash Redis

## Inštalácia

1. Klonuj alebo vytvor projekt:
```bash
cd /Users/peto/Git/personal/voicememo-web
```

2. Nainštaluj závislosti:
```bash
npm install
```

3. Skonfiguruj .env:
```bash
cp .env.local.example .env.local
# Uprav .env.local s tvojimi Upstash Redis údajami
```

4. Spusti vývojový server:
```bash
npm run dev
```

5. Otvor v prehliadači:
```
http://localhost:3000
```

## Štruktúra projektu

```
voicememo-web/
├── app/
│   ├── api/
│   │   └── messages/        # API endpointy
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx            # Hlavná stránka
├── components/
│   └── MessagePanel.tsx    # Komponenta panelu
├── lib/
│   └── redis.ts           # Redis utility a typy
└── ...config files
```

## API Endpointy

- `GET /api/messages` - Načítaj všetky príspevky
- `POST /api/messages` - Vytvor nový príspevok
- `DELETE /api/messages/[id]` - Vymaž príspevok
- `POST /api/messages/[id]/comments` - Pridaj komentár
- `DELETE /api/messages/[id]/comments/[commentId]` - Vymaž komentár

## Databáza

Aplikácia wykorzystuje Upstash Redis. Všetky údaje sa ukladajú v jednom kľúči `voicememo:messages`.

## Autor

Vytvorené pre zdieľanie myšlienok medzi dvoma random postavami.
