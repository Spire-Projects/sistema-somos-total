import { IpcRendererEvent } from 'electron';
declare const electronAPI: {
    getAppVersion: () => Promise<any>;
    getAppInfo: () => Promise<any>;
    onAppUpdate: (callback: (event: IpcRendererEvent, ...args: any[]) => void) => () => Electron.IpcRenderer;
    platform: NodeJS.Platform;
    versions: {
        electron: string;
        chrome: string;
        node: string;
    };
};
declare global {
    interface Window {
        electronAPI: typeof electronAPI;
    }
}
export {};
//# sourceMappingURL=preload.d.ts.map