import { onMounted } from 'vue';

/**
 * Composable for setting page metadata like title
 * @param {string} title - The page title to set
 */
export function useMeta(title) {
  onMounted(() => {
    if (title) {
      document.title = `${title} | Triton Admin`;
    }
  });
} 