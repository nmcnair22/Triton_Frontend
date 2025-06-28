<script setup>
import AppleWidget from '@/components/auth/AppleWidget.vue';
import GoogleWidget from '@/components/auth/GoogleWidget.vue';
import Logo from '@/components/landing/LogoWidget.vue';
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import { useUserStore } from '@/stores/user';
import { z } from 'zod';

const router = useRouter();
const userStore = useUserStore();

const email = ref('');
const password = ref('');
const remember = ref(false);
const errorMessage = ref('');
const isSubmitting = ref(false);

// Form validation schema
const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required')
});

// Get values from the store
const loading = computed(() => userStore.loading);
const error = computed(() => userStore.error);

// Validate form
function validateForm() {
    try {
        loginSchema.parse({ email: email.value, password: password.value });
        return true;
    } catch (error) {
        errorMessage.value = error.errors[0].message || 'Please check your login details';
        return false;
    }
}

async function handleLogin(event) {
    event.preventDefault();
    
    // Validate form before submission
    if (!validateForm()) {
        return;
    }
    
    errorMessage.value = '';
    isSubmitting.value = true;
    
    try {
        // Use our enhanced auth service for login
        const result = await AuthService.loginWithCredentials(
            email.value, 
            password.value, 
            remember.value
        );
        
        if (result.success) {
            // Login successful, redirect to dashboard or stored redirect path
            const redirectPath = localStorage.getItem('auth_redirect');
            if (redirectPath) {
                localStorage.removeItem('auth_redirect');
                router.push(redirectPath);
            } else {
                router.push({ name: 'dashboard-marketing' });
            }
        } else {
            // Handle login error from the auth service
            errorMessage.value = result.error || 'Login failed. Please try again.';
        }
    } catch (error) {
        console.error('Login error:', error);
        errorMessage.value = error.message || 'Login failed. Please try again.';
    } finally {
        isSubmitting.value = false;
    }
}

function handleMicrosoftLogin() {
    // Use our enhanced auth service for Microsoft login
    AuthService.loginWithMicrosoft();
}
</script>

<template>
    <!-- Modern gradient background with animated elements -->
    <section class="min-h-screen relative overflow-hidden">
        <!-- Animated gradient background -->
        <div class="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"></div>
        
        <!-- Floating animated elements -->
        <div class="absolute inset-0 overflow-hidden">
            <div class="absolute -top-40 -right-40 w-80 h-80 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div class="absolute top-40 left-40 w-80 h-80 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            
            <!-- Subtle grid pattern -->
            <div class="absolute inset-0 opacity-5">
                <div class="grid grid-cols-12 gap-4 h-full">
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                    <div class="border-r border-white/20"></div>
                </div>
            </div>
        </div>
        
        <!-- Main content -->
        <div class="relative z-10 min-h-screen flex items-center justify-center px-4 py-12">
            <div class="w-full max-w-md">
                <!-- Glass morphism card -->
                <div class="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    <!-- Subtle inner glow -->
                    <div class="absolute inset-0 rounded-3xl bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
                    <div class="relative z-10">
                    <!-- Logo section -->
                    <div class="text-center mb-8">
                        <img src="/layout/images/logo-cis.png" alt="CIS Logo" class="h-14 mx-auto mb-6 drop-shadow-lg" />
                        <h1 class="text-3xl font-bold text-white mb-2 tracking-tight">Welcome Back</h1>
                        <p class="text-blue-100/80 text-lg">Sign in to access your account</p>
                    </div>
                    
                    <!-- Error message -->
                    <div v-if="errorMessage" class="mb-6 p-4 bg-red-500/20 border border-red-400/30 rounded-xl text-red-100 text-sm backdrop-blur-sm">
                        {{ errorMessage }}
                    </div>
                    
                    <!-- Login form -->
                    <form @submit="handleLogin" class="space-y-6">
                        <!-- Email field -->
                        <div class="space-y-2">
                            <label for="email" class="block text-sm font-medium text-blue-100">Email Address</label>
                            <div class="relative">
                                <input 
                                    id="email" 
                                    type="email" 
                                    v-model="email" 
                                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 backdrop-blur-sm focus:bg-white/20 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                                    placeholder="Enter your email"
                                    autocomplete="email"
                                />
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <i class="pi pi-envelope text-blue-200/60"></i>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Password field -->
                        <div class="space-y-2">
                            <label for="password" class="block text-sm font-medium text-blue-100">Password</label>
                            <div class="relative">
                                <input 
                                    id="password"
                                    type="password" 
                                    v-model="password" 
                                    class="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/60 backdrop-blur-sm focus:bg-white/20 focus:border-blue-400/50 focus:outline-none focus:ring-2 focus:ring-blue-400/30 transition-all duration-300"
                                    placeholder="Enter your password"
                                    autocomplete="current-password"
                                />
                                <div class="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <i class="pi pi-lock text-blue-200/60"></i>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Remember me and forgot password -->
                        <div class="flex items-center justify-between">
                            <label class="flex items-center space-x-2 text-sm text-blue-100">
                                <input type="checkbox" v-model="remember" class="rounded border-white/20 bg-white/10 text-blue-400 focus:ring-blue-400/30">
                                <span>Remember me</span>
                            </label>
                            <router-link to="/auth/forgot-password" class="text-sm text-blue-200 hover:text-white transition-colors duration-200">
                                Forgot password?
                            </router-link>
                        </div>
                        
                        <!-- CIS Employee Login Button -->
                        <button 
                            type="button" 
                            @click="handleMicrosoftLogin"
                            class="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-3 relative overflow-hidden group"
                        >
                            <!-- Shimmer effect -->
                            <div class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 ease-out"></div>
                            <img src="/layout/images/cis-favicon.ico" alt="CIS" class="w-5 h-5 relative z-10" />
                            <span class="relative z-10">CIS Employee Login</span>
                            <i class="pi pi-arrow-right relative z-10"></i>
                        </button>
                    </form>
                    
                    <!-- Registration link -->
                    <div class="mt-8 text-center">
                        <p class="text-blue-100/80 text-sm">
                            Don't have an account? 
                            <router-link to="/auth/register" class="text-blue-200 hover:text-white font-medium transition-colors duration-200">
                                Create one here
                            </router-link>
                        </p>
                    </div>
                    
                    <!-- Copyright -->
                    <div class="mt-8 text-center text-blue-200/60 text-xs">
                        ©{{ new Date().getFullYear() }} CIS. All rights reserved.
                    </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
</template>

<style scoped>
@keyframes blob {
    0% {
        transform: translate(0px, 0px) scale(1);
    }
    33% {
        transform: translate(30px, -50px) scale(1.1);
    }
    66% {
        transform: translate(-20px, 20px) scale(0.9);
    }
    100% {
        transform: translate(0px, 0px) scale(1);
    }
}

.animate-blob {
    animation: blob 7s infinite;
}

.animation-delay-2000 {
    animation-delay: 2s;
}

.animation-delay-4000 {
    animation-delay: 4s;
}

/* Custom focus styles for better accessibility */
input:focus {
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

/* Hover effect for the login button */
button:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}
</style>
