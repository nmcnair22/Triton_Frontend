import AppLayout from '@/layout/AppLayout.vue';
import AuthLayout from '@/layout/AuthLayout.vue';
import LandingLayout from '@/layout/LandingLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { AuthService } from '@/auth/AuthService';

// Explicitly set development mode variable
const isDevelopmentMode = import.meta.env.DEV;

const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/',
                name: 'dashboard-marketing',
                meta: {
                    breadcrumb: ['Marketing Dashboard']
                },
                component: () => import('@/views/dashboard/MarketingView.vue')
            },
            {
                path: '/dashboard-banking',
                name: 'dashboard-banking',
                meta: {
                    breadcrumb: ['Streamline Dashboard']
                },
                component: () => import('@/views/dashboard/BankingView.vue')
            },
            {
                path: '/streamline/bill-import',
                name: 'bill-import',
                meta: {
                    breadcrumb: ['Streamline', 'Bill Import']
                },
                component: () => import('@/views/apps/BillImport.vue')
            },
            {
                path: '/apps/blog/list',
                component: () => import('@/views/apps/blog/List.vue')
            },
            {
                path: '/apps/blog/detail',
                component: () => import('@/views/apps/blog/Detail.vue')
            },
            {
                path: '/apps/blog/edit',
                name: 'blog-edit',
                component: () => import('@/views/apps/blog/Edit.vue')
            },
            {
                path: '/apps/waveai/frontpage',
                name: 'waveai-frontpage',
                component: () => import('@/views/apps/waveai/FrontPage.vue')
            },
            {
                path: '/apps/waveai/network',
                name: 'waveai-network',
                component: () => import('@/views/apps/waveai/Network.vue')
            },
            {
                path: '/apps/waveai/dispatch',
                name: 'waveai-dispatch',
                component: () => import('@/views/apps/waveai/Dispatch.vue')
            },
            {
                path: '/apps/waveai/circuits',
                name: 'waveai-circuits',
                component: () => import('@/views/apps/waveai/Circuits.vue')
            },
            {
                path: '/apps/files',
                name: 'files',
                component: () => import('@/views/apps/Files.vue')
            },
            {
                path: '/apps/chat',
                name: 'chat',
                component: () => import('@/views/apps/chat/Index.vue')
            },
            {
                path: '/apps/tasklist',
                name: 'tasklist',
                component: () => import('@/views/apps/tasklist/Index.vue')
            },
            {
                path: '/apps/mail',

                component: () => import('@/views/apps/mail/Index.vue'),
                children: [
                    {
                        path: '/apps/mail/inbox',
                        name: 'mail-inbox',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/compose',
                        name: 'mail-compose',
                        component: () => import('@/views/apps/mail/ComposeNew.vue')
                    },
                    {
                        path: '/apps/mail/detail/:id',
                        name: 'mail-detail',
                        component: () => import('@/views/apps/mail/Detail.vue')
                    },
                    {
                        path: '/apps/mail/starred',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/spam',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/important',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/sent',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/archived',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    },
                    {
                        path: '/apps/mail/trash',
                        component: () => import('@/views/apps/mail/MailTypes.vue')
                    }
                ]
            },
            {
                path: '/uikit/formlayout',
                name: 'formlayout',
                meta: {
                    breadcrumb: ['UI Kit', 'Form Layout']
                },
                component: () => import('@/views/uikit/FormLayoutDoc.vue')
            },
            {
                path: '/uikit/input',
                name: 'input',
                meta: {
                    breadcrumb: ['UI Kit', 'Input']
                },
                component: () => import('@/views/uikit/InputDoc.vue')
            },
            {
                path: '/uikit/button',
                name: 'button',
                meta: {
                    breadcrumb: ['UI Kit', 'Button']
                },
                component: () => import('@/views/uikit/ButtonDoc.vue')
            },
            {
                path: '/uikit/table',
                name: 'table',
                meta: {
                    breadcrumb: ['UI Kit', 'Table']
                },
                component: () => import('@/views/uikit/TableDoc.vue')
            },
            {
                path: '/uikit/list',
                name: 'list',
                meta: {
                    breadcrumb: ['UI Kit', 'List']
                },
                component: () => import('@/views/uikit/ListDoc.vue')
            },
            {
                path: '/uikit/tree',
                name: 'tree',
                meta: {
                    breadcrumb: ['UI Kit', 'Tree']
                },
                component: () => import('@/views/uikit/TreeDoc.vue')
            },
            {
                path: '/uikit/panel',
                name: 'panel',
                meta: {
                    breadcrumb: ['UI Kit', 'Panel']
                },
                component: () => import('@/views/uikit/PanelsDoc.vue')
            },

            {
                path: '/uikit/overlay',
                name: 'overlay',
                meta: {
                    breadcrumb: ['UI Kit', 'Overlay']
                },
                component: () => import('@/views/uikit/OverlayDoc.vue')
            },
            {
                path: '/uikit/media',
                name: 'media',
                meta: {
                    breadcrumb: ['UI Kit', 'Media']
                },
                component: () => import('@/views/uikit/MediaDoc.vue')
            },
            {
                path: '/uikit/menu',
                meta: {
                    breadcrumb: ['UI Kit', 'Menu']
                },
                component: () => import('@/views/uikit/MenuDoc.vue')
            },
            {
                path: '/uikit/message',
                name: 'message',
                meta: {
                    breadcrumb: ['UI Kit', 'Message']
                },
                component: () => import('@/views/uikit/MessagesDoc.vue')
            },
            {
                path: '/uikit/file',
                name: 'file',
                meta: {
                    breadcrumb: ['UI Kit', 'File']
                },
                component: () => import('@/views/uikit/FileDoc.vue')
            },
            {
                path: '/uikit/charts',
                name: 'charts',
                meta: {
                    breadcrumb: ['UI Kit', 'Charts']
                },
                component: () => import('@/views/uikit/ChartDoc.vue')
            },
            {
                path: '/uikit/timeline',
                name: 'timeline',
                meta: {
                    breadcrumb: ['UI Kit', 'Timeline']
                },
                component: () => import('@/views/uikit/TimelineDoc.vue')
            },
            {
                path: '/uikit/misc',
                name: 'misc',
                meta: {
                    breadcrumb: ['UI Kit', 'Misc']
                },
                component: () => import('@/views/uikit/MiscDoc.vue')
            },
            {
                path: '/blocks',
                name: 'blocks',
                meta: {
                    breadcrumb: ['Prime Blocks', 'Free Blocks']
                },
                component: () => import('@/views/utilities/Blocks.vue')
            },
            {
                path: '/pages/empty',
                name: 'empty',
                component: () => import('@/views/pages/Empty.vue')
            },
            {
                path: '/pages/crud',
                name: 'crud',
                component: () => import('@/views/pages/Crud.vue')
            },
            {
                path: '/ecommerce/product-overview',
                name: 'product-overview',
                meta: {
                    breadcrumb: ['E-Commerce', 'Product Overview']
                },
                component: () => import('@/views/e-commerce/ProductOverview.vue')
            },
            {
                path: '/ecommerce/product-list',
                name: 'product-list',
                meta: {
                    breadcrumb: ['E-Commerce', 'Product List']
                },
                component: () => import('@/views/e-commerce/ProductList.vue')
            },
            {
                path: '/ecommerce/new-product',
                name: 'new-product',
                meta: {
                    breadcrumb: ['E-Commerce', 'New Product']
                },
                component: () => import('@/views/e-commerce/NewProduct.vue')
            },
            {
                path: '/ecommerce/shopping-cart',
                name: 'shopping-cart',
                meta: {
                    breadcrumb: ['E-Commerce', 'Shopping Cart']
                },
                component: () => import('@/views/e-commerce/ShoppingCart.vue')
            },
            {
                path: '/ecommerce/checkout-form',
                name: 'checkout-form',
                meta: {
                    breadcrumb: ['E-Commerce', 'Checkout Form']
                },
                component: () => import('@/views/e-commerce/CheckoutForm.vue')
            },
            {
                path: '/ecommerce/order-history',
                name: 'order-history',
                meta: {
                    breadcrumb: ['E-Commerce', 'Order History']
                },
                component: () => import('@/views/e-commerce/OrderHistory.vue')
            },
            {
                path: '/ecommerce/order-summary',
                name: 'order-summary',
                meta: {
                    breadcrumb: ['E-Commerce', 'Order Summary']
                },
                component: () => import('@/views/e-commerce/OrderSummary.vue')
            },

            {
                path: '/profile/create',
                name: 'user-create',
                meta: {
                    breadcrumb: ['User Management', 'Create']
                },
                component: () => import('@/views/user-management/UserCreate.vue')
            },
            {
                path: '/profile/list',
                name: 'user-list',
                meta: {
                    breadcrumb: ['User Management', 'List']
                },
                component: () => import('@/views/user-management/UserList.vue')
            },
            {
                path: '/documentation',
                name: 'documentation',
                component: () => import('@/views/utilities/Documentation.vue')
            },
            {
                path: '/pages/aboutus',
                name: 'aboutus',
                meta: {
                    breadcrumb: ['Pages', 'About']
                },
                component: () => import('@/views/pages/AboutUs.vue')
            },
            {
                path: '/pages/faq',
                name: 'faq',
                meta: {
                    breadcrumb: ['Pages', 'FAQ']
                },
                component: () => import('@/views/pages/Faq.vue')
            },
            {
                path: '/pages/help',
                name: 'help',
                component: () => import('@/views/pages/Help.vue')
            },
            {
                path: '/pages/invoice',
                name: 'invoice-sample',
                component: () => import('@/views/pages/InvoiceSample.vue')
            },
            {
                path: '/accounting/invoicing',
                name: 'accounting-invoicing',
                meta: {
                    breadcrumb: ['Accounting', 'Invoicing']
                },
                component: () => import('@/views/accounting/Invoicing.vue')
            },
            {
                path: '/accounting/invoice-templates',
                name: 'accounting-invoice-templates',
                meta: {
                    breadcrumb: ['Accounting', 'Invoice Templates']
                },
                component: () => import('@/views/accounting/InvoiceTemplates.vue')
            },
            {
                path: '/accounting/field-service-billing',
                name: 'accounting-field-service-billing',
                meta: {
                    breadcrumb: ['Accounting', 'Field Service Billing']
                },
                component: () => import('@/views/accounting/FieldServiceBilling.vue')
            },
            {
                path: '/reporting/report-manager',
                name: 'reporting-report-manager',
                meta: {
                    breadcrumb: ['Reporting', 'Report Manager']
                },
                component: () => import('@/views/reporting/ReportManager.vue')
            },
            {
                path: '/todo',
                name: 'todo',
                meta: {
                    breadcrumb: ['Todo List']
                },
                component: () => import('@/views/TodoPage.vue')
            },
            {
                path: '/debug/permissions',
                name: 'permission-debug',
                component: () => import('@/components/auth/PermissionDebug.vue'),
                meta: {
                    requiresAuth: true,
                    breadcrumb: ['Debug', 'Permissions']
                }
            }
        ],
        meta: { requiresAuth: true }
    },
    {
        path: '/landing',
        component: LandingLayout,
        children: [
            {
                path: '',
                name: 'landing',
                component: () => import('@/views/landing/LandingView.vue')
            },
            {
                path: 'features',
                name: 'features',
                component: () => import('@/views/landing/FeaturesView.vue')
            },
            {
                path: 'pricing',
                name: 'pricing',
                component: () => import('@/views/landing/PricingView.vue')
            },
            {
                path: 'contact',
                name: 'contact',
                component: () => import('@/views/landing/ContactView.vue')
            }
        ],
        meta: { scrollToTop: true }
    },
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                name: 'login',
                component: () => import('@/views/auth/LoginView.vue')
            },
            {
                path: 'microsoft-callback',
                name: 'microsoft-callback',
                component: () => import('@/views/auth/MicrosoftCallback.vue')
            },
            {
                path: 'register',
                name: 'register',
                component: () => import('@/views/auth/RegisterView.vue')
            },
            {
                path: 'verification',
                name: 'verification',
                component: () => import('@/views/auth/VerificationView.vue')
            },
            {
                path: 'forgot-password',
                name: 'forgot-password',
                component: () => import('@/views/auth/ForgotPassword.vue')
            },
            {
                path: 'new-password',
                name: 'new-password',
                component: () => import('@/views/auth/NewPassword.vue')
            },
            {
                path: 'lock-screen',
                name: 'lock-screen',
                component: () => import('@/views/auth/LockScreen.vue')
            },
            {
                path: 'access',
                name: 'access',
                component: () => import('@/views/pages/AccessDenied.vue')
            },
            {
                path: 'oops',
                name: 'oops',
                component: () => import('@/views/pages/Oops.vue')
            }
        ],
        meta: { scrollToTop: true }
    },

    {
        path: '/pages/notfound',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'notfound',
        component: () => import('@/views/pages/NotFound.vue')
    },
    {
        path: '/user-management',
        component: AppLayout,
        meta: { 
            requiresAuth: true,
            permissions: ['users.view'],
            breadcrumb: ['User Management']
        },
        children: [
            {
                path: '',
                name: 'user-management',
                component: () => import('@/views/user-management/UserList.vue'),
                meta: {
                    breadcrumb: ['User Management', 'Users']
                }
            },
            {
                path: 'create',
                name: 'user-create',
                component: () => import('@/views/user-management/UserCreate.vue'),
                meta: {
                    permissions: ['users.create'],
                    breadcrumb: ['User Management', 'Create User']
                }
            },
            {
                path: 'edit/:id',
                name: 'user-edit',
                component: () => import('@/views/user-management/UserEdit.vue'),
                meta: {
                    permissions: ['users.edit'],
                    breadcrumb: ['User Management', 'Edit User']
                }
            },
            {
                path: 'profile',
                name: 'user-profile',
                component: () => import('@/views/user-management/UserProfile.vue'),
                meta: {
                    breadcrumb: ['User Management', 'My Profile']
                }
            },
            {
                path: 'roles',
                name: 'role-management',
                component: () => import('@/views/user-management/RoleList.vue'),
                meta: {
                    permissions: ['roles.view'],
                    breadcrumb: ['User Management', 'Roles']
                }
            },
            {
                path: 'roles/create',
                name: 'role-create',
                component: () => import('@/views/user-management/RoleCreate.vue'),
                meta: {
                    permissions: ['roles.create'],
                    breadcrumb: ['User Management', 'Create Role']
                }
            },
            {
                path: 'roles/edit/:id',
                name: 'role-edit',
                component: () => import('@/views/user-management/RoleEdit.vue'),
                meta: {
                    permissions: ['roles.edit'],
                    breadcrumb: ['User Management', 'Edit Role']
                }
            }
        ]
    },
    {
        path: '/profile',
        component: AppLayout,
        meta: { 
            requiresAuth: true,
            breadcrumb: ['My Profile']
        },
        children: [
            {
                path: '',
                name: 'profile',
                component: () => import('@/views/user-management/UserProfile.vue')
            }
        ]
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior() {
        return { left: 0, top: 0 };
    }
});

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
    const requiredPermissions = to.meta.permissions || [];
    const requiredRoles = to.meta.roles || [];
    const isAuthenticated = AuthService.isAuthenticated();
    
    // Not authenticated but route requires auth
    if (requiresAuth && !isAuthenticated) {
        // Store the intended destination for redirect after login
        localStorage.setItem('auth_redirect', to.fullPath);
        return next({ name: 'login' });
    }
    
    // Already authenticated but trying to access login page
    if (to.name === 'login' && isAuthenticated) {
        return next({ name: 'dashboard-marketing' });
    }
    
    // Authenticated and route has permission requirements
    if (isAuthenticated && (requiredPermissions.length > 0 || requiredRoles.length > 0)) {
        // Check required permissions
        const hasRequiredPermissions = requiredPermissions.length === 0 || 
            requiredPermissions.some(permission => AuthService.hasPermission(permission));
            
        // Check required roles
        const hasRequiredRoles = requiredRoles.length === 0 || 
            requiredRoles.some(role => AuthService.hasRole(role));
            
        // Redirect to access denied if missing permissions/roles
        if (!hasRequiredPermissions || !hasRequiredRoles) {
            console.warn('Access denied: Missing required permissions or roles');
            return next({ name: 'access', query: { from: to.fullPath } });
        }
    }
    
    // Proceed to the route
    next();
});

// Check for auth redirect after login
router.afterEach((to) => {
    // If we've just logged in, check for a stored redirect
    if (to.name === 'dashboard-marketing' && AuthService.isAuthenticated()) {
        const redirectPath = localStorage.getItem('auth_redirect');
        if (redirectPath) {
            localStorage.removeItem('auth_redirect');
            
            // Use router.replace to avoid adding to history stack
            router.replace(redirectPath);
        }
    }
});

export default router;
