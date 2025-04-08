<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '@/stores/userStore';
import { UserService } from '@/service/UserService';
import { z } from 'zod';
import Select from 'primevue/select';

const toast = useToast();
const userStore = useUserStore();

// Form validation schemas
const profileSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address'),
    bio: z.string().optional(),
    website: z.string().optional(),
    country: z.object({
        name: z.string().optional(),
        code: z.string().optional()
    }).optional().nullable(),
    city: z.string().optional(),
    state: z.string().optional(),
    avatar: z.any().optional()
});

const passwordSchema = z.object({
    current_password: z.string().min(1, 'Current password is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    password_confirmation: z.string().min(8, 'Please confirm your password')
}).refine(data => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ['password_confirmation']
});

// Form state
const profileData = ref({
    name: '',
    email: '',
    bio: '',
    website: '',
    country: null,
    city: '',
    state: '',
    avatar: null
});

const passwordData = ref({
    current_password: '',
    password: '',
    password_confirmation: ''
});

// Form errors
const profileErrors = ref({});
const passwordErrors = ref({});

const countries = ref([]);
const isLocalUser = ref(false);
const isLoading = ref(true);
const isSubmittingProfile = ref(false);
const isSubmittingPassword = ref(false);
const avatarFile = ref(null);

// Initialize on component mount
onMounted(async () => {
    try {
        // Fetch user profile
        await fetchUserProfile();
        
        // Sample countries data
        countries.value = [
            { name: 'Australia', code: 'AU' },
            { name: 'Brazil', code: 'BR' },
            { name: 'China', code: 'CN' },
            { name: 'Egypt', code: 'EG' },
            { name: 'France', code: 'FR' },
            { name: 'Germany', code: 'DE' },
            { name: 'India', code: 'IN' },
            { name: 'Japan', code: 'JP' },
            { name: 'Spain', code: 'ES' },
            { name: 'United States', code: 'US' }
        ];
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load profile data',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
});

// Fetch user profile
async function fetchUserProfile() {
    try {
        const response = await UserService.getProfile();
        const userData = response.user || response;
        
        // Check if user is local (not Microsoft/external auth)
        isLocalUser.value = userData.auth_provider === 'local' || !userData.auth_provider;
        
        // Populate profile form data
        profileData.value = {
            name: userData.name || '',
            email: userData.email || '',
            bio: userData.bio || '',
            website: userData.website || '',
            country: userData.country || null,
            city: userData.city || '',
            state: userData.state || '',
            avatar: null  // Don't populate the file input
        };
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to fetch profile data',
            life: 3000
        });
    }
}

// Validate profile form
const validateProfileForm = () => {
    try {
        profileSchema.parse(profileData.value);
        profileErrors.value = {};
        return true;
    } catch (error) {
        const formattedErrors = {};
        error.errors.forEach(err => {
            const field = err.path.join('.');
            formattedErrors[field] = err.message;
        });
        profileErrors.value = formattedErrors;
        return false;
    }
};

// Validate password form
const validatePasswordForm = () => {
    try {
        passwordSchema.parse(passwordData.value);
        passwordErrors.value = {};
        return true;
    } catch (error) {
        const formattedErrors = {};
        error.errors.forEach(err => {
            const field = err.path.join('.');
            formattedErrors[field] = err.message;
        });
        passwordErrors.value = formattedErrors;
        return false;
    }
};

// Handle avatar file upload
const handleFileUpload = (event) => {
    const file = event.files[0];
    if (file) {
        avatarFile.value = file;
        profileData.value.avatar = file;
    }
};

// Update profile
const updateProfile = async (e) => {
    e.preventDefault();
    
    if (!validateProfileForm()) {
        return;
    }
    
    isSubmittingProfile.value = true;
    
    try {
        // Create form data with avatar if provided
        const userData = { ...profileData.value };
        
        // Submit the profile data
        await userStore.updateProfile(userData);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Profile updated successfully',
            life: 3000
        });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update profile',
            life: 3000
        });
    } finally {
        isSubmittingProfile.value = false;
    }
};

// Change password
const changePassword = async (e) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) {
        return;
    }
    
    isSubmittingPassword.value = true;
    
    try {
        await userStore.changePassword(passwordData.value);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Password changed successfully',
            life: 3000
        });
        
        // Reset password form
        passwordData.value = {
            current_password: '',
            password: '',
            password_confirmation: ''
        };
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to change password',
            life: 3000
        });
    } finally {
        isSubmittingPassword.value = false;
    }
};
</script>

<template>
    <div class="card">
        <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">My Profile</span>
        
        <ProgressSpinner v-if="isLoading" class="w-12 h-12 mx-auto my-8" />
        
        <div v-else class="grid grid-cols-12 gap-x-6 gap-y-10">
            <!-- Profile Form -->
            <div class="col-span-12 lg:col-span-6">
                <h2 class="text-lg font-medium mb-4">Profile Information</h2>
                
                <form @submit="updateProfile" class="p-fluid">
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Name -->
                        <div class="mb-4 col-span-12">
                            <label for="name" class="font-medium block mb-2">Name</label>
                            <InputText 
                                id="name" 
                                v-model="profileData.name" 
                                :class="{'p-invalid': profileErrors.name}" 
                                class="w-full"
                            />
                            <small v-if="profileErrors.name" class="p-error block mt-1">{{ profileErrors.name }}</small>
                        </div>
                        
                        <!-- Email -->
                        <div class="mb-4 col-span-12">
                            <label for="email" class="font-medium block mb-2">Email</label>
                            <InputText 
                                id="email" 
                                type="email" 
                                v-model="profileData.email" 
                                :class="{'p-invalid': profileErrors.email}" 
                                class="w-full"
                            />
                            <small v-if="profileErrors.email" class="p-error block mt-1">{{ profileErrors.email }}</small>
                        </div>
                        
                        <!-- Avatar -->
                        <div class="mb-4 col-span-12 flex flex-col items-start">
                            <label for="avatar" class="font-medium block mb-2">Avatar</label>
                            <FileUpload
                                mode="basic"
                                name="avatar"
                                :customUpload="true"
                                @uploader="handleFileUpload"
                                accept="image/*"
                                :maxFileSize="1000000"
                                chooseLabel="Upload Image"
                                class="w-unset !text-surface-600 dark:!text-surface-200 hover:!text-primary !bg-surface-200/20 hover:!bg-surface-200/30 dark:!bg-surface-700/20 hover:!dark-bg-surface-700/30 border !border-surface-300 dark:!border-surface-500 !p-2"
                            />
                        </div>
                        
                        <!-- Bio -->
                        <div class="mb-4 col-span-12">
                            <label for="bio" class="font-medium block mb-2">Bio</label>
                            <Textarea 
                                id="bio" 
                                v-model="profileData.bio" 
                                rows="4" 
                                autoResize 
                                class="w-full resize-none"
                                :class="{'p-invalid': profileErrors.bio}"
                            />
                            <small v-if="profileErrors.bio" class="p-error block mt-1">{{ profileErrors.bio }}</small>
                        </div>
                        
                        <!-- Country -->
                        <div class="mb-4 col-span-12 md:col-span-12">
                            <label for="country" class="font-medium block mb-2">Country</label>
                            <Select
                                id="country"
                                v-model="profileData.country"
                                :options="countries"
                                optionLabel="name"
                                showClear
                                placeholder="Select a Country"
                                class="w-full"
                                :class="{'p-invalid': profileErrors.country}"
                            >
                                <template #option="slotProps">
                                    <div class="flex items-center">
                                        <span :class="`mr-2 flag flag-${slotProps.option.code.toLowerCase()}`" style="width: 18px; height: 12px"></span>
                                        <div>{{ slotProps.option.name }}</div>
                                    </div>
                                </template>
                                <template #value="slotProps">
                                    <div class="flex items-center" v-if="slotProps.value && slotProps.value.code">
                                        <span :class="`mr-2 flag flag-${slotProps.value.code.toLowerCase()}`" style="width: 18px; height: 12px"></span>
                                        <div>{{ slotProps.value.name }}</div>
                                    </div>
                                    <span v-else>{{ slotProps.placeholder }}</span>
                                </template>
                            </Select>
                            <small v-if="profileErrors.country" class="p-error block mt-1">{{ profileErrors.country }}</small>
                        </div>
                        
                        <!-- City and State -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="city" class="font-medium block mb-2">City</label>
                            <InputText 
                                id="city" 
                                v-model="profileData.city" 
                                class="w-full"
                                :class="{'p-invalid': profileErrors.city}"
                            />
                            <small v-if="profileErrors.city" class="p-error block mt-1">{{ profileErrors.city }}</small>
                        </div>
                        
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="state" class="font-medium block mb-2">State</label>
                            <InputText 
                                id="state" 
                                v-model="profileData.state" 
                                class="w-full"
                                :class="{'p-invalid': profileErrors.state}"
                            />
                            <small v-if="profileErrors.state" class="p-error block mt-1">{{ profileErrors.state }}</small>
                        </div>
                        
                        <!-- Website -->
                        <div class="mb-4 col-span-12">
                            <label for="website" class="font-medium block mb-2">Website</label>
                            <InputGroup>
                                <InputGroupAddon>www</InputGroupAddon>
                                <InputText 
                                    v-model="profileData.website" 
                                    id="website" 
                                    type="text" 
                                    class="w-full"
                                    :class="{'p-invalid': profileErrors.website}"
                                />
                            </InputGroup>
                            <small v-if="profileErrors.website" class="p-error block mt-1">{{ profileErrors.website }}</small>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12">
                            <Button 
                                type="submit" 
                                label="Update Profile" 
                                icon="pi pi-save" 
                                :loading="isSubmittingProfile"
                                class="w-auto mt-2"
                            />
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Password Form (only for local users) -->
            <div v-if="isLocalUser" class="col-span-12 lg:col-span-6">
                <h2 class="text-lg font-medium mb-4">Change Password</h2>
                
                <form @submit="changePassword" class="p-fluid">
                    <div class="grid grid-cols-12 gap-4">
                        <!-- Current Password -->
                        <div class="mb-4 col-span-12">
                            <label for="current_password" class="font-medium block mb-2">Current Password</label>
                            <Password 
                                id="current_password" 
                                v-model="passwordData.current_password" 
                                :feedback="false"
                                toggleMask
                                :class="{'p-invalid': passwordErrors.current_password}"
                                inputClass="w-full"
                            />
                            <small v-if="passwordErrors.current_password" class="p-error block mt-1">
                                {{ passwordErrors.current_password }}
                            </small>
                        </div>
                        
                        <!-- New Password -->
                        <div class="mb-4 col-span-12">
                            <label for="password" class="font-medium block mb-2">New Password</label>
                            <Password 
                                id="password" 
                                v-model="passwordData.password" 
                                toggleMask
                                :class="{'p-invalid': passwordErrors.password}"
                                inputClass="w-full"
                            />
                            <small v-if="passwordErrors.password" class="p-error block mt-1">
                                {{ passwordErrors.password }}
                            </small>
                        </div>
                        
                        <!-- Confirm New Password -->
                        <div class="mb-4 col-span-12">
                            <label for="password_confirmation" class="font-medium block mb-2">Confirm New Password</label>
                            <Password 
                                id="password_confirmation" 
                                v-model="passwordData.password_confirmation" 
                                :feedback="false"
                                toggleMask
                                :class="{'p-invalid': passwordErrors.password_confirmation}"
                                inputClass="w-full"
                            />
                            <small v-if="passwordErrors.password_confirmation" class="p-error block mt-1">
                                {{ passwordErrors.password_confirmation }}
                            </small>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12">
                            <Button 
                                type="submit" 
                                label="Change Password" 
                                icon="pi pi-lock" 
                                :loading="isSubmittingPassword"
                                class="w-auto mt-2"
                            />
                        </div>
                    </div>
                </form>
            </div>
            
            <!-- Message for external auth users -->
            <div v-else class="col-span-12 lg:col-span-6">
                <h2 class="text-lg font-medium mb-4">Authentication</h2>
                
                <Message severity="info" class="mb-4">
                    <div class="flex flex-column gap-2">
                        <div class="font-bold">Microsoft Authentication</div>
                        <p class="m-0 p-0">
                            Your account is linked to Microsoft. Password management is handled through your 
                            Microsoft account settings.
                        </p>
                    </div>
                </Message>
            </div>
        </div>
    </div>
</template> 