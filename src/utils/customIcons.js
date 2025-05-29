import { library } from '@fortawesome/fontawesome-svg-core';

// Custom icon definitions that follow Font Awesome format
export const customWarningTriangle = {
  prefix: 'custom',
  iconName: 'warning-triangle',
  icon: [24, 24, [], '', 'M12 2L22 20H2L12 2ZM12 9V13M12 17H12.01']
};

export const customToastSuccess = {
  prefix: 'custom',
  iconName: 'toast-success', 
  icon: [24, 24, [], '', 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z']
};

// Add custom icons to Font Awesome library
export function registerCustomIcons() {
  library.add(
    customWarningTriangle,
    customToastSuccess
  );
}

// Export all custom icons for reference
export const customIcons = {
  customWarningTriangle,
  customToastSuccess
}; 