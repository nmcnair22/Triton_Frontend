<script setup>
import { useLayout } from '@/layout/composables/layout';

const { isDarkTheme } = useLayout();
</script>

<template>
    <div class="layout-footer">
        <div class="footer-logo-container">
            <img :src="`/layout/images/logo-${isDarkTheme ? 'white' : 'dark'}.svg`" alt="diamond-layout" />
            <span class="footer-app-name">TRITON V3</span>
        </div>
        <span class="footer-copyright">&#169; Triton - 2024</span>
    </div>
</template>
