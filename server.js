const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware (WITHOUT static files yet)
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'dinner-spinner-secret-key-change-this',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

let db;

// Initialize database
function initDatabase() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database('dinner_spinner.db', (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to SQLite database');
                resolve();
            }
        });
    });
}

// Create tables
function createTables() {
    return new Promise((resolve, reject) => {
        console.log('Creating database tables...');
        
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) {
                console.error('Error creating users table:', err);
                reject(err);
                return;
            }
            console.log('Users table created');
            
            db.run(`CREATE TABLE IF NOT EXISTS meals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                ingredients TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
                if (err) {
                    console.error('Error creating meals table:', err);
                    reject(err);
                    return;
                }
                console.log('Meals table created');
                
                db.run(`CREATE TABLE IF NOT EXISTS restaurants (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    category TEXT NOT NULL,
                    details TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`, (err) => {
                    if (err) {
                        console.error('Error creating restaurants table:', err);
                        reject(err);
                        return;
                    }
                    console.log('Restaurants table created');
                    resolve();
                });
            });
        });
    });
}

// Create admin user
function createAdminUser() {
    return new Promise((resolve) => {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)`, 
               ['admin', hashedPassword], (err) => {
            if (err) {
                console.error('Error creating admin user:', err);
            } else {
                console.log('Admin user created/verified');
            }
            resolve();
        });
    });
}

// Auth middleware
function requireAuth(req, res, next) {
    if (req.session.userId) {
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

// ROUTES FIRST (before static middleware)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/meals', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/restaurants', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'restaurants.html'));
});

app.get('/admin', (req, res) => {
    res.redirect('/admin/meals');
});

app.get('/admin/meals', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/admin/restaurants', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-restaurants.html'));
});

// API Routes
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        req.session.userId = user.id;
        req.session.username = user.username;
        res.json({ success: true, message: 'Login successful' });
    });
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/auth/status', (req, res) => {
    res.json({ 
        authenticated: !!req.session.userId,
        username: req.session.username 
    });
});

// Meals API
app.get('/api/meals', (req, res) => {
    db.all('SELECT * FROM meals ORDER BY name', (err, meals) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(meals);
    });
});

app.post('/api/meals', requireAuth, (req, res) => {
    const { name, ingredients } = req.body;
    
    if (!name || !ingredients) {
        return res.status(400).json({ error: 'Name and ingredients are required' });
    }
    
    db.run('INSERT INTO meals (name, ingredients) VALUES (?, ?)', [name, ingredients], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, id: this.lastID, message: 'Meal added successfully' });
    });
});

app.put('/api/meals/:id', requireAuth, (req, res) => {
    const { name, ingredients } = req.body;
    const { id } = req.params;
    
    if (!name || !ingredients) {
        return res.status(400).json({ error: 'Name and ingredients are required' });
    }
    
    db.run('UPDATE meals SET name = ?, ingredients = ? WHERE id = ?', [name, ingredients, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        res.json({ success: true, message: 'Meal updated successfully' });
    });
});

app.delete('/api/meals/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM meals WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Meal not found' });
        }
        res.json({ success: true, message: 'Meal deleted successfully' });
    });
});

app.post('/api/spin', (req, res) => {
    const { count = 1 } = req.body;
    const mealCount = Math.min(Math.max(1, count), 5);
    
    db.all('SELECT * FROM meals ORDER BY RANDOM() LIMIT ?', [mealCount], (err, meals) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(meals);
    });
});

// Restaurants API
app.get('/api/restaurants', (req, res) => {
    const { category } = req.query;
    
    let query = 'SELECT * FROM restaurants';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY name';
    
    db.all(query, params, (err, restaurants) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(restaurants);
    });
});

app.post('/api/restaurants', requireAuth, (req, res) => {
    const { name, category, details } = req.body;
    
    if (!name || !category || !details) {
        return res.status(400).json({ error: 'Name, category, and details are required' });
    }
    
    const validCategories = ['formal', 'sit-down', 'quick-service'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    
    db.run('INSERT INTO restaurants (name, category, details) VALUES (?, ?, ?)', [name, category, details], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true, id: this.lastID, message: 'Restaurant added successfully' });
    });
});

app.put('/api/restaurants/:id', requireAuth, (req, res) => {
    const { name, category, details } = req.body;
    const { id } = req.params;
    
    if (!name || !category || !details) {
        return res.status(400).json({ error: 'Name, category, and details are required' });
    }
    
    const validCategories = ['formal', 'sit-down', 'quick-service'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid category' });
    }
    
    db.run('UPDATE restaurants SET name = ?, category = ?, details = ? WHERE id = ?', [name, category, details, id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json({ success: true, message: 'Restaurant updated successfully' });
    });
});

app.delete('/api/restaurants/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    
    db.run('DELETE FROM restaurants WHERE id = ?', [id], function(err) {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Restaurant not found' });
        }
        res.json({ success: true, message: 'Restaurant deleted successfully' });
    });
});

app.post('/api/restaurants/spin', (req, res) => {
    const { category } = req.body;
    
    let query = 'SELECT * FROM restaurants';
    let params = [];
    
    if (category && category !== 'all') {
        query += ' WHERE category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY RANDOM() LIMIT 1';
    
    db.get(query, params, (err, restaurant) => {
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }
        if (!restaurant) {
            return res.status(404).json({ error: 'No restaurants found for the selected category' });
        }
        res.json(restaurant);
    });
});

// Static files LAST (after all routes)
app.use(express.static('public'));

// Start server
async function startApp() {
    try {
        console.log('Starting Family Decision Spinner...');
        
        await initDatabase();
        await createTables();
        await createAdminUser();
        
        console.log('Database initialization complete');
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log('='.repeat(50));
            console.log('🎯 Family Decision Spinner is running!');
            console.log(`📍 http://192.168.6.214:${PORT}`);
            console.log('👤 Admin: admin / admin123');
            console.log('='.repeat(50));
        });
        
    } catch (error) {
        console.error('Failed to start application:', error);
        process.exit(1);
    }
}

process.on('SIGINT', () => {
    console.log('\nShutting down...');
    if (db) {
        db.close(() => {
            console.log('Database closed');
            process.exit(0);
        });
    } else {
        process.exit(0);
    }
});

startApp();
