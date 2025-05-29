# WH-HelperBot - Enhanced Informatik-Focused Conversational Assistant

## 🚀 Enhanced Telegram Bot for Westfälische Hochschule

This is a **JavaScript-only** deployment package with:
- ✅ **Informatik Department Priority** - Specialized CS/IT data from w-hs.de/informatik
- ✅ **Real-time RSS News Integration** - Live news from WH press releases  
- ✅ **Conversational German Interface** - Natural language, no commands needed
- ✅ **Real-time web scraping** from w-hs.de
- ✅ **Smart caching system** with 30-minute refresh
- ✅ **Telegram bot integration** with webhook support

## 🎓 **Informatik-Specific Features:**
- **Prüfungszeiträume 2025**: 27.01.-31.01.2025, 30.06.-11.07.2025, 22.09.-06.10.2025
- **Anmeldezeiträume**: Exact registration deadlines for each exam period  
- **Campus Portal Integration**: Direct links to campus.w-hs.de
- **Programming References**: Motivational coding messages

## 📰 **Live RSS News:**
- Direct feed from: `w-hs.de/pressemedien/nachrichten-lesen`
- Recent examples: Study orientation workshops, CHE rankings, Festival der Visionen 2025
- German date formatting (DD.MM.YYYY)
- Clean content extraction (no HTML tags)

## 📁 Files:
- `index.js` - Main application (single file with embedded scraper)
- `package.json` - Dependencies and scripts
- `Dockerfile` - Container configuration
- `nixpacks.toml` - Railway build configuration

## 💬 **Conversational Examples:**

### **Informatik Queries:**
```
User: "Hey, kannst du mir bei Informatik helfen?"
Bot: "Alles klar, du fragst nach dem Fachbereich Informatik! 💻
      📝 Nächste Anmeldung: 30.12.24 - 12.01.25
      📚 Nächste Prüfungsperiode: 27.01. - 31.01.2025
      🔗 https://www.w-hs.de/informatik/info-center/pruefungen/"
```

### **News Queries:**
```
User: "Was gibt's Neues?"  
Bot: "Hey! 👋 Das läuft grad an der WH:
      📰 Workshops zur Studienorientierung in Gelsenkirchen und Bocholt
      📅 27.05.2025
      📰 CHE-Ranking: Überdurchschnittliche Ergebnisse für Bionikstudium  
      📅 26.05.2025"
```

### **Natural Language Understanding:**
- ✅ "informatik prüfungen" → Informatik priority
- ✅ "computer wissenschaft anmeldung" → Informatik data
- ✅ "was gibt's neues" → RSS news feed
- ✅ "hallo" → Friendly greeting

## 🎯 Features:
- **Conversational Interface** - Natural German language (no commands needed)
- **Informatik Priority** - Specialized CS/IT department data
- **Live RSS News** - Real-time university announcements
- **Smart Intent Detection** - Understands user queries contextually
- **Campus Integration** - Direct links to registration portals

## 🔧 Environment Variables:
- `TELEGRAM_TOKEN` - Your bot token
- `PORT` - Server port (auto-set by Railway)

## 🌐 Data Sources:
- Real-time scraping from w-hs.de
- Automatic fallback to default data
- 30-minute smart caching

**Deploy to Railway:** Upload these files to your GitHub repository.
