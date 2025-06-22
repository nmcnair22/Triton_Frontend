<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const route = useRoute();
const toast = useToast();
const userManagementStore = useUserManagementStore();

const role = ref({
    id: null,
    name: '',
    description: '',
    is_system: false,
    permissions: []
});

const submitted = ref(false);
const loading = ref(false);
const loadingRole = ref(true);
const selectedPermissions = ref([]);
const permissionCategories = ref({});

onMounted(async () => {
    try {
        // Fetch permissions to populate the checkboxes
        await userManagementStore.fetchPermissions();
        organizePermissions();
        
        // Fetch role data if we have an ID
        if (route.params.id) {
            await fetchRoleData(route.params.id);
        } else {
            loadingRole.value = false;
            toast.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Role ID is missing',
                life: 3000
            });
            router.push({ name: 'role-management' });
        }
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load role data',
            life: 3000
        });
        loadingRole.value = false;
    }
});

async function fetchRoleData(id) {
    try {
        const roleData = await userManagementStore.getRole(id);
        role.value = roleData;
        
        // Set the selected permissions based on the role data
        selectedPermissions.value = roleData.permissions.map(p => p.id);
        
        loadingRole.value = false;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load role details',
            life: 3000
        });
        router.push({ name: 'role-management' });
    }
}

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

async function updateRole() {
    submitted.value = true;
    
    if (!role.value.name.trim()) {
        return;
    }
    
    loading.value = true;
    
    try {
        const roleData = {
            name: role.value.name,
            description: role.value.description,
            permissions: selectedPermissions.value
        };
        
        await userManagementStore.updateRole(role.value.id, roleData);
        
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Role updated successfully',
            life: 3000
        });
        
        router.push({ name: 'role-management' });
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to update role',
            life: 3000
        });
    } finally {
        loading.value = false;
    }
}

function cancelEdit() {
    router.push({ name: 'role-management' });
}
</script>

<template>
    <div class="card">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-2xl font-bold m-0">Edit Role</h2>
        </div>
        
        <ProgressSpinner v-if="loadingRole" class="w-full flex justify-center my-8" />
        
        <form v-else @submit.prevent="updateRole" class="p-fluid">
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
                            :disabled="role.is_system"
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
                            :disabled="role.is_system" 
                        />
                    </div>
                    
                    <div v-if="role.is_system" class="my-4">
                        <Message severity="warn">
                            <span>This is a system role. Only permissions can be modified.</span>
                        </Message>
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
                        @click="cancelEdit" 
                    />
                    <Button 
                        type="submit" 
                        label="Save Changes" 
                        icon="pi pi-check" 
                        :loading="loading" 
                    />
                </div>
            </div>
        </form>
    </div>
</template> 