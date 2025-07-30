<template>
    <div class="completion-analysis-panel">
        <!-- Progress Overview -->
        <Card class="mb-4">
            <template #header>
                <div class="flex items-center justify-between p-4">
                    <div class="flex items-center gap-2">
                        <i class="pi pi-chart-pie text-blue-600"></i>
                        <h6 class="text-lg font-semibold mb-0">Progress Overview</h6>
                    </div>
                    <div class="text-2xl font-bold" :class="getOverallCompletionClass(location.completionPercentage)">
                        {{ location.completionPercentage }}%
                    </div>
                </div>
            </template>
            <template #content>
                <!-- Completion Matrix -->
                <div class="completion-matrix mb-4">
                    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div v-for="category in completionCategories" :key="category.name" 
                             class="p-3 border rounded-lg" :class="getCategoryBorderClass(category.completion)">
                            <div class="flex items-center justify-between mb-2">
                                <span class="text-sm font-medium">{{ category.name }}</span>
                                <i :class="category.icon" class="text-lg" :style="{ color: getCategoryColor(category.completion) }"></i>
                            </div>
                            <div class="text-lg font-bold" :class="getCategoryTextClass(category.completion)">
                                {{ category.completion }}%
                            </div>
                            <ProgressBar 
                                :value="category.completion" 
                                :class="getCategoryProgressClass(category.completion)"
                                style="height: 6px" 
                                class="mt-2" />
                            <div class="text-xs text-surface-500 dark:text-surface-400 mt-1">
                                {{ category.completedItems }}/{{ category.totalItems }} items
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Timeline View -->
                <div class="completion-timeline">
                    <h6 class="font-semibold mb-3 flex items-center gap-2">
                        <i class="pi pi-clock"></i>
                        Completion Timeline
                    </h6>
                    <Timeline :value="timelineEvents" class="timeline-custom">
                        <template #marker="slotProps">
                            <span class="flex w-8 h-8 items-center justify-center text-white border-circle z-1 shadow-sm"
                                  :style="{ backgroundColor: slotProps.item.color }">
                                <i :class="slotProps.item.icon"></i>
                            </span>
                        </template>
                        <template #content="slotProps">
                            <Card class="mt-3 ml-3">
                                <template #content>
                                    <div class="flex items-start justify-between">
                                        <div>
                                            <h6 class="font-semibold mb-1">{{ slotProps.item.title }}</h6>
                                            <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                                                {{ slotProps.item.description }}
                                            </p>
                                            <div class="text-xs text-surface-500 dark:text-surface-400">
                                                {{ formatDate(slotProps.item.date) }}
                                            </div>
                                        </div>
                                        <Tag :value="slotProps.item.status" :severity="slotProps.item.severity" />
                                    </div>
                                </template>
                            </Card>
                        </template>
                    </Timeline>
                </div>
            </template>
        </Card>

        <!-- Field Details -->
        <Card>
            <template #header>
                <div class="flex items-center gap-2 p-4">
                    <i class="pi pi-list-check text-green-600"></i>
                    <h6 class="text-lg font-semibold mb-0">Field Details</h6>
                </div>
            </template>
            <template #content>
                <Accordion :multiple="true" :activeIndex="[0]">
                    <AccordionPanel v-for="section in fieldSections" :key="section.name" :value="section.name">
                        <AccordionHeader>
                            <div class="flex items-center justify-between w-full pr-4">
                                <div class="flex items-center gap-3">
                                    <i :class="section.icon" class="text-lg"></i>
                                    <span class="font-medium">{{ section.name }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <ProgressBar 
                                        :value="section.completion" 
                                        style="width: 100px; height: 6px" 
                                        :class="getCategoryProgressClass(section.completion)" />
                                    <span class="text-sm font-bold" :class="getCategoryTextClass(section.completion)">
                                        {{ section.completion }}%
                                    </span>
                                </div>
                            </div>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="space-y-3">
                                <div v-for="field in section.fields" :key="field.name" 
                                     class="flex items-center justify-between p-3 border rounded-lg"
                                     :class="getFieldBorderClass(field.status)">
                                    <div class="flex-1">
                                        <div class="flex items-start justify-between mb-2">
                                            <div>
                                                <h6 class="font-medium mb-1">{{ field.name }}</h6>
                                                <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">
                                                    {{ field.description }}
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <Tag 
                                                    :value="field.status" 
                                                    :severity="getFieldSeverity(field.status)"
                                                    class="text-xs" />
                                                <Button 
                                                    :icon="field.status === 'Complete' ? 'pi pi-check' : 'pi pi-pencil'"
                                                    size="small" 
                                                    :severity="field.status === 'Complete' ? 'success' : 'primary'"
                                                    outlined
                                                    @click="updateFieldStatus(field)" />
                                            </div>
                                        </div>
                                        
                                        <!-- Field Notes -->
                                        <div v-if="field.notes && field.notes.length > 0" class="mt-3">
                                            <h6 class="text-sm font-medium mb-2">Notes:</h6>
                                            <div class="space-y-2">
                                                <div v-for="note in field.notes" :key="note.id" 
                                                     class="p-2 bg-surface-50 dark:bg-surface-800 rounded text-sm">
                                                    <div class="flex items-start justify-between mb-1">
                                                        <span class="font-medium">{{ note.author }}</span>
                                                        <span class="text-xs text-surface-500 dark:text-surface-400">
                                                            {{ formatDate(note.date) }}
                                                        </span>
                                                    </div>
                                                    <p class="text-surface-700 dark:text-surface-300 mb-0">{{ note.content }}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Add Note -->
                                        <div class="mt-3 flex gap-2">
                                            <InputText 
                                                v-model="newNoteText[field.id]" 
                                                placeholder="Add a note..." 
                                                class="flex-1" 
                                                size="small" />
                                            <Button 
                                                label="Add Note" 
                                                icon="pi pi-plus" 
                                                size="small" 
                                                @click="addNote(field)" 
                                                :disabled="!newNoteText[field.id]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </AccordionContent>
                    </AccordionPanel>
                </Accordion>
            </template>
        </Card>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import Card from 'primevue/card';
import ProgressBar from 'primevue/progressbar';
import Timeline from 'primevue/timeline';
import Tag from 'primevue/tag';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';

// Props
const props = defineProps({
    location: {
        type: Object,
        required: true
    },
    completionData: {
        type: Object,
        default: () => ({})
    }
});

// Reactive data
const newNoteText = ref({});

// Computed data from backend - NO MOCK DATA
const completionCategories = computed(() => {
    if (!props.completionData) return [];
    
    // Return completion percentage from backend or show "No data available"
    return [{
        name: 'Overall Completion',
        icon: 'pi pi-check-circle',
        completion: props.completionData.calculated_completion_percentage || 0,
        completedItems: 'N/A',
        totalItems: 'Backend data'
    }];
});

// Timeline from backend notes - NO MOCK DATA
const timelineEvents = computed(() => {
    if (!props.completionData || !props.completionData.notes) return [];
    
    return props.completionData.notes.map(note => ({
        title: note.completion_field?.display_name || 'Field Update',
        description: note.note || 'No description available',
        date: note.created_at,
        icon: 'pi pi-comment',
        color: note.is_resolved ? '#10B981' : '#F59E0B',
        status: note.is_resolved ? 'Resolved' : 'Open',
        severity: note.is_resolved ? 'success' : 'warning'
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
});

// Field sections from backend completion data - NO MOCK DATA
const fieldSections = computed(() => {
    if (!props.completionData) return [];
    
    // If we have notes from backend, group them by field
    if (props.completionData.notes && props.completionData.notes.length > 0) {
        const sections = {};
        
        props.completionData.notes.forEach(note => {
            const fieldName = note.field_name || 'general';
            const sectionName = note.completion_field?.category || 'General';
            
            if (!sections[sectionName]) {
                sections[sectionName] = {
                    name: sectionName,
                    icon: 'pi pi-list-check',
                    completion: 0,
                    fields: []
                };
            }
            
            sections[sectionName].fields.push({
                id: note.id,
                name: note.completion_field?.display_name || fieldName,
                description: note.completion_field?.description || 'Field from backend',
                status: note.is_resolved ? 'Complete' : 'Pending',
                notes: [{
                    id: note.id,
                    author: note.author,
                    date: note.created_at,
                    content: note.note
                }]
            });
        });
        
        return Object.values(sections);
    }
    
    // If no detailed data, show basic completion info
    return [{
        name: 'Completion Status',
        icon: 'pi pi-percentage',
        completion: props.completionData.calculated_completion_percentage || 0,
        fields: [{
            id: 'overall',
            name: 'Overall Progress',
            description: `${props.completionData.calculated_completion_percentage || 0}% complete`,
            status: (props.completionData.calculated_completion_percentage || 0) >= 80 ? 'Complete' : 'Pending',
            notes: []
        }]
    }];
});

// Methods
const getOverallCompletionClass = (percentage) => {
    if (percentage >= 80) return 'text-green-600 dark:text-green-400';
    if (percentage >= 50) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
};

const getCategoryBorderClass = (completion) => {
    if (completion >= 80) return 'border-green-200 dark:border-green-800';
    if (completion >= 50) return 'border-yellow-200 dark:border-yellow-800';
    return 'border-red-200 dark:border-red-800';
};

const getCategoryTextClass = (completion) => {
    if (completion >= 80) return 'text-green-700 dark:text-green-300';
    if (completion >= 50) return 'text-yellow-700 dark:text-yellow-300';
    return 'text-red-700 dark:text-red-300';
};

const getCategoryProgressClass = (completion) => {
    if (completion >= 80) return 'completion-high';
    if (completion >= 50) return 'completion-medium';
    return 'completion-low';
};

const getCategoryColor = (completion) => {
    if (completion >= 80) return '#10B981';
    if (completion >= 50) return '#F59E0B';
    return '#EF4444';
};

const getFieldBorderClass = (status) => {
    switch (status) {
        case 'Complete':
            return 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20';
        case 'In Progress':
            return 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20';
        default:
            return 'border-surface-200 dark:border-surface-700';
    }
};

const getFieldSeverity = (status) => {
    switch (status) {
        case 'Complete':
            return 'success';
        case 'In Progress':
            return 'warning';
        default:
            return 'secondary';
    }
};

const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

const updateFieldStatus = (field) => {
    // Cycle through statuses
    const statuses = ['Pending', 'In Progress', 'Complete'];
    const currentIndex = statuses.indexOf(field.status);
    const nextIndex = (currentIndex + 1) % statuses.length;
    field.status = statuses[nextIndex];
    
    // Update completion percentages
    updateCompletionPercentages();
};

const addNote = (field) => {
    const noteText = newNoteText.value[field.id];
    if (noteText && noteText.trim()) {
        if (!field.notes) field.notes = [];
        
        field.notes.push({
            id: `note_${Date.now()}`,
            author: 'Current User', // Replace with actual user
            date: new Date().toISOString(),
            content: noteText.trim()
        });
        
        newNoteText.value[field.id] = '';
    }
};

const updateCompletionPercentages = () => {
    // Recalculate section and category completions
    fieldSections.value.forEach(section => {
        const totalFields = section.fields.length;
        const completedFields = section.fields.filter(f => f.status === 'Complete').length;
        section.completion = Math.round((completedFields / totalFields) * 100);
    });
};

// Initialize note text refs
watch(() => fieldSections.value, (newSections) => {
    newSections.forEach(section => {
        section.fields.forEach(field => {
            if (!newNoteText.value[field.id]) {
                newNoteText.value[field.id] = '';
            }
        });
    });
}, { immediate: true, deep: true });
</script>

<style scoped>
.completion-analysis-panel {
    height: 100%;
    overflow-y: auto;
}

/* Custom timeline styles */
:deep(.timeline-custom .p-timeline-event-marker) {
    border: 0;
}

:deep(.timeline-custom .p-timeline-event-connector) {
    background-color: var(--p-surface-300);
}

/* Progress bar colors */
:deep(.completion-high .p-progressbar-value) {
    background-color: var(--p-green-500);
}

:deep(.completion-medium .p-progressbar-value) {
    background-color: var(--p-yellow-500);
}

:deep(.completion-low .p-progressbar-value) {
    background-color: var(--p-red-500);
}
</style>