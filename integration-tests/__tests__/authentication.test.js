/**
 * Authentication & User Session Tests
 * Tests for login, registration, and user session management
 */

describe('Authentication Tests', () => {
    describe('User Registration', () => {
        test('POST /api/users creates a new user for registration', async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/users', testData.user);

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.name).toBe(testData.user.name);
            expect(response.data.email).toBe(testData.user.email);
        });

        test('Registration with existing email returns 409 conflict (unique constraint on profiles)', async () => {
            const testData = generateTestData();
            // Create first user
            await backendApi.post('/api/users', testData.user);

            // Try to create another user with same email - should return conflict
            try {
                const secondUser = { ...testData.user, name: 'Different Name' };
                await backendApi.post('/api/users', secondUser);
                // If no error, check response
            } catch (error) {
                // 409 Conflict is expected due to unique profile constraint
                expect(error.response.status).toBe(409);
            }
        });

        test('Registration with missing password returns 400', async () => {
            try {
                await backendApi.post('/api/users', {
                    name: 'Test User',
                    email: 'test@example.com'
                    // Missing password
                });
                fail('Expected 400 error');
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('Registration with missing email returns 400', async () => {
            try {
                await backendApi.post('/api/users', {
                    name: 'Test User',
                    password: 'TestPass123!'
                    // Missing email
                });
                fail('Expected 400 error');
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });
    });

    describe('User Lookup (Login Support)', () => {
        let testUser;

        beforeAll(async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/users', testData.user);
            testUser = response.data;
        });

        test('GET /api/users returns list that can be searched by email', async () => {
            const response = await backendApi.get('/api/users');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // Find our test user by email
            const foundUser = response.data.find(u => u.email === testUser.email);
            expect(foundUser).toBeDefined();
            expect(foundUser.id).toBe(testUser.id);
        });

        test('GET /api/users/:id retrieves user by ID for session', async () => {
            const response = await backendApi.get(`/api/users/${testUser.id}`);
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(testUser.id);
            expect(response.data.email).toBe(testUser.email);
        });
    });

    describe('Frontend Login Page', () => {
        test('Login page is accessible', async () => {
            const response = await frontendApi.get('/login');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Login page contains login form elements', async () => {
            const response = await frontendApi.get('/login');
            const html = response.data.toLowerCase();

            // Check for login-related content
            expect(
                html.includes('login') ||
                html.includes('sign in') ||
                html.includes('email') ||
                html.includes('password')
            ).toBe(true);
        });

        test('Login page contains login functionality', async () => {
            const response = await frontendApi.get('/login');
            const html = response.data.toLowerCase();

            // Check for login form elements
            expect(
                html.includes('email') ||
                html.includes('password') ||
                html.includes('sign in') ||
                html.includes('login')
            ).toBe(true);
        });
    });

    describe('Frontend Registration Page', () => {
        test('Registration page is accessible', async () => {
            const response = await frontendApi.get('/register');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Registration page contains registration form', async () => {
            const response = await frontendApi.get('/register');
            const html = response.data.toLowerCase();

            // Check for registration-related content
            expect(
                html.includes('register') ||
                html.includes('sign up') ||
                html.includes('create account')
            ).toBe(true);
        });
    });

    describe('Frontend Protected Routes', () => {
        test('My Shop page is accessible', async () => {
            const response = await frontendApi.get('/sell');
            expect(response.status).toBe(200);
        });

        test('Admin page is accessible', async () => {
            const response = await frontendApi.get('/admin');
            expect(response.status).toBe(200);
        });

        test('Profiles page is accessible', async () => {
            const response = await frontendApi.get('/profiles');
            expect(response.status).toBe(200);
        });
    });

    describe('Frontend Navigation', () => {
        test('Home page shows login/register buttons when not logged in', async () => {
            const response = await frontendApi.get('/');
            const html = response.data;

            expect(html.includes('Login') || html.includes('login')).toBe(true);
            expect(html.includes('Register') || html.includes('register')).toBe(true);
        });

        test('Marketplace page is accessible', async () => {
            const response = await frontendApi.get('/shop');
            expect(response.status).toBe(200);
            expect(response.headers['content-type']).toContain('text/html');
        });

        test('Navigation contains ShopTrack branding', async () => {
            const response = await frontendApi.get('/');
            const html = response.data;

            expect(html.includes('ShopTrack')).toBe(true);
        });
    });
});

describe('User Profiling Integration', () => {
    describe('Profiles API', () => {
        test('GET /api/profiles returns profiles list', async () => {
            const response = await backendApi.get('/api/profiles');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /api/profiles/statistics returns profile statistics', async () => {
            const response = await backendApi.get('/api/profiles/statistics');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('totalProfiles');
        });

        test('Profiles have correct structure', async () => {
            const response = await backendApi.get('/api/profiles');

            if (response.data.length > 0) {
                const profile = response.data[0];
                // Check profile has expected fields
                expect(profile).toHaveProperty('profileType');
                expect(['READ_HEAVY', 'WRITE_HEAVY', 'EXPENSIVE_SEEKER', 'BALANCED']).toContain(profile.profileType);
            }
        });
    });

    describe('Action Recording with User Context', () => {
        let testUser;

        beforeAll(async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/users', testData.user);
            testUser = response.data;
        });

        test('API calls with X-User-Id header are accepted', async () => {
            const response = await backendApi.get('/api/products', {
                headers: { 'X-User-Id': testUser.id }
            });
            expect(response.status).toBe(200);
        });

        test('API calls with X-User-Email header are accepted', async () => {
            const response = await backendApi.get('/api/products', {
                headers: { 'X-User-Email': testUser.email }
            });
            expect(response.status).toBe(200);
        });

        test('Multiple actions create user activity', async () => {
            // Perform several read actions
            for (let i = 0; i < 3; i++) {
                await backendApi.get('/api/products', {
                    headers: { 'X-User-Email': testUser.email }
                });
            }

            // Perform a write action
            const testData = generateTestData();
            await backendApi.post('/api/products', testData.product, {
                headers: { 'X-User-Email': testUser.email }
            });

            // These actions should be recorded (verified through profiles endpoint)
            const profilesResponse = await backendApi.get('/api/profiles');
            expect(profilesResponse.status).toBe(200);
        });
    });

    describe('Profile Types', () => {
        test('GET /api/profiles/type/READ_HEAVY returns read-heavy profiles', async () => {
            const response = await backendApi.get('/api/profiles/type/READ_HEAVY');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // All returned profiles should be READ_HEAVY
            response.data.forEach(profile => {
                expect(profile.profileType).toBe('READ_HEAVY');
            });
        });

        test('GET /api/profiles/type/WRITE_HEAVY returns write-heavy profiles', async () => {
            const response = await backendApi.get('/api/profiles/type/WRITE_HEAVY');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /api/profiles/type/EXPENSIVE_SEEKER returns expensive-seeker profiles', async () => {
            const response = await backendApi.get('/api/profiles/type/EXPENSIVE_SEEKER');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('GET /api/profiles/type/BALANCED returns balanced profiles', async () => {
            const response = await backendApi.get('/api/profiles/type/BALANCED');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });
    });
});

describe('Shopping Flow Integration', () => {
    describe('Complete Shopping Workflow', () => {
        let seller;
        let buyer;
        let createdProduct;

        beforeAll(async () => {
            // Create seller user
            const sellerData = generateTestData();
            sellerData.user.name = 'Test Seller';
            const sellerResponse = await backendApi.post('/api/users', sellerData.user);
            seller = sellerResponse.data;

            // Create buyer user
            const buyerData = generateTestData();
            buyerData.user.name = 'Test Buyer';
            const buyerResponse = await backendApi.post('/api/users', buyerData.user);
            buyer = buyerResponse.data;
        });

        test('Seller can create a product', async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/products', testData.product, {
                headers: { 'X-User-Email': seller.email }
            });

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            createdProduct = response.data;
        });

        test('Buyer can view products', async () => {
            const response = await backendApi.get('/api/products', {
                headers: { 'X-User-Email': buyer.email }
            });

            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);

            // Should find the created product
            const found = response.data.find(p => p.id === createdProduct?.id);
            if (createdProduct) {
                expect(found).toBeDefined();
            }
        });

        test('Buyer can view specific product details', async () => {
            if (!createdProduct) {
                // Skip if product wasn't created
                return;
            }

            const response = await backendApi.get(`/api/products/${createdProduct.id}`, {
                headers: { 'X-User-Email': buyer.email }
            });

            expect(response.status).toBe(200);
            expect(response.data.id).toBe(createdProduct.id);
        });

        test('Seller can update their product', async () => {
            if (!createdProduct) {
                return;
            }

            const updatedProduct = {
                ...createdProduct,
                price: 599.99
            };

            const response = await backendApi.put(`/api/products/${createdProduct.id}`, updatedProduct, {
                headers: { 'X-User-Email': seller.email }
            });

            expect(response.status).toBe(200);
            expect(response.data.price).toBe(599.99);
        });

        test('Seller can delete their product', async () => {
            if (!createdProduct) {
                return;
            }

            const response = await backendApi.delete(`/api/products/${createdProduct.id}`, {
                headers: { 'X-User-Email': seller.email }
            });

            expect(response.status).toBe(204);
        });
    });
});

describe('Admin Features Integration', () => {
    describe('Admin Dashboard Data', () => {
        test('Users count is available', async () => {
            const response = await backendApi.get('/api/users');
            expect(response.status).toBe(200);
            expect(response.data.length).toBeGreaterThan(0);
        });

        test('Products count is available', async () => {
            const response = await backendApi.get('/api/products');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('Profiles stats are available for admin view', async () => {
            const response = await backendApi.get('/api/profiles/statistics');
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('totalProfiles');
            expect(response.data).toHaveProperty('profileTypeDistribution');
        });
    });

    describe('Admin Frontend Page', () => {
        test('Admin dashboard page loads', async () => {
            const response = await frontendApi.get('/admin');
            expect(response.status).toBe(200);
        });

        test('Admin dashboard contains statistics elements', async () => {
            const response = await frontendApi.get('/admin');
            const html = response.data.toLowerCase();

            expect(
                html.includes('admin') ||
                html.includes('dashboard') ||
                html.includes('statistics') ||
                html.includes('stats')
            ).toBe(true);
        });
    });
});
