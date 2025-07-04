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
    <section class="min-h-screen flex items-center lg:items-start lg:py-20 justify-center animate-fadein animate-duration-300 animate-ease-in max-w-[100rem] mx-auto">
        <div class="flex w-full h-full justify-center gap-12">
            <div class="flex flex-col py-20 lg:min-w-[30rem]">
                <router-link to="/" class="flex items-center justify-center lg:justify-start mb-8">
                    <Logo />
                </router-link>
                <div class="flex flex-col justify-center flex-grow">
                    <div class="max-w-md mx-auto w-full">
                        <h5 class="title-h5 text-center lg:text-left">Login</h5>
                        <p class="body-small mt-3.5 text-center lg:text-left">Please enter your details</p>
                        
                        <!-- Display error message if there is one -->
                        <Message v-if="errorMessage" severity="error" class="w-full mb-4">{{ errorMessage }}</Message>
                        
                        <button class="button-button mt-8" @click="handleMicrosoftLogin">
                            <GoogleWidget /> 
                            <span class="ml-2">Sign in with Microsoft</span>
                        </button>
                        <div class="flex items-center gap-3.5 my-7">
                            <span class="flex-1 h-[1px] bg-surface-200 dark:bg-surface-800" />
                            <span class="body-small text-surface-400 dark:text-surface-600">or</span>
                            <span class="flex-1 h-[1px] bg-surface-200 dark:bg-surface-800" />
                        </div>
                        <form @submit="handleLogin">
                            <div class="mb-4">
                                <label for="email" class="block text-sm font-medium mb-2">Email</label>
                                <InputText 
                                    id="email" 
                                    type="text" 
                                    v-model="email" 
                                    :class="{'p-invalid': errorMessage && !email}" 
                                    class="w-full"
                                    placeholder="Enter your email"
                                    autocomplete="email"
                                />
                            </div>
                            <div class="mb-4">
                                <label for="password" class="block text-sm font-medium mb-2">Password</label>
                                <Password 
                                    v-model="password" 
                                    id="password" 
                                    :feedback="false" 
                                    :toggleMask="true"
                                    :class="{'p-invalid': errorMessage && !password}"
                                    class="w-full" 
                                    inputClass="w-full"
                                    placeholder="Enter your password"
                                    autocomplete="current-password"
                                />
                            </div>
                            <div class="my-4 flex items-center justify-between">
                                <div class="flex items-center gap-2">
                                    <Checkbox inputId="remember" v-model="remember" :binary="true" />
                                    <label for="remember" class="body-small">Remember me</label>
                                </div>
                                <router-link to="/auth/forgot-password" class="body-small text-primary-500 hover:underline">Forgot password?</router-link>
                            </div>
                            <Button 
                                type="submit" 
                                class="body-button w-full"
                                :loading="isSubmitting || loading"
                            >
                                {{ isSubmitting || loading ? 'Logging in...' : 'Login' }}
                            </Button>
                        </form>
                        <div class="mt-8 body-small text-center lg:text-left">Not registered? <router-link to="/auth/register" class="text-primary-500 hover:underline">Create an Account</router-link></div>
                    </div>
                </div>
                <div class="mt-8 text-center lg:text-start block relative text-surface-400 dark:text-surface-500 text-sm">©{{ new Date().getFullYear() }} Triton</div>
            </div>
            <div class="hidden lg:flex h-full py-20">
                <div class="h-full w-full lg:max-w-[32.5rem] xl:max-w-[60.5rem] mx-auto flex items-center justify-center shadow-[0px_1px_2px_0px_rgba(18,18,23,0.05)] rounded-3xl border border-surface overflow-hidden">
                    <LazyImageWidget class="w-auto h-full object-contain object-left" src="/demo/images/landing/auth-image.svg" alt="Auth Image" />
                </div>
            </div>
        </div>
    </section>
</template>
