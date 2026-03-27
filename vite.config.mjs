import { fileURLToPath, URL } from 'node:url';
import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig, loadEnv } from 'vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isDev = mode === 'development';
    const configuredBackendOrigin = env.VITE_BACKEND_ORIGIN || 'http://127.0.0.1:8000';
    const backendOrigin =
        isDev && configuredBackendOrigin === 'http://localhost:8000'
            ? 'http://127.0.0.1:8000'
            : configuredBackendOrigin;
    const apiBaseUrl = env.VITE_API_BASE_URL || (isDev ? '/api' : `${backendOrigin}/api`);

    return {
        define: {
            'import.meta.env.VITE_API_BASE_URL': JSON.stringify(apiBaseUrl)
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
            port: Number(env.PORT || 3000),
            host: '0.0.0.0',
            proxy: {
                '/api': {
                    target: backendOrigin,
                    changeOrigin: true,
                    secure: false
                }
            }
        }
        // NO BUILD CONFIGURATION - Let Vite use defaults!
    };
});
