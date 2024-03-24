const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();
const nunjucks = require("nunjucks");

const app = express();
const port = 3000;
const secretKey = "your-secret-key"; 
nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

// Middleware to parse JSON
app.use(express.json());

// Connect to the SQLite database and create the users table if it doesn't exist
const db = new sqlite3.Database("database.db", (err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Connected to the SQLite database.");

    db.run(
      "CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT NOT NULL, phone TEXT NOT NULL, email TEXT NOT NULL)",

      (err) => {
        if (err) {
          console.error("Error creating table:", err.message);
        } else {
          console.log("Users table created or already exists.");
        }
      }
    );
  }
});

app.get("/", (req, res) => {
  // Fetch all users from the database
  db.all("SELECT * FROM users", (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    } else {
      // Render the 'userlist' template with the user data
      res.render("index.html", { users: rows });
    }
  });
});

app.get("/api/user/:id", (req, res) => {
  //Fetch one user form database using id
  const query = "SELECT * FROM users WHERE id = ?";
  db.get(query, [req.params.id], (err, user) => {
    if (err) {
      return res.status(404).json({ message: "User Not Found" });
    }
    if (user) {
      res.json(user);
    }
  });
});

// Register route
app.post("/api/register", (req, res) => {
  const { username, phone, email } = req.body;
  // Check if username is already taken
  const query = "SELECT * FROM users WHERE username = ?";
  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error---->" });
    }
    if (user) {
      return res.status(409).json({ message: "UserName already exists" });
    }

    // Insert the user into the database
    const insertQuery =
      "INSERT INTO users (username, phone, email) VALUES (?, ?, ?)";
    db.run(insertQuery, [username, phone, email], (err) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ message: "User registered successfully" });
    });
  });
});
app.put("/api/update-user/:id", (req, res) => {
  const idParams = req.params.id;
  const { username, phone, email } = req.body;

  // Check if user is already exist
  const query = "SELECT * FROM users WHERE id = ?";
  db.get(query, [idParams], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!user) {
      return res.status(409).json({ message: "User not found" });
    }

    // Update the user into the database
    const updateQuery =
      "UPDATE users SET username = ?, phone = ?, email = ? WHERE id = ?";
    db.run(updateQuery, [username, phone, email, idParams], (err) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ message: "User updated successfully" });
    });
  });
});

// Login route
app.delete("/api/user/:id", (req, res) => {
  const idParams = req.params.id;

  // Check if user is already taken
  const query = "SELECT * FROM users WHERE id = ?";
  db.get(query, [idParams], (err, user) => {
    if (err) {
      return res.status(500).json({ message: "Internal server error" });
    }
    if (!user) {
      return res.status(409).json({ message: "User not found" });
    }

    // Delete the user into the database
    const deleteQuery = "DELETE FROM users WHERE id = $1 RETURNING *";
    db.run(deleteQuery, [idParams], (err) => {
      if (err) {
        return res.status(500).json({ message: "Internal server error" });
      }
      res.status(201).json({ message: "User deleted successfully" });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
