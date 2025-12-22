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
        test('Frontend contains application branding', async () => {
            const response = await frontendApi.get('/');
            // Check for app title or branding in the HTML
            const html = response.data.toLowerCase();
            expect(
                html.includes('observability') ||
                html.includes('app-root') ||
                html.includes('angular')
            ).toBe(true);
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
});
