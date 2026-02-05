const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Auth API Running");
});

app.listen(process.env.PORT, () =>
  console.log("Server running on port 5000")
);
