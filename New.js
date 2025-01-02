const express = require('express');
const mongoose = require('mongoose');

// Replace <db_password> with your actual MongoDB password
const uri = "mongodb+srv://shitijsharma707:<db_password>@cluster0.e5gv6.mongodb.net/?retryWrites=true&w=majority";

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware to parse JSON
app.use(express.json());

// MongoDB Connection
async function connectToMongoDB() {
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Successfully connected to MongoDB!");
  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
    process.exit(1); // Exit process if connection fails
  }
}

// Test Route
app.get('/', async (req, res) => {
  try {
    // Ping MongoDB
    const admin = mongoose.connection.db.admin();
    const result = await admin.command({ ping: 1 });
    res.status(200).send({
      message: "Pinged MongoDB successfully!",
      result,
    });
  } catch (err) {
    console.error("Error during ping:", err);
    res.status(500).send({ error: "Failed to ping MongoDB" });
  }
});

// Start the Server
app.listen(PORT, async () => {
  await connectToMongoDB();
  console.log(`Server is running on http://localhost:${PORT}`);
});
