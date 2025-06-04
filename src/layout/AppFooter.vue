<script setup>
import { useLayout } from '@/layout/composables/layout';

const { isDarkTheme } = useLayout();
</script>

<template>
    <div class="layout-footer">
        <div class="footer-logo-container">
            <img src="/layout/images/cis-logo-tagline-black.png" alt="CIS Logo" style="height: 2rem; width: auto; object-fit: contain;" />
        </div>
        <span class="footer-copyright">&#169; CIS - 2024</span>
    </div>
</template>
