const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("conradApi", {
  getVersion: () => ipcRenderer.invoke("app:get-version"),
});
