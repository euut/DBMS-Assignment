const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login')
});

router.post('/login', async (req, res) => {
    // const { username, password } = req.body;

    try {
        // Modify this part to make it vulnerable
        const db = getDB();
        const user = await db.collection('customers').findOne(req.body);

        if (!user) {
            return res.render('login', {
                error: "Incorrect username or password"
            });
        }

        // Save user session
        req.session.user = user;

        // Successful login
        res.redirect('/dashboard');

    } catch (err) {
        res.status(500).send("Internal server error");
    }
})

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    })
})

module.exports = router