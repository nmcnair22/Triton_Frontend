import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import BlockViewer from '@/components/BlockViewer.vue';
import { definePreset, palette } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';

const app = createApp(App);

app.use(router);

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

app.component('BlockViewer', BlockViewer);

app.mount('#app');
