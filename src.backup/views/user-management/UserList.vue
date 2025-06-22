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
const deleteUserDialog = ref(false);
const selectedUser = ref(null);
const filterTable = ref({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS }
});

onMounted(async () => {
    try {
        await userManagementStore.fetchUsers();
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load users',
            life: 3000
        });
    }
});

function formatDate(value) {
    return new Date(value).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function navigateToCreateUserPage() {
    router.push({ name: 'user-create' });
}

function editUser(user) {
    router.push({ name: 'user-edit', params: { id: user.id } });
}

function confirmDeleteUser(user) {
    selectedUser.value = user;
    deleteUserDialog.value = true;
}

async function deleteUser() {
    if (!selectedUser.value) return;
    
    try {
        await userManagementStore.deleteUser(selectedUser.value.id);
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'User deleted successfully',
            life: 3000
        });
        deleteUserDialog.value = false;
        selectedUser.value = null;
    } catch (error) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to delete user',
            life: 3000
        });
    }
}

function getRoleTag(role) {
    const roleColors = {
        admin: 'danger',
        manager: 'warning',
        user: 'info',
        viewer: 'success'
    };
    
    return roleColors[role.toLowerCase()] || 'primary';
}

function onPageChange(event) {
    userManagementStore.setPage(event.page + 1);
    userManagementStore.setLimit(event.rows);
    userManagementStore.fetchUsers();
}

function refreshUsers() {
    userManagementStore.fetchUsers();
}

function getSeverity(status) {
    switch (status) {
        case 'active':
            return 'success';
        case 'inactive':
            return 'warning';
        case 'suspended':
            return 'danger';
        default:
            return 'info';
    }
}
</script>

<template>
    <div class="card">
        <DataTable
            ref="tableRef"
            :value="userManagementStore.users"
            :lazy="true"
            :totalRecords="userManagementStore.totalUsers"
            :loading="userManagementStore.loading"
            paginator
            :rows="userManagementStore.pagination.limit"
            :rowsPerPageOptions="[10, 25, 50]"
            :first="(userManagementStore.pagination.page - 1) * userManagementStore.pagination.limit"
            :globalFilterFields="['name', 'email', 'role']"
            v-model:filters="filterTable"
            @page="onPageChange"
            :pt="{
                root: { class: 'shadow-sm rounded-lg overflow-hidden' },
                header: { class: 'bg-surface-50 dark:bg-surface-800 py-3' },
                thead: { class: 'bg-surface-50 dark:bg-surface-800' },
                headerRow: { class: 'border-b border-surface-200 dark:border-surface-700' },
                headerCell: { class: 'text-surface-700 dark:text-surface-300 font-semibold py-3 px-3' },
                bodyRow: { class: 'border-b border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors duration-200' },
                bodyCell: { class: 'py-3 px-3' },
                pagination: { class: 'bg-surface-50 dark:bg-surface-800 py-3' }
            }"
        >
            <template #header>
                <div class="flex flex-wrap gap-2 items-center justify-between">
                    <IconField class="w-full sm:w-80 order-1 sm:order-none">
                        <InputIcon class="pi pi-search" />
                        <InputText v-model="filterTable.global.value" placeholder="Search users..." class="w-full" />
                    </IconField>
                    <div class="flex gap-2">
                        <Button type="button" icon="pi pi-refresh" class="p-button-outlined" @click="refreshUsers" />
                        <PermissionGuard permission="users.create">
                            <Button 
                                type="button" 
                                icon="pi pi-user-plus" 
                                label="Add User" 
                                class="w-full sm:w-auto order-none sm:order-1" 
                                @click="navigateToCreateUserPage" 
                            />
                        </PermissionGuard>
                    </div>
                </div>
            </template>
            
            <Column field="name" header="Name" sortable headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <div class="flex items-center">
                        <Avatar 
                            :image="data.avatar || ''" 
                            class="mr-2" 
                            size="normal" 
                            shape="circle" 
                            :pt="{ 
                                image: { class: 'w-8 h-8' }
                            }" 
                        >
                            <template #icon>
                                <i class="pi pi-user"></i>
                            </template>
                        </Avatar>
                        <span>{{ data.name }}</span>
                    </div>
                </template>
            </Column>
            
            <Column field="email" header="Email" sortable headerClass="whitespace-nowrap" />
            
            <Column field="roles" header="Roles" headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <div class="flex flex-wrap gap-1">
                        <Tag 
                            v-for="role in data.roles" 
                            :key="role.id || role" 
                            :value="role.name || role" 
                            :severity="getRoleTag(role.name || role)" 
                        />
                    </div>
                </template>
            </Column>
            
            <Column field="status" header="Status" headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    <Tag :value="data.status || 'active'" :severity="getSeverity(data.status || 'active')" />
                </template>
            </Column>
            
            <Column field="created_at" header="Joined" sortable headerClass="whitespace-nowrap">
                <template #body="{ data }">
                    {{ formatDate(data.created_at) }}
                </template>
            </Column>
            
            <Column field="actions" header="Actions" headerClass="whitespace-nowrap" style="width: 180px">
                <template #body="{ data }">
                    <div class="flex gap-2">
                        <PermissionGuard permission="users.edit">
                            <Button icon="pi pi-pencil" rounded outlined severity="info" @click="editUser(data)" />
                        </PermissionGuard>
                        <PermissionGuard permission="users.delete">
                            <Button icon="pi pi-trash" rounded outlined severity="danger" @click="confirmDeleteUser(data)" />
                        </PermissionGuard>
                    </div>
                </template>
            </Column>
        </DataTable>
        
        <!-- Delete User Confirmation Dialog -->
        <Dialog v-model:visible="deleteUserDialog" header="Confirm Delete" :style="{ width: '450px' }" :modal="true">
            <div class="flex align-items-center justify-content-center">
                <i class="pi pi-exclamation-triangle mr-3" style="font-size: 2rem" />
                <span v-if="selectedUser">Are you sure you want to delete <b>{{ selectedUser.name }}</b>?</span>
            </div>
            <template #footer>
                <Button label="No" icon="pi pi-times" outlined @click="deleteUserDialog = false" />
                <Button label="Yes" icon="pi pi-check" severity="danger" @click="deleteUser" />
            </template>
        </Dialog>
    </div>
</template>
