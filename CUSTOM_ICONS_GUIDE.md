# Custom Icons Guide - Triton Frontend

This guide explains how to add and use custom icons for warning messages, toast notifications, and other UI elements in the Triton Frontend project.

## Quick Summary

- **Format**: SVG (preferred) or PNG with transparent background
- **Size**: 24x24px (standard), 16x16px (small), 32x32px (large)
- **Location**: `src/assets/icons/[category]/[icon-name].svg`
- **Integration**: 3 methods available (SVG imports, Vue components, Font Awesome)

## Directory Structure

```
src/assets/icons/
├── warnings/              # Warning-specific icons
│   ├── warning-custom.svg
│   ├── alert-triangle.svg
│   └── critical-warning.svg
├── notifications/         # Toast/notification icons
│   ├── success-check.svg
│   ├── info-circle.svg
│   └── error-x.svg
├── system/               # System/UI icons
├── business/            # Business-specific icons
└── index.js            # Icon registry/barrel export
```

## Icon Specifications

### Format Requirements
- **SVG**: Preferred format for scalability and theming
- **Viewbox**: Use `0 0 24 24` for consistency
- **Color**: Use `currentColor` for theme compatibility
- **Style**: Match your design system (outlined, filled, or mixed)

### Size Guidelines
- **Small**: 16x16px (inline text, small buttons)
- **Standard**: 24x24px (most UI elements)
- **Large**: 32x32px (headers, featured content)
- **Extra Large**: 48x48px+ (hero sections, empty states)

### Design Principles
- **Consistency**: Follow your existing icon style (PrimeIcons or Font Awesome)
- **Accessibility**: Ensure sufficient contrast and recognizable shapes
- **Clarity**: Simple, clear designs that work at small sizes
- **Theme Support**: Use `currentColor` for automatic light/dark mode support

## Implementation Methods

### Method 1: Direct SVG Imports (Recommended)

**Pros**: Simple, lightweight, good for static icons
**Best for**: Warning messages, decorative icons

```vue
<template>
  <!-- In warning messages -->
  <Message severity="warn">
    <template #icon>
      <img :src="warningIcons.warningCustom" alt="Warning" class="w-5 h-5" />
    </template>
    Your warning message here
  </Message>
</template>

<script setup>
import { warningIcons } from '@/assets/icons';
</script>
```

### Method 2: Vue Component Wrapper (Recommended for complex usage)

**Pros**: Type safety, props validation, consistent sizing, theme integration
**Best for**: Reusable icons with dynamic properties

```vue
<template>
  <!-- In components -->
  <CustomIcon name="warning-custom" category="warnings" size="20" />
  
  <!-- In toast content (custom) -->
  <div class="flex items-center gap-2">
    <CustomIcon name="toast-success" category="notifications" size="16" />
    <span>Success message</span>
  </div>
</template>

<script setup>
import CustomIcon from '@/components/icons/CustomIcon.vue';
</script>
```

### Method 3: Font Awesome Integration (Recommended for consistency)

**Pros**: Consistent with existing icons, works with PrimeVue's icon props
**Best for**: Toast messages, buttons, system-wide usage

```vue
<script setup>
import { useToast } from 'primevue/usetoast';

const toast = useToast();

function showCustomWarning() {
  toast.add({
    severity: 'warn',
    summary: 'Warning',
    detail: 'Custom warning message',
    icon: 'custom-warning-triangle', // Your custom icon
    life: 3000
  });
}
</script>
```

## Integration with PrimeVue Components

### Toast Messages
```javascript
// Using custom icons in toasts
toast.add({
  severity: 'info',
  summary: 'Custom Info',
  detail: 'Message with custom icon',
  icon: 'custom-info-circle', // Custom Font Awesome icon
  life: 3000
});
```

### Message Components
```vue
<!-- Using template slot for custom icon -->
<Message severity="warn">
  <template #icon>
    <CustomIcon name="warning-custom" category="warnings" size="20" />
  </template>
  Your warning message here
</Message>
```

### Buttons
```vue
<!-- Custom icon in button -->
<Button>
  <template #icon>
    <CustomIcon name="warning-custom" category="warnings" size="16" class="mr-2" />
  </template>
  Warning Action
</Button>
```

### Dialog Headers
```vue
<Dialog header="Warning" :modal="true">
  <template #header>
    <div class="flex items-center gap-2">
      <CustomIcon name="warning-custom" category="warnings" size="20" />
      <span>Custom Warning</span>
    </div>
  </template>
</Dialog>
```

## File Organization

### Icon Categories
- `warnings/` - Alert triangles, exclamation marks, caution signs
- `notifications/` - Success checks, info circles, error X's
- `system/` - UI controls, navigation, settings
- `business/` - Domain-specific icons (finance, shipping, etc.)

### Naming Convention
- Use kebab-case: `warning-triangle.svg`
- Be descriptive: `critical-alert.svg` vs `alert.svg`
- Include context: `toast-success.svg` vs `success.svg`

## Adding New Icons

### Step 1: Create SVG File
```svg
<!-- src/assets/icons/warnings/my-warning.svg -->
<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M12 2L22 20H2L12 2Z" stroke="currentColor" stroke-width="2"/>
  <path d="M12 9V13" stroke="currentColor" stroke-width="2"/>
  <path d="M12 17H12.01" stroke="currentColor" stroke-width="2"/>
</svg>
```

### Step 2: Register in Index (for direct imports)
```javascript
// src/assets/icons/index.js
import MyWarning from './warnings/my-warning.svg?url';

export const warningIcons = {
  // ... existing icons
  myWarning: MyWarning,
};
```

### Step 3: Use in Components
```vue
<template>
  <CustomIcon name="my-warning" category="warnings" size="24" />
</template>
```

## Best Practices

### Performance
- **Lazy Loading**: Use dynamic imports for large icon sets
- **Tree Shaking**: Only import icons you actually use
- **SVG Optimization**: Use tools like SVGO to minimize file size
- **Caching**: SVG files are cached by browsers automatically

### Accessibility
- **Alt Text**: Always provide meaningful alt text for images
- **ARIA Labels**: Use `aria-label` for decorative icons
- **Semantic HTML**: Use appropriate roles and landmarks
- **Color Independence**: Don't rely solely on color to convey meaning

### Maintenance
- **Documentation**: Document the purpose of each custom icon
- **Versioning**: Track icon changes in your version control
- **Consistency**: Regular audits to ensure design consistency
- **Cleanup**: Remove unused icons periodically

## Theme Integration

### Light/Dark Mode Support
```scss
// Icons automatically inherit theme colors when using currentColor
.custom-icon {
  color: var(--text-color); // PrimeVue theme variable
}

// Or specific theme colors
.warning-icon {
  color: var(--yellow-500);
}

.dark .warning-icon {
  color: var(--yellow-400);
}
```

### Brand Colors
```vue
<!-- Using your CIS brand colors -->
<CustomIcon 
  name="warning-custom" 
  category="warnings" 
  color="var(--cis-yellow-500)" 
  size="20" 
/>
```

## Examples in Your Project

Your project already uses icons effectively. Here's how to enhance with custom icons:

### Enhanced Toast Notifications
```javascript
// In your existing toast functions
function showEnhancedWarning() {
  toast.add({
    severity: 'warn',
    summary: 'Enhanced Warning',
    detail: 'This uses your custom warning icon',
    icon: 'custom-warning-triangle',
    life: 4000
  });
}
```

### Financial Dashboard Icons
```vue
<!-- In your finance components -->
<Card>
  <template #title>
    <div class="flex items-center gap-2">
      <CustomIcon name="finance-alert" category="business" size="24" />
      <span>Financial Alert</span>
    </div>
  </template>
</Card>
```

### Dispatch System Icons
```vue
<!-- In your dispatch components -->
<Tag severity="danger">
  <CustomIcon name="critical-issue" category="system" size="14" class="mr-1" />
  Critical
</Tag>
```

## Troubleshooting

### Common Issues
1. **Icon not showing**: Check file path and import statement
2. **Wrong size**: Verify size prop and CSS
3. **Color not changing**: Ensure you're using `currentColor` in SVG
4. **Performance issues**: Implement lazy loading for large icon sets

### Debug Tips
```vue
<!-- Debug icon loading -->
<template>
  <div>
    Icon URL: {{ warningIcons.warningCustom }}
    <img :src="warningIcons.warningCustom" alt="Debug" />
  </div>
</template>
```

## Migration from Existing Icons

If you want to replace existing PrimeIcons or Font Awesome icons:

1. **Identify usage**: Search for existing icon usage
2. **Create custom version**: Design your custom replacement
3. **Update gradually**: Replace icons component by component
4. **Test thoroughly**: Ensure all sizes and themes work correctly

## Conclusion

Custom icons should enhance your application's visual identity while maintaining performance and accessibility. Choose the implementation method that best fits your use case:

- **Direct SVG imports**: For simple, static icons
- **Vue components**: For dynamic, reusable icons
- **Font Awesome integration**: For consistency with existing icon usage

The examples and structure provided give you a solid foundation to build upon. Start with a few key icons and gradually expand your custom icon library as needed. 