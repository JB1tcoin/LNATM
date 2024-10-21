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
const successScreen= document.getElementById('success-screen');
const restartButton = document.getElementById('restart-button');


//restart-button
//restartButton.style.display = 'none';
//restartButton.textContent = 'Neu starten';
//restartButton.addEventListener('click', () => {
  //  console.log("Neu starten-Button gedrückt");
  //  qrScreen.style.display = 'none';
  //  startScreen.style.display = 'block';
//});
//qrScreen.appendChild(restartButton);

let currentEuroValue = 0;
let currentBtcToEur = 0;
let lnurlId = '';
let lnurlCheckInterval;
let qrCheckTimeout;

// Start-Button-Klick-Event hinzufügen
startButton.addEventListener('click', () => {
    console.log("Start-Button gedrückt");
    startScreen.style.display = 'none';
    coinScreen.style.display = 'block';
    ipcRenderer.send('start-coin-counting');
    setInterval(fetchBitcoinPrice, 5000);
});

// Abbrechen-Button-Klick-Event im Münz-Bildschirm
cancelButton.addEventListener('click', () => {
    console.log("Abbrechen-Button gedrückt");
    startScreen.style.display = 'block';
    coinScreen.style.display = 'none';
    ipcRenderer.send('activate-solenoids');
});

// Fortfahren-Button-Klick-Event
proceedButton.addEventListener('click', () => {
    // Erfolgsnachricht und QR-Code zurücksetzen
    qrCode.src = '';  // QR-Code zurücksetzen
    backButton.style.display = 'block';

    // Stelle sicher, dass eine neue LNURL erstellt wird
    const satoshis = Math.round((currentEuroValue / currentBtcToEur) * 100000000);

    // QR-Code-Bildschirm anzeigen, nachdem eine neue LNURL erstellt wird
    ipcRenderer.send('create-lnurlw', { satoshis: satoshis });

    // Münz-Counter zurücksetzen
    currentEuroValue = 0;
    valueDisplay.textContent = `Gesamtsumme: 0.00 €`;
    satoshiDisplay.textContent = `In Satoshis: 0 Sats`;
});
   //Fortfahren button aktiviert sobald geld eingeschmissen
function updateProceedButtonState() {
    if (currentEuroValue >= 0.05) {
        proceedButton.disabled = false;
        proceedButton.classList.add('glow'); // Add glowing effect
    } else {
        proceedButton.disabled = true;
        proceedButton.classList.remove('glow'); // Remove glowing effect
    }
}


// Empfangener LNURL QR-Code anzeigen
ipcRenderer.on('lnurl-qr', (event, { lnurl, id }) => {
    console.log(`LNURL erhalten: ${lnurl}, ID: ${id}`);
    lnurlId = id;
    qrCode.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(lnurl)}`;
    coinScreen.style.display = 'none';
    qrScreen.style.display = 'block';

 // Stoppe vorhandene Überprüfung, falls vorhanden
    stopLnurlCheck();


    // Nach 5 Sekunden mit dem Überprüfen der LNURL beginnen
    console.log("5 Sekunden Timer gestartet für LNURL Überprüfung");
    qrCheckTimeout = setTimeout(() => {
        lnurlCheckInterval = setInterval(() => {
            console.log("LNURL wird überprüft...");
            ipcRenderer.send('check-lnurl-status', { lnurlId: lnurlId });
        }, 5000);  // Alle 1,5 Sekunden überprüfen
   }, 1000);  // 5 Sekunden Verzögerung
});

// Empfangene Bestätigung der LNURL Auszahlung
ipcRenderer.on('lnurl-success', () => {
    console.log("LNURL Auszahlung bestätigt");
    stopLnurlCheck();  // Abfragen stoppen
    qrScreen.style.display = 'none';  // QR-Screen ausblenden
    successScreen.style.display = 'block';
    //backButton.style.display = 'none';  // Zurück-Button ausblenden
    ipcRenderer.send('activate-solenoid-17');  // Solenoid an GPIO 17 aktivieren
});

// Funktion zum Stoppen der LNURL-Abfragen
function stopLnurlCheck() {
    console.log("LNURL Überprüfungen gestoppt");
    clearInterval(lnurlCheckInterval);
    clearTimeout(qrCheckTimeout);
}

// Zurück-Button-Klick-Event im QR-Code-Bildschirm
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

// Empfangene Münzdaten anzeigen
ipcRenderer.on('coin-value', (event, coinData) => {
    console.log(`Münzen erkannt: ${coinData.value} €`);
    currentEuroValue = coinData.value;
    valueDisplay.textContent = `Gesamtsumme: ${coinData.value.toFixed(2)} €`;
    updateSatoshiDisplay();
    updateProceedButtonState();
});

// Disable proceed button on load
window.onload = () => {
    proceedButton.disabled = true;
    proceedButton.classList.remove('glow');
};

// Funktion zur Umrechnung von Euro in Satoshis
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

// Funktion zum Abrufen des aktuellen Bitcoin-Preises in Euro
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
// Neu starten-Button-Klick-Event hinzufügen
restartButton.addEventListener('click', () => {
    stopLnurlCheck();  // Stoppe die LNURL-Überprüfung, falls sie noch läuft
    qrScreen.style.display = 'none';
    successScreen.style.display = 'none'; 
    startScreen.style.display = 'block';

    // Münz-Counter auf 0 setzen
    currentEuroValue = 0;
    valueDisplay.textContent = `Gesamtsumme: 0.00 €`;
    satoshiDisplay.textContent = `In Satoshis: 0 Sats`;

    // LNURL und QR-Code zurücksetzen
    lnurlId = '';  // Lösche die alte LNURL ID
    qrCode.src = '';  // Lösche den alten QR-Code
    //backButton.style.display = 'block';  // Zurück-Button wieder anzeigen

    ipcRenderer.send('reset-coin-counter');  // Münz-Counter zurücksetzen
});
