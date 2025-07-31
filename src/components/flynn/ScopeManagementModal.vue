<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)"
        modal 
        header="Final Scope Management" 
        :style="{ width: '90rem', height: '80vh' }"
        :closable="!saving"
        class="scope-management-modal">
        
        <div class="h-full flex flex-col">
            <!-- Header Stats -->
            <div class="grid grid-cols-5 gap-4 mb-6 p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ stats.totalItems }}</div>
                    <div class="text-xs text-surface-500">Total Items</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ stats.completedItems }}</div>
                    <div class="text-xs text-surface-500">Completed</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">{{ stats.remainingItems }}</div>
                    <div class="text-xs text-surface-500">Remaining</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{{ stats.highPriority }}</div>
                    <div class="text-xs text-surface-500">High Priority</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-purple-600">{{ stats.duplicates }}</div>
                    <div class="text-xs text-surface-500">Duplicates</div>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <TabView v-model:activeIndex="activeTab" class="flex-1 flex flex-col">
                <!-- Current Scope Items Tab -->
                <TabPanel header="Current Scope Items" class="flex-1">
                    <div class="h-full flex flex-col">
                        <!-- Filters and Actions -->
                        <div class="flex items-center justify-between mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="flex items-center gap-3">
                                <InputText 
                                    v-model="searchFilter" 
                                    placeholder="Search items..." 
                                    class="w-60" />
                                <Select 
                                    v-model="statusFilter" 
                                    :options="statusFilterOptions" 
                                    option-label="label" 
                                    option-value="value"
                                    placeholder="Filter by status" 
                                    class="w-48" />
                                <Select 
                                    v-model="priorityFilter" 
                                    :options="priorityFilterOptions" 
                                    option-label="label" 
                                    option-value="value"
                                    placeholder="Filter by priority" 
                                    class="w-48" />
                            </div>
                            <div class="flex items-center gap-2">
                                <Button 
                                    label="Auto-Deduplicate" 
                                    icon="pi pi-sync" 
                                    size="small" 
                                    severity="warning"
                                    outlined
                                    @click="autoDeduplicate" 
                                    :disabled="!canDeduplicate" />
                                <Button 
                                    label="Add New Item" 
                                    icon="pi pi-plus" 
                                    size="small" 
                                    @click="showCreateItemModal = true" />
                            </div>
                        </div>

                        <!-- Scope Items DataTable -->
                        <DataTable 
                            :value="filteredScopeItems" 
                            v-model:selection="selectedItems"
                            dataKey="id"
                            selection-mode="multiple"
                            :paginator="true" 
                            :rows="10"
                            scrollable 
                            scroll-height="flex"
                            class="flex-1">
                            
                            <Column selection-mode="multiple" header-style="width: 3rem"></Column>
                            
                            <Column field="source_type" header="Type" style="width: 100px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.source_type" 
                                         :severity="getSourceTypeSeverity(slotProps.data.source_type)" 
                                         size="small" />
                                </template>
                            </Column>
                            
                            <Column field="title" header="Item Title" style="min-width: 250px">
                                <template #body="slotProps">
                                    <div class="font-medium">{{ slotProps.data.title }}</div>
                                    <div class="text-sm text-surface-500 mt-1">{{ slotProps.data.description }}</div>
                                </template>
                            </Column>
                            
                            <Column field="phase" header="Phase" style="width: 150px">
                                <template #body="slotProps">
                                    <div class="text-sm">{{ slotProps.data.phase }}</div>
                                </template>
                            </Column>
                            
                            <Column field="status" header="Status" style="width: 120px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.status.replace('_', ' ')" 
                                         :severity="getStatusSeverity(slotProps.data.status)" 
                                         size="small" />
                                </template>
                            </Column>
                            
                            <Column field="priority" header="Priority" style="width: 100px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.priority" 
                                         :severity="getPrioritySeverity(slotProps.data.priority)" 
                                         size="small" />
                                </template>
                            </Column>
                            
                            <Column field="evidence" header="Evidence" style="width: 200px">
                                <template #body="slotProps">
                                    <div class="text-sm text-surface-600">{{ slotProps.data.evidence || 'No evidence' }}</div>
                                </template>
                            </Column>
                            
                            <Column header="Actions" style="width: 120px">
                                <template #body="slotProps">
                                    <div class="flex gap-1">
                                        <Button 
                                            icon="pi pi-pencil" 
                                            size="small" 
                                            text 
                                            @click="editItem(slotProps.data)" />
                                        <Button 
                                            icon="pi pi-copy" 
                                            size="small" 
                                            text 
                                            severity="info"
                                            @click="duplicateItem(slotProps.data)" />
                                        <Button 
                                            icon="pi pi-trash" 
                                            size="small" 
                                            text 
                                            severity="danger"
                                            @click="deleteItem(slotProps.data)" />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- Add from Project Tasks Tab -->
                <TabPanel header="Add from Project Tasks" class="flex-1">
                    <div class="h-full flex flex-col">
                        <!-- Project Tasks Hierarchy -->
                        <div class="mb-4 p-3 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="flex items-center justify-between">
                                <h4 class="font-semibold flex items-center gap-2">
                                    <i class="pi pi-sitemap"></i>
                                    Wendy's Network Refresh - Available Tasks
                                </h4>
                                <div class="flex items-center gap-2">
                                    <InputText 
                                        v-model="taskSearchFilter" 
                                        placeholder="Search tasks..." 
                                        class="w-60" />
                                    <Button 
                                        label="Expand All" 
                                        icon="pi pi-plus" 
                                        size="small" 
                                        outlined
                                        @click="expandAllTasks" />
                                    <Button 
                                        label="Collapse All" 
                                        icon="pi pi-minus" 
                                        size="small" 
                                        outlined
                                        @click="collapseAllTasks" />
                                </div>
                            </div>
                        </div>

                        <!-- Project Tasks Tree -->
                        <div class="flex-1 border rounded p-4 overflow-auto">
                            <div v-for="phase in filteredProjectPhases" :key="phase.phase_id" class="mb-6">
                                <div class="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900 rounded mb-3">
                                    <Button 
                                        :icon="expandedPhases.has(phase.phase_id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                                        size="small"
                                        text
                                        @click="togglePhase(phase.phase_id)" />
                                    <div class="flex-1">
                                        <div class="font-semibold text-blue-700 dark:text-blue-300">
                                            Phase {{ phase.phase_id }}: {{ phase.phase_name }}
                                        </div>
                                        <div class="text-sm text-surface-500">
                                            {{ phase.parent_tasks?.length || 0 }} parent tasks, 
                                            {{ getTotalSubtasks(phase) }} subtasks
                                        </div>
                                    </div>
                                    <Checkbox 
                                        v-model="selectedPhases" 
                                        :value="phase.phase_id"
                                        @change="onPhaseSelectionChange(phase)" />
                                </div>

                                <div v-if="expandedPhases.has(phase.phase_id)" class="ml-6">
                                    <div v-for="parentTask in phase.parent_tasks" :key="parentTask.id" class="mb-4">
                                        <div class="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900 rounded mb-2">
                                            <Button 
                                                :icon="expandedTasks.has(parentTask.id) ? 'pi pi-chevron-down' : 'pi pi-chevron-right'"
                                                size="small"
                                                text
                                                @click="toggleTask(parentTask.id)" />
                                            <div class="flex-1">
                                                <div class="font-medium text-green-700 dark:text-green-300">
                                                    {{ parentTask.title }}
                                                </div>
                                                <div class="text-sm text-surface-500">
                                                    {{ parentTask.subtasks?.length || 0 }} subtasks
                                                </div>
                                            </div>
                                            <Checkbox 
                                                v-model="selectedTasks" 
                                                :value="parentTask.id"
                                                @change="onTaskSelectionChange(parentTask)" />
                                        </div>

                                        <div v-if="expandedTasks.has(parentTask.id)" class="ml-6">
                                            <div v-for="subtask in parentTask.subtasks" :key="subtask.id" class="mb-2">
                                                <div class="flex items-center gap-3 p-2 bg-surface-100 dark:bg-surface-700 rounded">
                                                    <div class="flex-1">
                                                        <div class="text-sm font-medium">{{ subtask.title }}</div>
                                                        <div class="text-xs text-surface-500 mt-1">{{ subtask.description }}</div>
                                                    </div>
                                                    <Checkbox 
                                                        v-model="selectedSubtasks" 
                                                        :value="subtask.id"
                                                        @change="onSubtaskSelectionChange(subtask)" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Add Selected Tasks Actions -->
                        <div class="mt-4 p-3 bg-surface-50 dark:bg-surface-800 rounded">
                            <div class="flex items-center justify-between">
                                <div class="text-sm text-surface-600">
                                    Selected: {{ selectedPhases.length }} phases, {{ selectedTasks.length }} tasks, {{ selectedSubtasks.length }} subtasks
                                </div>
                                <div class="flex gap-2">
                                    <Button 
                                        label="Clear Selection" 
                                        icon="pi pi-times" 
                                        size="small" 
                                        outlined
                                        @click="clearTaskSelection" />
                                    <Button 
                                        label="Add Selected to Scope" 
                                        icon="pi pi-plus" 
                                        size="small" 
                                        :disabled="!hasTaskSelection"
                                        @click="addSelectedTasksToScope" />
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Preview Final Scope Tab -->
                <TabPanel header="Preview Final Scope" class="flex-1">
                    <div class="h-full flex flex-col">
                        <!-- Final Scope Preview -->
                        <div class="mb-4 p-4 bg-surface-50 dark:bg-surface-800 rounded">
                            <h4 class="font-semibold mb-3 flex items-center gap-2">
                                <i class="pi pi-eye"></i>
                                Final Scope Document Preview
                            </h4>
                            <div class="grid grid-cols-4 gap-4 text-center">
                                <div class="p-3 bg-white dark:bg-surface-700 rounded">
                                    <div class="text-lg font-bold text-red-600">{{ finalScopeStats.notCompleted }}</div>
                                    <div class="text-xs text-surface-500">Not Completed</div>
                                </div>
                                <div class="p-3 bg-white dark:bg-surface-700 rounded">
                                    <div class="text-lg font-bold text-orange-600">{{ finalScopeStats.needsCorrection }}</div>
                                    <div class="text-xs text-surface-500">Needs Correction</div>
                                </div>
                                <div class="p-3 bg-white dark:bg-surface-700 rounded">
                                    <div class="text-lg font-bold text-blue-600">{{ finalScopeStats.newItems }}</div>
                                    <div class="text-xs text-surface-500">New Items</div>
                                </div>
                                <div class="p-3 bg-white dark:bg-surface-700 rounded">
                                    <div class="text-lg font-bold text-purple-600">{{ finalScopeStats.clientConcerns }}</div>
                                    <div class="text-xs text-surface-500">Client Concerns</div>
                                </div>
                            </div>
                        </div>

                        <!-- Categorized Final Scope -->
                        <div class="flex-1 overflow-auto">
                            <Accordion multiple>
                                <!-- Not Completed Items -->
                                <AccordionPanel v-if="finalScope.notCompleted.length > 0">
                                    <AccordionHeader>
                                        <span class="flex items-center gap-2">
                                            <i class="pi pi-times-circle text-red-600"></i>
                                            Not Completed Items ({{ finalScope.notCompleted.length }})
                                        </span>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <div class="space-y-3">
                                            <div v-for="item in finalScope.notCompleted" :key="item.id" 
                                                 class="p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded">
                                                <div class="font-medium">{{ item.title }}</div>
                                                <div class="text-sm text-surface-600 mt-1">{{ item.description }}</div>
                                                <div class="flex items-center gap-2 mt-2">
                                                    <Tag :value="item.phase" severity="info" size="small" />
                                                    <Tag :value="item.priority" :severity="getPrioritySeverity(item.priority)" size="small" />
                                                    <Tag value="NOT COMPLETED" severity="danger" size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>

                                <!-- Needs Correction Items -->
                                <AccordionPanel v-if="finalScope.needsCorrection.length > 0">
                                    <AccordionHeader>
                                        <span class="flex items-center gap-2">
                                            <i class="pi pi-exclamation-triangle text-orange-600"></i>
                                            Needs Correction Items ({{ finalScope.needsCorrection.length }})
                                        </span>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <div class="space-y-3">
                                            <div v-for="item in finalScope.needsCorrection" :key="item.id" 
                                                 class="p-3 bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-700 rounded">
                                                <div class="font-medium">{{ item.title }}</div>
                                                <div class="text-sm text-surface-600 mt-1">{{ item.description }}</div>
                                                <div class="flex items-center gap-2 mt-2">
                                                    <Tag :value="item.phase" severity="info" size="small" />
                                                    <Tag :value="item.priority" :severity="getPrioritySeverity(item.priority)" size="small" />
                                                    <Tag value="NEEDS CORRECTION" severity="warning" size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>

                                <!-- New Scope Items -->
                                <AccordionPanel v-if="finalScope.newItems.length > 0">
                                    <AccordionHeader>
                                        <span class="flex items-center gap-2">
                                            <i class="pi pi-plus-circle text-blue-600"></i>
                                            New Scope Items ({{ finalScope.newItems.length }})
                                        </span>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <div class="space-y-3">
                                            <div v-for="item in finalScope.newItems" :key="item.id" 
                                                 class="p-3 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded">
                                                <div class="font-medium">{{ item.title }}</div>
                                                <div class="text-sm text-surface-600 mt-1">{{ item.description }}</div>
                                                <div class="flex items-center gap-2 mt-2">
                                                    <Tag :value="item.source || 'Manual'" severity="info" size="small" />
                                                    <Tag :value="item.priority" :severity="getPrioritySeverity(item.priority)" size="small" />
                                                    <Tag value="NEW ITEM" severity="info" size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>

                                <!-- Client Concerns -->
                                <AccordionPanel v-if="finalScope.clientConcerns.length > 0">
                                    <AccordionHeader>
                                        <span class="flex items-center gap-2">
                                            <i class="pi pi-user-edit text-purple-600"></i>
                                            Client Concerns ({{ finalScope.clientConcerns.length }})
                                        </span>
                                    </AccordionHeader>
                                    <AccordionContent>
                                        <div class="space-y-3">
                                            <div v-for="item in finalScope.clientConcerns" :key="item.id" 
                                                 class="p-3 bg-purple-50 dark:bg-purple-900 border border-purple-200 dark:border-purple-700 rounded">
                                                <div class="font-medium">{{ item.title }}</div>
                                                <div class="text-sm text-surface-600 mt-1">{{ item.description }}</div>
                                                <div class="flex items-center gap-2 mt-2">
                                                    <Tag value="Client Feedback" severity="info" size="small" />
                                                    <Tag :value="item.priority" :severity="getPrioritySeverity(item.priority)" size="small" />
                                                    <Tag value="CLIENT CONCERN" severity="secondary" size="small" />
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionPanel>
                            </Accordion>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>

        <!-- Footer Actions -->
        <template #footer>
            <div class="flex justify-between items-center">
                <div class="text-sm text-surface-500">
                    {{ finalScopeStats.total }} total remaining scope items ready for document generation
                </div>
                <div class="flex gap-2">
                    <Button 
                        label="Reset to Original" 
                        icon="pi pi-refresh" 
                        outlined
                        @click="resetToOriginal" 
                        :disabled="saving" />
                    <Button 
                        label="Cancel" 
                        @click="$emit('update:visible', false)" 
                        outlined
                        :disabled="saving" />
                    <Button 
                        label="Save & Generate Document" 
                        icon="pi pi-save" 
                        @click="saveAndGenerate" 
                        :loading="saving" />
                </div>
            </div>
        </template>

        <!-- Edit Item Modal -->
        <Dialog 
            v-model:visible="showEditItemModal" 
            modal 
            header="Edit Scope Item" 
            :style="{ width: '45rem' }">
            <div v-if="editingItem" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Item Title</label>
                    <InputText v-model="editingItem.title" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Description</label>
                    <Textarea v-model="editingItem.description" rows="3" class="w-full" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Priority</label>
                        <Select v-model="editingItem.priority" :options="priorityOptions" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Status</label>
                        <Select v-model="editingItem.status" :options="statusOptions" class="w-full" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Evidence/Notes</label>
                    <Textarea v-model="editingItem.evidence" rows="2" class="w-full" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showEditItemModal = false" outlined />
                    <Button label="Save Changes" @click="saveEditedItem" />
                </div>
            </template>
        </Dialog>

        <!-- Create New Item Modal -->
        <Dialog 
            v-model:visible="showCreateItemModal" 
            modal 
            header="Create New Scope Item" 
            :style="{ width: '45rem' }">
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Item Title</label>
                    <InputText v-model="newItem.title" class="w-full" />
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Description</label>
                    <Textarea v-model="newItem.description" rows="3" class="w-full" />
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Priority</label>
                        <Select v-model="newItem.priority" :options="priorityOptions" class="w-full" />
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Phase</label>
                        <Select v-model="newItem.phase" :options="phaseOptions" class="w-full" />
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium mb-2">Evidence/Notes</label>
                    <Textarea v-model="newItem.evidence" rows="2" class="w-full" />
                </div>
            </div>
            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button label="Cancel" @click="showCreateItemModal = false" outlined />
                    <Button label="Create Item" @click="createNewItem" />
                </div>
            </template>
        </Dialog>
    </Dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useFlynnStore } from '@/stores/flynnStore';

// Props & Emits
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['update:visible', 'scope-updated']);

// Store
const flynnStore = useFlynnStore();

// State
const activeTab = ref(0);
const saving = ref(false);
const searchFilter = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const taskSearchFilter = ref('');
const selectedItems = ref([]);

// Project Task Selection
const expandedPhases = ref(new Set());
const expandedTasks = ref(new Set());
const selectedPhases = ref([]);
const selectedTasks = ref([]);
const selectedSubtasks = ref([]);

// Modals
const showEditItemModal = ref(false);
const showCreateItemModal = ref(false);
const editingItem = ref(null);
const newItem = ref({
    title: '',
    description: '',
    priority: 'medium',
    phase: '',
    evidence: '',
    source_type: 'manual'
});

// Scope Items (consolidated from all analysis passes)
const scopeItems = ref([]);

// Options
const statusFilterOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Not Completed', value: 'NOT_COMPLETED' },
    { label: 'Needs Correction', value: 'NEEDS_CORRECTION' },
    { label: 'New Item', value: 'NEW_ITEM' },
    { label: 'Client Concern', value: 'CLIENT_CONCERN' }
];

const priorityFilterOptions = [
    { label: 'All Priorities', value: '' },
    { label: 'High', value: 'high' },
    { label: 'Medium', value: 'medium' },
    { label: 'Low', value: 'low' }
];

const priorityOptions = ['high', 'medium', 'low'];
const statusOptions = ['NOT_COMPLETED', 'NEEDS_CORRECTION', 'NEW_ITEM', 'CLIENT_CONCERN'];

const phaseOptions = computed(() => {
    return flynnStore.projectPhases?.map(phase => ({
        label: `${phase.phase_id}: ${phase.phase_name}`,
        value: phase.phase_id
    })) || [];
});

// Initialize scope items from analysis results
const initializeScopeItems = () => {
    const items = [];
    let idCounter = 1;

    // Add Pass 1 remaining scope items
    if (flynnStore.currentAnalysisResults.pass1?.remaining_scope) {
        flynnStore.currentAnalysisResults.pass1.remaining_scope.forEach(item => {
            items.push({
                id: `pass1-${idCounter++}`,
                title: item.item_name,
                description: item.reason_incomplete,
                priority: item.priority_level || 'medium',
                status: 'NOT_COMPLETED',
                phase: 'General',
                evidence: '',
                source_type: 'high_level',
                original_data: item
            });
        });
    }

    // Add Pass 2 incomplete tasks
    if (flynnStore.currentAnalysisResults.pass2?.task_analysis) {
        flynnStore.currentAnalysisResults.pass2.task_analysis
            .filter(task => task.status !== 'COMPLETED')
            .forEach(task => {
                items.push({
                    id: `pass2-${idCounter++}`,
                    title: task.task_name,
                    description: task.correction_details || 'Task requires completion',
                    priority: 'medium', // Default priority
                    status: task.status,
                    phase: task.phase_name,
                    evidence: task.evidence_source || '',
                    source_type: 'task_analysis',
                    original_data: task
                });
            });
    }

    // Add Pass 3 new scope items
    if (flynnStore.currentAnalysisResults.pass3?.new_scope) {
        flynnStore.currentAnalysisResults.pass3.new_scope.forEach(item => {
            items.push({
                id: `pass3-new-${idCounter++}`,
                title: item.item_description,
                description: item.source || 'New scope item discovered',
                priority: item.priority || 'medium',
                status: 'NEW_ITEM',
                phase: 'General',
                evidence: item.source || '',
                source_type: 'new_scope',
                original_data: item
            });
        });
    }

    // Add Pass 3 client concerns
    if (flynnStore.currentAnalysisResults.pass3?.client_concerns) {
        flynnStore.currentAnalysisResults.pass3.client_concerns.forEach(concern => {
            items.push({
                id: `pass3-concern-${idCounter++}`,
                title: concern.concern_description,
                description: concern.recommended_action || 'Client concern requiring attention',
                priority: 'high', // Client concerns are typically high priority
                status: 'CLIENT_CONCERN',
                phase: 'General',
                evidence: 'Client feedback',
                source_type: 'client_concern',
                original_data: concern
            });
        });
    }

    scopeItems.value = items;
};

// Computed Properties
const filteredScopeItems = computed(() => {
    let filtered = scopeItems.value;

    if (searchFilter.value) {
        const search = searchFilter.value.toLowerCase();
        filtered = filtered.filter(item => 
            item.title.toLowerCase().includes(search) ||
            item.description.toLowerCase().includes(search)
        );
    }

    if (statusFilter.value) {
        filtered = filtered.filter(item => item.status === statusFilter.value);
    }

    if (priorityFilter.value) {
        filtered = filtered.filter(item => item.priority === priorityFilter.value);
    }

    return filtered;
});

const filteredProjectPhases = computed(() => {
    if (!taskSearchFilter.value) return flynnStore.projectPhases || [];
    
    const search = taskSearchFilter.value.toLowerCase();
    return (flynnStore.projectPhases || []).filter(phase => 
        phase.phase_name.toLowerCase().includes(search) ||
        phase.parent_tasks?.some(task => 
            task.title.toLowerCase().includes(search) ||
            task.subtasks?.some(subtask => 
                subtask.title.toLowerCase().includes(search)
            )
        )
    );
});

const stats = computed(() => {
    const items = scopeItems.value;
    const duplicates = detectDuplicates();
    return {
        totalItems: items.length,
        completedItems: 0, // All items in this modal are remaining scope
        remainingItems: items.length,
        highPriority: items.filter(item => item.priority === 'high').length,
        duplicates: duplicates.length
    };
});

const detectDuplicates = () => {
    const duplicatePairs = [];
    
    for (let i = 0; i < scopeItems.value.length; i++) {
        for (let j = i + 1; j < scopeItems.value.length; j++) {
            const item1 = scopeItems.value[i];
            const item2 = scopeItems.value[j];
            
            const titleSimilarity = calculateStringSimilarity(
                item1.title.toLowerCase(), 
                item2.title.toLowerCase()
            );
            
            if (titleSimilarity > 0.8) {
                duplicatePairs.push({ item1, item2, similarity: titleSimilarity });
            }
        }
    }
    
    return duplicatePairs;
};

const finalScope = computed(() => {
    return {
        notCompleted: scopeItems.value.filter(item => item.status === 'NOT_COMPLETED'),
        needsCorrection: scopeItems.value.filter(item => item.status === 'NEEDS_CORRECTION'),
        newItems: scopeItems.value.filter(item => item.status === 'NEW_ITEM'),
        clientConcerns: scopeItems.value.filter(item => item.status === 'CLIENT_CONCERN')
    };
});

const finalScopeStats = computed(() => {
    const scope = finalScope.value;
    return {
        notCompleted: scope.notCompleted.length,
        needsCorrection: scope.needsCorrection.length,
        newItems: scope.newItems.length,
        clientConcerns: scope.clientConcerns.length,
        total: scope.notCompleted.length + scope.needsCorrection.length + scope.newItems.length + scope.clientConcerns.length
    };
});

const hasTaskSelection = computed(() => {
    return selectedPhases.value.length > 0 || selectedTasks.value.length > 0 || selectedSubtasks.value.length > 0;
});

const canDeduplicate = computed(() => {
    return scopeItems.value.length > 1;
});

// Methods
const getSourceTypeSeverity = (type) => {
    const severityMap = {
        'high_level': 'info',
        'task_analysis': 'warning',
        'new_scope': 'success',
        'client_concern': 'danger',
        'manual': 'secondary'
    };
    return severityMap[type] || 'secondary';
};

const getStatusSeverity = (status) => {
    const severityMap = {
        'NOT_COMPLETED': 'danger',
        'NEEDS_CORRECTION': 'warning',
        'NEW_ITEM': 'success',
        'CLIENT_CONCERN': 'info'
    };
    return severityMap[status] || 'secondary';
};

const getPrioritySeverity = (priority) => {
    const severityMap = {
        'high': 'danger',
        'medium': 'warning',
        'low': 'info'
    };
    return severityMap[priority] || 'secondary';
};

const getTotalSubtasks = (phase) => {
    return phase.parent_tasks?.reduce((total, task) => total + (task.subtasks?.length || 0), 0) || 0;
};

// Project Task Management
const togglePhase = (phaseId) => {
    if (expandedPhases.value.has(phaseId)) {
        expandedPhases.value.delete(phaseId);
    } else {
        expandedPhases.value.add(phaseId);
    }
};

const toggleTask = (taskId) => {
    if (expandedTasks.value.has(taskId)) {
        expandedTasks.value.delete(taskId);
    } else {
        expandedTasks.value.add(taskId);
    }
};

const expandAllTasks = () => {
    flynnStore.projectPhases?.forEach(phase => {
        expandedPhases.value.add(phase.phase_id);
        phase.parent_tasks?.forEach(task => {
            expandedTasks.value.add(task.id);
        });
    });
};

const collapseAllTasks = () => {
    expandedPhases.value.clear();
    expandedTasks.value.clear();
};

const onPhaseSelectionChange = (phase) => {
    // Auto-select/deselect all tasks in this phase
    if (selectedPhases.value.includes(phase.phase_id)) {
        phase.parent_tasks?.forEach(task => {
            if (!selectedTasks.value.includes(task.id)) {
                selectedTasks.value.push(task.id);
            }
        });
    } else {
        phase.parent_tasks?.forEach(task => {
            const index = selectedTasks.value.indexOf(task.id);
            if (index > -1) {
                selectedTasks.value.splice(index, 1);
            }
        });
    }
};

const onTaskSelectionChange = (task) => {
    // Auto-select/deselect all subtasks in this task
    if (selectedTasks.value.includes(task.id)) {
        task.subtasks?.forEach(subtask => {
            if (!selectedSubtasks.value.includes(subtask.id)) {
                selectedSubtasks.value.push(subtask.id);
            }
        });
    } else {
        task.subtasks?.forEach(subtask => {
            const index = selectedSubtasks.value.indexOf(subtask.id);
            if (index > -1) {
                selectedSubtasks.value.splice(index, 1);
            }
        });
    }
};

const onSubtaskSelectionChange = (subtask) => {
    // Individual subtask selection - no auto-selection needed
};

const clearTaskSelection = () => {
    selectedPhases.value = [];
    selectedTasks.value = [];
    selectedSubtasks.value = [];
};

const addSelectedTasksToScope = () => {
    let idCounter = scopeItems.value.length + 1;
    const newItems = [];

    // Add selected phases (as high-level items)
    selectedPhases.value.forEach(phaseId => {
        const phase = flynnStore.projectPhases.find(p => p.phase_id === phaseId);
        if (phase) {
            newItems.push({
                id: `added-phase-${idCounter++}`,
                title: `Complete ${phase.phase_name}`,
                description: `Ensure all tasks in ${phase.phase_name} are completed`,
                priority: 'medium',
                status: 'NOT_COMPLETED',
                phase: phase.phase_id,
                evidence: 'Added from project tasks',
                source_type: 'manual',
                original_data: phase
            });
        }
    });

    // Add selected tasks
    selectedTasks.value.forEach(taskId => {
        const task = findTaskById(taskId);
        if (task) {
            newItems.push({
                id: `added-task-${idCounter++}`,
                title: task.title,
                description: task.description || 'Task from project scope',
                priority: 'medium',
                status: 'NOT_COMPLETED',
                phase: findPhaseForTask(taskId)?.phase_id || 'General',
                evidence: 'Added from project tasks',
                source_type: 'manual',
                original_data: task
            });
        }
    });

    // Add selected subtasks
    selectedSubtasks.value.forEach(subtaskId => {
        const subtask = findSubtaskById(subtaskId);
        if (subtask) {
            newItems.push({
                id: `added-subtask-${idCounter++}`,
                title: subtask.title,
                description: subtask.description || 'Subtask from project scope',
                priority: 'medium',
                status: 'NOT_COMPLETED',
                phase: findPhaseForSubtask(subtaskId)?.phase_id || 'General',
                evidence: 'Added from project tasks',
                source_type: 'manual',
                original_data: subtask
            });
        }
    });

    scopeItems.value.push(...newItems);
    clearTaskSelection();
    activeTab.value = 0; // Switch back to Current Scope Items tab
};

// Helper functions for finding tasks/subtasks
const findTaskById = (taskId) => {
    for (const phase of flynnStore.projectPhases || []) {
        const task = phase.parent_tasks?.find(t => t.id === taskId);
        if (task) return task;
    }
    return null;
};

const findSubtaskById = (subtaskId) => {
    for (const phase of flynnStore.projectPhases || []) {
        for (const task of phase.parent_tasks || []) {
            const subtask = task.subtasks?.find(st => st.id === subtaskId);
            if (subtask) return subtask;
        }
    }
    return null;
};

const findPhaseForTask = (taskId) => {
    for (const phase of flynnStore.projectPhases || []) {
        if (phase.parent_tasks?.some(t => t.id === taskId)) {
            return phase;
        }
    }
    return null;
};

const findPhaseForSubtask = (subtaskId) => {
    for (const phase of flynnStore.projectPhases || []) {
        for (const task of phase.parent_tasks || []) {
            if (task.subtasks?.some(st => st.id === subtaskId)) {
                return phase;
            }
        }
    }
    return null;
};

// Item Management
const editItem = (item) => {
    editingItem.value = { ...item };
    showEditItemModal.value = true;
};

const saveEditedItem = () => {
    const index = scopeItems.value.findIndex(item => item.id === editingItem.value.id);
    if (index > -1) {
        scopeItems.value[index] = { ...editingItem.value };
    }
    showEditItemModal.value = false;
    editingItem.value = null;
};

const duplicateItem = (item) => {
    const newItem = {
        ...item,
        id: `duplicate-${Date.now()}`,
        title: `${item.title} (Copy)`,
        source_type: 'manual'
    };
    scopeItems.value.push(newItem);
};

const deleteItem = (item) => {
    const index = scopeItems.value.findIndex(i => i.id === item.id);
    if (index > -1) {
        scopeItems.value.splice(index, 1);
    }
};

const createNewItem = () => {
    const item = {
        ...newItem.value,
        id: `manual-${Date.now()}`,
        status: 'NOT_COMPLETED'
    };
    scopeItems.value.push(item);
    
    // Reset form
    newItem.value = {
        title: '',
        description: '',
        priority: 'medium',
        phase: '',
        evidence: '',
        source_type: 'manual'
    };
    
    showCreateItemModal.value = false;
};

const autoDeduplicate = () => {
    const deduplicated = [];
    const duplicates = [];
    
    // Smart deduplication algorithm
    scopeItems.value.forEach((item, index) => {
        let isDuplicate = false;
        
        // Check against already processed items
        for (let i = 0; i < deduplicated.length; i++) {
            const existing = deduplicated[i];
            
            // Calculate similarity score
            const titleSimilarity = calculateStringSimilarity(item.title.toLowerCase(), existing.title.toLowerCase());
            const descriptionSimilarity = calculateStringSimilarity(
                item.description.toLowerCase(), 
                existing.description.toLowerCase()
            );
            
            // Consider items duplicates if:
            // 1. Title similarity > 80% OR
            // 2. Both title and description similarity > 70%
            if (titleSimilarity > 0.8 || (titleSimilarity > 0.7 && descriptionSimilarity > 0.7)) {
                isDuplicate = true;
                
                // Keep the item with more information (longer description + evidence)
                const itemScore = (item.description.length + (item.evidence?.length || 0));
                const existingScore = (existing.description.length + (existing.evidence?.length || 0));
                
                if (itemScore > existingScore) {
                    // Replace existing with current item
                    const existingIndex = deduplicated.findIndex(d => d.id === existing.id);
                    duplicates.push(existing);
                    deduplicated[existingIndex] = item;
                } else {
                    // Keep existing, mark current as duplicate
                    duplicates.push(item);
                }
                break;
            }
        }
        
        if (!isDuplicate) {
            deduplicated.push(item);
        }
    });
    
    // Update scope items with deduplicated list
    scopeItems.value = deduplicated;
    
    // Show summary
    if (duplicates.length > 0) {
        alert(`Removed ${duplicates.length} duplicate items. Kept ${deduplicated.length} unique items.`);
    } else {
        alert('No duplicates found.');
    }
};

// String similarity function using Levenshtein distance
const calculateStringSimilarity = (str1, str2) => {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
        for (let j = 1; j <= str1.length; j++) {
            if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    
    return matrix[str2.length][str1.length];
};

const resetToOriginal = () => {
    if (confirm('Are you sure you want to reset all changes and return to the original analysis results?')) {
        initializeScopeItems();
    }
};

const saveAndGenerate = async () => {
    saving.value = true;
    try {
        // TODO: Save the finalized scope to backend
        // TODO: Trigger installation document generation with finalized scope
        console.log('Saving finalized scope:', scopeItems.value);
        emit('scope-updated', scopeItems.value);
        emit('update:visible', false);
    } catch (error) {
        console.error('Failed to save scope:', error);
    } finally {
        saving.value = false;
    }
};

// Lifecycle
onMounted(() => {
    initializeScopeItems();
});

// Watch for changes in analysis results
watch(() => flynnStore.currentAnalysisResults, () => {
    if (props.visible) {
        initializeScopeItems();
    }
}, { deep: true });
</script>

<style scoped>
.scope-management-modal :deep(.p-dialog-content) {
    padding: 1rem;
    overflow: hidden;
}

.scope-management-modal :deep(.p-tabview-panels) {
    padding: 0;
    flex: 1;
    display: flex;
    flex-direction: column;
}

.scope-management-modal :deep(.p-tabview-panel) {
    padding: 1rem;
    flex: 1;
    display: flex;
    flex-direction: column;
}
</style>