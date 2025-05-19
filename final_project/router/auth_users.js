const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

// Check if username already exists
const isValid = (username) => { 
  // Using some() instead of filter for better performance (stops at first match)
  return users.some(user => user.username === username);
}

// Verify user credentials
const authenticatedUser = (username, password) => {
  // Using some() instead of filter for better performance
  return users.some(user => user.username === username && user.password === password);
}

// User login endpoint
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in" });
  }

  if (authenticatedUser(username, password)) {
    let accessToken = jwt.sign({
      data: password
    }, 'access', { expiresIn: 60 * 60 });

    req.session.authorization = {
      accessToken,
      username
    }
    return res.status(200).send("User successfully logged in");
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  try {
    const { isbn } = req.params;
    const { review } = req.body;
    const username = req.session.authorization?.username;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const book = books[isbn];

    if (book) {
      book.reviews[username] = review; 
      res.json({ message: "Review added/modified successfully" });
    } else {
      res.status(404).json({ message: "Book not found" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error adding/modifying review" });
  }
});

// Delete a book review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  try {
    const { isbn } = req.params;
    const username = req.session.authorization?.username;

    if (!username) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const book = books[isbn];

    if (!book) {
      return res.status(404).json({ message: "Book not found" }); 
    }
    
    if (book.reviews[username]) { 
      delete book.reviews[username]; 
      res.json({ message: "Review deleted successfully" });
    } else {
      res.status(404).json({ message: "Review not found" }); 
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting review" });
  }
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;