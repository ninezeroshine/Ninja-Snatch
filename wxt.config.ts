import { defineConfig } from 'wxt';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// https://wxt.dev/api/config.html
export default defineConfig({
    modules: ['@wxt-dev/module-react'],
    manifest: {
        name: 'Ninja Snatch',
        version: '2.0.0',
        description: 'Извлечение HTML с CSS и анимациями. Pixel-Perfect, Offline-First.',
        permissions: ['activeTab', 'scripting', 'downloads', 'storage'],
        icons: {
            16: 'icon16.png',
            32: 'icon32.png',
            48: 'icon48.png',
            128: 'icon128.png',
        },
    },
    vite: () => ({
        plugins: [tailwindcss()],
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './'),
            },
        },
    }),
});
