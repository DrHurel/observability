/**
 * Backend API Tests
 * Tests for the Spring Boot backend REST API endpoints
 */

describe('Backend API Tests', () => {
    describe('Health & Availability', () => {
        test('Backend service is accessible', async () => {
            const response = await backendApi.get('/actuator/health');
            expect(response.status).toBe(200);
        });

        test('Health check returns UP status', async () => {
            const response = await backendApi.get('/actuator/health');
            expect(response.data.status).toBe('UP');
        });

        test('Actuator info endpoint is available', async () => {
            const response = await backendApi.get('/actuator/info');
            expect(response.status).toBe(200);
        });
    });

    describe('Users API', () => {
        let createdUserId;

        test('GET /api/users returns array', async () => {
            const response = await backendApi.get('/api/users');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('POST /api/users creates a new user', async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/users', testData.user);

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.name).toBe(testData.user.name);
            expect(response.data.email).toBe(testData.user.email);

            createdUserId = response.data.id;
        });

        test('GET /api/users/:id returns specific user', async () => {
            // First create a user to get
            const testData = generateTestData();
            const createResponse = await backendApi.post('/api/users', testData.user);
            const userId = createResponse.data.id;

            const response = await backendApi.get(`/api/users/${userId}`);
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(userId);
        });

        test('GET /api/users/:id returns 404 for non-existent user', async () => {
            try {
                await backendApi.get('/api/users/000000000000000000000000');
                fail('Expected 404 error');
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('Products API', () => {
        let createdProductId;

        test('GET /api/products returns array', async () => {
            const response = await backendApi.get('/api/products');
            expect(response.status).toBe(200);
            expect(Array.isArray(response.data)).toBe(true);
        });

        test('POST /api/products creates a new product', async () => {
            const testData = generateTestData();
            const response = await backendApi.post('/api/products', testData.product);

            expect(response.status).toBe(201);
            expect(response.data).toHaveProperty('id');
            expect(response.data.name).toBe(testData.product.name);
            expect(response.data.price).toBe(testData.product.price);

            createdProductId = response.data.id;
        });

        test('GET /api/products/:id returns specific product', async () => {
            // First create a product
            const testData = generateTestData();
            const createResponse = await backendApi.post('/api/products', testData.product);
            const productId = createResponse.data.id;

            const response = await backendApi.get(`/api/products/${productId}`);
            expect(response.status).toBe(200);
            expect(response.data.id).toBe(productId);
        });

        test('PUT /api/products/:id updates a product', async () => {
            // Create a product first
            const testData = generateTestData();
            const createResponse = await backendApi.post('/api/products', testData.product);
            const productId = createResponse.data.id;

            // Update it
            const updatedProduct = {
                ...testData.product,
                name: 'Updated Product Name',
                price: 999
            };

            const response = await backendApi.put(`/api/products/${productId}`, updatedProduct);
            expect(response.status).toBe(200);
            expect(response.data.name).toBe('Updated Product Name');
            expect(response.data.price).toBe(999);
        });

        test('DELETE /api/products/:id removes a product', async () => {
            // Create a product first
            const testData = generateTestData();
            const createResponse = await backendApi.post('/api/products', testData.product);
            const productId = createResponse.data.id;

            // Delete it
            const deleteResponse = await backendApi.delete(`/api/products/${productId}`);
            expect(deleteResponse.status).toBe(204);

            // Verify it's gone
            try {
                await backendApi.get(`/api/products/${productId}`);
                fail('Expected 404 error');
            } catch (error) {
                expect(error.response.status).toBe(404);
            }
        });
    });

    describe('API Error Handling', () => {
        test('POST /api/users with invalid data returns 400', async () => {
            try {
                await backendApi.post('/api/users', {
                    name: 'Test',
                    // Missing required fields
                });
                fail('Expected 400 error');
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });

        test('POST /api/products with invalid data returns 400', async () => {
            try {
                await backendApi.post('/api/products', {
                    // Missing required fields
                });
                fail('Expected 400 error');
            } catch (error) {
                expect(error.response.status).toBe(400);
            }
        });
    });
});
