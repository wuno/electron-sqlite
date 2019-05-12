'use strict';

// yarn add sqlite3 --build-from-source --sqlite_libname=sqlcipher --sqlite=brew --prefix--runtime=electron --target=4.0.0 --save-dev --dist-url=https://atom.io/download/electron
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./src/encryptedDB.sql');

import { app, protocol, BrowserWindow, ipcMain } from 'electron';
import {
  createProtocol,
  installVueDevtools,
} from 'vue-cli-plugin-electron-builder/lib';
const isDevelopment = process.env.NODE_ENV !== 'production';
// The os.cpus() method returns an array of objects
// containing information about each logical CPU core.
const cpus = require('os').cpus().length;
console.log('cpus: ' + cpus);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let win;

// stack of available background WorkHorse threads
var available = [];

// queue of tasks to be done
var tasks = [];
console.log('tasks ', tasks.length);

// Distribute tasks to available threads
function runIt() {
  while (available.length > 0 && tasks.length > 0) {
    var task = tasks.shift();
    available.shift().send(task[0], task[1]);
  }
  // win.webContents.send('run-sql', available.length, tasks.length);
}

// For sqlite3
function fireSQL() {
  try {
    db.serialize(function () {
      // db.run('CREATE TABLE IF NOT EXISTS clients (info TEXT)');
      // var stmt = db.prepare('INSERT INTO clients VALUES (?)');
      // for (var i = 0; i < 10; i++) {
      //   stmt.run('wunO Background Client Number - ' + i);
      // }
      // stmt.finalize();
      db.each('SELECT* FROM clients', function (err, row) {
        const json = JSON.stringify(row.info);
        win.webContents.send('window-sql', json);
      });
    });
  } catch (err) {
    console.log(err);
  }
}

function createDB() {
  try {
    // var stmt
    //   , messages
    //   ;
    // db.run("PRAGMA KEY = 'secret'");
    db.serialize(function () {
      db.run("PRAGMA KEY = 'secret'");
      db.run("PRAGMA CIPHER = 'aes-256-cbc'");
      db.run('CREATE TABLE IF NOT EXISTS clients (info TEXT)');
      var stmt = db.prepare('INSERT INTO clients VALUES (?)');
      for (var i = 0; i < 10; i++) {
        stmt.run('wunO Background Client Number - ' + i);
      }
      stmt.finalize();
    });

    // stmt = db.prepare("INSERT INTO messages(id, user, msg) VALUES (?, ?, ?)");
    // messages = [
    //   [1, 'coolaj86', 'this is test message number one'],
    //   [2, 'ajthedj', 'this is test message number two'],
    //   [3, 'coolaj86', 'this is test message number three']
    // ];
    // messages.forEach(function (msg) {
    //   stmt.run(msg);
    // });
    // stmt.finalize();

  } catch (err) {
    console.log(err);
  }
}

// for sqlite-cipher
// function fireSQL() {
//   try {
//     db.get("SELECT * FROM messages", function (err, data) {
//       if (err) {
//         console.error(err);
//         return;
//       }
//       console.log(data);
//       const json = JSON.stringify(data);
//       win.webContents.send('window-sql', json);
//     });
//   } catch (err) {
//     console.log(err);
//   }
// }

// Helper to create our invisible WorkHorse BrowserWindow
function createBgWindow() {
  let result = new BrowserWindow({
    show: false,
  });
  result.loadURL(`file://${__dirname}/../public/WorkHorse.html`);
  result.on('closed', () => {
    console.log('WorkHorse window closed');
  });
  return result;
}

// Standard scheme must be registered before the app is ready
protocol.registerStandardSchemes(['app'], {
  secure: true,
});

// Helper to create our main view BrowserWindow
function createWindow() {
  createDB();
  // Create the browser window.
  win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  win.webContents.openDevTools()

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    win.loadURL(process.env.WEBPACK_DEV_SERVER_URL);
    // if (!process.env.IS_TEST) win.webContents.openDevTools();
  } else {
    createProtocol('app');
    // Load the index.html when not in development
    win.loadURL('app://./index.html');
  }

  win.on('closed', () => {
    db.close();
    win = null;
  });
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installVueDevtools();
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString());
    }
  }

  // Create Main BrowserWindow View
  createWindow();

  // Create WorkHorse BrowserWindow threads for each CPU core
  for (var i = 0; i < cpus; i++) {
    createBgWindow();
  }

  ipcMain.on('fire-sql', (event, arg) => {
    fireSQL();
  });

  ipcMain.on('get-sql', (event, arg) => {
    console.log('get-sql - ', arg);
    tasks.push(['run-sql', event.sender]);
    runIt();
  });

  ipcMain.on('show-sql', (event, arg) => {
    console.log('show-sql - ', arg);
    win.webContents.send('window-sql', arg);
  });

  ipcMain.on('to-main', (event, arg) => {
    console.log('Main Thread Loggin ', arg);
  });

  // When WorkHorse is ready add each instance to the avaialable array
  ipcMain.on('ready', (event, arg) => {
    available.push(event.sender);
    runIt();
  });
});

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', data => {
      if (data === 'graceful-exit') {
        app.quit();
      }
    });
  } else {
    process.on('SIGTERM', () => {
      app.quit();
    });
  }
}