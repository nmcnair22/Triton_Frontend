import AppLayout from '@/layout/AppLayout.vue';
import AuthLayout from '@/layout/AuthLayout.vue';
import LandingLayout from '@/layout/LandingLayout.vue';
import { createRouter, createWebHistory } from 'vue-router';
import { AuthService } from '@/auth/AuthService';
import { useUserStore } from '@/stores/user';

// Explicitly set development mode variable
const isDevelopmentMode = import.meta.env.DEV;

const routes = [
    {
        path: '/',
        component: AppLayout,
        children: [
            {
                path: '/',
                redirect: '/field-services/visit-management'
            },
            {
                path: '/dashboard-marketing',
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
                component: () => import('@/views/apps/StreamlineDashboard.vue')
            },
            {
                path: '/field-services/visit-management',
                name: 'visit-management',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Field Services', path: '/field-services' },
                        { label: 'Visit Management', path: '/field-services/visit-management' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/field-services/VisitDetails.vue')
            },
            {
                path: '/field-services/visit/:id',
                name: 'visit-detail',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Field Services', path: '/field-services' },
                        { label: 'Visit Management', path: '/field-services/visit-management' },
                        { label: 'Visit Detail', path: '/field-services/visit/:id' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/field-services/VisitDetailPage.vue')
            },
            {
                path: '/field-services/estimates',
                name: 'field-services-estimates',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Field Services', path: '/field-services' },
                        { label: 'Estimates / Quotes', path: '/field-services/estimates' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/field-services/EstimatesView.vue')
            },

            // Engineering Module Routes
            {
                path: '/engineering',
                redirect: '/engineering/dashboard'
            },
            {
                path: '/engineering/dashboard',
                name: 'engineering-dashboard',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Engineering', path: '/engineering' },
                        { label: 'Dashboard', path: '/engineering/dashboard' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/engineering/DashboardView.vue')
            },
            {
                path: '/engineering/tickets',
                name: 'engineering-tickets',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Engineering', path: '/engineering' },
                        { label: 'Tickets', path: '/engineering/tickets' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/engineering/TicketsView.vue')
            },
            {
                path: '/engineering/tickets/:id',
                name: 'engineering-ticket-detail',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Engineering', path: '/engineering' },
                        { label: 'Tickets', path: '/engineering/tickets' },
                        { label: 'Ticket Detail', path: '/engineering/tickets/:id' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/engineering/TicketDetailView.vue')
            },
            {
                path: '/engineering/calendar',
                name: 'engineering-calendar',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Engineering', path: '/engineering' },
                        { label: 'Calendar', path: '/engineering/calendar' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/engineering/CalendarView.vue')
            },

            // Flynn Project Module Routes
            {
                path: '/flynn/location-scope-review',
                name: 'flynn-location-scope-review',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Flynn Project', path: '/flynn' },
                        { label: 'Location Scope Review', path: '/flynn/location-scope-review' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/flynn/LocationScopeReview.vue')
            },

            // Customers Module Routes
            {
                path: '/customers',
                name: 'customers',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'Customers', path: '/customers' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/Customers.vue')
            },

            {
                path: '/streamline/dashboard',
                name: 'streamline-dashboard',
                meta: {
                    breadcrumb: ['Streamline', 'Dashboard']
                },
                component: () => import('@/views/apps/StreamlineDashboard.vue')
            },
            {
                path: '/streamline/bill-management',
                name: 'streamline-bill-management',
                meta: {
                    breadcrumb: ['Streamline', 'Bill Management']
                },
                component: () => import('@/views/apps/StreamlineBillManagement.vue')
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
                path: '/streamline/tem-accounts',
                name: 'tem-accounts',
                meta: {
                    breadcrumb: ['Streamline', 'Tem Accounts']
                },
                component: () => import('@/views/apps/TemAccounts.vue')
            },
            {
                path: '/streamline/vendors-contracts',
                name: 'vendors-contracts',
                meta: {
                    breadcrumb: ['Streamline', 'Vendors & Contracts']
                },
                component: () => import('@/views/apps/VendorsContracts.vue')
            },
            {
                path: '/streamline/bill-transfer-tracker',
                name: 'bill-transfer-tracker',
                meta: {
                    breadcrumb: ['Streamline', 'Bill Transfer Tracker']
                },
                component: () => import('@/views/apps/BillTransferTracker.vue')
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
                path: '/waveai/hd-ticket-analysis',
                name: 'waveai-hd-ticket-analysis',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'WaveAI', path: '/waveai' },
                        { label: 'HD Ticket Analysis', path: '/waveai/hd-ticket-analysis' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/waveai/HDTicketAnalysis.vue')
            },
            {
                path: '/waveai/dispatch-ticket-analysis',
                name: 'waveai-dispatch-ticket-analysis',
                meta: {
                    breadcrumb: [
                        { label: 'Home', path: '/' },
                        { label: 'WaveAI', path: '/waveai' },
                        { label: 'Dispatch Ticket Analysis', path: '/waveai/dispatch-ticket-analysis' }
                    ],
                    requiresAuth: true
                },
                component: () => import('@/views/waveai/DispatchTicketAnalysis.vue')
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
                path: '/finance/dashboard',
                name: 'finance-dashboard',
                meta: {
                    breadcrumb: ['Finance', 'Dashboard']
                },
                component: () => import('@/views/finance/Dashboard.vue')
            },
            {
                path: '/finance/invoicing',
                name: 'finance-invoicing',
                meta: {
                    breadcrumb: ['Finance', 'Invoicing']
                },
                component: () => import('@/views/finance/InvoicingPage.vue')
            },
            {
                path: '/finance/receivables',
                name: 'finance-receivables',
                meta: {
                    breadcrumb: ['Finance', 'Receivables']
                },
                component: () => import('@/views/finance/ReceivablesPage.vue')
            },
            {
                path: '/finance/payables',
                name: 'finance-payables',
                meta: {
                    breadcrumb: ['Finance', 'Payables']
                },
                component: () => import('@/views/finance/PayablesPage.vue')
            },
            {
                path: '/finance/accounts-receivable',
                name: 'accounts-receivable',
                meta: {
                    breadcrumb: ['Financial', 'Accounts Receivable']
                },
                component: () => import('@/views/finance/AccountsReceivable.vue')
            },
            {
                path: '/finance/accounts-payable',
                name: 'accounts-payable',
                meta: {
                    breadcrumb: ['Financial', 'Accounts Payable']
                },
                component: () => import('@/views/finance/AccountsPayable.vue')
            },
            {
                path: '/finance/customer/:id',
                name: 'customer-profile',
                meta: {
                    breadcrumb: ['Financial', 'Customer Profile']
                },
                component: () => import('@/views/finance/CustomerProfile.vue')
            },
            {
                path: '/finance/vendor/:id',
                name: 'vendor-profile',
                meta: {
                    breadcrumb: ['Financial', 'Vendor Profile']
                },
                component: () => import('@/views/finance/VendorProfile.vue')
            },
            {
                path: '/finance/analysis',
                name: 'financial-analysis',
                meta: {
                    breadcrumb: ['Financial', 'Financial Analysis']
                },
                component: () => import('@/views/finance/FinancialAnalysis.vue')
            },
            {
                path: '/finance/product-performance',
                name: 'product-performance',
                meta: {
                    breadcrumb: ['Financial', 'Product Performance']
                },
                component: () => import('@/views/finance/ProductPerformance.vue')
            },
            {
                path: '/finance/alerts',
                name: 'alerts-management',
                meta: {
                    breadcrumb: ['Financial', 'Alerts Management']
                },
                component: () => import('@/views/finance/AlertsManagement.vue')
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
router.beforeEach(async (to, from, next) => {
    // Skip auth check for public routes (login, callback, etc.)
    const publicPages = ['/auth/login', '/auth/microsoft-callback', '/auth/register', '/auth/forgot-password', '/auth/verification', '/auth/new-password'];
    const authRequired = !publicPages.includes(to.path);
    
    // Get stored auth token
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    
    // Store the attempted URL for redirect after login
    if (authRequired && !token) {
        localStorage.setItem('auth_redirect', to.fullPath);
        return next('/auth/login');
    }
    
    if (token) {
        try {
            // If we're on the callback page, let it handle its own logic
            if (to.path === '/auth/microsoft-callback') {
                return next();
            }
            
            // Check for permission requirements on the route
            if (to.meta.permissions && to.meta.permissions.length > 0) {
                // Get the user store
                const userStore = useUserStore();
                
                // Check if user store is already initialized with permissions
                if (!userStore.permissions || userStore.permissions.length === 0) {
                    // Fetch current user to get fresh permissions
                    await userStore.fetchCurrentUser();
                }
                
                // Check if user has at least one of the required permissions
                const hasPermission = to.meta.permissions.some(permission => 
                    userStore.hasPermission(permission)
                );
                
                if (!hasPermission) {
                    console.warn(`Access denied to ${to.path} - missing required permissions:`, to.meta.permissions);
                    return next({
                        path: '/auth/access',
                        query: { from: to.fullPath }
                    });
                }
            }
            
            // User is authenticated and has permission, proceed
            return next();
        } catch (error) {
            console.error("Error checking permissions:", error);
            // If there's an error checking permissions, proceed anyway
            // The server will handle access control as a fallback
            return next();
        }
    }
    
    // If no auth required or we've handled all cases above, proceed
    return next();
});

// Check for auth redirect after login
router.afterEach((to) => {
    // If we've just logged in, check for a stored redirect
    if (to.name === 'visit-management' && AuthService.isAuthenticated()) {
        const redirectPath = localStorage.getItem('auth_redirect');
        if (redirectPath) {
            localStorage.removeItem('auth_redirect');
            
            // Use router.replace to avoid adding to history stack
            router.replace(redirectPath);
        }
    }
});

export default router;
