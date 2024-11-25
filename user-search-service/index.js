require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

app.get('/users', (req, res) => {
    const { name, email } = req.query;
    const users = [
        { id: 1, name: 'User One', email: 'userone@example.com' },
        { id: 2, name: 'User Two', email: 'usertwo@example.com' },
    ];
    const filteredUsers = users.filter(user => 
        (name && user.name.includes(name)) || 
        (email && user.email.includes(email))
    );

    res.json(filteredUsers);
});

app.get('/users/:user_id', (req, res) => {
    const { user_id } = req.params;
    const user = { id: user_id, name: 'User Example', email: 'user@example.com' };

    res.json(user);
});

app.get('/users/me', (req, res) => {
    const currentUser = { id: 1, name: 'Current User', email: 'currentuser@example.com' };

    res.json(currentUser);
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
    console.log(`User Search Service running on port ${PORT}`);
});
