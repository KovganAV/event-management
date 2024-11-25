require('dotenv').config();
const express = require('express');
const redis = require('redis');

const app = express();
app.use(express.json());

const redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

redisClient.on('connect', () => {
    console.log('Connected to Redis');
});
redisClient.on('error', (err) => {
    console.error('Redis error:', err);
});

app.get('/events', async (req, res) => {
    const { date, type } = req.query;

    const cacheKey = `events:${date || 'all'}:${type || 'all'}`;

    redisClient.get(cacheKey, (err, cachedEvents) => {
        if (cachedEvents) {      
            return res.json(JSON.parse(cachedEvents));
        } else {
            const events = [
                { id: 1, name: 'Event 1', date: '2024-12-01', type: 'conference' },
                { id: 2, name: 'Event 2', date: '2024-12-05', type: 'meetup' },
            ];
            redisClient.setex(cacheKey, 60, JSON.stringify(events));
            res.json(events);
        }
    });
});

app.post('/events', (req, res) => {
    const { name, date, type } = req.body;
    const newEvent = { id: Date.now(), name, date, type };
    redisClient.del('events:all:all');
    res.status(201).json(newEvent);
});

app.put('/events/:event_id', (req, res) => {
    const { event_id } = req.params;
    const { name, date, type } = req.body;
    const updatedEvent = { id: event_id, name, date, type };
    redisClient.del('events:all:all');
    res.json(updatedEvent);
});

app.delete('/events/:event_id', (req, res) => {
    const { event_id } = req.params;
    redisClient.del('events:all:all');
    res.status(204).send();
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Event Management Service running on port ${PORT}`);
});
