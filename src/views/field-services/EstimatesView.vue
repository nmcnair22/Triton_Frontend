<template>
    <div class="estimates-page">
        <!-- Page Header -->
        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
            <div>
                <h1 class="text-3xl font-bold text-surface-900 dark:text-surface-0 mb-2">
                    Estimates / Quotes
                </h1>
                <p class="text-surface-600 dark:text-surface-400">
                    Manage project estimates, quotes, and proposals
                </p>
            </div>
            <div class="flex gap-2">
                <Button 
                    icon="pi pi-plus" 
                    label="New Estimate" 
                    severity="primary"
                    @click="openEstimateBuilder"
                />
                <Button 
                    icon="pi pi-calendar" 
                    label="Schedule Site Survey" 
                    severity="info"
                    outlined
                    @click="scheduleSurvey"
                />
            </div>
        </div>

        <!-- Main Content: Estimates Overview -->
        <div v-if="!showEstimateBuilder" class="estimates-content">
            <!-- Metrics Overview -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <!-- Open Estimates Card -->
                <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <i class="pi pi-file text-2xl text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">12</h3>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">Open Estimates</p>
                        </div>
                    </div>
                </div>

                <!-- Site Surveys Scheduled Card -->
                <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-lg flex items-center justify-center">
                            <i class="pi pi-calendar text-2xl text-teal-600 dark:text-teal-400"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">5</h3>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">Site Surveys Scheduled</p>
                        </div>
                    </div>
                </div>

                <!-- Awaiting Approval Card -->
                <div class="bg-white dark:bg-surface-900 rounded-lg p-6 border border-surface-200 dark:border-surface-700">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                            <i class="pi pi-clock text-2xl text-orange-600 dark:text-orange-400"></i>
                        </div>
                        <div>
                            <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">3</h3>
                            <p class="text-surface-600 dark:text-surface-400 text-sm">Awaiting Approval</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estimates Table -->
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-semibold text-surface-900 dark:text-surface-0">All Estimates</h2>
                    <Button 
                        icon="pi pi-refresh" 
                        text 
                        rounded
                        @click="refreshEstimates"
                    />
                </div>

                <DataTable 
                    :value="recentEstimates" 
                    :paginator="true" 
                    :rows="10"
                    :loading="isLoading"
                    dataKey="id"
                    :rowHover="true"
                    stripedRows
                    class="p-datatable-sm"
                >
                    <Column field="id" header="Estimate ID" sortable style="width: 12%">
                        <template #body="slotProps">
                            <span class="font-medium text-primary">{{ slotProps.data.id }}</span>
                        </template>
                    </Column>
                    
                    <Column field="client" header="Client" sortable style="width: 20%">
                        <template #body="slotProps">
                            <div class="font-medium">{{ slotProps.data.client }}</div>
                        </template>
                    </Column>
                    
                    <Column field="scope" header="Project Scope" sortable style="width: 25%">
                        <template #body="slotProps">
                            <div class="max-w-xs truncate" :title="slotProps.data.scope">
                                {{ slotProps.data.scope }}
                            </div>
                        </template>
                    </Column>
                    
                    <Column field="status" header="Status" sortable style="width: 12%">
                        <template #body="slotProps">
                            <Tag 
                                :value="slotProps.data.status" 
                                :severity="getStatusSeverity(slotProps.data.status)"
                            />
                        </template>
                    </Column>
                    
                    <Column field="cost" header="Estimated Cost" sortable style="width: 15%">
                        <template #body="slotProps">
                            <div class="font-medium text-green-600 dark:text-green-400">
                                {{ formatCurrency(slotProps.data.cost) }}
                            </div>
                        </template>
                    </Column>
                    
                    <Column header="Actions" style="width: 16%">
                        <template #body="slotProps">
                            <div class="flex gap-2">
                                <Button 
                                    icon="pi pi-eye" 
                                    text 
                                    rounded
                                    size="small"
                                    @click="viewEstimate(slotProps.data)"
                                    v-tooltip.top="'View Details'"
                                />
                                <Button 
                                    icon="pi pi-pencil" 
                                    text 
                                    rounded
                                    size="small"
                                    @click="editEstimate(slotProps.data)"
                                    v-tooltip.top="'Edit'"
                                />
                                <Button 
                                    icon="pi pi-download" 
                                    text 
                                    rounded
                                    size="small"
                                    @click="downloadEstimate(slotProps.data)"
                                    v-tooltip.top="'Download PDF'"
                                />
                            </div>
                        </template>
                    </Column>
                </DataTable>
            </div>
        </div>

        <!-- Estimate Builder Modal/Overlay -->
        <div v-else class="estimate-builder-overlay">
            <div class="builder-header">
                <div class="flex justify-between items-center mb-6">
                    <div class="flex items-center gap-4">
                        <Button 
                            icon="pi pi-arrow-left" 
                            text
                            rounded
                            @click="closeEstimateBuilder"
                            v-tooltip.top="'Back to Estimates'"
                        />
                        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">
                            Estimate Builder
                        </h2>
                    </div>
                    <Button 
                        icon="pi pi-save" 
                        label="Save Draft" 
                        severity="secondary"
                        outlined
                        @click="saveDraft"
                    />
                </div>

                <!-- Progress Steps Indicator -->
                <div class="mb-8">
                    <div class="flex items-center justify-between relative">
                        <!-- Progress Line -->
                        <div class="absolute top-6 left-0 w-full h-1 bg-surface-200 dark:bg-surface-700 rounded-full">
                            <div 
                                class="h-full bg-primary rounded-full transition-all duration-300"
                                :style="{ width: `${(currentStep - 1) * 20}%` }"
                            ></div>
                        </div>
                        
                        <!-- Step Indicators -->
                        <div 
                            v-for="(step, index) in progressSteps" 
                            :key="step.key"
                            class="flex flex-col items-center relative z-10"
                            :class="{ 'text-primary': index + 1 <= currentStep, 'text-surface-400': index + 1 > currentStep }"
                        >
                            <div 
                                class="w-12 h-12 rounded-full flex items-center justify-center border-2 bg-white dark:bg-surface-900 transition-all"
                                :class="{
                                    'border-primary bg-primary text-white': index + 1 < currentStep,
                                    'border-primary text-primary': index + 1 === currentStep,
                                    'border-surface-300 dark:border-surface-600': index + 1 > currentStep
                                }"
                            >
                                <i v-if="index + 1 < currentStep" class="pi pi-check text-sm"></i>
                                <span v-else class="text-sm font-medium">{{ index + 1 }}</span>
                            </div>
                            <span class="text-xs mt-2 text-center max-w-20">{{ step.label }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Stepper Content -->
            <div class="card">
                <!-- Step 1: Basic Project Information -->
                <div v-if="currentStep === 1" class="step-content">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
                        Step 1: Basic Project Information
                    </h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- Client Name -->
                        <div class="field">
                            <label for="clientName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Client Name
                            </label>
                            <InputText 
                                id="clientName"
                                v-model="estimateForm.clientName"
                                placeholder="Enter client name"
                                class="w-full"
                                :class="{ 'p-invalid': errors.clientName }"
                            />
                            <small v-if="errors.clientName" class="text-red-500">{{ errors.clientName }}</small>
                        </div>

                        <!-- Project Name -->
                        <div class="field">
                            <label for="projectName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Project Name
                            </label>
                            <InputText 
                                id="projectName"
                                v-model="estimateForm.projectName"
                                placeholder="Enter project name"
                                class="w-full"
                                :class="{ 'p-invalid': errors.projectName }"
                            />
                            <small v-if="errors.projectName" class="text-red-500">{{ errors.projectName }}</small>
                        </div>

                        <!-- Contact Person -->
                        <div class="field">
                            <label for="contactPerson" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Contact Person
                            </label>
                            <InputText 
                                id="contactPerson"
                                v-model="estimateForm.contactPerson"
                                placeholder="Enter contact name"
                                class="w-full"
                                :class="{ 'p-invalid': errors.contactPerson }"
                            />
                            <small v-if="errors.contactPerson" class="text-red-500">{{ errors.contactPerson }}</small>
                        </div>

                        <!-- Contact Email -->
                        <div class="field">
                            <label for="contactEmail" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Contact Email
                            </label>
                            <InputText 
                                id="contactEmail"
                                v-model="estimateForm.contactEmail"
                                placeholder="Enter contact email"
                                type="email"
                                class="w-full"
                                :class="{ 'p-invalid': errors.contactEmail }"
                            />
                            <small v-if="errors.contactEmail" class="text-red-500">{{ errors.contactEmail }}</small>
                        </div>
                    </div>

                    <!-- Project Overview -->
                    <div class="field mt-6">
                        <label for="projectOverview" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            Project Overview
                        </label>
                        <Textarea 
                            id="projectOverview"
                            v-model="estimateForm.projectOverview"
                            placeholder="Enter a brief description of the project"
                            rows="4"
                            class="w-full"
                            :class="{ 'p-invalid': errors.projectOverview }"
                        />
                        <small v-if="errors.projectOverview" class="text-red-500">{{ errors.projectOverview }}</small>
                    </div>

                    <!-- Navigation -->
                    <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                        <Button 
                            label="Cancel" 
                            severity="secondary"
                            outlined
                            @click="closeEstimateBuilder"
                        />
                        <Button 
                            label="Next" 
                            icon="pi pi-arrow-right" 
                            iconPos="right"
                            @click="nextStep"
                        />
                    </div>
                </div>

                <!-- Step 2: Detailed Scope Definition -->
                <div v-else-if="currentStep === 2" class="step-content">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
                        Step 2: Detailed Scope Definition
                    </h3>

                    <!-- Scope Type Selection -->
                    <div class="flex justify-center mb-8">
                        <SelectButton 
                            v-model="scopeType" 
                            :options="scopeTypeOptions" 
                            optionLabel="label" 
                            optionValue="value"
                            class="scope-selector"
                        />
                    </div>

                    <!-- Use Template Tab -->
                    <div v-if="scopeType === 'template'" class="template-content">
                        <div class="field">
                            <label for="templateSelect" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Select Template
                            </label>
                            <Select
                                id="templateSelect"
                                v-model="estimateForm.selectedTemplate"
                                :options="templateOptions"
                                optionLabel="name"
                                optionValue="id"
                                placeholder="Select a template"
                                class="w-full"
                                showClear
                            />
                        </div>

                        <!-- Template Preview -->
                        <div v-if="estimateForm.selectedTemplate" class="mt-6 p-4 border border-surface-200 dark:border-surface-700 rounded-lg">
                            <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Template Preview</h4>
                            <div class="text-sm text-surface-600 dark:text-surface-400">
                                {{ getSelectedTemplate()?.description }}
                            </div>
                            <div class="mt-3">
                                <span class="text-xs bg-surface-100 dark:bg-surface-800 px-2 py-1 rounded">
                                    {{ getSelectedTemplate()?.category }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Custom Scope Tab -->
                    <div v-else class="custom-scope-content">
                        <!-- Tasks -->
                        <div class="field mb-6">
                            <label for="tasks" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Tasks
                            </label>
                            <Textarea 
                                id="tasks"
                                v-model="estimateForm.tasks"
                                placeholder="Enter tasks, one per line"
                                rows="6"
                                class="w-full"
                            />
                        </div>

                        <!-- Labor Requirements -->
                        <div class="field mb-6">
                            <label for="laborRequirements" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Labor Requirements
                            </label>
                            <Textarea 
                                id="laborRequirements"
                                v-model="estimateForm.laborRequirements"
                                placeholder="Enter labor requirements"
                                rows="4"
                                class="w-full"
                            />
                        </div>

                        <!-- Materials & Equipment -->
                        <div class="field">
                            <label for="materialsEquipment" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                Materials & Equipment
                            </label>
                            <Textarea 
                                id="materialsEquipment"
                                v-model="estimateForm.materialsEquipment"
                                placeholder="Enter materials and equipment needed"
                                rows="4"
                                class="w-full"
                            />
                        </div>
                    </div>

                    <!-- Navigation -->
                    <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                        <Button 
                            label="Previous" 
                            icon="pi pi-arrow-left"
                            severity="secondary"
                            @click="previousStep"
                        />
                        <Button 
                            label="Next" 
                            icon="pi pi-arrow-right" 
                            iconPos="right"
                            @click="nextStep"
                        />
                    </div>
                </div>

                <!-- Step 3: Costing, Site Survey & Documents -->
                <div v-else-if="currentStep === 3" class="step-content">
                    <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
                        Step 3: Costing, Site Survey & Documents
                    </h3>

                    <!-- Tab Navigation for Step 3 -->
                    <div class="mb-6">
                        <div class="flex border-b border-surface-200 dark:border-surface-700">
                            <button 
                                @click="activeTab = 'costing'"
                                :class="[
                                    'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                                    activeTab === 'costing' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100'
                                ]"
                            >
                                Line Items & Costing
                            </button>
                            <button 
                                @click="activeTab = 'surveys'"
                                :class="[
                                    'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                                    activeTab === 'surveys' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100'
                                ]"
                            >
                                Site Surveys & Bids
                            </button>
                            <button 
                                @click="activeTab = 'documents'"
                                :class="[
                                    'px-4 py-2 font-medium text-sm border-b-2 transition-colors',
                                    activeTab === 'documents' 
                                        ? 'border-primary text-primary' 
                                        : 'border-transparent text-surface-600 hover:text-surface-900 dark:text-surface-400 dark:hover:text-surface-100'
                                ]"
                            >
                                Documents & Processing
                            </button>
                        </div>
                    </div>

                    <!-- Costing Tab -->
                    <div v-if="activeTab === 'costing'"  class="tab-content">

                    <!-- Add Line Item Button -->
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h4 class="text-lg font-medium text-surface-900 dark:text-surface-0">Line Items</h4>
                            <p class="text-sm text-surface-600 dark:text-surface-400">Add and manage cost line items for this estimate</p>
                        </div>
                        <Button 
                            label="Add Line Item" 
                            icon="pi pi-plus"
                            @click="openLineItemModal"
                        />
                    </div>

                    <!-- Line Items Table -->
                    <div class="mb-8">
                        <DataTable 
                            :value="lineItems" 
                            :paginator="false"
                            dataKey="id"
                            :rowHover="true"
                            stripedRows
                            class="p-datatable-sm"
                            :emptyMessage="'No line items added yet. Click Add Line Item to get started.'"
                        >
                            <Column field="category" header="Category" style="width: 12%">
                                <template #body="slotProps">
                                    <Tag 
                                        :value="slotProps.data.category" 
                                        :severity="getCategorySeverity(slotProps.data.category)"
                                    />
                                </template>
                            </Column>
                            
                            <Column field="description" header="Description" style="width: 25%">
                                <template #body="slotProps">
                                    <div class="max-w-xs truncate" :title="slotProps.data.description">
                                        {{ slotProps.data.description }}
                                    </div>
                                </template>
                            </Column>
                            
                            <Column field="vendor" header="Vendor" style="width: 15%">
                                <template #body="slotProps">
                                    <span class="text-surface-600 dark:text-surface-400">
                                        {{ slotProps.data.vendor || 'N/A' }}
                                    </span>
                                </template>
                            </Column>
                            
                            <Column field="quantity" header="Qty" style="width: 8%">
                                <template #body="slotProps">
                                    {{ slotProps.data.quantity }}
                                </template>
                            </Column>
                            
                            <Column field="unitCost" header="Unit Cost" style="width: 10%">
                                <template #body="slotProps">
                                    {{ formatCurrency(slotProps.data.unitCost) }}
                                </template>
                            </Column>
                            
                            <Column field="margin" header="Margin" style="width: 8%">
                                <template #body="slotProps">
                                    {{ slotProps.data.margin }}%
                                </template>
                            </Column>
                            
                            <Column header="Total Cost" style="width: 10%">
                                <template #body="slotProps">
                                    <span class="font-medium">
                                        {{ formatCurrency(slotProps.data.quantity * slotProps.data.unitCost) }}
                                    </span>
                                </template>
                            </Column>
                            
                            <Column header="Client Charge" style="width: 12%">
                                <template #body="slotProps">
                                    <span class="font-medium text-green-600 dark:text-green-400">
                                        {{ formatCurrency(calculateClientCharge(slotProps.data)) }}
                                    </span>
                                </template>
                            </Column>
                            
                            <Column header="Actions" style="width: 10%">
                                <template #body="slotProps">
                                    <div class="flex gap-2">
                                        <Button 
                                            icon="pi pi-pencil" 
                                            text 
                                            rounded
                                            size="small"
                                            @click="editLineItem(slotProps.data)"
                                            v-tooltip.top="'Edit'"
                                        />
                                        <Button 
                                            icon="pi pi-trash" 
                                            text 
                                            rounded
                                            size="small"
                                            severity="danger"
                                            @click="confirmDeleteLineItem(slotProps.data)"
                                            v-tooltip.top="'Remove'"
                                        />
                                    </div>
                                </template>
                            </Column>
                        </DataTable>
                    </div>

                    <!-- Summary Section -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
                            <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Cost</div>
                            <div class="text-xl font-bold text-surface-900 dark:text-surface-0">
                                {{ formatCurrency(totalCost) }}
                            </div>
                        </div>
                        
                        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
                            <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Total Margin</div>
                            <div class="text-xl font-bold text-orange-600 dark:text-orange-400">
                                {{ formatCurrency(totalMarkup) }}
                            </div>
                        </div>
                        
                        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
                            <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Client Charge</div>
                            <div class="text-xl font-bold text-green-600 dark:text-green-400">
                                {{ formatCurrency(totalClientCharge) }}
                            </div>
                        </div>
                        
                        <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg border">
                            <div class="text-sm text-surface-600 dark:text-surface-400 mb-1">Overall Margin</div>
                            <div class="text-xl font-bold text-blue-600 dark:text-blue-400">
                                {{ overallMargin }}%
                            </div>
                        </div>
                    </div>

                    <!-- Navigation -->
                    <div class="flex justify-between mt-8 pt-6 border-t border-surface-200 dark:border-surface-700">
                        <Button 
                            label="Previous" 
                            icon="pi pi-arrow-left"
                            severity="secondary"
                            @click="previousStep"
                        />
                        <Button 
                            label="Next" 
                            icon="pi pi-arrow-right" 
                            iconPos="right"
                            @click="nextStep"
                        />
                    </div>
                </div>
            </div>
            </div>
        </div>

         <!-- Line Item Modal -->
         <Dialog 
             v-model:visible="showLineItemModal" 
             :header="editingLineItem ? 'Edit Line Item' : 'Add Line Item'"
             :modal="true"
             :closable="true"
             :draggable="false"
             class="w-full max-w-2xl"
         >
             <div class="space-y-6">
                 <!-- Category and Description Row -->
                 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div class="field">
                         <label for="lineItemCategory" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                             Cost Category *
                         </label>
                         <Select
                             id="lineItemCategory"
                             v-model="lineItemForm.category"
                             :options="categoryOptions"
                             placeholder="Select category"
                             class="w-full"
                             :class="{ 'p-invalid': lineItemErrors.category }"
                         />
                         <small v-if="lineItemErrors.category" class="text-red-500">{{ lineItemErrors.category }}</small>
                     </div>

                     <div class="field">
                         <label for="lineItemVendor" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                             Vendor
                         </label>
                         <div class="flex gap-2">
                             <Select
                                 id="lineItemVendor"
                                 v-model="lineItemForm.vendor"
                                 :options="vendorOptions"
                                 placeholder="Select vendor"
                                 class="flex-1"
                                 showClear
                                 editable
                             />
                             <Button 
                                 icon="pi pi-plus" 
                                 severity="secondary"
                                 outlined
                                 @click="openAddVendorDialog"
                                 v-tooltip.top="'Add New Vendor'"
                             />
                         </div>
                     </div>
                 </div>

                 <!-- Description -->
                 <div class="field">
                     <label for="lineItemDescription" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                         Description *
                     </label>
                     <Textarea 
                         id="lineItemDescription"
                         v-model="lineItemForm.description"
                         placeholder="Enter detailed description of the line item"
                         rows="3"
                         maxlength="500"
                         class="w-full"
                         :class="{ 'p-invalid': lineItemErrors.description }"
                     />
                     <div class="flex justify-between">
                         <small v-if="lineItemErrors.description" class="text-red-500">{{ lineItemErrors.description }}</small>
                         <small class="text-surface-500">{{ lineItemForm.description.length }}/500</small>
                     </div>
                 </div>

                 <!-- Quantity, Unit Cost, and Margin Row -->
                 <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <div class="field">
                         <label for="lineItemQuantity" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                             Quantity *
                         </label>
                         <InputNumber 
                             id="lineItemQuantity"
                             v-model="lineItemForm.quantity"
                             :min="0.1"
                             :step="0.1"
                             :minFractionDigits="1"
                             :maxFractionDigits="2"
                             class="w-full"
                             :class="{ 'p-invalid': lineItemErrors.quantity }"
                             @input="updateCalculations"
                         />
                         <small v-if="lineItemErrors.quantity" class="text-red-500">{{ lineItemErrors.quantity }}</small>
                     </div>

                     <div class="field">
                         <label for="lineItemUnitCost" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                             Unit Cost *
                         </label>
                         <InputNumber 
                             id="lineItemUnitCost"
                             v-model="lineItemForm.unitCost"
                             mode="currency"
                             currency="USD"
                             :min="0"
                             :step="0.01"
                             :minFractionDigits="2"
                             class="w-full"
                             :class="{ 'p-invalid': lineItemErrors.unitCost }"
                             @input="updateCalculations"
                         />
                         <small v-if="lineItemErrors.unitCost" class="text-red-500">{{ lineItemErrors.unitCost }}</small>
                     </div>

                     <div class="field">
                         <label for="lineItemMargin" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                             Margin %
                         </label>
                         <InputNumber 
                             id="lineItemMargin"
                             v-model="lineItemForm.margin"
                             :min="0"
                             :max="100"
                             :step="0.01"
                             class="w-full"
                             :class="{ 'p-invalid': lineItemErrors.margin }"
                             @input="updateCalculations"
                         />
                     </div>
                 </div>

                 <!-- Calculations Preview -->
                 <div v-if="lineItemForm.quantity && lineItemForm.unitCost" class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                     <h5 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Calculations Preview</h5>
                     <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                         <div>
                             <span class="text-surface-600 dark:text-surface-400">Total Cost:</span>
                             <span class="font-medium ml-2">{{ formatCurrency(lineItemForm.quantity * lineItemForm.unitCost) }}</span>
                         </div>
                         <div>
                             <span class="text-surface-600 dark:text-surface-400">Client Charge:</span>
                             <span class="font-medium ml-2 text-green-600 dark:text-green-400">
                                 {{ formatCurrency(calculateLineItemClientCharge()) }}
                             </span>
                         </div>
                         <div>
                             <span class="text-surface-600 dark:text-surface-400">Margin:</span>
                             <span class="font-medium ml-2 text-blue-600 dark:text-blue-400">
                                 {{ calculateLineItemMargin() }}%
                             </span>
                         </div>
                     </div>
                 </div>
             </div>

             <template #footer>
                 <div class="flex justify-end gap-2">
                     <Button 
                         label="Cancel" 
                         severity="secondary"
                         outlined
                         @click="closeLineItemModal"
                     />
                     <Button 
                         :label="editingLineItem ? 'Update' : 'Add'"
                         @click="saveLineItem"
                     />
                 </div>
             </template>
         </Dialog>

         <!-- Add Vendor Dialog -->
         <Dialog 
             v-model:visible="showAddVendorDialog" 
             header="Add New Vendor"
             :modal="true"
             :closable="true"
             :draggable="false"
             class="w-full max-w-md"
         >
             <div class="space-y-4">
                 <div class="field">
                     <label for="newVendorName" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                         Vendor Name *
                     </label>
                     <InputText 
                         id="newVendorName"
                         v-model="newVendorName"
                         placeholder="Enter vendor name"
                         class="w-full"
                         @keyup.enter="addNewVendor"
                     />
                 </div>
             </div>

             <template #footer>
                 <div class="flex justify-end gap-2">
                     <Button 
                         label="Cancel" 
                         severity="secondary"
                         outlined
                         @click="cancelAddVendor"
                     />
                     <Button 
                         label="Add Vendor" 
                         :disabled="!newVendorName.trim()"
                         @click="addNewVendor"
                     />
                 </div>
             </template>
         </Dialog>

         <!-- Site Survey Modal -->
         <Dialog 
             v-model:visible="showSiteSurveyModal" 
             header="Request Site Survey"
             :modal="true"
             :closable="true"
             :draggable="false"
             class="w-full max-w-4xl"
         >
             <div class="space-y-6">
                 <!-- Client Information (Pre-populated) -->
                 <div class="bg-surface-50 dark:bg-surface-800 p-4 rounded-lg">
                     <h5 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Client Information</h5>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                         <div><strong>Client:</strong> {{ siteSurveyForm.clientName || 'Not specified' }}</div>
                         <div><strong>Project:</strong> {{ siteSurveyForm.projectName || 'Not specified' }}</div>
                         <div><strong>Contact:</strong> {{ siteSurveyForm.contactPerson || 'Not specified' }}</div>
                         <div><strong>Email:</strong> {{ siteSurveyForm.contactEmail || 'Not specified' }}</div>
                     </div>
                 </div>

                 <!-- Location Information -->
                 <div>
                     <h5 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Survey Location</h5>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div class="field md:col-span-2">
                             <label for="locationAddress" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 Street Address *
                             </label>
                             <InputText 
                                 id="locationAddress"
                                 v-model="siteSurveyForm.locationAddress"
                                 placeholder="Enter street address"
                                 class="w-full"
                                 :class="{ 'p-invalid': siteSurveyErrors.locationAddress }"
                             />
                             <small v-if="siteSurveyErrors.locationAddress" class="text-red-500">{{ siteSurveyErrors.locationAddress }}</small>
                         </div>

                         <div class="field">
                             <label for="locationCity" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 City *
                             </label>
                             <InputText 
                                 id="locationCity"
                                 v-model="siteSurveyForm.locationCity"
                                 placeholder="Enter city"
                                 class="w-full"
                                 :class="{ 'p-invalid': siteSurveyErrors.locationCity }"
                             />
                             <small v-if="siteSurveyErrors.locationCity" class="text-red-500">{{ siteSurveyErrors.locationCity }}</small>
                         </div>

                         <div class="field">
                             <label for="locationState" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 State *
                             </label>
                             <InputText 
                                 id="locationState"
                                 v-model="siteSurveyForm.locationState"
                                 placeholder="Enter state"
                                 class="w-full"
                                 :class="{ 'p-invalid': siteSurveyErrors.locationState }"
                             />
                             <small v-if="siteSurveyErrors.locationState" class="text-red-500">{{ siteSurveyErrors.locationState }}</small>
                         </div>

                         <div class="field">
                             <label for="locationZip" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 ZIP Code
                             </label>
                             <InputText 
                                 id="locationZip"
                                 v-model="siteSurveyForm.locationZip"
                                 placeholder="Enter ZIP code"
                                 class="w-full"
                             />
                         </div>
                     </div>
                 </div>

                 <!-- Vendor and Cost Information -->
                 <div>
                     <h5 class="font-medium text-surface-900 dark:text-surface-0 mb-3">Survey Details</h5>
                     <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div class="field">
                             <label for="surveyVendor" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 Survey Vendor *
                             </label>
                             <Select
                                 id="surveyVendor"
                                 v-model="siteSurveyForm.surveyVendor"
                                 :options="vendorOptions"
                                 placeholder="Select vendor for survey"
                                 class="w-full"
                                 :class="{ 'p-invalid': siteSurveyErrors.surveyVendor }"
                                 showClear
                                 editable
                             />
                             <small v-if="siteSurveyErrors.surveyVendor" class="text-red-500">{{ siteSurveyErrors.surveyVendor }}</small>
                         </div>

                         <div class="field">
                             <label for="surveyDate" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 Preferred Survey Date
                             </label>
                             <Calendar
                                 id="surveyDate"
                                 v-model="siteSurveyForm.surveyDate"
                                 placeholder="Select date"
                                 class="w-full"
                                 :minDate="new Date()"
                                 showIcon
                             />
                         </div>

                         <div class="field">
                             <div class="flex items-center gap-2 mb-2">
                                 <Checkbox 
                                     id="costUnknown"
                                     v-model="siteSurveyForm.costUnknown"
                                     binary
                                 />
                                 <label for="costUnknown" class="text-sm font-medium text-surface-700 dark:text-surface-300">
                                     Cost Unknown
                                 </label>
                             </div>
                             <InputNumber 
                                 v-if="!siteSurveyForm.costUnknown"
                                 v-model="siteSurveyForm.estimatedCost"
                                 mode="currency"
                                 currency="USD"
                                 :min="0"
                                 placeholder="Estimated survey cost"
                                 class="w-full"
                             />
                         </div>

                         <div class="field">
                             <label for="surveyNotes" class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                                 Additional Notes
                             </label>
                             <Textarea 
                                 id="surveyNotes"
                                 v-model="siteSurveyForm.notes"
                                 placeholder="Any special requirements or notes"
                                 rows="3"
                                 class="w-full"
                             />
                         </div>
                     </div>
                 </div>
             </div>

             <template #footer>
                 <div class="flex justify-end gap-2">
                     <Button 
                         label="Cancel" 
                         severity="secondary"
                         outlined
                         @click="closeSiteSurveyModal"
                     />
                     <Button 
                         label="Request Survey" 
                         icon="pi pi-send"
                         @click="submitSiteSurvey"
                     />
                 </div>
             </template>
         </Dialog>

         <!-- Delete Confirmation Dialog -->
         <ConfirmDialog />
            </div>
   </template>
  
  <script setup>
import { ref, computed, onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import Tag from 'primevue/tag';

import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Select from 'primevue/select';
import SelectButton from 'primevue/selectbutton';
import Dialog from 'primevue/dialog';
import InputNumber from 'primevue/inputnumber';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import FileUpload from 'primevue/fileupload';

// Composables
const toast = useToast();
const confirm = useConfirm();

// Reactive data
const isLoading = ref(false);
const showEstimateBuilder = ref(false);

// Stepper data
const currentStep = ref(1);
const scopeType = ref('template');
const activeTab = ref('costing');

// Progress steps configuration
const progressSteps = ref([
    { key: 'info', label: 'Project Info' },
    { key: 'scope', label: 'Scope' },
    { key: 'costing', label: 'Costing & Docs' },
    { key: 'review', label: 'Review' }
]);

// Scope type options
const scopeTypeOptions = ref([
    { label: 'Use Template', value: 'template' },
    { label: 'Custom Scope', value: 'custom' }
]);

// Template options
const templateOptions = ref([
    { 
        id: 1, 
        name: 'Network Infrastructure Setup', 
        category: 'IT Infrastructure',
        description: 'Complete network infrastructure setup including switches, routers, cabling, and configuration.'
    },
    { 
        id: 2, 
        name: 'Security System Installation', 
        category: 'Security',
        description: 'Comprehensive security system including cameras, access control, and monitoring setup.'
    },
    { 
        id: 3, 
        name: 'Server Room Setup', 
        category: 'IT Infrastructure',
        description: 'Complete server room setup with racks, power, cooling, and network infrastructure.'
    },
    { 
        id: 4, 
        name: 'POS System Deployment', 
        category: 'Retail',
        description: 'Point of sale system deployment including hardware, software, and training.'
    }
]);

// Form data
const estimateForm = ref({
    clientName: '',
    projectName: '',
    contactPerson: '',
    contactEmail: '',
    projectOverview: '',
    selectedTemplate: null,
    tasks: '',
    laborRequirements: '',
    materialsEquipment: ''
});

// Form validation errors
const errors = ref({});

// Line Items data
const lineItems = ref([]);
const showLineItemModal = ref(false);
const editingLineItem = ref(null);
const lineItemForm = ref({
    category: '',
    description: '',
    vendor: '',
    quantity: 1,
    unitCost: 0,
    margin: 23.08 // Changed from markup to margin, default ~23% margin (30% markup equivalent)
});
const lineItemErrors = ref({});

// Vendor management
const vendorOptions = ref([
    'ABC Supplies Co.',
    'Tech Solutions Inc.',
    'Global Materials',
    'Premium Hardware',
    'Local Contractor Services'
]);
const showAddVendorDialog = ref(false);
const newVendorName = ref('');

// Site Survey Management
const showSiteSurveyModal = ref(false);
const siteSurveyForm = ref({
    clientName: '',
    projectName: '',
    contactPerson: '',
    contactEmail: '',
    locationAddress: '',
    locationCity: '',
    locationState: '',
    locationZip: '',
    surveyVendor: '',
    estimatedCost: 0,
    costUnknown: false,
    surveyDate: null,
    notes: ''
});
const siteSurveyErrors = ref({});

// Site Surveys & Bid Tracking
const siteSurveys = ref([
    {
        id: 'SS-001',
        vendor: 'ABC Supplies Co.',
        location: '123 Main St, Anytown, CA 90210',
        status: 'Scheduled',
        scheduledDate: '2024-01-15',
        estimatedCost: 500,
        actualCost: null
    },
    {
        id: 'SS-002', 
        vendor: 'Tech Solutions Inc.',
        location: '456 Oak Ave, Business Park, TX 75001',
        status: 'Completed',
        scheduledDate: '2024-01-10',
        estimatedCost: 750,
        actualCost: 680
    }
]);

// Document Management
const showDocumentModal = ref(false);
const showDocumentViewer = ref(false);
const documentForm = ref({
    name: '',
    type: 'vendor', // vendor, client, cis
    category: '', // quote, contract, specification, etc.
    source: '', // who provided it
    version: 1,
    parentDocumentId: null,
    isNewVersion: false,
    notes: ''
});
const documentErrors = ref({});
const selectedDocument = ref(null);
const uploadedFile = ref(null);

// Document Processing (OCR)
const showDocumentProcessor = ref(false);
const processingDocument = ref(null);
const extractedData = ref({
    vendor: '',
    totalAmount: 0,
    lineItems: [],
    validUntil: null,
    terms: '',
    contactInfo: ''
});

// Document Storage
const projectDocuments = ref({
    vendor: [
        {
            id: 'DOC-V001',
            name: 'Network Equipment Quote',
            source: 'ABC Supplies Co.',
            type: 'quote',
            version: 1,
            uploadDate: '2024-01-12',
            size: '2.4 MB',
            processed: true
        }
    ],
    client: [
        {
            id: 'DOC-C001', 
            name: 'Project Requirements',
            source: 'Acme Corporation',
            type: 'specification',
            version: 2,
            uploadDate: '2024-01-10',
            size: '1.8 MB',
            processed: false
        }
    ],
    cis: [
        {
            id: 'DOC-I001',
            name: 'Installation Checklist',
            source: 'CIS Internal',
            type: 'procedure',
            version: 1,
            uploadDate: '2024-01-08',
            size: '856 KB',
            processed: false
        }
    ]
});

// Document type options
const documentTypes = ref({
    vendor: ['Quote', 'Proposal', 'Specification', 'Datasheet', 'Warranty'],
    client: ['Requirements', 'Specification', 'Contract', 'Approval', 'Change Order'],
    cis: ['Procedure', 'Checklist', 'Report', 'Analysis', 'Documentation']
});

// Category options
const categoryOptions = ref([
    'Labor',
    'Materials', 
    'Travel',
    'Other Fees'
]);

// Computed properties for totals
const totalCost = computed(() => {
    return lineItems.value.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);
});

const totalClientCharge = computed(() => {
    return lineItems.value.reduce((sum, item) => sum + calculateClientCharge(item), 0);
});

const totalMarkup = computed(() => {
    return totalClientCharge.value - totalCost.value;
});

const overallMargin = computed(() => {
    if (totalClientCharge.value === 0) return '0.00';
    return ((totalMarkup.value / totalClientCharge.value) * 100).toFixed(2);
});

// Sample data for recent estimates
const recentEstimates = ref([
    {
        id: 'EST-1001',
        client: 'Acme Corporation',
        scope: 'Network Infrastructure Upgrade',
        status: 'Draft',
        cost: 12450.00
    },
    {
        id: 'EST-1002',
        client: 'TechSolutions Inc.',
        scope: 'Server Room Installation',
        status: 'Submitted',
        cost: 28750.00
    },
    {
        id: 'EST-1003',
        client: 'Global Retail',
        scope: 'POS System Deployment',
        status: 'Approved',
        cost: 45200.00
    },
    {
        id: 'EST-1004',
        client: 'Healthcare Partners',
        scope: 'Security System Installation',
        status: 'Rejected',
        cost: 18900.00
    },
    {
        id: 'EST-1005',
        client: 'Financial Services Group',
        scope: 'Data Center Migration',
        status: 'Awaiting Approval',
        cost: 67500.00
    }
]);

// Methods
function getStatusSeverity(status) {
    const severityMap = {
        'Draft': 'secondary',
        'Submitted': 'info',
        'Approved': 'success',
        'Rejected': 'danger',
        'Awaiting Approval': 'warning'
    };
    return severityMap[status] || 'info';
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function refreshEstimates() {
    isLoading.value = true;
    
    // Simulate API call
    setTimeout(() => {
        isLoading.value = false;
        toast.add({
            severity: 'success',
            summary: 'Refreshed',
            detail: 'Estimates data has been refreshed',
            life: 3000
        });
    }, 1000);
}

function viewEstimate(estimate) {
    toast.add({
        severity: 'info',
        summary: 'View Estimate',
        detail: `Viewing estimate ${estimate.id}`,
        life: 3000
    });
}

function editEstimate(estimate) {
    toast.add({
        severity: 'info',
        summary: 'Edit Estimate',
        detail: `Editing estimate ${estimate.id}`,
        life: 3000
    });
}

function downloadEstimate(estimate) {
    toast.add({
        severity: 'success',
        summary: 'Download Started',
        detail: `Downloading PDF for estimate ${estimate.id}`,
        life: 3000
    });
}

// Stepper navigation methods
function nextStep() {
    if (validateCurrentStep()) {
        if (currentStep.value < progressSteps.value.length) {
            currentStep.value++;
        }
    }
}

function previousStep() {
    if (currentStep.value > 1) {
        currentStep.value--;
    }
}

// Form validation
function validateCurrentStep() {
    errors.value = {};
    
    if (currentStep.value === 1) {
        // Remove all required validations for testing
        // Optional email validation if provided
        if (estimateForm.value.contactEmail.trim() && !isValidEmail(estimateForm.value.contactEmail)) {
            errors.value.contactEmail = 'Please enter a valid email address';
        }
    }
    
    return Object.keys(errors.value).length === 0;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Template methods
function getSelectedTemplate() {
    return templateOptions.value.find(template => template.id === estimateForm.value.selectedTemplate);
}

// Save draft functionality
function saveDraft() {
    toast.add({
        severity: 'success',
        summary: 'Draft Saved',
        detail: 'Your estimate draft has been saved successfully',
        life: 3000
    });
}

// Estimate builder navigation
function openEstimateBuilder() {
    showEstimateBuilder.value = true;
    currentStep.value = 1;
    // Reset form
    estimateForm.value = {
        clientName: '',
        projectName: '',
        contactPerson: '',
        contactEmail: '',
        projectOverview: '',
        selectedTemplate: null,
        tasks: '',
        laborRequirements: '',
        materialsEquipment: ''
    };
    errors.value = {};
}

function closeEstimateBuilder() {
    showEstimateBuilder.value = false;
    currentStep.value = 1;
}

// Schedule survey functionality
function scheduleSurvey() {
    toast.add({
        severity: 'info',
        summary: 'Schedule Survey',
        detail: 'Site survey scheduling feature coming soon',
        life: 3000
    });
}

// Line Item Methods
function calculateClientCharge(item) {
    const totalCost = item.quantity * item.unitCost;
    // Calculate client charge based on desired margin
    // If margin is 23.08%, then client charge = cost / (1 - 0.2308)
    if (item.margin && item.margin > 0 && item.margin < 100) {
        return totalCost / (1 - item.margin / 100);
    }
    return totalCost; // No margin if 0 or invalid
}

function getCategorySeverity(category) {
    const severityMap = {
        'Labor': 'info',
        'Materials': 'success',
        'Travel': 'warning',
        'Other Fees': 'secondary'
    };
    return severityMap[category] || 'info';
}

function openLineItemModal() {
    editingLineItem.value = null;
    lineItemForm.value = {
        category: '',
        description: '',
        vendor: '',
        quantity: 1,
        unitCost: 0,
        margin: 23.08 // Default margin
    };
    lineItemErrors.value = {};
    showLineItemModal.value = true;
}

function editLineItem(item) {
    editingLineItem.value = item;
    lineItemForm.value = { ...item };
    lineItemErrors.value = {};
    showLineItemModal.value = true;
}

function closeLineItemModal() {
    showLineItemModal.value = false;
    editingLineItem.value = null;
    lineItemForm.value = {
        category: '',
        description: '',
        vendor: '',
        quantity: 1,
        unitCost: 0,
        margin: 23.08
    };
    lineItemErrors.value = {};
}

function validateLineItem() {
    lineItemErrors.value = {};
    
    if (!lineItemForm.value.category) {
        lineItemErrors.value.category = 'Category is required';
    }
    if (!lineItemForm.value.description.trim()) {
        lineItemErrors.value.description = 'Description is required';
    }
    if (!lineItemForm.value.quantity || lineItemForm.value.quantity < 0.1) {
        lineItemErrors.value.quantity = 'Quantity must be at least 0.1';
    }
    if (!lineItemForm.value.unitCost || lineItemForm.value.unitCost < 0) {
        lineItemErrors.value.unitCost = 'Unit cost must be greater than 0';
    }
    
    return Object.keys(lineItemErrors.value).length === 0;
}

function saveLineItem() {
    if (!validateLineItem()) return;
    
    const lineItem = {
        ...lineItemForm.value,
        id: editingLineItem.value ? editingLineItem.value.id : Date.now()
    };
    
    if (editingLineItem.value) {
        // Update existing item
        const index = lineItems.value.findIndex(item => item.id === editingLineItem.value.id);
        if (index !== -1) {
            lineItems.value[index] = lineItem;
        }
        toast.add({
            severity: 'success',
            summary: 'Line Item Updated',
            detail: 'Line item has been updated successfully',
            life: 3000
        });
    } else {
        // Add new item
        lineItems.value.push(lineItem);
        toast.add({
            severity: 'success',
            summary: 'Line Item Added',
            detail: 'New line item has been added successfully',
            life: 3000
        });
    }
    
    closeLineItemModal();
}

function confirmDeleteLineItem(item) {
    confirm.require({
        message: `Are you sure you want to remove this line item: "${item.description}"?`,
        header: 'Confirm Deletion',
        icon: 'pi pi-exclamation-triangle',
        rejectProps: {
            label: 'Cancel',
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: 'Delete',
            severity: 'danger'
        },
        accept: () => {
            deleteLineItem(item);
        }
    });
}

function deleteLineItem(item) {
    const index = lineItems.value.findIndex(i => i.id === item.id);
    if (index !== -1) {
        lineItems.value.splice(index, 1);
        toast.add({
            severity: 'success',
            summary: 'Line Item Removed',
            detail: 'Line item has been removed successfully',
            life: 3000
        });
    }
}

function updateCalculations() {
    // This method is called when quantity, unit cost, or margin changes
    // The reactive computed properties will automatically update
}

function calculateLineItemClientCharge() {
    if (!lineItemForm.value.quantity || !lineItemForm.value.unitCost) return 0;
    const totalCost = lineItemForm.value.quantity * lineItemForm.value.unitCost;
    // Calculate client charge based on desired margin
    if (lineItemForm.value.margin && lineItemForm.value.margin > 0 && lineItemForm.value.margin < 100) {
        return totalCost / (1 - lineItemForm.value.margin / 100);
    }
    return totalCost;
}

function calculateLineItemMargin() {
    return lineItemForm.value.margin ? lineItemForm.value.margin.toFixed(2) : '0.00';
}

// Vendor management methods
function openAddVendorDialog() {
    newVendorName.value = '';
    showAddVendorDialog.value = true;
}

function addNewVendor() {
    if (newVendorName.value.trim()) {
        vendorOptions.value.push(newVendorName.value.trim());
        lineItemForm.value.vendor = newVendorName.value.trim();
        showAddVendorDialog.value = false;
        newVendorName.value = '';
        toast.add({
            severity: 'success',
            summary: 'Vendor Added',
            detail: 'New vendor has been added successfully',
            life: 3000
        });
    }
}

function cancelAddVendor() {
    showAddVendorDialog.value = false;
    newVendorName.value = '';
}

// Site Survey Methods
function openSiteSurveyModal() {
    // Pre-populate with estimate form data
    siteSurveyForm.value.clientName = estimateForm.value.clientName;
    siteSurveyForm.value.projectName = estimateForm.value.projectName;
    siteSurveyForm.value.contactPerson = estimateForm.value.contactPerson;
    siteSurveyForm.value.contactEmail = estimateForm.value.contactEmail;
    
    siteSurveyErrors.value = {};
    showSiteSurveyModal.value = true;
}

function closeSiteSurveyModal() {
    showSiteSurveyModal.value = false;
    siteSurveyForm.value = {
        clientName: '',
        projectName: '',
        contactPerson: '',
        contactEmail: '',
        locationAddress: '',
        locationCity: '',
        locationState: '',
        locationZip: '',
        surveyVendor: '',
        estimatedCost: 0,
        costUnknown: false,
        surveyDate: null,
        notes: ''
    };
    siteSurveyErrors.value = {};
}

function submitSiteSurvey() {
    if (!validateSiteSurvey()) return;
    
    const newSurvey = {
        id: `SS-${String(siteSurveys.value.length + 1).padStart(3, '0')}`,
        vendor: siteSurveyForm.value.surveyVendor,
        location: `${siteSurveyForm.value.locationAddress}, ${siteSurveyForm.value.locationCity}, ${siteSurveyForm.value.locationState} ${siteSurveyForm.value.locationZip}`,
        status: 'Scheduled',
        scheduledDate: siteSurveyForm.value.surveyDate,
        estimatedCost: siteSurveyForm.value.costUnknown ? 0 : siteSurveyForm.value.estimatedCost,
        actualCost: null
    };
    
    siteSurveys.value.push(newSurvey);
    closeSiteSurveyModal();
    
    toast.add({
        severity: 'success',
        summary: 'Site Survey Requested',
        detail: `Survey request sent to ${siteSurveyForm.value.surveyVendor}`,
        life: 3000
    });
}

function validateSiteSurvey() {
    siteSurveyErrors.value = {};
    
    if (!siteSurveyForm.value.locationAddress.trim()) {
        siteSurveyErrors.value.locationAddress = 'Address is required';
    }
    if (!siteSurveyForm.value.locationCity.trim()) {
        siteSurveyErrors.value.locationCity = 'City is required';
    }
    if (!siteSurveyForm.value.locationState.trim()) {
        siteSurveyErrors.value.locationState = 'State is required';
    }
    if (!siteSurveyForm.value.surveyVendor.trim()) {
        siteSurveyErrors.value.surveyVendor = 'Vendor is required';
    }
    
    return Object.keys(siteSurveyErrors.value).length === 0;
}

function getSurveyStatusSeverity(status) {
    const severityMap = {
        'Scheduled': 'info',
        'Completed': 'success',
        'Cancelled': 'danger',
        'In Progress': 'warning'
    };
    return severityMap[status] || 'info';
}

// Document Management Methods
function openDocumentModal() {
    documentForm.value = {
        name: '',
        type: 'vendor',
        category: '',
        source: '',
        version: 1,
        parentDocumentId: null,
        isNewVersion: false,
        notes: ''
    };
    documentErrors.value = {};
    showDocumentModal.value = true;
}

function openDocumentProcessor() {
    showDocumentProcessor.value = true;
}

function viewDocument(doc) {
    selectedDocument.value = doc;
    showDocumentViewer.value = true;
}

function downloadDocument(doc) {
    toast.add({
        severity: 'info',
        summary: 'Download Started',
        detail: `Downloading ${doc.name}`,
        life: 3000
    });
}

// Utility Methods
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
}

function submitEstimate() {
    toast.add({
        severity: 'success',
        summary: 'Estimate Submitted',
        detail: 'Your estimate has been submitted successfully',
        life: 3000
    });
}

function completeEstimate() {
    toast.add({
        severity: 'success',
        summary: 'Estimate Complete',
        detail: 'Estimate process completed successfully',
        life: 3000
    });
    closeEstimateBuilder();
}

// Lifecycle
onMounted(() => {
    // Initialize component
    console.log('EstimatesView mounted');
});
</script>

<style scoped>
.estimates-page {
    padding: 1rem;
}

.tab-content {
    min-height: 60vh;
}

.card {
    background: white;
    border-radius: 8px;
    padding: 1.5rem;
    border: 1px solid var(--surface-border);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
}

.dark .card {
    background: var(--surface-900);
    border-color: var(--surface-700);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .estimates-page {
        padding: 0.5rem;
    }
    
    .card {
        padding: 1rem;
    }
}

/* Enhanced table styling */
:deep(.p-datatable-sm .p-datatable-tbody > tr > td) {
    padding: 0.75rem 1rem;
}

:deep(.p-tabmenu .p-tabmenu-nav) {
    border-radius: 8px 8px 0 0;
}

:deep(.p-tabmenu .p-tabmenuitem .p-menuitem-link) {
    border-radius: 8px 8px 0 0;
    transition: all 0.2s;
}

/* Stepper styling */
.estimate-stepper {
    margin-top: 1rem;
}

.step-content {
    padding: 1rem 0;
}

.scope-selector {
    background: var(--surface-50);
    border-radius: 8px;
    padding: 0.25rem;
}

.dark .scope-selector {
    background: var(--surface-800);
}

:deep(.p-selectbutton .p-button) {
    border-radius: 6px !important;
    margin: 0 2px;
}

/* Progress indicator styling */
.progress-step {
    transition: all 0.3s ease;
}

.progress-step.active {
    transform: scale(1.1);
}

/* Form field styling */
.field {
    margin-bottom: 1rem;
}

.field label {
    font-weight: 500;
}

/* Template preview styling */
.template-preview {
    background: var(--surface-50);
    border: 1px solid var(--surface-200);
    border-radius: 8px;
    padding: 1rem;
    margin-top: 1rem;
}

.dark .template-preview {
    background: var(--surface-800);
    border-color: var(--surface-700);
}

/* Estimate builder overlay styling */
.estimate-builder-overlay {
    min-height: 100vh;
    padding: 1rem;
}

.builder-header {
    margin-bottom: 2rem;
}

/* Responsive adjustments for builder */
@media (max-width: 768px) {
    .estimate-builder-overlay {
        padding: 0.5rem;
    }
    
    .builder-header h2 {
        font-size: 1.5rem;
    }
}
</style> 