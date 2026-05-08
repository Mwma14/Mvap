import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.thewaymmofficial.mvstream',
  appName: 'Kyi Mal',
  webDir: 'dist',
  plugins: {
    StatusBar: {
      overlaysWebView: true,
    },
  },
};

export default config;
