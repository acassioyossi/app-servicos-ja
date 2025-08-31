import type {Metadata} from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/error-boundary';
import { NotificationProvider } from '@/contexts/notification-context';
import { PWAManager } from '@/components/pwa/pwa-manager';
import { FirebaseAuthProvider } from '@/components/auth/firebase-auth-provider';

export const metadata: Metadata = {
  title: 'Wayne - Plataforma de Serviços',
  description: 'Conecte-se com profissionais qualificados para seus serviços domésticos e comerciais. Acompanhe em tempo real, pague com segurança e ganhe recompensas.',
  manifest: '/manifest.json',
  themeColor: '#000000',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Wayne',
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Wayne',
    'application-name': 'Wayne',
    'msapplication-TileColor': '#000000',
    'msapplication-config': '/browserconfig.xml',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className={cn('min-h-screen bg-background font-body antialiased')}>
        <FirebaseAuthProvider>
          <NotificationProvider>
            <ErrorBoundary>
              {children}
              <Toaster />
              <PWAManager />
            </ErrorBoundary>
          </NotificationProvider>
        </FirebaseAuthProvider>
      </body>
    </html>
  );
}
