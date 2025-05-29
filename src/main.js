import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import axios from 'axios';

import BlockViewer from '@/components/BlockViewer.vue';
import { definePreset, palette } from '@primeuix/themes';
import Material from '@primeuix/themes/material';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

// RBAC components
import PermissionGuard from '@/components/auth/PermissionGuard.vue';

// Import auth service from the correct path
import { AuthService } from './auth/AuthService';

import '@/assets/styles.scss';

// Setup axios for CSRF handling with Laravel
axios.defaults.withCredentials = true;

// Check for CSRF token meta tag and set it
const csrfToken = document.head.querySelector('meta[name="csrf-token"]');
if (csrfToken) {
  axios.defaults.headers.common['X-CSRF-TOKEN'] = csrfToken.content;
}

// Set token in axios headers if present
const token = localStorage.getItem('token') || localStorage.getItem('auth_token'); 
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

const app = createApp(App);
const pinia = createPinia();

// Mount pinia before router to ensure store is available for navigation guards
app.use(pinia);
app.use(router);

// Generate palettes for CIS colors
const cisNavyPalette = palette('#0B2244');
const cisBluePalette = palette('#297FB7');
const cisYellowPalette = palette('#FFB400');
const cisGrayPalette = palette('#595959');
const cisRedPalette = palette('#F60D03');

const MyPreset = definePreset(Material, {
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
    pt: {
        chart: {
            root: { class: 'w-full' }
        }
    },
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

/* Import Font Awesome */
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { 
    faArrowTrendUp,
    faArrowTrendDown,
    faTruck,
    faMoneyBill,
    faChartLine,
    faCheckCircle
} from '@fortawesome/free-solid-svg-icons';

// Import custom icons (optional - if using Font Awesome approach)
import { registerCustomIcons } from '@/utils/customIcons';

// Add icons to the library
library.add(
    faArrowTrendUp,
    faArrowTrendDown,
    faTruck,
    faMoneyBill,
    faChartLine,
    faCheckCircle
);

// Register custom icons (optional)
registerCustomIcons();

app.component('font-awesome-icon', FontAwesomeIcon);

app.mount('#app');
