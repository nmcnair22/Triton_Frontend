<script setup>
import { computed, ref } from 'vue';
import { hasPermission } from '@/utils/rbac';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Field Services',
        icon: 'pi pi-home',
        items: [
            {
                label: 'Dispatch Dashboard',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/field-services/dispatch-dashboard',
                visible: false
            },
            {
                label: 'Call Operations',
                icon: 'pi pi-fw pi-phone',
                to: '/field-services/visit-management'
            },
            {
                label: 'Estimates / Quotes',
                icon: 'pi pi-fw pi-calculator',
                to: '/field-services/estimates',
                visible: false
            }
        ]
    },
    { separator: true },
    {
        label: 'Streamline',
        icon: 'pi pi-chart-line',
        visible: false,
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-building-columns',
                to: '/streamline/dashboard'
            },
            {
                label: 'Bill Management',
                icon: 'pi pi-fw pi-money-bill',
                items: [
                    {
                        label: 'Bill Management',
                        icon: 'pi pi-fw pi-money-bill',
                        to: '/streamline/bill-management'
                    },
                    {
                        label: 'Bill Import',
                        icon: 'pi pi-fw pi-file-import',
                        to: '/streamline/bill-import'
                    },
                    {
                        label: 'New Bill',
                        icon: 'pi pi-fw pi-plus',
                        to: '/streamline/bills/new'
                    },
                    {
                        label: 'Custom Charges',
                        icon: 'pi pi-fw pi-tag',
                        to: '/streamline/custom-charges'
                    }
                ]
            },
            {
                label: 'Contracts',
                icon: 'pi pi-fw pi-file-edit',
                items: [
                    {
                        label: 'Contract List',
                        icon: 'pi pi-fw pi-list',
                        to: '/streamline/contracts'
                    },
                    {
                        label: 'New Contract',
                        icon: 'pi pi-fw pi-plus',
                        to: '/streamline/contracts/new'
                    }
                ]
            },
            {
                label: 'Order Management',
                icon: 'pi pi-fw pi-shopping-cart',
                items: [
                    {
                        label: 'Orders',
                        icon: 'pi pi-fw pi-shopping-cart',
                        to: '/streamline/orders'
                    },
                    {
                        label: 'New Order',
                        icon: 'pi pi-fw pi-plus',
                        to: '/streamline/orders/new'
                    }
                ]
            },
            {
                label: 'Ticketing',
                icon: 'pi pi-fw pi-ticket',
                items: [
                    {
                        label: 'Tickets',
                        icon: 'pi pi-fw pi-ticket',
                        to: '/streamline/tickets'
                    },
                    {
                        label: 'New Ticket',
                        icon: 'pi pi-fw pi-plus',
                        to: '/streamline/tickets/new'
                    }
                ]
            },
            {
                label: 'Reference',
                icon: 'pi pi-fw pi-database',
                items: [
                    {
                        label: 'Carriers',
                        icon: 'pi pi-fw pi-building',
                        to: '/streamline/carriers'
                    },
                    {
                        label: 'Account Types',
                        icon: 'pi pi-fw pi-tags',
                        to: '/streamline/account-types'
                    }
                ]
            }
        ]
    },
    { separator: true },
    {
        label: 'TEM (Telecom Expense Management)',
        icon: 'pi pi-phone',
        visible: false,
        items: [
            {
                label: 'Customers',
                icon: 'pi pi-fw pi-building',
                to: '/tem/customers'
            },
            {
                label: 'Locations',
                icon: 'pi pi-fw pi-map-marker',
                to: '/tem/locations'
            },
            {
                label: 'Account Inventory',
                icon: 'pi pi-fw pi-credit-card',
                to: '/tem/accounts'
            },
            {
                label: 'Bill Management',
                icon: 'pi pi-fw pi-file-text',
                to: '/tem/bills'
            },
            {
                label: 'Audit Center',
                icon: 'pi pi-fw pi-search',
                items: [
                    {
                        label: 'Variance Analysis',
                        icon: 'pi pi-fw pi-chart-line',
                        to: '/tem/audit/variance'
                    },
                    {
                        label: 'Missing Bills',
                        icon: 'pi pi-fw pi-exclamation-triangle',
                        to: '/tem/audit/missing-bills'
                    },
                    {
                        label: 'Exception Queue',
                        icon: 'pi pi-fw pi-flag',
                        to: '/tem/audit/exceptions'
                    }
                ]
            }
        ]
    },
    { separator: true },
    {
        label: 'Audit Workbench',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'Audit Dashboard',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/audit/291/dashboard'
            },
            {
                label: 'Customer Management',
                icon: 'pi pi-fw pi-building',
                to: '/audit/291/customer'
            },
            {
                label: 'Locations',
                icon: 'pi pi-fw pi-map',
                to: '/audit/291/locations'
            }
        ]
    },
    { separator: true },
    {
        label: 'Customers',
        icon: 'pi pi-users',
        visible: false,
        items: [
            {
                label: 'Customer List',
                icon: 'pi pi-fw pi-users',
                to: '/customers'
            }
        ]
    },
    { separator: true },
    {
        label: 'Accounting',
        icon: 'pi pi-calculator',
        items: [
            {
                label: 'Invoicing',
                icon: 'pi pi-fw pi-dollar',
                to: '/accounting/invoicing'
            },
            {
                label: 'Invoice Templates',
                icon: 'pi pi-fw pi-file',
                to: '/accounting/invoice-templates'
            },
            {
                label: 'Cash Application',
                icon: 'pi pi-fw pi-money-bill',
                to: '/accounting/cash-application',
                visible: false
            },
            {
                label: 'Accounting Dashboard',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/accounting/dashboard',
                visible: false
            }
        ]
    },
    { separator: true },
    {
        label: 'Billing',
        icon: 'pi pi-credit-card',
        visible: false,
        items: [
            {
                label: 'Subscriptions',
                icon: 'pi pi-fw pi-sync',
                to: '/billing/subscriptions'
            },
            {
                label: 'Create Subscription',
                icon: 'pi pi-fw pi-plus',
                to: '/billing/subscriptions/create'
            },
            {
                label: 'Payment Methods',
                icon: 'pi pi-fw pi-credit-card',
                to: '/billing/payment-methods'
            },
            {
                label: 'Billing Portal',
                icon: 'pi pi-fw pi-external-link',
                to: '/billing/portal'
            }
        ]
    },
    { separator: true },
    {
        label: 'Inventory',
        icon: 'pi pi-box',
        visible: false,
        items: [
            {
                label: 'Equipment Database',
                icon: 'pi pi-fw pi-database',
                to: '/inventory/equipment'
            },
            {
                label: 'Add Equipment',
                icon: 'pi pi-fw pi-plus',
                to: '/inventory/equipment/add'
            },
            {
                label: 'Equipment Types',
                icon: 'pi pi-fw pi-list',
                to: '/inventory/equipment-types'
            },
            {
                label: 'Check In/Out',
                icon: 'pi pi-fw pi-sync',
                to: '/inventory/check-in-out'
            }
        ]
    },
    { separator: true },
    {
        label: 'Admin',
        icon: 'pi pi-briefcase',
        items: [
            {
                label: 'Business Details',
                icon: 'pi pi-fw pi-building',
                to: '/admin/business'
            },
            {
                label: 'Devices',
                icon: 'pi pi-fw pi-mobile',
                to: '/admin/devices'
            },
            {
                label: 'Integrations',
                icon: 'pi pi-fw pi-link',
                to: '/admin/integrations'
            },
            {
                label: 'Activity Log',
                icon: 'pi pi-fw pi-book',
                to: '/admin/activity'
            },
            {
                label: 'Users',
                icon: 'pi pi-fw pi-user',
                items: [
                    {
                        label: 'User List',
                        icon: 'pi pi-fw pi-users',
                        to: '/admin/users'
                    },
                    {
                        label: 'Roles',
                        icon: 'pi pi-fw pi-lock',
                        to: '/admin/roles'
                    },
                    {
                        label: 'Permissions',
                        icon: 'pi pi-fw pi-key',
                        to: '/admin/permissions'
                    },
                    {
                        label: 'Invite User',
                        icon: 'pi pi-fw pi-user-plus',
                        to: '/admin/users/invite'
                    }
                ]
            },
            {
                label: 'Settings',
                icon: 'pi pi-fw pi-cog',
                items: [
                    {
                        label: 'General',
                        icon: 'pi pi-fw pi-cog',
                        to: '/settings/general'
                    },
                    {
                        label: 'Security',
                        icon: 'pi pi-fw pi-shield',
                        to: '/settings/security'
                    },
                    {
                        label: 'Notifications',
                        icon: 'pi pi-fw pi-bell',
                        to: '/settings/notifications'
                    },
                    {
                        label: 'Audit Logs',
                        icon: 'pi pi-fw pi-list',
                        to: '/settings/audit-logs'
                    }
                ]
            }
        ]
    }
]);

const isItemVisible = (item) => {
    if (item?.visible === false) {
        return false;
    }

    if (!item?.permissionGuard || item.visible === true) {
        return true;
    }

    return hasPermission(item.permissionGuard);
};

const canDisplayItem = (item) => {
    if (!item?.items?.length) {
        return isItemVisible(item);
    }

    return isItemVisible(item) && item.items.some((child) => canDisplayItem(child));
};

const renderedModel = computed(() => {
    const visibleEntries = model.value.filter((item) => item.separator || canDisplayItem(item));

    return visibleEntries.filter((item, index) => {
        if (!item.separator) {
            return true;
        }

        const hasPreviousItem = visibleEntries.slice(0, index).some((entry) => !entry.separator);
        const hasNextItem = visibleEntries.slice(index + 1).some((entry) => !entry.separator);
        const previousIsSeparator = index > 0 && visibleEntries[index - 1].separator;

        return hasPreviousItem && hasNextItem && !previousIsSeparator;
    });
});
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in renderedModel" :key="item">
            <AppMenuItem v-if="!item.separator" :item="item" root :index="i" />

            <li v-else class="menu-separator" />
        </template>
    </ul>
</template>
