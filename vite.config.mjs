import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    define: {
        'import.meta.env.VITE_API_BASE_URL': JSON.stringify(process.env.VITE_API_BASE_URL || 'http://localhost:8000/api'),
    },
    optimizeDeps: {
        noDiscovery: true,
        include: ['quill', '@primevue/forms', 'pusher-js', 'laravel-echo']
    },
    plugins: [
        vue({
            script: {
                defineModel: true,
                propsDestructure: true
            }
        }),
        Components({
            resolvers: [PrimeVueResolver()]
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    css: {
        preprocessorOptions: {
            scss: {
                api: 'modern-compiler'
            }
        }
    },
    server: {
        port: process.env.PORT || 3000,
        host: '0.0.0.0'
    }
    // NO BUILD CONFIGURATION - Let Vite use defaults!
});