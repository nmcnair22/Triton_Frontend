<template>
  <div class="p-6">
    <Card>
      <template #title>Custom Icon Usage Examples</template>
      <template #content>
        
        <!-- Toast Examples with Custom Icons -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Toast Messages with Custom Icons</h3>
          <div class="flex flex-wrap gap-2">
            <Button @click="showCustomSuccessToast" label="Custom Success" severity="success" />
            <Button @click="showCustomWarningToast" label="Custom Warning" severity="warn" />
            <Button @click="showCustomErrorToast" label="Custom Error" severity="danger" />
          </div>
        </div>

        <!-- Warning Messages with Custom Icons -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Warning Messages with Custom Icons</h3>
          
          <!-- Method 1: Direct SVG import -->
          <Message severity="warn" class="mb-4">
            <template #icon>
              <img :src="warningIcons.warningCustom" alt="Warning" class="w-5 h-5" />
            </template>
            This is a warning with a custom icon (Direct SVG)
          </Message>

          <!-- Method 2: CustomIcon component -->
          <Message severity="error" class="mb-4">
            <template #icon>
              <CustomIcon name="warning-custom" category="warnings" size="20" />
            </template>
            This is an error with a custom icon (Vue Component)
          </Message>

          <!-- Method 3: Font Awesome custom icon -->
          <Message severity="info" class="mb-4">
            <template #icon>
              <font-awesome-icon icon="custom-toast-success" class="text-blue-500" />
            </template>
            This is an info message with Font Awesome custom icon
          </Message>
        </div>

        <!-- Inline Warning with Custom Icon -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Inline Warnings</h3>
          <div class="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <CustomIcon name="warning-custom" category="warnings" size="18" color="#F59E0B" />
            <span class="text-yellow-800 dark:text-yellow-200">
              Please review your input before proceeding
            </span>
          </div>
        </div>

        <!-- Button with Custom Icons -->
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-4">Buttons with Custom Icons</h3>
          <div class="flex gap-2">
            <Button severity="warn">
              <template #icon>
                <CustomIcon name="warning-custom" category="warnings" size="16" class="mr-2" />
              </template>
              Warning Action
            </Button>
            
            <Button severity="success">
              <template #icon>
                <CustomIcon name="toast-success" category="notifications" size="16" class="mr-2" />
              </template>
              Success Action
            </Button>
          </div>
        </div>

      </template>
    </Card>
    
    <Toast />
  </div>
</template>

<script setup>
import { useToast } from 'primevue/usetoast';
import Card from 'primevue/card';
import Button from 'primevue/button';
import Message from 'primevue/message';
import Toast from 'primevue/toast';
import CustomIcon from '@/components/icons/CustomIcon.vue';
import { warningIcons, notificationIcons } from '@/assets/icons';

const toast = useToast();

// Toast functions with custom icons
function showCustomSuccessToast() {
  toast.add({
    severity: 'success',
    summary: 'Success',
    detail: 'Operation completed successfully',
    life: 3000,
    icon: 'custom-toast-success' // Using custom Font Awesome icon
  });
}

function showCustomWarningToast() {
  toast.add({
    severity: 'warn',
    summary: 'Warning',
    detail: 'Please check your input',
    life: 3000,
    icon: 'custom-warning-triangle' // Using custom Font Awesome icon
  });
}

function showCustomErrorToast() {
  toast.add({
    severity: 'error',
    summary: 'Error',
    detail: 'Something went wrong',
    life: 3000,
    icon: 'pi pi-times-circle' // Using PrimeIcons as fallback
  });
}
</script>

<style scoped>
/* Add any component-specific styles here */
</style> 