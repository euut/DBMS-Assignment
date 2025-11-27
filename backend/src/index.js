import express from "express"
import dotenv from "dotenv"
import connectDB from "./config/database.js"

const app = express();
app.use(express.json());

dotenv.config({ path: './.env' });

const startServer = async () => {
    try {
        await connectDB();

        const PORT = process.env.PORT || 8000;

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
        
    } catch (error) {
        console.log("\n MongoDB connection failed.", error);
    }
}

startServer();