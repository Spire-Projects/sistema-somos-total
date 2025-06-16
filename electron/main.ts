import { app, BrowserWindow } from "electron";
import path from "path";

const createWindow = () => {
  const win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  win.loadURL("http://localhost:5173"); // apuntará al dev server de Vite
};

app.whenReady().then(createWindow);
