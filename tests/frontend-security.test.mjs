import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { webcrypto } from 'node:crypto';
import { inspect } from 'node:util';
import { test } from 'node:test';
import { JSDOM } from 'jsdom';
import { babelParse, parse as parseSfc } from '@vue/compiler-sfc';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'https://frontend.example/auth/microsoft-callback'
});
for (const key of ['window', 'document', 'Element', 'HTMLElement', 'SVGElement', 'Node', 'localStorage']) {
    globalThis[key] = dom.window[key];
}
const Vue = await import('vue');
const root = new URL('../', import.meta.url);
const silentConsole = { log() {}, error() {}, warn() {} };

async function sfc(path) {
    return parseSfc(await readFile(new URL(path, root), 'utf8')).descriptor;
}

async function declaredValue(path, name, bindings = {}) {
    const descriptor = await sfc(path);
    const script = descriptor.scriptSetup.content;
    const declaration = babelParse(script, { sourceType: 'module' }).program.body
        .filter((node) => node.type === 'VariableDeclaration')
        .flatMap((node) => node.declarations)
        .find((node) => node.id.name === name);
    assert.ok(declaration, `Missing ${name} in ${path}`);
    return new Function(...Object.keys(bindings), `return (${script.slice(declaration.init.start, declaration.init.end)});`)(...Object.values(bindings));
}

async function htmlBindings() {
    try {
        const source = (await readFile(new URL('src/utils/sanitizeHtml.js', root), 'utf8'))
            .replace("from 'dompurify'", `from '${import.meta.resolve('dompurify')}'`);
        return await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
    } catch (error) {
        if (!['ENOENT', 'ERR_MODULE_NOT_FOUND'].includes(error.code)) throw error;
        return {};
    }
}

async function renderElement(path, expression, bindings, tag = null) {
    const descriptor = await sfc(path);
    function find(node) {
        if (tag && node.type === 1 && node.tag === tag && node.loc.source.includes(expression)) return node;
        for (const child of node.children || []) {
            const match = find(child);
            if (match) return match;
        }
        return node.type === 1 && node.loc.source.includes(expression) ? node : null;
    }
    const element = find(descriptor.template.ast);
    assert.ok(element, `Missing element for ${expression}`);
    const host = document.createElement('div');
    const app = Vue.createApp({ setup: () => bindings, render: Vue.compile(element.loc.source) });
    app.mount(host);
    const result = host.innerHTML;
    app.unmount();
    return result;
}

function parsedHtml(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    return container;
}

function assertSafeHtml(html) {
    const container = parsedHtml(html);
    assert.equal(container.querySelector('script, iframe, object, embed'), null);
    for (const element of container.querySelectorAll('*')) {
        for (const attribute of element.attributes) {
            assert.ok(!/^on/i.test(attribute.name), `Executable attribute ${attribute.name} survived`);
            if (['href', 'src', 'xlink:href'].includes(attribute.name)) {
                assert.ok(!/^\s*(javascript|vbscript|data):/i.test(attribute.value), `Unsafe URL ${attribute.value}`);
            }
        }
    }
    return container;
}

const attackHtml = '<img src=x onerror="window.__securityMarker=1"><svg onload="window.__securityMarker=1"></svg><a href="javascript:alert(1)">unsafe</a>';

for (const [path, stateName] of [
    ['src/components/accounting/InvoiceDetailDrawer.vue', 'drawerSelectedInvoice'],
    ['src/views/accounting/Invoicing.vue', 'selectedInvoice'],
    ['src/views/reporting/reports/shipping/InvoiceSupplemental.vue', 'selectedInvoice']
]) {
    test(`${path} displays API address as text and retains line breaks`, async () => {
        const address = `100 Main St\n${attackHtml}\nSuite 2`;
        const html = await renderElement(path, `${stateName}?.customer?.address`, {
            [stateName]: { customer: { address } }
        });
        const container = parsedHtml(html);
        assert.equal(container.querySelector('img, svg, a'), null);
        assert.equal(container.textContent.trim(), address);
    });
}

test('installation Markdown strips executable HTML and javascript links while retaining document formatting', async () => {
    const renderedMarkdown = await declaredValue('src/components/flynn/InstallationDocumentViewer.vue', 'renderedMarkdown', {
        computed: Vue.computed,
        props: { document: `# Work order\n**Keep bold**\n[unsafe](javascript:alert(1))\n[reference](https://example.com)\n${attackHtml}` },
        ...await htmlBindings()
    });
    const container = assertSafeHtml(renderedMarkdown.value);
    assert.equal(container.querySelector('h1').textContent, 'Work order');
    assert.equal(container.querySelector('strong').textContent, 'Keep bold');
    assert.equal(container.querySelector('a[href="https://example.com"]').textContent, 'reference');
    assert.ok(container.querySelectorAll('br').length >= 3);
});

test('installation print document uses the same sanitized content', async () => {
    const renderedMarkdown = await declaredValue('src/components/flynn/InstallationDocumentViewer.vue', 'renderedMarkdown', {
        computed: Vue.computed,
        props: { document: `## Print\n${attackHtml}` },
        ...await htmlBindings()
    });
    const printed = new JSDOM('<!doctype html><html><body></body></html>');
    const printDocument = await declaredValue('src/components/flynn/InstallationDocumentViewer.vue', 'printDocument', {
        window: { open: () => ({ document: printed.window.document, focus() {}, print() {} }) },
        renderedMarkdown,
        props: { sessionId: attackHtml, locationId: attackHtml, lastGenerated: '2026-10-26T00:00:00Z' },
        formatDate: () => 'Oct 26, 2026',
        setTimeout: (callback) => callback()
    });
    printDocument();
    assertSafeHtml(printed.window.document.documentElement.outerHTML);
    assert.equal(printed.window.document.querySelector('h2').textContent, 'Print');
    assert.ok(printed.window.document.body.textContent.includes(attackHtml));
});

test('scope summary strips stored executable HTML while preserving rich text', async () => {
    const formatMarkdown = await declaredValue('src/views/flynn/LocationScopeReview.vue', 'formatMarkdown', await htmlBindings());
    const html = await renderElement('src/views/flynn/LocationScopeReview.vue', 'flynnStore.projectInfo.scope_summary', {
        formatMarkdown,
        flynnStore: { projectInfo: { scope_summary: `<p><strong>Scope</strong><br>Second line</p>${attackHtml}` } }
    });
    const container = assertSafeHtml(html);
    assert.equal(container.querySelector('strong').textContent, 'Scope');
    assert.ok(container.querySelector('br'));
});

test('mail HTML strips stored executable markup while retaining Quill text formatting', async () => {
    const html = await renderElement('src/views/apps/mail/Detail.vue', 'mail?.message', {
        mail: { message: `<p><strong>Message</strong><br>Second line</p>${attackHtml}` },
        ...await htmlBindings()
    });
    const container = assertSafeHtml(html);
    assert.equal(container.querySelector('strong').textContent, 'Message');
    assert.ok(container.querySelector('br'));
});

test('calendar event and hover tooltip treat API event text as text', async () => {
    const onEventRendered = await declaredValue('src/views/engineering/CalendarView.vue', 'onEventRendered', {
        document,
        window,
        console: silentConsole,
        engineeringEventTypes: Vue.ref({}),
        setTimeout() {},
        handleOverlappingEvents() {}
    });
    const event = document.createElement('div');
    document.body.appendChild(event);
    onEventRendered({ element: event, data: {
        Subject: attackHtml,
        Description: attackHtml,
        Category: attackHtml,
        EstimatedHours: attackHtml,
        StartTime: '2026-10-26T10:00:00Z',
        EndTime: '2026-10-26T11:00:00Z'
    } });
    assert.equal(event.querySelector('img, svg, a'), null);
    event.dispatchEvent(new window.MouseEvent('mouseenter'));
    const tooltip = document.querySelector('.fast-tooltip');
    assert.ok(tooltip);
    assert.equal(tooltip.querySelector('img, svg, a'), null);
    assert.match(tooltip.textContent, /<img/);
    tooltip.remove();
    event.remove();
});

test('receivables risk label renders arbitrary risk values as text', async () => {
    const riskIndicator = await declaredValue('src/views/finance/AccountsReceivable.vue', 'riskIndicator');
    const html = await renderElement('src/views/finance/AccountsReceivable.vue', 'riskIndicator(data.risk)', {
        riskIndicator,
        data: { risk: attackHtml }
    }, 'span');
    const container = parsedHtml(html);
    assert.equal(container.querySelector('img, svg, a'), null);
    assert.equal(container.textContent.trim(), attackHtml);
});

async function microsoftAuth(bindings = {}) {
    const source = (await readFile(new URL('src/auth/MicrosoftAuth.js', root), 'utf8'))
        .replace('import.meta.env.VITE_API_BASE_URL', '"https://backend.example/api"')
        .replace('export const MicrosoftAuth', 'const MicrosoftAuth')
        .replace('export default MicrosoftAuth;', 'return MicrosoftAuth;');
    return new Function('window', 'localStorage', 'crypto', 'console', source)(window, localStorage, webcrypto, silentConsole, ...Object.values(bindings));
}

async function serviceObject(path, name, bindings) {
    let source = await readFile(new URL(path, root), 'utf8');
    const imports = babelParse(source, { sourceType: 'module' }).program.body.filter((node) => node.type === 'ImportDeclaration');
    for (const node of imports.reverse()) source = source.slice(0, node.start) + source.slice(node.end);
    source = source.replaceAll('import.meta.env.VITE_API_BASE_URL', '"https://backend.example/api"')
        .replace(`export const ${name}`, `const ${name}`)
        .replace(`export default ${name};`, `return ${name};`);
    return new Function(...Object.keys(bindings), source)(...Object.values(bindings));
}

test('failed Microsoft state validation cannot fall back to unauthenticated page content', async () => {
    localStorage.clear();
    window.history.replaceState(null, '', '#token=synthetic-token');
    document.body.textContent = '{"token":"synthetic-token","user":{"id":1},"permissions":[]}';
    const auth = await serviceObject('src/auth/AuthService.js', 'AuthService', {
        ref: Vue.ref,
        MicrosoftAuth: await microsoftAuth(),
        LocalAuth: {},
        LogoutService: {},
        ROLES: {},
        PERMISSIONS: {},
        axios: {},
        console: silentConsole
    });
    assert.equal(auth.handleMicrosoftCallback().success, false);
    assert.equal(auth.getToken(), null);
    document.body.textContent = '';
});

test('logout clears every credential alias read by application clients', async () => {
    for (const key of ['auth_token', 'token', 'access_token', 'user', 'user_permissions', 'auth_state']) localStorage.setItem(key, 'synthetic-value');
    const axios = { create: () => ({}), defaults: { headers: { common: { Authorization: 'Bearer synthetic-value' } } } };
    const logout = await serviceObject('src/auth/LogoutService.js', 'LogoutService', { axios, console: silentConsole });
    logout.clearLocalSession();
    for (const key of ['auth_token', 'token', 'access_token', 'user', 'user_permissions', 'auth_state']) assert.equal(localStorage.getItem(key), null, `${key} survived logout`);
    assert.equal(axios.defaults.headers.common.Authorization, undefined);
});

function credentialError() {
    return Object.assign(new Error('Request failed'), {
        response: { status: 401, data: { message: 'Invalid credentials' } },
        config: { headers: { Authorization: 'Bearer SYNTHETIC_SECRET' }, data: '{"password":"SYNTHETIC_SECRET","token":"SYNTHETIC_SECRET"}' }
    });
}

function capturedConsole() {
    const messages = [];
    return { messages, console: Object.fromEntries(['log', 'warn', 'error'].map((method) => [method, (...args) => messages.push(inspect(args))])) };
}

async function apiService(client, console) {
    const source = await readFile(new URL('src/service/ApiService.js', root), 'utf8');
    const declaration = babelParse(source, { sourceType: 'module' }).program.body
        .filter((node) => node.type === 'ExportNamedDeclaration' && node.declaration?.type === 'VariableDeclaration')
        .flatMap((node) => node.declaration.declarations)
        .find((node) => node.id.name === 'ApiService');
    return new Function('apiClient', 'console', `return (${source.slice(declaration.init.start, declaration.init.end)});`)(client, console);
}

for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    test(`ApiService ${method} errors retain the request and rejection while logs omit credentials and response data`, async () => {
        const captured = capturedConsole();
        const rawError = credentialError();
        rawError.message = 'SYNTHETIC_SECRET';
        rawError.response.data = { privateCustomer: 'SYNTHETIC_SECRET' };
        rawError.response.statusText = 'SYNTHETIC_SECRET';
        const calls = [];
        const service = await apiService({ [method]: async (...args) => { calls.push(args); throw rawError; } }, captured.console);
        const payload = { value: 'SYNTHETIC_SECRET' };
        await assert.rejects(service[method]('/items?token=SYNTHETIC_SECRET', payload), (error) => error === rawError);
        const expectedArgs = method === 'delete' ? ['items?token=SYNTHETIC_SECRET']
            : method === 'get' ? ['items?token=SYNTHETIC_SECRET', { params: payload }]
                : ['items?token=SYNTHETIC_SECRET', payload];
        assert.deepEqual(calls, [expectedArgs]);
        assert.ok(captured.messages.every((message) => !message.includes('SYNTHETIC_SECRET')));
        assert.match(captured.messages.join(' '), new RegExp(method, 'i'));
        assert.match(captured.messages.join(' '), /401/);
    });
}

for (const status of [undefined, 'SYNTHETIC_SECRET']) {
    test(`ApiService logs a generic failure for ${status === undefined ? 'network errors' : 'a nonnumeric status'}`, async () => {
        const captured = capturedConsole();
        const rawError = credentialError();
        rawError.response.status = status;
        const service = await apiService({ get: async () => { throw rawError; } }, captured.console);
        await assert.rejects(service.get('/items?token=SYNTHETIC_SECRET'), (error) => error === rawError);
        assert.ok(captured.messages.length > 0);
        assert.ok(captured.messages.every((message) => !message.includes('SYNTHETIC_SECRET')));
    });
}

for (const [method, args] of [
    ['login', ['user@example.com', 'SYNTHETIC_SECRET']],
    ['register', [{ email: 'user@example.com', password: 'SYNTHETIC_SECRET' }]],
    ['forgotPassword', ['user@example.com']],
    ['resetPassword', ['SYNTHETIC_SECRET', 'new-password', 'new-password']],
    ['verifyEmail', ['SYNTHETIC_SECRET']]
]) {
    test(`local ${method} failure does not log Axios credentials`, async () => {
        const captured = capturedConsole();
        const auth = await serviceObject('src/auth/LocalAuth.js', 'LocalAuth', {
            axios: { create: () => ({ post: async () => { throw credentialError(); } }) },
            console: captured.console
        });
        assert.equal((await auth[method](...args)).success, false);
        assert.ok(captured.messages.every((message) => !message.includes('SYNTHETIC_SECRET')));
    });
}

test('server logout failure does not log Axios bearer credentials', async () => {
    const captured = capturedConsole();
    const logout = await serviceObject('src/auth/LogoutService.js', 'LogoutService', {
        axios: { create: () => ({ post: async () => { throw credentialError(); } }) },
        console: captured.console
    });
    await logout.logout('SYNTHETIC_SECRET');
    assert.ok(captured.messages.every((message) => !message.includes('SYNTHETIC_SECRET')));
});

for (const method of ['logout', 'getCurrentUser']) {
    test(`central auth ${method} failure does not log Axios bearer credentials`, async () => {
        localStorage.clear();
        const captured = capturedConsole();
        const auth = await serviceObject('src/auth/AuthService.js', 'AuthService', {
            ref: Vue.ref,
            MicrosoftAuth: {},
            LocalAuth: {},
            LogoutService: { logout: async () => { throw credentialError(); } },
            ROLES: {},
            PERMISSIONS: {},
            axios: { get: async () => { throw credentialError(); } },
            console: captured.console
        });
        auth.setToken('SYNTHETIC_SECRET');
        if (method === 'logout') {
            await assert.rejects(auth.logout(), { message: 'Request failed' });
        } else {
            assert.equal(await auth.getCurrentUser(), null);
        }
        assert.ok(captured.messages.every((message) => !message.includes('SYNTHETIC_SECRET')));
    });
}

test('Microsoft login generates state from browser cryptographic randomness', async () => {
    let redirected;
    let randomCalls = 0;
    const source = (await readFile(new URL('src/auth/MicrosoftAuth.js', root), 'utf8'))
        .replace('import.meta.env.VITE_API_BASE_URL', '"https://backend.example/api"')
        .replace('export const MicrosoftAuth', 'const MicrosoftAuth')
        .replace('export default MicrosoftAuth;', 'return MicrosoftAuth;');
    const auth = new Function('window', 'localStorage', 'crypto', 'console', source)(
        { location: { origin: 'https://frontend.example', set href(value) { redirected = value; } } },
        localStorage,
        { getRandomValues: (array) => { randomCalls++; return webcrypto.getRandomValues(array); } },
        silentConsole
    );
    auth.login();
    assert.equal(randomCalls, 1);
    const state = localStorage.getItem('auth_state');
    assert.match(state, /^[a-f0-9]{64}$/);
    assert.equal(new URL(redirected).searchParams.get('state'), state);
    localStorage.clear();
});

for (const [name, returnedState, storedState] of [
    ['missing callback state', '', 'expected-state'],
    ['missing browser state', 'expected-state', null],
    ['mismatched state', 'attacker-state', 'expected-state']
]) {
    test(`Microsoft callback rejects ${name}`, async () => {
        localStorage.clear();
        if (storedState) localStorage.setItem('auth_state', storedState);
        window.history.replaceState(null, '', `#token=synthetic-token${returnedState ? `&state=${returnedState}` : ''}`);
        const result = (await microsoftAuth()).handleCallback();
        assert.equal(result.success, false);
        assert.equal(result.token, undefined);
    });
}

test('Microsoft callback accepts matching state once and rejects replay', async () => {
    localStorage.setItem('auth_state', 'expected-state');
    window.history.replaceState(null, '', '#token=synthetic-token&state=expected-state');
    const auth = await microsoftAuth();
    assert.equal(auth.handleCallback().success, true);
    assert.equal(localStorage.getItem('auth_state'), null);
    assert.equal(auth.handleCallback().success, false);
});

for (const success of [true, false]) {
    test(`Microsoft callback ${success ? 'success' : 'failure'} never logs or renders callback credentials`, async () => {
        const marker = 'SYNTHETIC_CREDENTIAL_MARKER';
        window.history.replaceState(null, '', `?code=${marker}#token=${marker}`);
        const descriptor = await sfc('src/views/auth/MicrosoftCallback.vue');
        const script = descriptor.scriptSetup.content;
        const imports = babelParse(script, { sourceType: 'module' }).program.body.filter((node) => node.type === 'ImportDeclaration');
        let executable = script;
        for (const node of imports.reverse()) executable = executable.slice(0, node.start) + executable.slice(node.end);
        let mounted;
        const logs = [];
        const captureConsole = Object.fromEntries(['log', 'error', 'warn'].map((method) => [method, (...args) => logs.push(inspect(args))]));
        const AuthService = {
            handleMicrosoftCallback: () => ({ success, token: marker, user: { id: 1 }, permissions: [], error: success ? undefined : 'Security validation failed' }),
            getCurrentUser: async () => ({ id: 1 }),
            getToken: () => marker,
            getUser: () => ({ id: 1 }),
            getPermissions: () => [],
            hasRole: () => false
        };
        const bindings = { onMounted: (callback) => { mounted = callback; }, ref: Vue.ref, useRouter: () => ({ push() {} }), AuthService, console: captureConsole, setTimeout: (callback) => callback() };
        const result = new Function(...Object.keys(bindings), `${executable}\nreturn { error, loading, debugInfo: typeof debugInfo === 'undefined' ? null : debugInfo, goToLogin };`)(...Object.values(bindings));
        await mounted();
        assert.ok(logs.every((log) => !log.includes(marker)), 'Credential reached console output');
        assert.ok(!inspect(result.debugInfo).includes(marker), 'Credential reached visible debug state');
        assert.ok(!window.location.href.includes(marker), 'Credential remained in browser URL');
    });
}
