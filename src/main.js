import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import axios from 'axios';

import BlockViewer from '@/components/BlockViewer.vue';
import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

// RBAC components
import PermissionGuard from '@/components/auth/PermissionGuard.vue';

// Import auth service
import { AuthService } from './service/AuthService';

import '@/assets/styles.scss';

// Setup axios for CSRF handling with Laravel
axios.defaults.withCredentials = true;

// Check for CSRF token meta tag and set it
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
}

// Get token from local storage on app start
AuthService.setupInterceptors();

const app = createApp(App);
const pinia = createPinia();

app.use(router);
app.use(pinia);

// Generate palettes for CIS colors
const cisNavyPalette = palette('#0B2244');
const cisBluePalette = palette('#297FB7');
const cisYellowPalette = palette('#FFB400');
const cisGrayPalette = palette('#595959');
const cisRedPalette = palette('#F60D03');

const MyPreset = definePreset(Aura, {
    colors: {
        'cis-navy': cisNavyPalette,
        'cis-blue': cisBluePalette,
        'cis-yellow': cisYellowPalette,
        'cis-gray': cisGrayPalette,
        'cis-red': cisRedPalette
    },
    semantic: {
        primary: cisNavyPalette,
        info: cisBluePalette,
        warning: cisYellowPalette,
        danger: cisRedPalette
        }
});

app.use(PrimeVue, {
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.use(ConfirmationService);

// Register global components
app.component('BlockViewer', BlockViewer);
app.component('PermissionGuard', PermissionGuard);

app.mount('#app');
