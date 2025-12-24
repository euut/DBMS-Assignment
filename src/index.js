const express = require('express')
const session = require('express-session')
const { connectDB } = require('./config/db.js')
const authRoutes = require('./routes/auth.js')
const dashboardRoutes = require('./routes/dashboard.js')

const app = express();

app.set('query parser', 'extended');

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Express session
app.use(session({
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false
}));

// API Routes
app.use('/', authRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/', (req, res) => {
    res.redirect('/login');
})

const PORT = 3000;

connectDB().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})