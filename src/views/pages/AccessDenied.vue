<script setup>
import LazyImageWidget from '@/components/landing/LazyImageWidget.vue';
import { useRoute, useRouter } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import Button from 'primevue/button';

const route = useRoute();
const router = useRouter();

// Get the route that was attempted
const fromRoute = route.query.from || '/';

// Navigation handlers
function goToDashboard() {
    router.push('/dashboard');
}

function goToProfile() {
    router.push('/profile');
}

// Check if user has admin permissions
const isAdmin = AuthService.hasRole('admin');
</script>

<template>
    <section class="animate-fadein animate-duration-300 animate-ease-in landing-container mx-auto min-h-[75vh] lg:min-h-screen flex flex-col items-center justify-center p-4">
        <LazyImageWidget class="w-[15rem]" :src="'/demo/images/landing/access-denied.png'" alt="Access Denied Image" />
        <h1 class="title-h5 lg:title-h1 mt-8">Access Denied</h1>
        <p class="body-small lg:body-large mt-2 lg:mt-4 text-center max-w-xl">
            You don't have the required permissions to access this page. 
            <span v-if="fromRoute !== '/'">
                The route <code class="bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded text-primary">{{ fromRoute }}</code> 
                requires permissions you don't currently have.
            </span>
        </p>
        
        <div class="flex flex-wrap gap-3 mt-8">
            <Button 
                label="Go to Dashboard" 
                icon="pi pi-home" 
                @click="goToDashboard" 
                class="p-button-primary"
            />
            <Button 
                label="My Profile" 
                icon="pi pi-user" 
                @click="goToProfile" 
                class="p-button-secondary"
            />
            <Button 
                v-if="isAdmin"
                label="User Management" 
                icon="pi pi-users" 
                @click="() => router.push('/user-management')" 
                class="p-button-info"
            />
        </div>
        
        <div class="mt-5 text-sm text-surface-500 dark:text-surface-400">
            If you believe this is an error, please contact your system administrator.
        </div>
    </section>
</template>
