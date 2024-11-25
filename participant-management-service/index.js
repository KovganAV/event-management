require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

app.get('/participants', (req, res) => {
    const { event_id } = req.query;
    const participants = [
        { id: 1, name: 'Participant 1', eventId: event_id },
        { id: 2, name: 'Participant 2', eventId: event_id },
    ];
    res.json(participants);
});

app.post('/participants', (req, res) => {
    const { name, eventId } = req.body;
    const newParticipant = { id: Date.now(), name, eventId };

    res.status(201).json(newParticipant);
});

app.put('/participants/:participant_id', (req, res) => {
    const { participant_id } = req.params;
    const { name, eventId } = req.body;
    const updatedParticipant = { id: participant_id, name, eventId };
    res.json(updatedParticipant);
});

app.delete('/participants/:participant_id', (req, res) => {
    const { participant_id } = req.params;
    res.status(204).send();
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
    console.log(`Participant Management Service running on port ${PORT}`);
});
