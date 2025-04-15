<script setup>
import { ref } from 'vue';
import AppMenuItem from './AppMenuItem.vue';

const model = ref([
    {
        label: 'Dashboards',
        icon: 'pi pi-home',
        items: [
            {
                label: 'Dispatch Dashboard',
                icon: 'pi pi-fw pi-truck',
                to: '/dispatch/dashboard'
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
                to: '/dashboard-banking'
            },
            {
                label: 'Bill Import',
                icon: 'pi pi-fw pi-file-import',
                to: '/streamline/bill-import'
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
                icon: 'pi pi-fw pi-table',
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
        label: 'Other Page Elements',
        icon: 'pi pi-fw pi-sitemap',
        items: [
            {
                label: 'Apps',
                icon: 'pi pi-th-large',
                items: [
                    {
                        label: 'Blog',
                        icon: 'pi pi-fw pi-comment',
                        items: [
                            {
                                label: 'List',
                                icon: 'pi pi-fw pi-image',
                                to: '/apps/blog/list'
                            },
                            {
                                label: 'Detail',
                                icon: 'pi pi-fw pi-list',
                                to: '/apps/blog/detail'
                            },
                            {
                                label: 'Edit',
                                icon: 'pi pi-fw pi-pencil',
                                to: '/apps/blog/edit'
                            }
                        ]
                    },
                    {
                        label: 'Chat',
                        icon: 'pi pi-fw pi-comments',
                        to: '/apps/chat'
                    },
                    {
                        label: 'Files',
                        icon: 'pi pi-fw pi-folder',
                        to: '/apps/files'
                    },
                    {
                        label: 'Mail',
                        icon: 'pi pi-fw pi-envelope',
                        items: [
                            {
                                label: 'Inbox',
                                icon: 'pi pi-fw pi-inbox',
                                to: '/apps/mail/inbox'
                            },
                            {
                                label: 'Compose',
                                icon: 'pi pi-fw pi-pencil',
                                to: '/apps/mail/compose'
                            },
                            {
                                label: 'Detail',
                                icon: 'pi pi-fw pi-comment',
                                to: '/apps/mail/detail/1000'
                            }
                        ]
                    },
                    {
                        label: 'Task List',
                        icon: 'pi pi-fw pi-check-square',
                        to: '/apps/tasklist'
                    },
                    {
                        label: 'Todo List',
                        icon: 'pi pi-fw pi-check-square',
                        to: '/todo'
                    }
                ]
            },
            {
                label: 'UI Kit',
                icon: 'pi pi-fw pi-star-fill',
                items: [
                    {
                        label: 'Form Layout',
                        icon: 'pi pi-fw pi-id-card',
                        to: '/uikit/formlayout'
                    },
                    {
                        label: 'Input',
                        icon: 'pi pi-fw pi-check-square',
                        to: '/uikit/input'
                    },
                    {
                        label: 'Button',
                        icon: 'pi pi-fw pi-box',
                        to: '/uikit/button'
                    },
                    {
                        label: 'Table',
                        icon: 'pi pi-fw pi-table',
                        to: '/uikit/table'
                    },
                    {
                        label: 'List',
                        icon: 'pi pi-fw pi-list',
                        to: '/uikit/list'
                    },
                    {
                        label: 'Tree',
                        icon: 'pi pi-fw pi-share-alt',
                        to: '/uikit/tree'
                    },
                    {
                        label: 'Panel',
                        icon: 'pi pi-fw pi-tablet',
                        to: '/uikit/panel'
                    },
                    {
                        label: 'Overlay',
                        icon: 'pi pi-fw pi-clone',
                        to: '/uikit/overlay'
                    },
                    {
                        label: 'Media',
                        icon: 'pi pi-fw pi-image',
                        to: '/uikit/media'
                    },
                    {
                        label: 'Menu',
                        icon: 'pi pi-fw pi-bars',
                        to: '/uikit/menu'
                    },
                    {
                        label: 'Message',
                        icon: 'pi pi-fw pi-comment',
                        to: '/uikit/message'
                    },
                    {
                        label: 'File',
                        icon: 'pi pi-fw pi-file',
                        to: '/uikit/file'
                    },
                    {
                        label: 'Chart',
                        icon: 'pi pi-fw pi-chart-bar',
                        to: '/uikit/charts'
                    },
                    {
                        label: 'Timeline',
                        icon: 'pi pi-fw pi-calendar',
                        to: '/uikit/timeline'
                    },
                    {
                        label: 'Misc',
                        icon: 'pi pi-fw pi-circle-off',
                        to: '/uikit/misc'
                    }
                ]
            },
            {
                label: 'Pages',
                icon: 'pi pi-fw pi-briefcase',
                items: [
                    {
                        label: 'Landing',
                        icon: 'pi pi-fw pi-globe',
                        to: '/landing'
                    },
                    {
                        label: 'Auth',
                        icon: 'pi pi-fw pi-user',
                        items: [
                            {
                                label: 'Login',
                                icon: 'pi pi-fw pi-sign-in',
                                to: '/auth/login'
                            },
                            {
                                label: 'Error',
                                icon: 'pi pi-fw pi-times-circle',
                                to: '/auth/error'
                            },
                            {
                                label: 'Access Denied',
                                icon: 'pi pi-fw pi-lock',
                                to: '/auth/access'
                            },
                            {
                                label: 'Register',
                                icon: 'pi pi-fw pi-user-plus',
                                to: '/auth/register'
                            },
                            {
                                label: 'Forgot Password',
                                icon: 'pi pi-fw pi-question',
                                to: '/auth/forgot-password'
                            },
                            {
                                label: 'New Password',
                                icon: 'pi pi-fw pi-cog',
                                to: '/auth/new-password'
                            },
                            {
                                label: 'Verification',
                                icon: 'pi pi-fw pi-envelope',
                                to: '/auth/register/verification'
                            },
                            {
                                label: 'Lock Screen',
                                icon: 'pi pi-fw pi-eye-slash',
                                to: '/auth/lock-screen'
                            }
                        ]
                    },
                    {
                        label: 'Crud',
                        icon: 'pi pi-fw pi-pencil',
                        to: '/pages/crud'
                    },
                    {
                        label: 'Invoice Sample',
                        icon: 'pi pi-fw pi-dollar',
                        to: '/pages/invoice'
                    },
                    {
                        label: 'About Us',
                        icon: 'pi pi-fw pi-user',
                        to: '/pages/aboutus'
                    },
                    {
                        label: 'Help',
                        icon: 'pi pi-fw pi-question-circle',
                        to: '/pages/help'
                    },
                    {
                        label: 'Oops',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        to: '/auth/oops'
                    },
                    {
                        label: 'Not Found',
                        icon: 'pi pi-fw pi-exclamation-circle',
                        to: '/pages/notfound'
                    },
                    {
                        label: 'Empty',
                        icon: 'pi pi-fw pi-circle-off',
                        to: '/pages/empty'
                    },
                    {
                        label: 'FAQ',
                        icon: 'pi pi-fw pi-question',
                        to: '/pages/faq'
                    },
                    {
                        label: 'Contact Us',
                        icon: 'pi pi-fw pi-phone',
                        to: '/landing/contact'
                    }
                ]
            },
            {
                label: 'E-Commerce',
                icon: 'pi pi-fw pi-wallet',
                items: [
                    {
                        label: 'Product Overview',
                        icon: 'pi pi-fw pi-image',
                        to: '/ecommerce/product-overview'
                    },
                    {
                        label: 'Product List',
                        icon: 'pi pi-fw pi-list',
                        to: '/ecommerce/product-list'
                    },
                    {
                        label: 'New Product',
                        icon: 'pi pi-fw pi-plus',
                        to: '/ecommerce/new-product'
                    },
                    {
                        label: 'Shopping Cart',
                        icon: 'pi pi-fw pi-shopping-cart',
                        to: '/ecommerce/shopping-cart'
                    },
                    {
                        label: 'Checkout Form',
                        icon: 'pi pi-fw pi-check-square',
                        to: '/ecommerce/checkout-form'
                    },
                    {
                        label: 'Order History',
                        icon: 'pi pi-fw pi-history',
                        to: '/ecommerce/order-history'
                    },
                    {
                        label: 'Order Summary',
                        icon: 'pi pi-fw pi-file',
                        to: '/ecommerce/order-summary'
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
