<template>
    <Drawer 
        v-model:visible="visible" 
        position="right" 
        :style="{ width: '90vw' }"
        class="flynn-addendum-drawer">
        
        <template #header>
            <div class="flex items-center justify-between w-full">
                <div class="flex items-center gap-3">
                    <i class="pi pi-sitemap text-2xl text-blue-600"></i>
                    <div>
                        <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">Flynn Addendum</h2>
                        <p class="text-sm text-surface-500">Patch Panel Matrix & Color Coding Management</p>
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <Button 
                        label="Validate Standards" 
                        icon="pi pi-check-circle" 
                        size="small" 
                        outlined
                        @click="validateStandards" 
                        :loading="validating" />
                    <Button 
                        label="Save Changes" 
                        icon="pi pi-save" 
                        size="small" 
                        @click="saveChanges" 
                        :loading="saving"
                        :disabled="!hasChanges" />
                </div>
            </div>
        </template>

        <div v-if="loading" class="flex items-center justify-center h-64">
            <ProgressSpinner />
            <span class="ml-3">Loading patch panel data...</span>
        </div>

        <div v-else class="space-y-6">
            <!-- Summary Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-50 dark:bg-surface-800 rounded">
                <div class="text-center">
                    <div class="text-2xl font-bold text-blue-600">{{ stats.totalPorts }}</div>
                    <div class="text-xs text-surface-500">Total Ports</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-green-600">{{ stats.activePorts }}</div>
                    <div class="text-xs text-surface-500">Active Ports</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-orange-600">{{ stats.unassignedPorts }}</div>
                    <div class="text-xs text-surface-500">Unassigned</div>
                </div>
                <div class="text-center">
                    <div class="text-2xl font-bold text-red-600">{{ stats.violations }}</div>
                    <div class="text-xs text-surface-500">Color Violations</div>
                </div>
            </div>

            <!-- Tabs for Different Sections -->
            <TabView v-model:activeIndex="activeTab">
                <!-- Patch Panel Matrix Tab -->
                <TabPanel header="Patch Panel Matrix">
                    <div class="space-y-6">
                        <!-- Panel Selector -->
                        <div class="flex items-center gap-3 mb-4">
                            <label class="font-medium">View Panel:</label>
                            <SelectButton 
                                v-model="selectedPanel" 
                                :options="panelOptions" 
                                option-label="label" 
                                option-value="value" />
                        </div>

                        <!-- Patch Panel Grid -->
                        <div v-for="panel in filteredPanels" :key="panel.name" class="mb-8">
                            <div class="flex items-center gap-3 mb-4">
                                <h3 class="text-lg font-semibold">{{ panel.name }}</h3>
                                <Tag :value="`${panel.ports.length} ports`" severity="info" size="small" />
                                <Tag :value="`${getActivePorts(panel).length} active`" severity="success" size="small" />
                            </div>

                            <!-- Ports Grid -->
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                <div 
                                    v-for="port in panel.ports" 
                                    :key="`${panel.name}-${port.port}`"
                                    class="border rounded p-3 hover:shadow-md transition-shadow cursor-pointer"
                                    :class="{
                                        'border-green-300 bg-green-50 dark:bg-green-900': port.device,
                                        'border-gray-300 bg-gray-50 dark:bg-gray-800': !port.device,
                                        'border-red-300 bg-red-50 dark:bg-red-900': hasColorViolation(port)
                                    }"
                                    @click="editPort(port, panel.name)">
                                    
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="font-medium text-sm">Port {{ port.port }}</div>
                                        <div class="text-xs text-surface-500">{{ port.label || `${panel.name.split(' ')[2]}${port.port}` }}</div>
                                    </div>
                                    
                                    <div class="space-y-1">
                                        <div class="text-sm font-medium">
                                            {{ port.device || 'Unassigned' }}
                                        </div>
                                        
                                        <div v-if="port.device" class="flex items-center gap-2">
                                            <div 
                                                class="w-3 h-3 rounded border"
                                                :style="{ backgroundColor: getColorCode(port.keystone_color) }"
                                                :title="`Keystone: ${port.keystone_color}`">
                                            </div>
                                            <div 
                                                class="w-3 h-3 rounded border"
                                                :style="{ backgroundColor: getColorCode(port.clip_band_color) }"
                                                :title="`Clip Band: ${port.clip_band_color}`">
                                            </div>
                                            <span class="text-xs text-surface-500">{{ port.faceplate_type }}</span>
                                        </div>
                                        
                                        <div v-if="hasColorViolation(port)" class="text-xs text-red-600 mt-1">
                                            <i class="pi pi-exclamation-triangle mr-1"></i>
                                            Color violation
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </TabPanel>

                <!-- Color Coding Standards Tab -->
                <TabPanel header="Color Coding Standards">
                    <div class="space-y-4">
                        <div class="p-4 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                            <h4 class="font-semibold text-blue-700 dark:text-blue-300 mb-2">
                                <i class="pi pi-info-circle mr-2"></i>
                                Color Coding Standards
                            </h4>
                            <p class="text-sm text-surface-600 dark:text-surface-400">
                                Each device type has specific color requirements for keystone jacks and clip bands. 
                                Follow these standards to ensure proper cable management and identification.
                            </p>
                        </div>

                        <DataTable :value="colorCodingStandards" class="mt-4">
                            <Column field="color" header="Color" style="width: 120px">
                                <template #body="slotProps">
                                    <div class="flex items-center gap-2">
                                        <div 
                                            class="w-6 h-6 rounded border border-gray-300"
                                            :style="{ backgroundColor: getColorCode(slotProps.data.color) }">
                                        </div>
                                        <span class="font-medium">{{ slotProps.data.color }}</span>
                                    </div>
                                </template>
                            </Column>
                            <Column field="device_type" header="Device Type" style="min-width: 200px">
                                <template #body="slotProps">
                                    <div class="font-medium">{{ slotProps.data.device_type }}</div>
                                </template>
                            </Column>
                            <Column field="example_devices" header="Example Devices" style="min-width: 300px">
                                <template #body="slotProps">
                                    <div class="text-sm text-surface-600">
                                        {{ Array.isArray(slotProps.data.example_devices) ? slotProps.data.example_devices.join(', ') : slotProps.data.example_devices }}
                                    </div>
                                </template>
                            </Column>
                            <Column field="usage_count" header="Current Usage" style="width: 120px">
                                <template #body="slotProps">
                                    <Tag :value="getColorUsageCount(slotProps.data.color)" severity="info" size="small" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- Faceplate Types Tab -->
                <TabPanel header="Faceplate Types">
                    <div class="space-y-4">
                        <DataTable :value="faceplateTypes" class="mt-4">
                            <Column field="type" header="Faceplate Type" style="min-width: 200px">
                                <template #body="slotProps">
                                    <div class="font-medium">{{ slotProps.data.type }}</div>
                                </template>
                            </Column>
                            <Column field="description" header="Description" style="min-width: 300px">
                                <template #body="slotProps">
                                    <div class="text-sm text-surface-600">{{ slotProps.data.description }}</div>
                                </template>
                            </Column>
                            <Column field="port_count" header="Port Count" style="width: 100px">
                                <template #body="slotProps">
                                    <Tag :value="slotProps.data.port_count" severity="info" size="small" />
                                </template>
                            </Column>
                            <Column field="usage_count" header="Current Usage" style="width: 120px">
                                <template #body="slotProps">
                                    <Tag :value="getFaceplateUsageCount(slotProps.data.type)" severity="success" size="small" />
                                </template>
                            </Column>
                        </DataTable>
                    </div>
                </TabPanel>

                <!-- Validation Results Tab -->
                <TabPanel header="Validation Results">
                    <div class="space-y-4">
                        <div v-if="validationResults.length === 0" class="text-center py-8">
                            <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
                            <h3 class="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">All Standards Met!</h3>
                            <p class="text-surface-600 dark:text-surface-400">No color coding violations or assignment issues found.</p>
                        </div>

                        <div v-else>
                            <div class="p-4 bg-red-50 dark:bg-red-900 rounded border border-red-200 dark:border-red-700 mb-4">
                                <h4 class="font-semibold text-red-700 dark:text-red-300 mb-2">
                                    <i class="pi pi-exclamation-triangle mr-2"></i>
                                    {{ validationResults.length }} Violation(s) Found
                                </h4>
                                <p class="text-sm text-surface-600 dark:text-surface-400">
                                    Please review and correct the following color coding violations:
                                </p>
                            </div>

                            <DataTable :value="validationResults">
                                <Column field="panel" header="Panel" style="width: 100px">
                                    <template #body="slotProps">
                                        <Tag :value="slotProps.data.panel" severity="warning" size="small" />
                                    </template>
                                </Column>
                                <Column field="port" header="Port" style="width: 80px">
                                    <template #body="slotProps">
                                        <div class="font-medium">{{ slotProps.data.port }}</div>
                                    </template>
                                </Column>
                                <Column field="device_name" header="Device" style="min-width: 150px">
                                    <template #body="slotProps">
                                        <div class="font-medium">{{ slotProps.data.device_name }}</div>
                                    </template>
                                </Column>
                                <Column field="violation_type" header="Issue" style="min-width: 200px">
                                    <template #body="slotProps">
                                        <div class="text-red-600">{{ slotProps.data.violation_type }}</div>
                                    </template>
                                </Column>
                                <Column field="expected_color" header="Expected" style="width: 120px">
                                    <template #body="slotProps">
                                        <div class="flex items-center gap-2">
                                            <div 
                                                class="w-4 h-4 rounded border"
                                                :style="{ backgroundColor: getColorCode(slotProps.data.expected_color) }">
                                            </div>
                                            <span class="text-sm">{{ slotProps.data.expected_color }}</span>
                                        </div>
                                    </template>
                                </Column>
                                <Column header="Actions" style="width: 100px">
                                    <template #body="slotProps">
                                        <Button 
                                            icon="pi pi-pencil" 
                                            size="small" 
                                            text
                                            @click="fixViolation(slotProps.data)" />
                                    </template>
                                </Column>
                            </DataTable>
                        </div>
                    </div>
                </TabPanel>
            </TabView>
        </div>

        <!-- Port Edit Modal -->
        <Dialog 
            v-model:visible="showPortEditModal" 
            modal 
            header="Edit Port Assignment" 
            :style="{ width: '500px' }">
            
            <div v-if="editingPort" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">
                        Port {{ editingPort.port }} ({{ editingPanel }})
                    </label>
                    <div class="text-xs text-surface-500 mb-3">
                        Label: {{ editingPort.label || `${editingPanel.split(' ')[2]}${editingPort.port}` }}
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Device Name</label>
                    <InputText 
                        v-model="editingPort.device" 
                        class="w-full" 
                        placeholder="e.g., POS 1, Kiosk 2, Router" />
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Keystone Color</label>
                        <Select 
                            v-model="editingPort.keystone_color" 
                            :options="availableColors" 
                            option-label="color" 
                            option-value="color"
                            placeholder="Select color" 
                            class="w-full">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <div 
                                        class="w-4 h-4 rounded border"
                                        :style="{ backgroundColor: getColorCode(slotProps.option.color) }">
                                    </div>
                                    <span>{{ slotProps.option.color }}</span>
                                </div>
                            </template>
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="flex items-center gap-2">
                                    <div 
                                        class="w-4 h-4 rounded border"
                                        :style="{ backgroundColor: getColorCode(slotProps.value) }">
                                    </div>
                                    <span>{{ slotProps.value }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium mb-2">Clip Band Color</label>
                        <Select 
                            v-model="editingPort.clip_band_color" 
                            :options="availableColors" 
                            option-label="color" 
                            option-value="color"
                            placeholder="Select color" 
                            class="w-full">
                            <template #option="slotProps">
                                <div class="flex items-center gap-2">
                                    <div 
                                        class="w-4 h-4 rounded border"
                                        :style="{ backgroundColor: getColorCode(slotProps.option.color) }">
                                    </div>
                                    <span>{{ slotProps.option.color }}</span>
                                </div>
                            </template>
                            <template #value="slotProps">
                                <div v-if="slotProps.value" class="flex items-center gap-2">
                                    <div 
                                        class="w-4 h-4 rounded border"
                                        :style="{ backgroundColor: getColorCode(slotProps.value) }">
                                    </div>
                                    <span>{{ slotProps.value }}</span>
                                </div>
                            </template>
                        </Select>
                    </div>
                </div>

                <div>
                    <label class="block text-sm font-medium mb-2">Faceplate Type</label>
                    <Select 
                        v-model="editingPort.faceplate_type" 
                        :options="faceplateTypes" 
                        option-label="type" 
                        option-value="type"
                        placeholder="Select faceplate type" 
                        class="w-full" />
                </div>

                <!-- Color Recommendation -->
                <div v-if="editingPort.device" class="p-3 bg-blue-50 dark:bg-blue-900 rounded border border-blue-200 dark:border-blue-700">
                    <h5 class="font-medium text-blue-700 dark:text-blue-300 mb-2">
                        <i class="pi pi-lightbulb mr-1"></i>
                        Color Recommendation
                    </h5>
                    <div class="text-sm text-surface-600 dark:text-surface-400">
                        {{ getColorRecommendation(editingPort.device) }}
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex justify-end gap-2">
                    <Button 
                        label="Cancel" 
                        @click="showPortEditModal = false" 
                        outlined />
                    <Button 
                        label="Clear Port" 
                        @click="clearPort" 
                        severity="secondary"
                        outlined />
                    <Button 
                        label="Save Changes" 
                        @click="savePortChanges" 
                        :disabled="!editingPort?.device" />
                </div>
            </template>
        </Dialog>
    </Drawer>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ApiService } from '@/service/ApiService';

// Props & Emits
const props = defineProps({
    visible: {
        type: Boolean,
        default: false
    },
    locationId: {
        type: [String, Number],
        default: null
    }
});

const emit = defineEmits(['update:visible']);

// State
const loading = ref(false);
const saving = ref(false);
const validating = ref(false);
const activeTab = ref(0);
const selectedPanel = ref('all');
const hasChanges = ref(false);

// Data
const patchPanels = ref([]);
const colorCodingStandards = ref([]);
const faceplateTypes = ref([]);
const validationResults = ref([]);

// Port editing
const showPortEditModal = ref(false);
const editingPort = ref(null);
const editingPanel = ref('');

// Panel options
const panelOptions = [
    { label: 'All Panels', value: 'all' },
    { label: 'Panel A', value: 'A' },
    { label: 'Panel B', value: 'B' },
    { label: 'Panel C', value: 'C' }
];

// Color mapping for visual display
const colorMap = {
    'Green': '#22c55e',
    'Blue': '#3b82f6',
    'Orange': '#f97316',
    'Yellow': '#eab308',
    'Red': '#ef4444',
    'Purple': '#a855f7',
    'Brown': '#a3a3a3',
    'White': '#ffffff',
    'Black': '#000000',
    'Gray': '#6b7280'
};

// Computed Properties
const filteredPanels = computed(() => {
    if (selectedPanel.value === 'all') {
        return patchPanels.value;
    }
    return patchPanels.value.filter(panel => 
        panel.name.includes(`Panel ${selectedPanel.value}`)
    );
});

const stats = computed(() => {
    const allPorts = patchPanels.value.flatMap(panel => panel.ports);
    const activePorts = allPorts.filter(port => port.device);
    const violations = validationResults.value.length;
    
    return {
        totalPorts: allPorts.length,
        activePorts: activePorts.length,
        unassignedPorts: allPorts.length - activePorts.length,
        violations: violations
    };
});

const availableColors = computed(() => {
    return colorCodingStandards.value.map(standard => ({
        color: standard.color,
        device_type: standard.device_type
    }));
});

// Methods
const fetchPatchPanelData = async () => {
    loading.value = true;
    try {
        const endpoint = props.locationId 
            ? `flynn/patch-panel/matrix/${props.locationId}`
            : 'flynn/patch-panel/matrix';
            
        const response = await ApiService.get(endpoint);
        
        if (response.data.success) {
            const data = response.data.data;
            patchPanels.value = data.patch_panels || [];
            
            // Convert color coding summary from API format
            colorCodingStandards.value = Object.entries(data.color_coding_summary || {}).map(([color, info]) => ({
                color: color.charAt(0).toUpperCase() + color.slice(1),
                device_type: info.device_type,
                example_devices: Array.isArray(info.example_devices) ? info.example_devices : info.example_devices
            }));
        }
    } catch (error) {
        console.error('Failed to fetch patch panel data:', error);
    } finally {
        loading.value = false;
    }
};

const fetchColorCoding = async () => {
    try {
        const response = await ApiService.get('flynn/patch-panel/color-coding');
        if (response.data.success) {
            // Convert API format to component format
            colorCodingStandards.value = response.data.data.map(item => ({
                color: item.color.charAt(0).toUpperCase() + item.color.slice(1),
                device_type: item.device_type_category,
                example_devices: JSON.parse(item.example_devices || '[]')
            }));
        }
    } catch (error) {
        console.error('Failed to fetch color coding:', error);
    }
};

const fetchFaceplateTypes = async () => {
    try {
        // This endpoint might not exist yet, so we'll use default data
        faceplateTypes.value = [
            { type: '1 Port Stainless', description: 'Single port stainless steel faceplate', port_count: 1 },
            { type: '2 Port Stainless', description: 'Dual port stainless steel faceplate', port_count: 2 },
            { type: '3 Port Stainless', description: 'Triple port stainless steel faceplate', port_count: 3 },
            { type: '4 Port Stainless', description: 'Quad port stainless steel faceplate', port_count: 4 },
            { type: '6 Port Stainless', description: 'Six port stainless steel faceplate', port_count: 6 }
        ];
    } catch (error) {
        console.error('Failed to fetch faceplate types:', error);
    }
};

const validateStandards = async () => {
    validating.value = true;
    try {
        const response = await ApiService.get('flynn/patch-panel/validate');
        if (response.data.success) {
            validationResults.value = response.data.data.violations || [];
            activeTab.value = 3; // Switch to validation tab
        }
    } catch (error) {
        console.error('Failed to validate standards:', error);
        // Mock validation for now
        validationResults.value = mockValidation();
    } finally {
        validating.value = false;
    }
};

const mockValidation = () => {
    const violations = [];
    patchPanels.value.forEach(panel => {
        panel.ports.forEach(port => {
            if (port.device && hasColorViolation(port)) {
                violations.push({
                    panel: panel.name.split(' ')[2],
                    port: port.port,
                    device_name: port.device,
                    violation_type: 'Color coding does not match device type',
                    expected_color: getExpectedColor(port.device),
                    current_color: port.keystone_color
                });
            }
        });
    });
    return violations;
};

const editPort = (port, panelName) => {
    editingPort.value = { ...port };
    editingPanel.value = panelName;
    showPortEditModal.value = true;
};

const savePortChanges = async () => {
    try {
        saving.value = true;
        
        // Find the original port and update it
        const panel = patchPanels.value.find(p => p.name === editingPanel.value);
        const portIndex = panel.ports.findIndex(p => p.port === editingPort.value.port);
        
        if (portIndex !== -1) {
            // Update local data
            panel.ports[portIndex] = { ...editingPort.value };
            hasChanges.value = true;
            
            // TODO: Call API to save changes
            // await ApiService.patch(`flynn/patch-panel/port/${editingPort.value.id}`, editingPort.value);
        }
        
        showPortEditModal.value = false;
    } catch (error) {
        console.error('Failed to save port changes:', error);
    } finally {
        saving.value = false;
    }
};

const clearPort = () => {
    editingPort.value.device = '';
    editingPort.value.keystone_color = '';
    editingPort.value.clip_band_color = '';
    editingPort.value.faceplate_type = '';
};

const saveChanges = async () => {
    saving.value = true;
    try {
        // TODO: Implement bulk save functionality
        console.log('Saving all changes to patch panel data');
        hasChanges.value = false;
    } catch (error) {
        console.error('Failed to save changes:', error);
    } finally {
        saving.value = false;
    }
};

const fixViolation = (violation) => {
    // Find the port and open it for editing
    const panel = patchPanels.value.find(p => p.name.includes(`Panel ${violation.panel}`));
    const port = panel?.ports.find(p => p.port === violation.port);
    
    if (port) {
        editPort(port, panel.name);
        // Pre-fill with expected color
        editingPort.value.keystone_color = violation.expected_color;
        editingPort.value.clip_band_color = violation.expected_color;
    }
};

// Helper functions
const getColorCode = (colorName) => {
    return colorMap[colorName] || '#6b7280';
};

const getActivePorts = (panel) => {
    return panel.ports.filter(port => port.device);
};

const hasColorViolation = (port) => {
    if (!port.device) return false;
    const expectedColor = getExpectedColor(port.device);
    return expectedColor && (port.keystone_color !== expectedColor || port.clip_band_color !== expectedColor);
};

const getExpectedColor = (deviceName) => {
    const device = deviceName.toLowerCase();
    if (device.includes('pos') || device.includes('kiosk')) return 'Green';
    if (device.includes('router') || device.includes('switch')) return 'Blue';
    if (device.includes('printer')) return 'Orange';
    if (device.includes('phone') || device.includes('voip')) return 'Yellow';
    if (device.includes('camera') || device.includes('security')) return 'Red';
    return null;
};

const getColorRecommendation = (deviceName) => {
    const expectedColor = getExpectedColor(deviceName);
    if (expectedColor) {
        const standard = colorCodingStandards.value.find(s => s.color === expectedColor);
        return `Recommended color: ${expectedColor} (${standard?.device_type || 'Unknown device type'})`;
    }
    return 'No specific color recommendation available for this device type.';
};

const getColorUsageCount = (color) => {
    const allPorts = patchPanels.value.flatMap(panel => panel.ports);
    return allPorts.filter(port => port.keystone_color === color || port.clip_band_color === color).length;
};

const getFaceplateUsageCount = (type) => {
    const allPorts = patchPanels.value.flatMap(panel => panel.ports);
    return allPorts.filter(port => port.faceplate_type === type).length;
};

// Lifecycle
onMounted(() => {
    if (props.visible) {
        fetchPatchPanelData();
        fetchColorCoding();
        fetchFaceplateTypes();
    }
});

// Watch for visibility changes
watch(() => props.visible, (newValue) => {
    if (newValue) {
        fetchPatchPanelData();
        fetchColorCoding();
        fetchFaceplateTypes();
    }
});

// Update visibility
const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
});
</script>

<style scoped>
.flynn-addendum-drawer :deep(.p-drawer-content) {
    padding: 1.5rem;
}

.flynn-addendum-drawer :deep(.p-tabview-panels) {
    padding-top: 1rem;
}
</style>