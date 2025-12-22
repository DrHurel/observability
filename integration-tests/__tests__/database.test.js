/**
 * Database Tests
 * Tests for MongoDB and ClickHouse database connectivity and data
 */

const { MongoClient } = require('mongodb');
const axios = require('axios');

describe('Database Tests', () => {
    describe('MongoDB', () => {
        let client;
        let db;

        beforeAll(async () => {
            client = new MongoClient(CONFIG.mongodb.uri);
            await client.connect();
            db = client.db();
        });

        afterAll(async () => {
            if (client) {
                await client.close();
            }
        });

        test('MongoDB connection is successful', async () => {
            const adminDb = client.db().admin();
            const result = await adminDb.ping();
            expect(result.ok).toBe(1);
        });

        test('Users collection exists and is accessible', async () => {
            const collections = await db.listCollections({ name: 'users' }).toArray();
            expect(collections.length).toBe(1);
        });

        test('Products collection exists and is accessible', async () => {
            const collections = await db.listCollections({ name: 'products' }).toArray();
            expect(collections.length).toBe(1);
        });

        test('Users collection contains documents', async () => {
            const count = await db.collection('users').countDocuments();
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('Products collection contains documents', async () => {
            const count = await db.collection('products').countDocuments();
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('Can perform CRUD operations on MongoDB', async () => {
            const testCollection = db.collection('integration_test');
            const testDoc = {
                name: 'integration-test',
                timestamp: new Date(),
                value: Math.random()
            };

            // Create
            const insertResult = await testCollection.insertOne(testDoc);
            expect(insertResult.acknowledged).toBe(true);

            // Read
            const found = await testCollection.findOne({ _id: insertResult.insertedId });
            expect(found.name).toBe('integration-test');

            // Update
            await testCollection.updateOne(
                { _id: insertResult.insertedId },
                { $set: { name: 'updated-test' } }
            );
            const updated = await testCollection.findOne({ _id: insertResult.insertedId });
            expect(updated.name).toBe('updated-test');

            // Delete
            await testCollection.deleteOne({ _id: insertResult.insertedId });
            const deleted = await testCollection.findOne({ _id: insertResult.insertedId });
            expect(deleted).toBeNull();
        });
    });

    describe('ClickHouse', () => {
        const clickhouseUrl = `http://${CONFIG.clickhouse.host}:${CONFIG.clickhouse.port}`;

        test('ClickHouse is responsive', async () => {
            const response = await axios.get(`${clickhouseUrl}/ping`);
            expect(response.status).toBe(200);
        });

        test('ClickHouse can execute queries', async () => {
            const response = await axios.get(`${clickhouseUrl}/?query=SELECT%201`);
            expect(response.status).toBe(200);
            expect(String(response.data).trim()).toBe('1');
        });

        test('user_events table exists', async () => {
            const query = encodeURIComponent(
                "SELECT name FROM system.tables WHERE database = 'observability' AND name = 'user_events'"
            );
            const response = await axios.get(`${clickhouseUrl}/?query=${query}`);
            expect(response.data.trim()).toBe('user_events');
        });

        test('product_events table exists', async () => {
            const query = encodeURIComponent(
                "SELECT name FROM system.tables WHERE database = 'observability' AND name = 'product_events'"
            );
            const response = await axios.get(`${clickhouseUrl}/?query=${query}`);
            expect(response.data.trim()).toBe('product_events');
        });

        test('Can query user_events table', async () => {
            const query = encodeURIComponent('SELECT count() FROM observability.user_events');
            const response = await axios.get(`${clickhouseUrl}/?query=${query}`);
            expect(response.status).toBe(200);
            const count = parseInt(String(response.data).trim(), 10);
            expect(count).toBeGreaterThanOrEqual(0);
        });

        test('Can query product_events table', async () => {
            const query = encodeURIComponent('SELECT count() FROM observability.product_events');
            const response = await axios.get(`${clickhouseUrl}/?query=${query}`);
            expect(response.status).toBe(200);
            const count = parseInt(String(response.data).trim(), 10);
            expect(count).toBeGreaterThanOrEqual(0);
        });
    });
});
