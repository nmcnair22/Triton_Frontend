<template>
    <div class="network-data-panel">
        <!-- Infrastructure Summary -->
        <Card class="mb-4">
            <template #header>
                <div class="flex items-center gap-2 p-4">
                    <i class="pi pi-wifi text-blue-600"></i>
                    <h6 class="text-lg font-semibold mb-0">Infrastructure Summary</h6>
                </div>
            </template>
            <template #content>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="p-4 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-server text-blue-600 text-2xl"></i>
                            <div>
                                <h6 class="font-bold text-blue-700 dark:text-blue-300 mb-1">Network Equipment</h6>
                                <p class="text-sm text-blue-600 dark:text-blue-400">{{ networkSummary.equipment.installed }}/{{ networkSummary.equipment.total }} Installed</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 border rounded-lg bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-link text-green-600 text-2xl"></i>
                            <div>
                                <h6 class="font-bold text-green-700 dark:text-green-300 mb-1">Connectivity</h6>
                                <p class="text-sm text-green-600 dark:text-green-400">{{ networkSummary.connectivity.status }}</p>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 border rounded-lg bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                        <div class="flex items-center gap-3">
                            <i class="pi pi-check-circle text-purple-600 text-2xl"></i>
                            <div>
                                <h6 class="font-bold text-purple-700 dark:text-purple-300 mb-1">Testing Status</h6>
                                <p class="text-sm text-purple-600 dark:text-purple-400">{{ networkSummary.testing.completed }}% Complete</p>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </Card>

        <!-- Technical Details -->
        <Card>
            <template #header>
                <div class="flex items-center gap-2 p-4">
                    <i class="pi pi-cog text-green-600"></i>
                    <h6 class="text-lg font-semibold mb-0">Technical Details</h6>
                </div>
            </template>
            <template #content>
                <Accordion :multiple="true" :activeIndex="[0]">
                    <AccordionPanel v-for="section in technicalSections" :key="section.name" :value="section.name">
                        <AccordionHeader>
                            <div class="flex items-center gap-3">
                                <i :class="section.icon" class="text-lg"></i>
                                <span class="font-medium">{{ section.name }}</span>
                                <Tag :value="section.status" :severity="getStatusSeverity(section.status)" />
                            </div>
                        </AccordionHeader>
                        <AccordionContent>
                            <div class="space-y-4">
                                <div v-for="item in section.items" :key="item.name" 
                                     class="flex items-center justify-between p-3 border rounded-lg">
                                    <div class="flex-1">
                                        <h6 class="font-medium mb-1">{{ item.name }}</h6>
                                        <p class="text-sm text-surface-600 dark:text-surface-400">{{ item.description }}</p>
                                        <div v-if="item.specifications" class="mt-2">
                                            <div v-for="spec in item.specifications" :key="spec.name" 
                                                 class="text-xs text-surface-500 dark:text-surface-400">
                                                <strong>{{ spec.name }}:</strong> {{ spec.value }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <Tag :value="item.status" :severity="getStatusSeverity(item.status)" />
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
import { ref, computed } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Accordion from 'primevue/accordion';
import AccordionPanel from 'primevue/accordionpanel';
import AccordionHeader from 'primevue/accordionheader';
import AccordionContent from 'primevue/accordioncontent';

// Props
const props = defineProps({
    location: {
        type: Object,
        required: true
    },
    networkData: {
        type: Object,
        default: () => ({})
    }
});

// Network summary from backend - NO MOCK DATA
const networkSummary = computed(() => {
    if (!props.networkData) return {
        equipment: { installed: 'N/A', total: 'N/A' },
        connectivity: { status: 'No data' },
        testing: { completed: 0 }
    };
    
    return {
        equipment: {
            installed: props.networkData.number_of_drops || 'N/A',
            total: 'Backend data'
        },
        connectivity: {
            status: props.networkData.stores_on_new_network_status || 'Unknown'
        },
        testing: {
            completed: props.networkData.completion_percentage || 0
        }
    };
});

// Technical sections from backend smart sheet data - NO MOCK DATA
const technicalSections = computed(() => {
    if (!props.networkData) return [];
    
    const sections = [];
    
    // Network Status Section
    if (props.networkData.stores_on_new_network_status) {
        sections.push({
            name: 'Network Status',
            icon: 'pi pi-wifi',
            status: props.networkData.stores_on_new_network_status,
            items: [
                {
                    name: 'Network Status',
                    description: 'Current network operational status',
                    status: props.networkData.stores_on_new_network_status,
                    specifications: [
                        { name: 'Status', value: props.networkData.stores_on_new_network_status },
                        { name: 'Drops', value: props.networkData.number_of_drops || 'N/A' }
                    ]
                }
            ]
        });
    }
    
    // Installation Section
    if (props.networkData.re_cabling_start || props.networkData.re_cabling_complete) {
        sections.push({
            name: 'Installation Timeline',
            icon: 'pi pi-clock',
            status: props.networkData.re_cabling_complete ? 'Complete' : 'In Progress',
            items: [
                {
                    name: 'Re-cabling Project',
                    description: 'Network refresh installation timeline',
                    status: props.networkData.re_cabling_complete ? 'Complete' : 'In Progress',
                    specifications: [
                        { name: 'Start Date', value: props.networkData.re_cabling_start || 'N/A' },
                        { name: 'Complete Date', value: props.networkData.re_cabling_complete || 'In Progress' }
                    ]
                }
            ]
        });
    }
    
    // If no specific data, show basic info
    if (sections.length === 0) {
        sections.push({
            name: 'Network Information',
            icon: 'pi pi-info-circle',
            status: 'Available',
            items: [
                {
                    name: 'Smart Sheet Data',
                    description: 'Network data from backend',
                    status: 'Available',
                    specifications: [
                        { name: 'Location', value: props.networkData.location_name || 'N/A' },
                        { name: 'Franchise #', value: props.networkData.franchise_number || 'N/A' }
                    ]
                }
            ]
        });
    }
    
    return sections;
});

// Methods
const getStatusSeverity = (status) => {
    switch (status) {
        case 'Complete':
            return 'success';
        case 'In Progress':
            return 'warning';
        case 'Pending':
            return 'secondary';
        default:
            return 'secondary';
    }
};
</script>

<style scoped>
.network-data-panel {
    height: 100%;
    overflow-y: auto;
}
</style>