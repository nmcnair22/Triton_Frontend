<template>
  <div class="space-y-3">
    <div class="grid grid-cols-2 xl:grid-cols-7 gap-3">
      <template v-if="loading">
        <Card v-for="index in 7" :key="index" class="shadow-sm">
          <template #content>
            <div class="space-y-3">
              <Skeleton width="7rem" height="1rem" />
              <Skeleton width="4rem" height="2rem" />
              <Skeleton width="6rem" height="0.875rem" />
            </div>
          </template>
        </Card>
      </template>

      <template v-else>
        <StatsCard title="Total Visits" :value="summary.total_visits" icon="pi pi-calendar" color="primary" />
        <StatsCard title="Ready to Send" :value="summary.ready_to_push" icon="pi pi-send" color="success" />
        <StatsCard title="Past Due" :value="summary.past_due" icon="pi pi-clock" color="warning" />
        <StatsCard title="Blocked / Ineligible" :value="otherBlockedCount" icon="pi pi-ban" color="danger" />
        <StatsCard title="Sent" :value="summary.sent" icon="pi pi-cloud-upload" color="info" />
        <StatsCard title="Awaiting Call" :value="summary.awaiting_call" icon="pi pi-phone" color="warning" />
        <StatsCard title="Completed" :value="summary.completed" icon="pi pi-check-circle" color="success" />
      </template>
    </div>

    <Card class="shadow-sm">
      <template #content>
        <div class="flex flex-wrap items-center gap-2.5">
          <Tag :value="`Past Due ${summary.past_due}`" severity="warn" />
          <Tag :value="`Needs Update ${summary.needs_update}`" severity="warning" />
          <Tag :value="`Push Failed ${summary.push_failed}`" severity="danger" />
          <Tag :value="`Transferred ${summary.transferred}`" severity="info" />
          <Tag :value="`Failed Calls ${summary.failed}`" severity="danger" />
          <Tag :value="`SMS Sent ${summary.sms_sent}`" severity="contrast" />
          <Chip :label="`Completion ${(summary.completion_rate * 100).toFixed(0)}%`" icon="pi pi-chart-line" />
          <Chip :label="`Transfer ${(summary.transfer_rate * 100).toFixed(0)}%`" icon="pi pi-arrow-right-arrow-left" />
        </div>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import StatsCard from '@/components/field-services/StatsCard.vue';

const props = defineProps({
  summary: {
    type: Object,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const otherBlockedCount = computed(() => Math.max((props.summary?.not_ready || 0) - (props.summary?.past_due || 0), 0));
</script>
