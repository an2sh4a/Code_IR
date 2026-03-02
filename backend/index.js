require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase Admin Client
// Using the Service Role Key here lets the backend bypass Row Level Security rules
// Make sure to replace SUPABASE_SERVICE_ROLE_KEY in .env with the actual secret from your dashboard
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Basic health check route
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "ok", message: "CodeIR Express Backend is running!" });
});

// We will add the evaluation and submission API routes in the next phases

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Backend Server running on http://localhost:${PORT}`);
});
