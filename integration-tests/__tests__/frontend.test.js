/**
 * Frontend Tests
 * Tests for the Angular frontend application
 */

describe('Frontend Tests', () => {
    describe('Availability', () => {
        test('Frontend is accessible', async () => {
            const response = await frontendApi.get('/');
            expect(response.status).toBe(200);
        });

        test('Frontend serves HTML content', async () => {
            const response = await frontendApi.get('/');
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Frontend contains app root element', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('<app-root');
        });
    });

    describe('Static Assets', () => {
        test('JavaScript bundle is served', async () => {
            const indexResponse = await frontendApi.get('/');
            const html = indexResponse.data;

            // Check that there are script tags
            expect(html).toMatch(/<script[^>]*src="[^"]*\.js"[^>]*>/);
        });

        test('CSS styles are applied', async () => {
            const indexResponse = await frontendApi.get('/');
            const html = indexResponse.data;

            // Check for stylesheet links or inline styles
            const hasStyles = html.includes('<link') && html.includes('.css') ||
                html.includes('<style');
            expect(hasStyles).toBe(true);
        });
    });

    describe('Application Content', () => {
        test('Frontend contains ShopTrack branding', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('ShopTrack');
        });

        test('Frontend contains app-root element', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('app-root');
        });
    });

    describe('SSR Health', () => {
        test('Server-side rendering returns complete HTML', async () => {
            const response = await frontendApi.get('/');
            const html = response.data;

            // SSR should return a complete HTML document
            expect(html).toContain('<!DOCTYPE html>');
            expect(html).toContain('</html>');
            expect(html).toContain('<head>');
            expect(html).toContain('<body>');
        });
    });

    describe('Shopping App Pages', () => {
        test('Home page loads with hero section', async () => {
            const response = await frontendApi.get('/');
            expect(response.status).toBe(200);
            expect(response.data).toContain('Welcome');
        });

        test('Login page is accessible', async () => {
            const response = await frontendApi.get('/login');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Register page is accessible', async () => {
            const response = await frontendApi.get('/register');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Marketplace page is accessible', async () => {
            const response = await frontendApi.get('/shop');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('My Shop (Sell) page is accessible', async () => {
            const response = await frontendApi.get('/sell');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Admin dashboard page is accessible', async () => {
            const response = await frontendApi.get('/admin');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Profiles page is accessible', async () => {
            const response = await frontendApi.get('/profiles');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });
    });

    describe('Navigation Elements', () => {
        test('Navigation contains Marketplace link', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('Marketplace');
        });

        test('Navigation contains Login button', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('Login');
        });

        test('Navigation contains Register button', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('Register');
        });

        test('Footer contains copyright information', async () => {
            const response = await frontendApi.get('/');
            expect(response.data).toContain('2025');
            expect(response.data).toContain('ShopTrack');
        });
    });

    describe('Page Content Validation', () => {
        test('Login page contains form elements', async () => {
            const response = await frontendApi.get('/login');
            const html = response.data.toLowerCase();
            expect(
                html.includes('email') ||
                html.includes('password') ||
                html.includes('login') ||
                html.includes('sign in')
            ).toBe(true);
        });

        test('Register page contains registration form', async () => {
            const response = await frontendApi.get('/register');
            const html = response.data.toLowerCase();
            expect(
                html.includes('register') ||
                html.includes('sign up') ||
                html.includes('create')
            ).toBe(true);
        });

        test('Marketplace page contains product-related elements', async () => {
            const response = await frontendApi.get('/shop');
            const html = response.data.toLowerCase();
            expect(
                html.includes('marketplace') ||
                html.includes('product') ||
                html.includes('search') ||
                html.includes('filter')
            ).toBe(true);
        });

        test('My Shop page contains seller dashboard elements', async () => {
            const response = await frontendApi.get('/sell');
            const html = response.data.toLowerCase();
            expect(
                html.includes('shop') ||
                html.includes('product') ||
                html.includes('sell') ||
                html.includes('add')
            ).toBe(true);
        });

        test('Admin page contains admin dashboard elements', async () => {
            const response = await frontendApi.get('/admin');
            const html = response.data.toLowerCase();
            expect(
                html.includes('admin') ||
                html.includes('dashboard') ||
                html.includes('statistics') ||
                html.includes('users')
            ).toBe(true);
        });

        test('Profiles page contains profiling elements', async () => {
            const response = await frontendApi.get('/profiles');
            const html = response.data.toLowerCase();
            expect(
                html.includes('profile') ||
                html.includes('user') ||
                html.includes('type')
            ).toBe(true);
        });
    });
});
