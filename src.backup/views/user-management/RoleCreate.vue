<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const toast = useToast();
const userManagementStore = useUserManagementStore();

const role = ref({
    name: '',
    description: '',
    permissions: []
});

const submitted = ref(false);
const loading = ref(false);
const selectedPermissions = ref([]);
const permissionCategories = ref({});

onMounted(async () => {
    try {
        await userManagementStore.fetchPermissions();
        organizePermissions();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load permissions',
            life: 3000
        });
    }
});

function organizePermissions() {
    // Group permissions by their category (e.g. users.create -> users)
    const categories = {};
    
    userManagementStore.permissions.forEach(permission => {
        const parts = permission.name.split('.');
        const category = parts[0];
        
        if (!categories[category]) {
            categories[category] = [];
        }
        
        categories[category].push(permission);
    });
    
    permissionCategories.value = categories;
}

async function saveRole() {
    submitted.value = true;
    
    if (!role.value.name.trim()) {
        return;
    }
    
    loading.value = true;
    
    try {
        // Assign selected permissions to the role
        role.value.permissions = selectedPermissions.value;
        
        await userManagementStore.createRole(role.value);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Role created successfully',
            life: 3000
        });
        
        router.push({ name: 'role-management' });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to create role',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function cancelCreate() {
    router.push({ name: 'role-management' });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold m-0">Create New Role</h2>
        </div>
        
        <form @submit.prevent="saveRole" class="p-fluid">
            <div class="grid">
                <div class="col-12 lg:col-6">
                    <div class="p-field mb-4">
                        <label for="name" class="font-bold block mb-2">Role Name*</label>
                        <InputText 
                            id="name" 
                            v-model="role.name" 
                            :class="{'p-invalid': submitted && !role.name}" 
                            placeholder="Enter role name" 
                            required 
                        />
                        <small class="p-error" v-if="submitted && !role.name">Role name is required.</small>
                    </div>
                    
                    <div class="p-field mb-4">
                        <label for="description" class="font-bold block mb-2">Description</label>
                        <Textarea 
                            id="description" 
                            v-model="role.description" 
                            rows="3" 
                            placeholder="Enter role description" 
                        />
                    </div>
                </div>
                
                <div class="col-12">
                    <Divider>
                        <span class="font-semibold">Permissions</span>
                    </Divider>
                    
                    <div class="grid">
                        <div v-for="(permissions, category) in permissionCategories" :key="category" class="col-12 md:col-6 lg:col-4 mb-4">
                            <Panel :header="category.charAt(0).toUpperCase() + category.slice(1)" toggleable>
                                <div class="p-field-checkbox mb-2" v-for="permission in permissions" :key="permission.id">
                                    <Checkbox 
                                        :inputId="'permission_' + permission.id" 
                                        v-model="selectedPermissions" 
                                        :value="permission.id" 
                                        name="permission" 
                                    />
                                    <label :for="'permission_' + permission.id" class="ml-2">
                                        {{ permission.name }}
                                        <div class="text-xs text-gray-500">{{ permission.description }}</div>
                                    </label>
                                </div>
                            </Panel>
                        </div>
                    </div>
                </div>
                
                <div class="col-12 flex justify-end gap-2 mt-4">
                    <Button 
                        type="button" 
                        label="Cancel" 
                        icon="pi pi-times" 
                        outlined 
                        @click="cancelCreate" 
                    />
                    <Button 
                        type="submit" 
                        label="Save" 
                        icon="pi pi-check" 
                        :loading="loading" 
                    />
                </div>
            </div>
        </form>
    </div>
</template> 