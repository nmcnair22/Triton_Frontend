<script setup>
import Tag from 'primevue/tag';

const props = defineProps({
  status: { type: String, default: 'Draft' }
});

function getSeverity(status) {
  const map = {
    Draft: 'secondary',
    Submitted: 'info',
    'Awaiting Approval': 'warning',
    Approved: 'success',
    'Client Sent': 'info',
    Accepted: 'success',
    Rejected: 'danger',
    Converted: 'success'
  };
  return map[status] || 'info';
}
</script>

<template>
  <Tag :value="status" :severity="getSeverity(status)" />
</template>

