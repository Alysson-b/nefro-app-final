const crypto = require('crypto');

function generateRandomSecret(length) {
    return crypto.randomBytes(length).toString('hex');
}

const jwtSecret = generateRandomSecret(32); 
console.log('JWT Secret:', jwtSecret);


fetch('http://localhost:3000/protected-route', {
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`
    }
});


const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401); 

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); 
        req.user = user;
        next(); 
    });
}


app.get('/protected-route', authenticateToken, (req, res) => {
    res.send('This is a protected route');



app.get('/protected-route', authenticateToken, (req, res) => {
    res.send('This is a protected route');
});
});
