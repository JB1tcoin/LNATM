const { ipcRenderer } = require('electron');

// Elemente aus dem HTML-Dokument auswählen
console.log("DOM-Elemente initialisiert");
const startButton = document.getElementById('start-button');
const cancelButton = document.getElementById('cancel-button');
const proceedButton = document.getElementById('proceed-button');
const backButton = document.getElementById('back-button');
const startScreen = document.getElementById('start-screen');
const coinScreen = document.getElementById('coin-screen');
const qrScreen = document.getElementById('qr-screen');
const valueDisplay = document.getElementById('value-display');
const satoshiDisplay = document.getElementById('satoshi-display');
const qrCode = document.getElementById('qr-code');
const successMessage = document.createElement('div');  
const restartButton = document.createElement('button');

// Erfolgsnachricht und Button-Styling
successMessage.style.display = 'none';
successMessage.textContent = 'Erfolg! Auszahlung abgeschlossen.';
successMessage.style.fontSize = '2em';
successMessage.style.color = 'orange';
qrScreen.appendChild(successMessage);

restartButton.style.display = 'none';
restartButton.textContent = 'Neu starten';
restartButton.addEventListener('click', () => {
    console.log("Neu starten-Button gedrückt");
    qrScreen.style.display = 'none';
    startScreen.style.display = 'block';
});
qrScreen.appendChild(restartButton);

let currentEuroValue = 0;
let currentBtcToEur = 0;
let lnurlId = '';
let lnurlCheckInterval;
let qrCheckTimeout;

// Start-Button
startButton.addEventListener('click', () => {
    console.log("Start-Button gedrückt");
    startScreen.style.display = 'none';
    coinScreen.style.display = 'block';
    ipcRenderer.send('start-coin-counting');
    setInterval(fetchBitcoinPrice, 5000);
});

// Abbrechen-Button-Klick-Event im Münz-Screen
cancelButton.addEventListener('click', () => {
    console.log("Abbrechen-Button gedrückt");
    startScreen.style.display = 'block';
    coinScreen.style.display = 'none';
    ipcRenderer.send('activate-solenoids');
});

// Fortfahren-Button
proceedButton.addEventListener('click', () => {
    // Erfolgsnachricht und QR-Code zurücksetzen
    successMessage.style.display = 'none';
    qrCode.src = '';  // QR-Code zurücksetzen
    restartButton.style.display = 'none';
    backButton.style.display = 'block';

    const satoshis = Math.round((currentEuroValue / currentBtcToEur) * 100000000);

    // QR-Code-Bildschirm anzeigen, nachdem eine neue LNURL erstellt wird
    ipcRenderer.send('create-lnurlw', { satoshis: satoshis });

    // Münz-Counter zurücksetzen
    currentEuroValue = 0;
    valueDisplay.textContent = `Gesamtsumme: 0.00 €`;
    satoshiDisplay.textContent = `In Satoshis: 0 Sats`;
});

// LNURL QR-Code anzeigen
ipcRenderer.on('lnurl-qr', (event, { lnurl, id }) => {
    console.log(`LNURL erhalten: ${lnurl}, ID: ${id}`);
    lnurlId = id;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lnurl)}`;
    coinScreen.style.display = 'none';
    qrScreen.style.display = 'block';

 // Stoppe Überprüfung, falls vorhanden
    stopLnurlCheck();


    // Nach 5 Sekunden mit dem Überprüfen der LNURL beginnen um Abfragen zu sparen
    console.log("5 Sekunden Timer gestartet für LNURL Überprüfung");
    qrCheckTimeout = setTimeout(() => {
        lnurlCheckInterval = setInterval(() => {
            console.log("LNURL wird überprüft...");
            ipcRenderer.send('check-lnurl-status', { lnurlId: lnurlId });
        }, 5000);  // Alle 1,5 Sekunden überprüfen (evtl auch noch länger oder kürzer)
    }, 5000);  // 5 Sekunden Verzögerung (um Abfragen zu sparen)
});

// Empfangene Bestätigung der LNURL Auszahlung
ipcRenderer.on('lnurl-success', () => {
    console.log("LNURL Auszahlung bestätigt");
    stopLnurlCheck();  // Abfragen stoppen
    qrCode.style.display = 'none';  // QR-Code ausblenden
    successMessage.style.display = 'block';  // Erfolgsnachricht anzeigen
    restartButton.style.display = 'block';  // Neu starten-Button anzeigen
    backButton.style.display = 'none';  // Zurück-Button ausblenden
    ipcRenderer.send('activate-solenoid-17');  // Solenoid 17 aktivieren
});

// Stoppen der LNURL-Abfragen
function stopLnurlCheck() {
    console.log("LNURL Überprüfungen gestoppt");
    clearInterval(lnurlCheckInterval);
    clearTimeout(qrCheckTimeout);
}

// Zurück-Button im QR-Code-Bildschirm
backButton.addEventListener('click', () => {
    console.log("Zurück-Button gedrückt");
    stopLnurlCheck();  // LNURL-Abfragen stoppen
    ipcRenderer.send('cancel-lnurlw', { lnurlId: lnurlId });
    ipcRenderer.send('activate-solenoids');
    qrScreen.style.display = 'none';
    startScreen.style.display = 'block';
    currentEuroValue = 0;
    valueDisplay.textContent = `Gesamtsumme: 0.00 €`;
    satoshiDisplay.textContent = `In Satoshis: 0 Sats`;
});

// Coindaten anzeigen
ipcRenderer.on('coin-value', (event, coinData) => {
    console.log(`Münzen erkannt: ${coinData.value} €`);
    currentEuroValue = coinData.value;
    valueDisplay.textContent = `Gesamtsumme: ${coinData.value.toFixed(2)} €`;
    updateSatoshiDisplay();
});

// Umrechnung von Euro in Sats
function updateSatoshiDisplay() {
    if (currentBtcToEur > 0) {
        const satoshis = Math.round((currentEuroValue / currentBtcToEur) * 100000000);
        console.log(`Umrechnung: ${currentEuroValue} € = ${satoshis} Sats`);
        satoshiDisplay.textContent = `In Satoshis: ${satoshis} Sats`;
    } else {
        console.log("Bitcoin-Kurs wird aktualisiert...");
        satoshiDisplay.textContent = 'Aktualisiere Kurs...';
    }
}

// Abrufen des aktuellen BTC-Preises in Euro
function fetchBitcoinPrice() {
    console.log("Bitcoin-Kurs wird abgerufen...");
    fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=eur')
        .then(response => response.json())
        .then(data => {
            currentBtcToEur = data.bitcoin.eur;
            console.log(`Aktueller Bitcoin-Kurs: ${currentBtcToEur} €`);
            updateSatoshiDisplay();
        })
        .catch(error => {
            console.error('Fehler beim Abrufen des Bitcoin-Kurses:', error);
        });
}
// Neu starten-Button
restartButton.addEventListener('click', () => {
    stopLnurlCheck();  // Stoppe die LNURL-Überprüfung, falls sie noch läuft
    qrScreen.style.display = 'none';
    startScreen.style.display = 'block';
    
    // Coin-Counter auf 0 setzen
    currentEuroValue = 0;
    valueDisplay.textContent = `Gesamtsumme: 0.00 €`;
    satoshiDisplay.textContent = `In Satoshis: 0 Sats`;

    // LNURL und QR-Code zurücksetzen
    lnurlId = '';  // Lösche alte LNURL ID
    qrCode.src = '';  // Lösche alten QR-Code
    successMessage.style.display = 'none';  // Erfolgsnachricht ausblenden
    restartButton.style.display = 'none';  // Neu starten-Button ausblenden
    backButton.style.display = 'block';  // Zurück-Button wieder anzeigen

    ipcRenderer.send('reset-coin-counter');  // Coin-Counter zurücksetzen
});
