const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.static('public'));
app.use(express.json());

// MySQL Connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password', // Make sure this is your correct password
    database: 'chatApp'
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('MySQL Connected...');
});

// Serve login page or chat page based on query params
app.get('/', (req, res) => {
    if (req.query.username) {
        res.sendFile(path.join(__dirname, 'public', 'chat.html'));
    } else {
        res.sendFile(path.join(__dirname, 'public', 'login.html'));
    }
});

// Login endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ? AND password = ?';
    db.query(sql, [username, password], (err, results) => {
        if (err) throw err;
        if (results.length > 0) {
            const user = results[0];
            res.json({ username: user.username, avatar_url: user.avatar_url });
        } else {
            res.status(401).send('Invalid credentials');
        }
    });
});

// Signup endpoint
app.post('/signup', (req, res) => {
    const { username, password, avatar_url } = req.body;
    // In a real app, you MUST hash the password first for security.
    const sql = 'INSERT INTO users (username, password, avatar_url) VALUES (?, ?, ?)';
    db.query(sql, [username, password, avatar_url], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Username already exists.' });
            }
            throw err;
        }
        res.status(201).json({ message: 'User created successfully' });
    });
});


io.on('connection', (socket) => {
    console.log('New client connected');
    db.query('SELECT * FROM messages ORDER BY timestamp ASC', (err, results) => {
        if (err) throw err;
        socket.emit('load all messages', results);
    });

    socket.on('send message', (data) => {
        const { username, message, is_anonymous, avatar_url } = data;
        const messageWithTimestamp = { ...data, timestamp: new Date() };
        const sql = 'INSERT INTO messages (username, message, is_anonymous, avatar_url) VALUES (?, ?, ?, ?)';
        db.query(sql, [username, message, is_anonymous, avatar_url], (err, result) => {
            if (err) throw err;
            io.emit('receive message', messageWithTimestamp);
        });
    });

    socket.on('typing', (data) => {
        socket.broadcast.emit('user typing', data);
    });

    socket.on('stop typing', () => {
        socket.broadcast.emit('user stop typing');
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));