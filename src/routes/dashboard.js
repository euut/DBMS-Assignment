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

router.get('/search', async (req, res) => {
    const user = req.session.user;
    const q = req.query.search;

    if (!user) {
        return res.redirect('/login');
    }

    try {
        const db = getDB();
        const transactions = await db.collection('transactions').aggregate([
            { $match: { account_id: { $in: user.accounts } } },
            {
                $project: {
                account_id: 1,
                transactions: {
                    $filter: {
                    input: {
                        $sortArray: { input: "$transactions", sortBy: { date: -1 } }
                    },
                    as: "t",
                    cond: {
                        $or: [
                            { $regexMatch: { input: "$$t.symbol", regex: q, options: "i" } },
                            { $regexMatch: { input: "$$t.transaction_code", regex: q, options: "i" } },
                            { $regexMatch: { input: { $dateToString: { date: "$$t.date", format: "%Y-%m-%d" } }, regex: q, options: "i" } }
                        ]
                    }
                    }
                }
                }
            },
            { $match: { "transactions.0": { $exists: true } } }
        ]).toArray();

        res.render('dashboard', { user, transactions });

    } catch (err) {
        res.status(500).send("Internal server error");
    }
});


module.exports = router