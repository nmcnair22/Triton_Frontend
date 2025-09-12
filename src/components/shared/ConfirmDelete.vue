<script setup>
import Button from 'primevue/button';
import ConfirmDialog from 'primevue/confirmdialog';
import { useConfirm } from 'primevue/useconfirm';

const props = defineProps({
  label: { type: String, default: 'Delete' },
  severity: { type: String, default: 'danger' },
  message: { type: String, default: 'Are you sure you want to delete this item?' },
  icon: { type: String, default: 'pi pi-trash' },
  size: { type: String, default: 'small' }
});

const emit = defineEmits(['confirm']);
const confirm = useConfirm();

function onClick() {
  confirm.require({
    message: props.message,
    header: 'Confirm Deletion',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: { label: 'Cancel', severity: 'secondary', outlined: true },
    acceptProps: { label: 'Delete', severity: props.severity },
    accept: () => emit('confirm')
  });
}
</script>

<template>
  <Button :icon="icon" :label="label" :severity="severity" :size="size" text rounded @click="onClick" />
  <ConfirmDialog />
</template>

