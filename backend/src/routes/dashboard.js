const express = require('express');
const { getDB } = require('../config/db');

const router = express.Router();

router.get('/', async (req, res) => {
    const user = req.session.user;

    try {
        if (!user) {
            return res.redirect('/login');
        }

        // Fetch all transactions
        const db = getDB();
        const transactions = await db.collection('transactions')
            .find({ account_id: user.account_id })
            .toArray();

        // console.log(transactions);

        res.render('dashboard', { user, transactions });

    } catch (err) {
        res.status(500).send("Internal server error");
    }
})

module.exports = router