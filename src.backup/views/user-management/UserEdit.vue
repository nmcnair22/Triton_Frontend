<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';
import { useUserManagementStore } from '@/stores/userManagementStore';
import MultiSelect from 'primevue/multiselect';
import { UserService } from '@/service/UserService';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const userManagementStore = useUserManagementStore();

// Get user ID from route params
const userId = route.params.id;

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
const isLoading = ref(true);

// Initialize data on component mount
onMounted(async () => {
    try {
        // Fetch roles from the API
        await userManagementStore.fetchRoles();
        roles.value = userManagementStore.roles;
        
        // Fetch user data
        await fetchUserData();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load form data',
            life: 3000
        });
    } finally {
        isLoading.value = false;
    }
});

// Fetch user data
async function fetchUserData() {
    try {
        const userData = await UserService.getUser(userId);
        roles.value = await UserService.getRoles();
        
        // Process user roles based on data structure
        let userRoles = [];
        
        if (userData.roles && Array.isArray(userData.roles)) {
            // User has roles as array of objects or strings
            userRoles = userData.roles.map(role => {
                if (typeof role === 'object' && role.id) {
                    return role;
                } else if (typeof role === 'string') {
                    // Find matching role object from available roles
                    const matchingRole = roles.value.find(r => r.name === role);
                    return matchingRole || { id: null, name: role };
                }
                return role;
            });
        } else if (userData.role && typeof userData.role === 'string') {
            // User has a single role as string
            const matchingRole = roles.value.find(r => r.name === userData.role);
            
            if (matchingRole) {
                userRoles = [matchingRole];
            } else {
                // Create a temporary role object if no match found
                userRoles = [{ id: null, name: userData.role }];
            }
        }
        
        // Populate form data
        formData.value = {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            roles: userRoles,
            status: userData.status || 'active'
        };
        
        isLoading.value = false;
    } catch (error) {
        console.error('Error fetching user data:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: `Failed to load user data: ${error.message}`,
            life: 3000
        });
    }
}

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
    
    if (formData.value.password && formData.value.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (formData.value.password && formData.value.password !== formData.value.password_confirmation) {
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
        
        // Format roles data for API - either send role IDs or role objects based on API requirements
        if (userData.roles && Array.isArray(userData.roles)) {
            // Option 1: Send role IDs array
            // userData.role_ids = userData.roles.map(role => role.id);
            
            // Option 2: Keep role objects as is (if API expects full role objects)
            // No change needed
            
            // Option 3: Send single role string if API expects it
            // if (userData.roles.length > 0) {
            //    userData.role = userData.roles[0].name;
            // }
            
            console.log('Submitting roles:', userData.roles);
        }
        
        // Add avatar from file upload if provided
        if (avatarFile.value) {
            userData.avatar = avatarFile.value;
        }
        
        // Remove password fields if not provided
        if (!userData.password) {
            delete userData.password;
            delete userData.password_confirmation;
        }
        
        // Submit the form data
        await userManagementStore.updateUser(userId, userData);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User updated successfully',
            life: 3000
        });
        
        // Redirect to user management page
        router.push({ name: 'user-management' });
    } catch (error) {
        console.error('Error updating user:', error);
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: error.message || 'Failed to update user',
            life: 3000
        });
    } finally {
        isSubmitting.value = false;
    }
};
</script>

<template>
    <div class="card">
        <span class="text-surface-900 dark:text-surface-0 text-xl font-bold mb-6 block">Edit User</span>
        
        <ProgressSpinner v-if="isLoading" class="w-12 h-12 mx-auto my-8" />
        
        <div v-else class="p-fluid">
            <div class="grid grid-cols-12 gap-4">
                <div class="col-span-12 lg:col-span-2">
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl mb-4">Profile</div>
                    <p class="m-0 p-0 text-surface-600 dark:text-surface-200 leading-normal mr-4">
                        Edit user information and role assignment.
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
                        
                        <!-- Password heading (optional for editing) -->
                        <div class="col-span-12 mt-2">
                            <h3 class="text-lg font-medium text-surface-900 dark:text-surface-0 mb-2">Change Password (Optional)</h3>
                            <p class="text-surface-600 dark:text-surface-400 mb-4">Leave blank to keep the current password.</p>
                        </div>
                        
                        <!-- Password -->
                        <div class="mb-4 col-span-12 md:col-span-6">
                            <label for="password" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">New Password</label>
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
                            <label for="password_confirmation" class="font-medium text-surface-900 dark:text-surface-0 block mb-2">Confirm New Password</label>
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
                                <div class="field-radiobutton">
                                    <RadioButton v-model="formData.status" inputId="status_suspended" name="status" value="suspended" />
                                    <label for="status_suspended">Suspended</label>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Submit Button -->
                        <div class="col-span-12">
                            <Button 
                                type="submit" 
                                label="Update User" 
                                icon="pi pi-save" 
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