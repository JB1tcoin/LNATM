const { app, BrowserWindow, ipcMain } = require('electron');
const { spawn } = require('child_process');
const axios = require('axios');
const path = require('path');
const { adminKey } = require('./config');
const { lnBitsURL } = require('./config');

app.disableHardwareAcceleration();

let mainWindow;
let pythonProcess;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'renderer.js'),
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    ipcMain.on('start-coin-counting', (event) => {
        pythonProcess = spawn('python3', ['../python_backend/backend.py']);
        pythonProcess.stdout.on('data', (data) => {
            let coinData = JSON.parse(data.toString());
            mainWindow.webContents.send('coin-value', coinData);
        });
        pythonProcess.stderr.on('data', (data) => {
            console.error(`Fehler im Python-Skript: ${data}`);
        });
    });

    ipcMain.on('activate-solenoids', (event) => {
        console.log(`Solenoid 17 und 27 aktiviert`);
        const solenoidProcess = spawn('python3', ['../python_backend/activate_solenoids.py']);
        solenoidProcess.stderr.on('data', (data) => {
            console.error(`Fehler im Solenoid-Skript: ${data}`);
        });
    });

ipcMain.on('create-lnurlw', async (event, { satoshis }) => {
    try {
        const response = await axios.post(
            lnBitsURL,
            {
                title: 'Lightning ATM Withdrawal',
                min_withdrawable: satoshis,
                max_withdrawable: satoshis,
                uses: 1,
                wait_time: 1,
                is_unique: true,
                webhook_url: ''
            },
            {
                headers: { 'X-Api-Key': adminKey }
            }
        );
        const lnurl = response.data.lnurl;
        const id = response.data.id;
        mainWindow.webContents.send('lnurl-qr', { lnurl, id });
    } catch (error) {
        console.error('Fehler beim Erstellen des LNURL:', error);
    }
});

ipcMain.on('check-lnurl-status', async (event, { lnurlId }) => {
    try {
        const response = await axios.get(`${lnBitsURL}/${lnurlId}`, {
            headers: { 'X-Api-Key': adminKey }
        });

        const withdrawLink = response.data;
        if (withdrawLink.used === 1) {
            mainWindow.webContents.send('lnurl-success');
        }
    } catch (error) {
        console.error('Fehler beim Prüfen des LNURL-Status:', error);
    }
});

ipcMain.on('cancel-lnurlw', async (event, { lnurlId }) => {
    try {
        await axios.delete(`${lnBitsURL}/${lnurlId}`, {
            headers: { 'X-Api-Key': adminKey }
        });
        console.log(`LNURLw mit ID ${lnurlId} storniert`);
    } catch (error) {
        console.error('Fehler beim Stornieren des LNURL:', error);
    }
});

// Solenoid an GPIO 17 aktivieren
ipcMain.on('activate-solenoid-17', (event) => {
    console.log(`Solenoid 17 aktiviert`);
    const solenoidProcess = spawn('python3', ['../python_backend/activate_solenoid_17.py']);
    solenoidProcess.stderr.on('data', (data) => {
        console.error(`Fehler im Solenoid-Skript: ${data}`);
    });
});

}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

