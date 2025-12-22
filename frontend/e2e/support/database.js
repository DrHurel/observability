const axios = require('axios');

class DatabaseHelper {
    constructor() {
        this.baseUrl = process.env.API_URL || 'http://localhost:8080';
    }

    /**
     * Check if database is accessible via API health endpoint
     */
    async checkDatabaseConnection() {
        try {
            const response = await axios.get(`${this.baseUrl}/actuator/health`);
            return response.status === 200;
        } catch (error) {
            console.error('Database connection check failed:', error.message);
            return false;
        }
    }

    /**
     * Get all users from database via API
     */
    async getAllUsers() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/users`);
            return response.data;
        } catch (error) {
            console.error('Failed to get users:', error.message);
            throw error;
        }
    }

    /**
     * Get user by email from database
     */
    async getUserByEmail(email) {
        try {
            const users = await this.getAllUsers();
            return users.find(user => user.email === email);
        } catch (error) {
            console.error(`Failed to get user with email ${email}:`, error.message);
            return null;
        }
    }

    /**
     * Get all products from database via API
     */
    async getAllProducts() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/products`);
            return response.data;
        } catch (error) {
            console.error('Failed to get products:', error.message);
            throw error;
        }
    }

    /**
     * Get product by name from database
     */
    async getProductByName(name) {
        try {
            const products = await this.getAllProducts();
            return products.find(product => product.name === name);
        } catch (error) {
            console.error(`Failed to get product with name ${name}:`, error.message);
            return null;
        }
    }

    /**
     * Create a user directly via API
     */
    async createUser(userData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/users`, userData);
            return response.data;
        } catch (error) {
            console.error('Failed to create user:', error.message);
            throw error;
        }
    }

    /**
     * Create a product directly via API
     */
    async createProduct(productData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/products`, productData);
            return response.data;
        } catch (error) {
            console.error('Failed to create product:', error.message);
            throw error;
        }
    }

    /**
     * Delete all users (for cleanup)
     */
    async deleteAllUsers() {
        try {
            const users = await this.getAllUsers();
            for (const user of users) {
                await axios.delete(`${this.baseUrl}/api/users/${user.id}`);
            }
        } catch (error) {
            console.error('Failed to delete users:', error.message);
        }
    }

    /**
     * Delete all products (for cleanup)
     */
    async deleteAllProducts() {
        try {
            const products = await this.getAllProducts();
            for (const product of products) {
                await axios.delete(`${this.baseUrl}/api/products/${product.id}`);
            }
        } catch (error) {
            console.error('Failed to delete products:', error.message);
        }
    }

    /**
     * Get user count from database
     */
    async getUserCount() {
        try {
            const users = await this.getAllUsers();
            return users.length;
        } catch (error) {
            console.error('Failed to get user count:', error.message);
            return 0;
        }
    }

    /**
     * Get product count from database
     */
    async getProductCount() {
        try {
            const products = await this.getAllProducts();
            return products.length;
        } catch (error) {
            console.error('Failed to get product count:', error.message);
            return 0;
        }
    }

    /**
     * Wait for data to be persisted (polling with timeout)
     */
    async waitForUser(email, timeoutMs = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const user = await this.getUserByEmail(email);
            if (user) {
                return user;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error(`Timeout waiting for user with email: ${email}`);
    }

    /**
     * Wait for product to be persisted
     */
    async waitForProduct(name, timeoutMs = 5000) {
        const startTime = Date.now();
        while (Date.now() - startTime < timeoutMs) {
            const product = await this.getProductByName(name);
            if (product) {
                return product;
            }
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        throw new Error(`Timeout waiting for product with name: ${name}`);
    }
}

module.exports = DatabaseHelper;
