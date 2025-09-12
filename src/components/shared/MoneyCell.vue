<script setup>
import { computed } from 'vue';
import { formatCurrency } from '@/utils/money';

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  currency: { type: String, default: 'USD' },
  locale: { type: String, default: 'en-US' },
  negativeClass: { type: String, default: 'text-red-500' },
  positiveClass: { type: String, default: 'text-green-600 dark:text-green-400' },
  neutralClass: { type: String, default: 'text-surface-900 dark:text-surface-0' }
});

const text = computed(() => formatCurrency(Number(props.value) || 0, { currency: props.currency, locale: props.locale }));
const cls = computed(() => {
  const v = Number(props.value) || 0;
  if (v < 0) return props.negativeClass;
  if (v > 0) return props.positiveClass;
  return props.neutralClass;
});
</script>

<template>
  <span :class="cls">{{ text }}</span>
  <slot />
  
</template>

