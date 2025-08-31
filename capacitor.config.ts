import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.servicosja.app',
  appName: 'Serviços Já',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;