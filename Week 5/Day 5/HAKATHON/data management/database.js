const mongoose = require("mongoose");

const connectDatabase = async () => {
    try {
        const mongoURI =
            process.env.MONGO_URI || "mongodb://127.0.0.1:27017/mtaafix";

        await mongoose.connect(mongoURI);

        console.log("✅ Mtaafix database connected successfully!");
    } catch (error) {
        console.error(
            "❌ Database connection failed:",
            error.message
        );

        process.exit(1);
    }
};

module.exports = connectDatabase;