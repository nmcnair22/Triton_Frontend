<template>
  <div class="contract-templates-view">
    <!-- Header Section -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h4 class="text-lg font-bold">Contract Templates</h4>
        <p class="text-gray-600">Pre-configured contract templates for different customer types</p>
      </div>
      <div class="flex gap-2">
        <Button 
          label="Create Template" 
          icon="pi pi-plus" 
          severity="success"
          @click="createTemplate"
        />
      </div>
    </div>

    <!-- Templates Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <!-- Standard Service Agreement -->
      <Card class="template-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex items-center">
              <i class="pi pi-file-edit text-blue-500 mr-2 text-xl"></i>
              <div>
                <h5 class="font-bold">Standard Service Agreement</h5>
                <p class="text-sm text-gray-600">Basic service contract template</p>
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-3">
            <div class="text-sm">
              <div class="text-gray-600">Default Terms:</div>
              <ul class="list-disc list-inside text-xs space-y-1 mt-1">
                <li>12-month minimum term</li>
                <li>Bronze tier pricing</li>
                <li>30-day notice for changes</li>
                <li>Standard SLA included</li>
              </ul>
            </div>
            
            <div class="flex gap-2 pt-3 border-t">
              <Button 
                label="Use Template" 
                size="small" 
                @click="useTemplate('standard')"
              />
              <Button 
                label="Edit" 
                size="small" 
                text
                @click="editTemplate('standard')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Enterprise Contract -->
      <Card class="template-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex items-center">
              <i class="pi pi-building text-purple-500 mr-2 text-xl"></i>
              <div>
                <h5 class="font-bold">Enterprise Contract</h5>
                <p class="text-sm text-gray-600">Large customer contract template</p>
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-3">
            <div class="text-sm">
              <div class="text-gray-600">Default Terms:</div>
              <ul class="list-disc list-inside text-xs space-y-1 mt-1">
                <li>36-month minimum term</li>
                <li>Gold/Platinum tier pricing</li>
                <li>60-day notice for changes</li>
                <li>Premium SLA included</li>
                <li>Custom pricing options</li>
              </ul>
            </div>
            
            <div class="flex gap-2 pt-3 border-t">
              <Button 
                label="Use Template" 
                size="small" 
                @click="useTemplate('enterprise')"
              />
              <Button 
                label="Edit" 
                size="small" 
                text
                @click="editTemplate('enterprise')"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Volume Discount Agreement -->
      <Card class="template-card">
        <template #header>
          <div class="p-4 pb-0">
            <div class="flex items-center">
              <i class="pi pi-percentage text-green-500 mr-2 text-xl"></i>
              <div>
                <h5 class="font-bold">Volume Discount Agreement</h5>
                <p class="text-sm text-gray-600">High-volume customer template</p>
              </div>
            </div>
          </div>
        </template>
        
        <template #content>
          <div class="space-y-3">
            <div class="text-sm">
              <div class="text-gray-600">Default Terms:</div>
              <ul class="list-disc list-inside text-xs space-y-1 mt-1">
                <li>24-month minimum term</li>
                <li>Tiered volume discounts</li>
                <li>Quarterly pricing reviews</li>
                <li>Enhanced SLA included</li>
                <li>Bundle pricing available</li>
              </ul>
            </div>
            
            <div class="flex gap-2 pt-3 border-t">
              <Button 
                label="Use Template" 
                size="small" 
                @click="useTemplate('volume')"
              />
              <Button 
                label="Edit" 
                size="small" 
                text
                @click="editTemplate('volume')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
const createTemplate = () => {
  console.log('Creating new template...');
};

const useTemplate = (templateType) => {
  console.log('Using template:', templateType);
};

const editTemplate = (templateType) => {
  console.log('Editing template:', templateType);
};
</script>

<style scoped>
.contract-templates-view {
  @apply space-y-6;
}

.template-card {
  @apply transition-shadow duration-200;
}

.template-card:hover {
  @apply shadow-lg;
}
</style>
