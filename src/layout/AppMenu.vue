<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Field Services',
        icon: 'pi pi-home',
        items: [
            {
                label: 'Visit Details',
                icon: 'pi pi-fw pi-calendar-plus',
                to: '/field-services/visit-management'
            },
            {
                label: 'Estimates / Quotes',
                icon: 'pi pi-fw pi-calculator',
                to: '/field-services/estimates'
            }
        ]
    },
    { separator: true },
    {
        label: 'Streamline',
        icon: 'pi pi-chart-line',
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
                        label: 'Bill Transfer Tracker',
                        icon: 'pi pi-fw pi-sync',
                        to: '/streamline/bill-transfer-tracker'
                    }
                ]
            },
            {
                label: 'Accounts',
                icon: 'pi pi-fw pi-users',
                items: [
                    {
                        label: 'Tem Accounts',
                        icon: 'pi pi-fw pi-users',
                        to: '/streamline/tem-accounts'
                    },
                    {
                        label: 'Vendors & Contracts',
                        icon: 'pi pi-fw pi-building',
                        to: '/streamline/vendors-contracts'
                    }
                ]
            }
        ]
    },
    { separator: true },
    {
        label: 'Engineering',
        icon: 'pi pi-cog',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-chart-line',
                to: '/engineering/dashboard'
            },
            {
                label: 'Tickets',
                icon: 'pi pi-fw pi-ticket',
                to: '/engineering/tickets'
            },
            {
                label: 'Calendar',
                icon: 'pi pi-fw pi-calendar',
                to: '/engineering/calendar'
            }
        ]
    },
    { separator: true },
    {
        label: 'Customers',
        icon: 'pi pi-users',
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
                label: 'Field Service Billing',
                icon: 'pi pi-fw pi-money-bill',
                to: '/accounting/field-service-billing'
            }
        ]
    },
    { separator: true },
    {
        label: 'Finance',
        icon: 'pi pi-chart-bar',
        items: [
            {
                label: 'Dashboard',
                icon: 'pi pi-fw pi-money-bill',
                to: '/finance/dashboard'
            },
            {
                label: 'Core Finance',
                icon: 'pi pi-fw pi-file-edit',
                items: [
                    {
                        label: 'Invoicing',
                        icon: 'pi pi-fw pi-file-edit',
                        to: '/finance/invoicing'
                    },
                    {
                        label: 'Receivables',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/finance/receivables'
                    },
                    {
                        label: 'Payables',
                        icon: 'pi pi-fw pi-credit-card',
                        to: '/finance/payables'
                    }
                ]
            },
            {
                label: 'Legacy Accounts',
                icon: 'pi pi-fw pi-database',
                items: [
                    {
                        label: 'Accounts Receivable',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/finance/accounts-receivable'
                    },
                    {
                        label: 'Accounts Payable',
                        icon: 'pi pi-fw pi-credit-card',
                        to: '/finance/accounts-payable'
                    }
                ]
            },
            {
                label: 'Analytics & Reports',
                icon: 'pi pi-fw pi-chart-line',
                items: [
                    {
                        label: 'Financial Analysis',
                        icon: 'pi pi-fw pi-chart-line',
                        to: '/finance/analysis'
                    },
                    {
                        label: 'Product Performance',
                        icon: 'pi pi-fw pi-box',
                        to: '/finance/product-performance'
                    },
                    {
                        label: 'Alerts Management',
                        icon: 'pi pi-fw pi-bell',
                        to: '/finance/alerts'
                    }
                ]
            }
        ]
    },
    { separator: true },
    {
        label: 'Reporting',
        icon: 'pi pi-chart-bar',
        items: [
            {
                label: 'Report Manager',
                icon: 'pi pi-fw pi-file-export',
                to: '/reporting/report-manager'
            }
        ]
    },
    { separator: true },
    {
        label: 'WaveAI',
        icon: 'pi pi-bolt',
        items: [
            {
                label: 'HD Ticket Analysis',
                icon: 'pi pi-fw pi-chart-line',
                to: '/waveai/hd-ticket-analysis'
            },
            {
                label: 'Dispatch Ticket Analysis',
                icon: 'pi pi-fw pi-chart-bar',
                to: '/waveai/dispatch-ticket-analysis'
            },
            {
                label: 'Network News',
                icon: 'pi pi-fw pi-globe',
                items: [
                    {
                        label: 'Front Page',
                        icon: 'pi pi-fw pi-list',
                        to: '/apps/waveai/frontpage'
                    },
                    {
                        label: 'Network',
                        icon: 'pi pi-fw pi-server',
                        to: '/apps/waveai/network'
                    },
                    {
                        label: 'Dispatch',
                        icon: 'pi pi-fw pi-send',
                        to: '/apps/waveai/dispatch'
                    },
                    {
                        label: 'Circuits',
                        icon: 'pi pi-fw pi-sitemap',
                        to: '/apps/waveai/circuits'
                    }
                ]
            }
        ]
    },
    { separator: true },
    {
        label: 'User Management',
        icon: 'pi pi-fw pi-users',
        permissionGuard: 'users.view',
        items: [
            {
                label: 'Users',
                icon: 'pi pi-fw pi-user',
                to: '/user-management',
                permissionGuard: 'users.view'
            },
            {
                label: 'Create User',
                icon: 'pi pi-fw pi-user-plus',
                to: '/user-management/create',
                permissionGuard: 'users.create'
            },
            {
                label: 'Roles',
                icon: 'pi pi-fw pi-shield',
                to: '/user-management/roles',
                permissionGuard: 'roles.view'
            },
            {
                label: 'Create Role',
                icon: 'pi pi-fw pi-plus-circle',
                to: '/user-management/roles/create',
                permissionGuard: 'roles.create'
            },
            {
                label: 'My Profile',
                icon: 'pi pi-fw pi-user-edit',
                to: '/profile'
            }
        ]
    }
]);
</script>

<template>
    <ul class="layout-menu">
        <template v-for="(item, i) in model" :key="item">
            <AppMenuItem v-if="!item.separator" :item="item" root :index="i" />

            <li v-else class="menu-separator" />
        </template>
    </ul>
</template>
