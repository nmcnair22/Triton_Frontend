<script setup>
import { FilterMatchMode } from '@primevue/core/api';
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserManagementStore } from '@/stores/userManagementStore';
import { useToast } from 'primevue/usetoast';
import PermissionGuard from '@/components/auth/PermissionGuard.vue';

const router = useRouter();
const toast = useToast();
const userManagementStore = useUserManagementStore();

const tableRef = ref(null);
const deleteRoleDialog = ref(false);
const selectedRole = ref(null);
const filterTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    try {
        await userManagementStore.fetchRoles();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load roles',
            life: 3000
        });
    }
});

function navigateToCreateRolePage() {
    router.push({ name: 'role-create' });
}

function editRole(role) {
    router.push({ name: 'role-edit', params: { id: role.id } });
}

function confirmDeleteRole(role) {
    selectedRole.value = role;
    deleteRoleDialog.value = true;
}

async function deleteRole() {
    if (!selectedRole.value) return;
    
    try {
        await userManagementStore.deleteRole(selectedRole.value.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Role deleted successfully',
            life: 3000
        });
        deleteRoleDialog.value = false;
        selectedRole.value = null;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete role',
            life: 3000
        });
    }
}

function getSeverity(isSystem) {
    return isSystem ? 'warning' : 'info';
}

function refreshRoles() {
    userManagementStore.fetchRoles();
}

function getPermissionCount(role) {
    return role.permissions ? role.permissions.length : 0;
}
</script>

<template>
    <div class="card">
        <DataTable
            ref="tableRef"
            :value="userManagementStore.roles"
            :loading="userManagementStore.loading"
            :globalFilterFields="['name', 'description']"
            v-model:filters="filterTable"
            stripedRows
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <IconField class="w-full sm:w-80 order-1 sm:order-none">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="filterTable.global.value" placeholder="Search roles..." class="w-full" />
                    </IconField>
                    <div class="flex gap-2">
                        <Button type="button" icon="pi pi-refresh" class="p-button-outlined" @click="refreshRoles" />
                        <PermissionGuard permission="roles.create">
                            <Button 
                                type="button" 
                                icon="pi pi-plus-circle" 
                                label="Add Role" 
                                class="w-full sm:w-auto order-none sm:order-1" 
                                @click="navigateToCreateRolePage" 
                            />
                        </PermissionGuard>
                    </div>
                </div>
            </template>
            
            <Column field="name" header="Role Name" sortable headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <div class="flex items-center">
                        <i class="pi pi-shield mr-2 text-lg"></i>
                        <span class="font-semibold">{{ data.name }}</span>
                    </div>
                </template>
            </Column>
            
            <Column field="description" header="Description" headerClass="whitespace-nowrap" />
            
            <Column field="permissions" header="Permissions" headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <Badge :value="getPermissionCount(data)" severity="info" />
                </template>
            </Column>
            
            <Column field="is_system" header="Type" headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <Tag 
                        :value="data.is_system ? 'System' : 'Custom'" 
                        :severity="getSeverity(data.is_system)" 
                    />
                </template>
            </Column>
            
            <Column field="actions" header="Actions" headerClass="whitespace-nowrap" style="width: 180px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <PermissionGuard permission="roles.edit">
                            <Button 
                                icon="pi pi-pencil" 
                                rounded 
                                outlined 
                                severity="info" 
                                @click="editRole(data)" 
                                :disabled="data.is_system" 
                            />
                        </PermissionGuard>
                        <PermissionGuard permission="roles.delete">
                            <Button 
                                icon="pi pi-trash" 
                                rounded 
                                outlined 
                                severity="danger" 
                                @click="confirmDeleteRole(data)" 
                                :disabled="data.is_system" 
                            />
                        </PermissionGuard>
                    </div>
                </template>
            </Column>
        </DataTable>
        
        <!-- Delete Role Confirmation Dialog -->
        <Dialog v-model:visible="deleteRoleDialog" header="Confirm Delete" :style="{ width: '450px' }" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="selectedRole">Are you sure you want to delete the <b>{{ selectedRole.name }}</b> role?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" outlined @click="deleteRoleDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteRole" />
            </template>
        </Dialog>
    </div>
</template> 