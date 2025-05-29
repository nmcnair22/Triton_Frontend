// Custom Icon Registry
// Import all custom SVG icons

// Warning Icons
import WarningCustom from './warnings/warning-custom.svg?url';

// Notification Icons
import ToastSuccess from './notifications/toast-success.svg?url';

// Export organized icon groups
export const warningIcons = {
  warningCustom: WarningCustom,
};

export const notificationIcons = {
  toastSuccess: ToastSuccess,
};

// Export all icons as a flat object for easier access
export const customIcons = {
  ...warningIcons,
  ...notificationIcons,
};

// Export default for bulk import
export default customIcons; 