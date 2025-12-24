const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
    const user = req.session.user;

    if (!user) {
        return res.redirect('/login');
    }

    try {
        // Fetch all transactions
        const db = getDB();

        // Original query: without date sorting
        // const transactions = await db.collection('transactions').find({
        //     account_id: { $in: user.accounts }
        // }).toArray();
        
        const transactions = await db.collection('transactions').aggregate([
            { $match: { account_id: { $in: user.accounts } } },
            {
                $project: {
                    account_id: 1,
                    transactions: {
                        $sortArray: { input: "$transactions", sortBy: { date: -1 } }
                    }
                }
            }
        ]).toArray();

        // console.log(transactions);

        res.render('dashboard', { user, transactions });

    } catch (err) {
        res.status(500).send("Internal server error");
    }
})

// ------------------------------VULNERABLE CODE: JAVASCRIPT INJECTION------------------------------
router.get('/search', async (req, res) => {
    const user = req.session.user;
    const q = req.query.search; // User input

    if (!user) return res.redirect('/login');

    try {
        const db = getDB();
        
        const transactions = await db.collection('transactions').find({
            $where: `function() { 
                return this.transactions && this.transactions.some(t => t.symbol == '${q}') 
            }`
        }).toArray();

        res.render('dashboard', { user, transactions });
    } catch (err) {
        res.status(500).send("Internal server error: " + err.message);
    }
});

// ------------------------------VULNERABLE CODE: OPERATOR QUERY INJECTION------------------------------
// router.get('/search', async (req, res) => {
//     const user = req.session.user;
//     console.log("--- DEBUG START ---");
//     // DEBUG: Print the WHOLE query object to see keys
//     console.log("FULL QUERY OBJECT:", req.query); 
    
//     const q = req.query.search; 
//     console.log("Type of q:", typeof q);

//     if (!user) return res.redirect('/login');

//     try {
//         const db = getDB();

//         // DEBUG 2: Check what 'q' actually looks like
//         // This tells us if Postman sent a String or an Object
//         console.log("Query Input (q):", JSON.stringify(q, null, 2));
//         console.log("Type of q:", typeof q);

//         // Run the vulnerable query
//         const transactions = await db.collection('transactions').find({
//             "transactions.symbol": q 
//         }).toArray();

//         // DEBUG 3: How many results did we get?
//         console.log("Transactions Found:", transactions.length);
//         console.log("--- DEBUG END ---");

//         res.render('dashboard', { user, transactions });
//     } catch (err) {
//         console.error("Error:", err);
//         res.status(500).send("Internal server error: " + err.message);
//     }
// });

// ------------------------------PREVENTION METHOD 1: INPUT VALIDATION------------------------------
// router.get('/search', async (req, res) => {
//     const user = req.session.user;
//     const q = req.query.search; 

//     if (!user) return res.redirect('/login');

//     // --- PREVENTION: INPUT VALIDATION ---
//     // Rule: The search term MUST be a String. 
//     // If it is an Object (like { $ne: null }) or Array, block it.
//     if (typeof q !== 'string') {
//         console.log("Attack Blocked: Invalid Input Type");
//         // Return 400 Bad Request
//         return res.status(400).send("Invalid Input: Search term must be a text string.");
//     }

//     try {
//         const db = getDB();
        
//         // Safe to run because we know 'q' is just a string now
//         // Note: This does NOT stop JS Injection (Method 3), only Operator Injection.
//         const transactions = await db.collection('transactions').find({
//             "transactions.symbol": q 
//         }).toArray();

//         res.render('dashboard', { user, transactions });
//     } catch (err) {
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------PREVENTION METHOD 2: INPUT SANITIZATION------------------------------
// Helper function to remove MongoDB operators
// function sanitizeInput(input) {
//     if (typeof input === 'string') {
//         // Remove any character starting with '$' to prevent operators
//         // We also generally remove '.' to prevent accessing nested properties
//         return input.replace(/[$.]/g, ""); 
//     }
//     return input;
// }

// router.get('/search', async (req, res) => {
//     const user = req.session.user;
//     let q = req.query.search; // Use 'let' so we can modify it

//     if (!user) return res.redirect('/login');

//     // --- PREVENTION: INPUT SANITIZATION ---
//     // If 'q' is an object (the attack), this converts it to a harmless string 
//     // or strips the keys. For simplicity here, we assume string input or convert keys.
    
//     // 1. If it's an object (Operator Attack), we can convert to string or stringify
//     if (typeof q === 'object') {
//         q = JSON.stringify(q); // Turns { $ne: null } into the string '{"$ne":null}'
//     }
    
//     // 2. Clean the string of dangerous symbols ($ and .)
//     q = sanitizeInput(q); 

//     try {
//         const db = getDB();
        
//         // If attacker sent { $ne: null }, it became string '{"ne":null}' (safe)
//         const transactions = await db.collection('transactions').find({
//             "transactions.symbol": q 
//         }).toArray();

//         // Result: 200 OK, but 0 transactions found (Attack Neutralized)
//         res.render('dashboard', { user, transactions });
//     } catch (err) {
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------PREVENTION METHOD 3: PARAMETERIZED QUERIES------------------------------
//Function to escape Regex characters (makes it treat . as a dot, not a wildcard)
// function escapeRegex(string) {
//     return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// }

// router.get('/search', async (req, res) => {
//     const user = req.session.user;
    
//     // 1. Force to String (Stops Operator Injection Objects)
//     let rawInput = String(req.query.search || "");
    
//     // 2. Escape Regex Characters (Stops Regex Injection & Empty String wildcard)
//     const q = escapeRegex(rawInput);

//     // DEBUG: Verify the protection
//     console.log(`Raw: ${JSON.stringify(req.query.search)} | Safe: ${q}`);

//     if (!user) return res.redirect('/login');

//     try {
//         const db = getDB();
        
//         const transactions = await db.collection('transactions').aggregate([
//             { $match: { account_id: { $in: user.accounts } } },
//             {
//                 $project: {
//                     account_id: 1,
//                     transactions: {
//                         $filter: {
//                             input: "$transactions",
//                             as: "t",
//                             cond: {
//                                 // Now safe: "." matches a literal dot, not "any char"
//                                 $regexMatch: { 
//                                     input: "$$t.symbol", 
//                                     regex: q, 
//                                     options: "i" 
//                                 }
//                             }
//                         }
//                     }
//                 }
//             },
//             { $match: { "transactions.0": { $exists: true } } }
//         ]).toArray();

//         res.render('dashboard', { user, transactions });
//     } catch (err) {
//         res.status(500).send("Internal server error");
//     }
// });

// ------------------------------PREVENTION METHOD 4: where -> expr------------------------------
// router.get('/search', async (req, res) => {
//     const user = req.session.user;
//     const q = req.query.search; 

//     if (!user) return res.redirect('/login');

//     try {
//         const db = getDB();

//         // --- PREVENTION: REPLACE $where WITH $expr ---
//         // Instead of running JS, we use MongoDB's native expression operators.
//         // Logic: Is 'q' found inside the 'transactions.symbol' array?
        
//         const transactions = await db.collection('transactions').find({
//             $expr: {
//                 $in: [ q, "$transactions.symbol" ]
//             }
//         }).toArray();

//         // If attacker sends "' || true || '", $expr just looks for a symbol
//         // strictly named "' || true || '". It won't execute the logic.
        
//         res.render('dashboard', { user, transactions });
//     } catch (err) {
//         res.status(500).send("Internal server error: " + err.message);
//     }
// });

module.exports = router