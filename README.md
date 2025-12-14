# 🇨🇺 Dogana Cuba - PWA

Guida completa alle importazioni non commerciali a Cuba.

## 📱 Caratteristiche

- ✅ **Progressive Web App (PWA)** - Installabile su Android/iOS
- ✅ **Funziona Offline** - Tutti i dati sono salvati localmente
- ✅ **Motore di ricerca intelligente** - Cerca per nome, sinonimi, categoria
- ✅ **Database completo** - Oltre 70 articoli con regole dettagliate
- ✅ **Guida per il viaggiatore** - Informazioni pratiche su elettricità, SIM, moneta, trasporti, emergenze
- ✅ **Fonti ufficiali** - Dati estratti da Gaceta Oficial e aduana.gob.cu
- ✅ **Mobile-First Design** - Ottimizzato per smartphone
- ✅ **Multilingua** - Italiano + termini spagnoli per ricerca

## 🚀 Come Usare

### Opzione 1: Hosting Web

1. Carica tutti i file su un server web o hosting gratuito:
   - **GitHub Pages** (gratuito)
   - **Netlify** (gratuito)
   - **Vercel** (gratuito)
   - **Firebase Hosting** (gratuito)

2. Visita il sito dal browser mobile

3. Installa l'app:
   - Android Chrome: Menu (⋮) → "Aggiungi a Home"
   - iOS Safari: Condividi → "Aggiungi a Home"

### Opzione 2: Test Locale

```bash
# Avvia un server locale
python3 -m http.server 8000

# Oppure con Node.js
npx http-server

# Visita: http://localhost:8000
```

## 📂 Struttura File

```
├── index.html                    # Pagina principale
├── app.js                        # Logica app e motore di ricerca
├── sw.js                         # Service Worker (cache offline)
├── manifest.json                 # Configurazione PWA
├── aduana_cuba_db.json          # Database completo regole doganali
├── guida_viaggiatore_cuba.json  # Guida pratica per il viaggiatore
├── icon-192.png        # Icona 192x192
├── icon-512.png        # Icona 512x512
└── README.md           # Questo file
```

## 🔍 Come Funziona la Ricerca

Il motore di ricerca cerca in:
1. **Nome italiano** (es: "computer")
2. **Sinonimi** (es: "laptop", "pc", "portatile")
3. **Nome spagnolo** (es: "computadora")
4. **Nome categoria** (es: "elettronica")

Esempi di ricerca:
- `computer` → trova laptop, desktop, tablet
- `telefono` → trova smartphone, cellulari
- `frigo` → trova frigorifero
- `medicine` → trova medicinali e dispositivi medici

## 🌐 Deploy su GitHub Pages (GRATIS)

1. Crea un repository su GitHub
2. Carica tutti i file
3. Vai su Settings → Pages
4. Seleziona branch "main" e cartella "root"
5. Salva e aspetta qualche minuto
6. L'app sarà disponibile su: `https://tuousername.github.io/repo-name/`

## 🔄 Aggiornare i Dati

Per aggiornare le informazioni:

1. Modifica `aduana_cuba_db.json`
2. Aggiorna il campo `ultimo_aggiornamento` in `meta`
3. Cambia `CACHE_NAME` in `sw.js` (es: `dogana-cuba-v2`)
4. Ricarica il sito

Il Service Worker aggiornerà automaticamente la cache.

## 📱 Convertire in APK (Opzionale)

Se vuoi pubblicare su Google Play Store:

### Con Capacitor:

```bash
# Installa Capacitor
npm install @capacitor/core @capacitor/cli

# Inizializza
npx cap init

# Aggiungi Android
npx cap add android

# Copia i file
npx cap copy

# Apri in Android Studio
npx cap open android

# Compila APK da Android Studio
```

### Con PWA Builder:

1. Vai su https://www.pwabuilder.com/
2. Inserisci l'URL della tua PWA
3. Scarica il pacchetto Android
4. Firma e carica su Play Store

## 🛠️ Tecnologie

- **HTML5** - Struttura semantica
- **CSS3** - Design responsive e animazioni
- **JavaScript Vanilla** - Nessuna dipendenza esterna
- **Service Worker API** - Cache e offline
- **Web App Manifest** - PWA configuration

## 📄 Licenza

I dati sono di dominio pubblico (fonti governative cubane).
Il codice può essere usato liberamente.

## 🔗 Fonti Dati

- Gaceta Oficial No. 57/2024
- Resolución 175/2022 - Aduana General de la República
- Resolución 211/2024 - Ministerio de Finanzas y Precios
- https://www.aduana.gob.cu/
- https://www.gacetaoficial.gob.cu/

## ⚠️ Disclaimer

Questa app è stata creata in modo indipendente utilizzando informazioni pubbliche ufficiali. Non è affiliata con il governo cubano o la dogana. Le normative possono cambiare: verificare sempre sul sito ufficiale prima del viaggio.

---

**Creato con ❤️ per aiutare i viaggiatori diretti a Cuba 🇨🇺**
