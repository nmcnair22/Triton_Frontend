<script setup>
import { computed } from 'vue';
import { formatPercent } from '@/utils/money';

const props = defineProps({
  value: { type: [Number, String], default: 0 },
  digits: { type: Number, default: 2 },
  warnBelow: { type: Number, default: null },
  goodClass: { type: String, default: 'text-blue-600 dark:text-blue-400' },
  warnClass: { type: String, default: 'text-orange-600 dark:text-orange-400' },
  badClass: { type: String, default: 'text-red-500' }
});

const cls = computed(() => {
  const n = Number(props.value) || 0;
  if (props.warnBelow == null) return props.goodClass;
  return n < props.warnBelow ? props.warnClass : props.goodClass;
});

const text = computed(() => formatPercent(Number(props.value) || 0, { digits: props.digits }));
</script>

<template>
  <span :class="cls">{{ text }}</span>
</template>

