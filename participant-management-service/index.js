require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
app.use(express.json());

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/participants';
mongoose
  .connect(mongoUri)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

const participantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  eventId: { type: String, required: true },
});

const Participant = mongoose.model('Participant', participantSchema);

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Participant Management API',
      version: '1.0.0',
      description: 'API for managing participants using MongoDB.',
    },
    servers: [{ url: `http://localhost:${process.env.PORT || 3002}` }],
  },
  apis: ['./index.js'],
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

/**
 * @swagger
 * /participants:
 *   get:
 *     summary: Получить список участников
 *     tags: [Participants]
 *     parameters:
 *       - in: query
 *         name: eventId
 *         schema:
 *           type: string
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of participants
 */
app.get('/participants', async (req, res) => {
  const { eventId } = req.query;

  try {
    const query = eventId ? { eventId } : {};
    const participants = await Participant.find(query);
    res.status(200).json(participants);
  } catch (err) {
    console.error('Error fetching participants:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /participants:
 *   post:
 *     summary: Добавить участника
 *     tags: [Participants]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Participant added
 */
app.post('/participants', async (req, res) => {
  const { name, email, eventId } = req.body;

  if (!name || !email || !eventId) {
    return res.status(400).json({ error: 'All fields (name, email, eventId) are required.' });
  }

  const newParticipant = new Participant({ name, email, eventId });

  try {
    await newParticipant.save();
    res.status(201).json(newParticipant);
  } catch (err) {
    console.error('Error adding participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /participants/{participant_id}:
 *   put:
 *     summary: Обновление участника по id
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: participant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               eventId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Participant updated
 */
app.put('/participants/:participant_id', async (req, res) => {
  const { participant_id } = req.params;
  const { name, email, eventId } = req.body;

  if (!name || !email || !eventId) {
    return res.status(400).json({ error: 'All fields (name, email, eventId) are required.' });
  }

  try {
    const updatedParticipant = await Participant.findByIdAndUpdate(
      participant_id,
      { name, email, eventId },
      { new: true }
    );
    if (!updatedParticipant) {
      return res.status(404).json({ error: 'Participant not found.' });
    }
    res.status(200).json(updatedParticipant);
  } catch (err) {
    console.error('Error updating participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /participants/{participant_id}:
 *   delete:
 *     summary: Удоление участника по id
 *     tags: [Participants]
 *     parameters:
 *       - in: path
 *         name: participant_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant ID
 *     responses:
 *       204:
 *         description: Participant deleted
 */
app.delete('/participants/:participant_id', async (req, res) => {
  const { participant_id } = req.params;

  try {
    const deletedParticipant = await Participant.findByIdAndDelete(participant_id);
    if (!deletedParticipant) {
      return res.status(404).json({ error: 'Participant not found.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Error deleting participant:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = parseInt(process.env.PORT, 10) || 3002;
app.listen(PORT, () => {
  console.log(`Participant Management Service running on port ${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
});
