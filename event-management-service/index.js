require('dotenv').config();
const express = require('express');
const redis = require('redis');
const { MongoClient, ObjectId } = require('mongodb');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

const redisClient = redis.createClient({
    socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
    },
});

redisClient.connect().then(() => {
    console.log('Connected to Redis');
}).catch((err) => {
    console.error('Redis connection error:', err);
});

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017';
const mongoClient = new MongoClient(mongoUri);
let db;

mongoClient.connect()
    .then(() => {
        db = mongoClient.db('event_management');
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'Event Management API',
            version: '1.0.0',
            description: 'API для управления событиями с использованием MongoDB и Redis.',
        },
        servers: [{ url: `http://localhost:${process.env.PORT || 3001}` }],
    },
    apis: ['./index.js'], 
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Получить список событий
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *         description: Дата событий
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Тип событий
 *     responses:
 *       200:
 *         description: Список событий
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   date:
 *                     type: string
 *                   type:
 *                     type: string
 */
app.get('/events', async (req, res) => {
    const { date, type } = req.query;
    const cacheKey = `events:${date || 'all'}:${type || 'all'}`;

    try {
        const cachedEvents = await redisClient.get(cacheKey);
        if (cachedEvents) {
            return res.json(JSON.parse(cachedEvents));
        }

        const query = {};
        if (date) query.date = date;
        if (type) query.type = type;

        const events = await db.collection('events').find(query).toArray();
        await redisClient.setEx(cacheKey, 60, JSON.stringify(events));

        res.json(events);
    } catch (err) {
        console.error('Error fetching events:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Создать новое событие
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Событие создано
 */
app.post('/events', async (req, res) => {
    const { name, date, type } = req.body;

    try {
        const newEvent = { name, date, type };
        const result = await db.collection('events').insertOne(newEvent);
        await redisClient.del('events:all:all');

        res.status(201).json({ id: result.insertedId, ...newEvent });
    } catch (err) {
        console.error('Error adding event:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /events/{event_id}:
 *   put:
 *     summary: Обновить событие
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               date:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Событие обновлено
 */
app.put('/events/:event_id', async (req, res) => {
    const { event_id } = req.params;
    const { name, date, type } = req.body;

    try {
        const updatedEvent = { name, date, type };
        const result = await db.collection('events').updateOne(
            { _id: new ObjectId(event_id) },
            { $set: updatedEvent }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await redisClient.del('events:all:all');
        res.json({ id: event_id, ...updatedEvent });
    } catch (err) {
        console.error('Error updating event:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @swagger
 * /events/{event_id}:
 *   delete:
 *     summary: Удалить событие
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: event_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID события
 *     responses:
 *       204:
 *         description: Событие удалено
 */
app.delete('/events/:event_id', async (req, res) => {
    const { event_id } = req.params;

    try {
        const result = await db.collection('events').deleteOne({ _id: new ObjectId(event_id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        await redisClient.del('events:all:all');
        res.status(204).send();
    } catch (err) {
        console.error('Error deleting event:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Event Management Service running on port ${PORT}`);
    console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
