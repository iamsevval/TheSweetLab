const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./sweetlab.db', (err) => {
    if (err) console.error('Veritabanı hatası:', err.message);
    else console.log('SQlite veritabanına bağlanıldı.');
});

db.serialize(() => {
    // 1. Kullanıcılar Tablosu 
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        reset_code TEXT,
        role TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // 2. Tarifler Tablosu 
    db.run(`CREATE TABLE IF NOT EXISTS recipes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        description TEXT,
        ingredients TEXT,
        category TEXT,
        prep_time INTEGER,
        cook_time INTEGER,
        servings INTEGER,
        image_url TEXT,
        user_id INTEGER,
        like_count INTEGER DEFAULT 0,    
        cooked_count INTEGER DEFAULT 0,  
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER, recipe_id INTEGER,
        PRIMARY KEY (user_id, recipe_id),
        FOREIGN KEY(user_id) REFERENCES users(id),
        FOREIGN KEY(recipe_id) REFERENCES recipes(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, email TEXT, message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipe_id INTEGER,
    user_id INTEGER,
    username TEXT,
    comment TEXT,
    parent_id INTEGER DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recipe_id) REFERENCES recipes(id)
)`);
});

module.exports = db;