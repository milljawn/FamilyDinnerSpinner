const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

console.log('Checking database setup...');

// Create/open database
const db = new sqlite3.Database('dinner_spinner.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
        process.exit(1);
    } else {
        console.log('✓ Connected to SQLite database');
        setupDatabase();
    }
});

function setupDatabase() {
    console.log('Creating tables...');
    
    // Create users table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('✗ Error creating users table:', err.message);
        } else {
            console.log('✓ Users table created');
            
            // Create admin user
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run(`
                INSERT OR REPLACE INTO users (username, password) 
                VALUES (?, ?)
            `, ['admin', hashedPassword], (err) => {
                if (err) {
                    console.error('✗ Error creating admin user:', err.message);
                } else {
                    console.log('✓ Admin user created');
                    createMealsTable();
                }
            });
        }
    });
}

function createMealsTable() {
    // Create meals table
    db.run(`
        CREATE TABLE IF NOT EXISTS meals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ingredients TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('✗ Error creating meals table:', err.message);
        } else {
            console.log('✓ Meals table created');
            
            // Add sample meals
            const sampleMeals = [
                ['Spaghetti Bolognese', 'Ground beef, pasta, tomato sauce, onions, garlic, herbs'],
                ['Chicken Stir Fry', 'Chicken breast, mixed vegetables, soy sauce, ginger, garlic'],
                ['Grilled Salmon', 'Salmon fillets, lemon, herbs, olive oil, vegetables'],
                ['Taco Tuesday', 'Ground turkey, taco shells, lettuce, tomatoes, cheese, salsa'],
                ['Vegetable Curry', 'Mixed vegetables, coconut milk, curry spices, rice']
            ];
            
            let inserted = 0;
            sampleMeals.forEach((meal, index) => {
                db.run('INSERT OR IGNORE INTO meals (name, ingredients) VALUES (?, ?)', meal, (err) => {
                    if (err) {
                        console.error(`✗ Error inserting sample meal ${index + 1}:`, err.message);
                    } else {
                        console.log(`✓ Sample meal ${index + 1} added: ${meal[0]}`);
                    }
                    inserted++;
                    if (inserted === sampleMeals.length) {
                        verifyDatabase();
                    }
                });
            });
        }
    });
}

function verifyDatabase() {
    console.log('\nVerifying database...');
    
    // Check users table
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
            console.error('✗ Error checking users table:', err.message);
        } else {
            console.log(`✓ Users table has ${row.count} user(s)`);
        }
    });
    
    // Check meals table
    db.get('SELECT COUNT(*) as count FROM meals', (err, row) => {
        if (err) {
            console.error('✗ Error checking meals table:', err.message);
        } else {
            console.log(`✓ Meals table has ${row.count} meal(s)`);
        }
        
        // Close database
        db.close((err) => {
            if (err) {
                console.error('Error closing database:', err.message);
            } else {
                console.log('\n✓ Database setup complete! You can now run "npm start"');
            }
        });
    });
}
