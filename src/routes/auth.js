const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/login', (req, res) => {
    res.render('login')
});

// ------------------------------PREVENTION METHOD 1: INPUT VALIDATION------------------------------
// router.post('/login', async (req, res) => {
//     try {
//         const { username, password } = req.body;

//         // PREVENTION: Input Validation
//         // Strictly check if inputs are Strings. If they are Objects (attacks), block them.
//         if (typeof username !== 'string' || typeof password !== 'string') {
//             return res.status(400).send("Invalid Input: Strings required.");
//         }

//         const db = getDB();
        
//         // Now safe to use because we know they are strings
//         const user = await db.collection('customers').findOne({ username, password });

//         if (!user) {
//             console.log("User not found or password wrong. Rendering login page...");
//             return res.render('login', { error: "Incorrect username or password" });
//         }

//         req.session.user = user;
//         res.redirect('/dashboard');

//     } catch (err) {
//         console.error("CRITICAL SERVER ERROR:", err);
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------PREVENTION METHOD 2: INPUT SANITIZATION------------------------------
// Helper function to remove keys starting with '$'
// function sanitizeInput(input) {
//     if (input instanceof Object) {
//         for (let key in input) {
//             if (/^\$/.test(key)) {
//                 delete input[key]; // Remove dangerous operator
//             } else {
//                 sanitizeInput(input[key]); // Recursively clean nested objects
//             }
//         }
//     }
//     return input;
// }

// router.post('/login', async (req, res) => {
//     try {
//         // PREVENTION: Input Sanitization
//         // We create a copy of the body and clean it
//         const safeBody = sanitizeInput(req.body);

//         const db = getDB();
        
//         // Use the sanitized body
//         const user = await db.collection('customers').findOne(safeBody);

//         if (!user) {
//             console.log("User not found or password wrong. Rendering login page...");
//             return res.render('login', { error: "Incorrect username or password" });
//         }

//         req.session.user = user;
//         res.redirect('/dashboard');

//     } catch (err) {
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------PREVENTION METHOD 3: PARAMETERISED QUERIES------------------------------
// router.post('/login', async (req, res) => {
//     try {
//         // PREVENTION: Parameterized Query
//         // We force the input to be a String. 
//         // If an attacker sends { $ne: "1" }, it becomes the string "[object Object]"
//         const username = String(req.body.username);
//         const password = String(req.body.password);

//         const db = getDB();

//         // We explicitly bind keys to values, never passing the raw 'req.body' object
//         const user = await db.collection('customers').findOne({ 
//             username: username, 
//             password: password 
//         });

//         if (!user) {
//             return res.render('login', { error: "Incorrect username or password" });
//         }

//         req.session.user = user;
//         res.redirect('/dashboard');

//     } catch (err) {
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------VULNERABLE CODE------------------------------
router.post('/login', async (req, res) => {
    // const { username, password } = req.body;

    try {
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