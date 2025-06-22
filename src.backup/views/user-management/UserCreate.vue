<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUserManagementStore } from '@/stores/userManagementStore';
import MultiSelect from 'primevue/multiselect';

const router = useRouter();
const toast = useToast();
const userManagementStore = useUserManagementStore();

// Form data
const formData = ref({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    roles: [],
    city: '',
    state: '',
    bio: '',
    website: '',
    status: 'active',
    avatar: null
});

// Form validation 
const errors = ref({});
const roles = ref([]);
const avatarFile = ref(null);
const isSubmitting = ref(false);

// Initialize data on component mount
onMounted(async () => {
    try {
        // Fetch roles from the API
        await userManagementStore.fetchRoles();
        roles.value = userManagementStore.roles;
        console.log('Available roles:', roles.value);
    } catch (error) {
        console.error('Error fetching roles:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load form data',
            life: 3000
        });
    }
});

// Handle avatar file upload
const handleFileUpload = (event) => {
    const file = event.files[0];
    if (file) {
        avatarFile.value = file;
    }
};

// Validate form
const validateForm = () => {
    const newErrors = {};
    
    if (!formData.value.name) {
        newErrors.name = 'Name is required';
    }
    
    if (!formData.value.email) {
        newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.value.email)) {
        newErrors.email = 'Invalid email format';
    }
    
    if (!formData.value.password) {
        newErrors.password = 'Password is required';
    } else if (formData.value.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!formData.value.password_confirmation) {
        newErrors.password_confirmation = 'Please confirm your password';
    } else if (formData.value.password !== formData.value.password_confirmation) {
        newErrors.password_confirmation = 'Passwords do not match';
    }
    
    if (!formData.value.roles || formData.value.roles.length === 0) {
        newErrors.roles = 'At least one role is required';
    }
    
    errors.value = newErrors;
    return Object.keys(newErrors).length === 0;
};

// Form submission handler
const handleSubmit = async () => {
    if (!validateForm()) {
        toast.add({
            severity: 'error',
            summary: 'Validation Error',
            detail: 'Please correct the errors in the form',
            life: 3000
        });
        return;
    }
    
    isSubmitting.value = true;
    
    try {
        // Create form data with avatar if provided
        const userData = { ...formData.value };
        
        // Format roles data for API
        if (userData.roles && Array.isArray(userData.roles)) {
            console.log('Submitting roles:', userData.roles);
        }
        
        // Add avatar from file upload if provided
        if (avatarFile.value) {
            userData.avatar = avatarFile.value;
        }
        
        // Submit the form data
        await userManagementStore.createUser(userData);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User created successfully',
            life: 3000
        });
        
        // Redirect to user management page
        router.push({ name: 'user-management' });
    } catch (error) {
        console.error('Error creating user:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to create user',
            life: 3000
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="card">
        <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">Create User</span>
        
        <div class="p-fluid">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 lg:col-span-2">
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl mb-4">Profile</div>
                    <p class="m-0 p-0 text-surface-600 dark:text-surface-200 leading-normal mr-4">
                        Create a new user account with appropriate role and permissions.
                    </p>
                </div>
                
                <div class="col-span-12 lg:col-span-10">
                    <form @submit.prevent="handleSubmit" class="grid grid-cols-12 gap-4">
                        <!-- Name -->
                        <div class="mb-4 col-span-12">
                            <label for="name" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Name</label>
                            <InputText 
                                id="name" 
                                v-model="formData.name" 
                                :class="{'p-invalid': errors.name}" 
                                class="w-full"
                            />
                            <small v-if="errors.name" class="p-error block mt-1">{{ errors.name }}</small>
                        </div>
                        
                        <!-- Avatar -->
                        <div class="mb-4 col-span-12 flex flex-col items-start">
                            <label for="avatar" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Avatar</label>
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
                            <label for="bio" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Bio</label>
                            <Textarea 
                                id="bio" 
                                v-model="formData.bio" 
                                rows="5" 
                                autoResize 
                                class="w-full resize-none"
                            />
                        </div>
                        
                        <!-- Email -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="email" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Email</label>
                            <InputText 
                                id="email" 
                                v-model="formData.email" 
                                type="email" 
                                :class="{'p-invalid': errors.email}" 
                                class="w-full"
                            />
                            <small v-if="errors.email" class="p-error block mt-1">{{ errors.email }}</small>
                        </div>
                        
                        <!-- Role -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="role" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Role</label>
                            <MultiSelect
                                id="role"
                                v-model="formData.roles"
                                :options="roles"
                                optionLabel="name"
                                dataKey="id"
                                display="chip"
                                placeholder="Select Roles"
                                :class="{'p-invalid': errors.roles}" 
                                class="w-full"
                                filter
                            />
                            <small v-if="errors.roles" class="p-error block mt-1">{{ errors.roles }}</small>
                        </div>
                        
                        <!-- Password -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="password" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Password</label>
                            <Password 
                                id="password" 
                                v-model="formData.password" 
                                :feedback="false"
                                toggleMask
                                :class="{'p-invalid': errors.password}" 
                                class="w-full"
                            />
                            <small v-if="errors.password" class="p-error block mt-1">{{ errors.password }}</small>
                        </div>
                        
                        <!-- Password Confirmation -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="password_confirmation" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Confirm Password</label>
                            <Password 
                                id="password_confirmation" 
                                v-model="formData.password_confirmation" 
                                :feedback="false"
                                toggleMask
                                :class="{'p-invalid': errors.password_confirmation}" 
                                class="w-full"
                            />
                            <small v-if="errors.password_confirmation" class="p-error block mt-1">{{ errors.password_confirmation }}</small>
                        </div>
                        
                        <!-- City -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="city" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">City</label>
                            <InputText id="city" v-model="formData.city" class="w-full" />
                        </div>
                        
                        <!-- State -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="state" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">State</label>
                            <InputText id="state" v-model="formData.state" class="w-full" />
                        </div>
                        
                        <!-- Website -->
                        <div class="mb-4 col-span-12">
                            <label for="website" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Website</label>
                            <InputGroup>
                                <InputGroupAddon>www</InputGroupAddon>
                                <InputText v-model="formData.website" id="website" type="text" class="w-full" />
                            </InputGroup>
                        </div>
                        
                        <!-- Status -->
                        <div class="mb-4 col-span-12">
                            <label class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Status</label>
                            <div class="flex gap-4">
                                <div class="field-radiobutton">
                                    <RadioButton v-model="formData.status" inputId="status_active" name="status" value="active" />
                                    <label for="status_active">Active</label>
                                </div>
                                <div class="field-radiobutton">
                                    <RadioButton v-model="formData.status" inputId="status_inactive" name="status" value="inactive" />
                                    <label for="status_inactive">Inactive</label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12">
                            <Button 
                                type="submit" 
                                label="Create User" 
                                icon="pi pi-user-plus" 
                                :loading="isSubmitting"
                                class="w-auto mt-4"
                            />
                            <Button 
                                type="button" 
                                label="Cancel" 
                                icon="pi pi-times" 
                                severity="secondary" 
                                text
                                @click="router.push({ name: 'user-management' })"
                                class="w-auto mt-4 ml-2"
                            />
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</template>
