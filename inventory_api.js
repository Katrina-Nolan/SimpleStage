// inventory_api.js - Express API for Warehouse Management System

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db'); // Database connection

const app = express();
app.use(express.json());
app.use(cors());

// GET all inventory items
app.get('/items', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM items');
    res.json(result.rows);
  } catch (err) {
    console.error("Error in GET /items:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// PUT update an entire inventory item
app.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, barcode, quantity, photo_url, missing, damaged, notes } = req.body;

    const result = await pool.query(
      `UPDATE items 
       SET name = $1, 
           description = $2, 
           barcode = $3, 
           quantity = $4, 
           photo_url = $5, 
           missing = $6, 
           damaged = $7, 
           notes = $8
       WHERE id = $9 
       RETURNING *`,
      [name, description, barcode, quantity, photo_url, missing, damaged, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error in PUT /items/:id:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST update item quantity (if needed)
app.post("/items/:id/update-quantity", async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    const result = await pool.query(
      "UPDATE items SET quantity = quantity + $1 WHERE id = $2 RETURNING *",
      [quantity, id]
    );
    res.json({ success: true, item: result.rows[0] });
  } catch (err) {
    console.error("Error in POST /items/:id/update-quantity:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST add a new inventory item (with extra fields)
app.post('/items', async (req, res) => {
  try {
    const { 
      name, 
      description, 
      barcode, 
      quantity, 
      photo_url, 
      missing = false, 
      damaged = false, 
      notes = "" 
    } = req.body;

    console.log("Request body:", req.body);  // Log request body

    const result = await pool.query(
      `INSERT INTO items 
       (name, description, barcode, quantity, photo_url, missing, damaged, notes) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [name, description, barcode, quantity, photo_url, missing, damaged, notes]
    );

    console.log("Insert result:", result.rows[0]);  // Log insert result

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /items:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST log inventory movement (IN/OUT)
app.post('/inventory_movements', async (req, res) => {
  try {
    const { item_id, order_id, movement_type, quantity } = req.body;
    const result = await pool.query(
      'INSERT INTO inventory_movements (item_id, order_id, movement_type, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [item_id, order_id, movement_type, quantity]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error in POST /inventory_movements:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET all orders
app.get('/orders', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders');
    res.json(result.rows);
  } catch (err) {
    console.error("Error in GET /orders:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start the server (or export app if using a separate server.js)
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} ✅`);
});
