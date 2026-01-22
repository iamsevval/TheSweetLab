const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database');

// --- RESİM YÜKLEME AYARLARI (Multer) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); 
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// --- 1. TARİF EKLE (POST) ---
router.post('/add-recipe', upload.single('image'), (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Önce giriş yapmalısın!" });
    }

    const { title, description, ingredients, category, prep_time, cook_time, servings } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/assets/images/default-cake.jpg';
    const userId = req.session.userId;

    const sql = `INSERT INTO recipes (title, description, ingredients, category, prep_time, cook_time, servings, image_url, user_id) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    // 'function(err)' kullanıldığı için 'this.lastID' çalışır.
    db.run(sql, [title, description, ingredients, category, prep_time, cook_time, servings, imageUrl, userId], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Veritabanı hatası!" });
        }
        
        res.json({ 
            success: true, 
            message: "Tarif başarıyla eklendi!",
            new_recipe_id: this.lastID  // <--- BU SATIR EKLENDİ
        });
    });
});

// --- 2. KULLANICININ TARİFLERİNİ GETİR (GET) ---
router.get('/my-recipes', (req, res) => {
    if (!req.session.userId) return res.json([]);

    const sql = "SELECT id, title, description, ingredients, category, prep_time, cook_time, servings, image_url, user_id, like_count, cooked_count FROM recipes WHERE user_id = ? ORDER BY id DESC";
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- 3. TARİF SİL (DELETE) ---
router.delete('/delete-recipe/:id', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Yetkisiz işlem!" });

    const sql = "DELETE FROM recipes WHERE id = ? AND user_id = ?";
    db.run(sql, [req.params.id, req.session.userId], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
});

// --- 4. TÜM TARİFLERİ GETİR (HERKES İÇİN) ---
router.get('/recipes', (req, res) => {
    const sql = "SELECT id, title, description, ingredients, category, prep_time, cook_time, servings, image_url, user_id, like_count, cooked_count FROM recipes ORDER BY id DESC";
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// --- 5. FAVORİYE EKLE / KALDIR ---
router.post('/toggle-favorite', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Giriş yapmalısın!" });

    const { recipeId } = req.body;
    const userId = req.session.userId;

    const checkSql = "SELECT * FROM favorites WHERE user_id = ? AND recipe_id = ?";
    db.get(checkSql, [userId, recipeId], (err, row) => {
        if (row) {
            db.run("DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?", [userId, recipeId], () => {
                res.json({ success: true, action: 'removed' });
            });
        } else {
            db.run("INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)", [userId, recipeId], () => {
                res.json({ success: true, action: 'added' });
            });
        }
    });
});

// --- 6. KULLANICININ FAVORİ TARİFLERİNİ GETİR ---
router.get('/my-favorites', (req, res) => {
    if (!req.session.userId) return res.json([]);

    const sql = `
        SELECT r.id, r.title, r.description, r.ingredients, r.category, r.prep_time, r.cook_time, 
               r.servings, r.image_url, r.like_count, r.cooked_count 
        FROM recipes r 
        JOIN favorites f ON r.id = f.recipe_id 
        WHERE f.user_id = ? ORDER BY r.id DESC`;
    
    db.all(sql, [req.session.userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// --- 7. SOSYAL ETKİLEŞİM ROTASI ---
router.post('/recipe/interaction', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, message: "Lütfen giriş yapın." });
    }

    const { recipeId, type, action } = req.body; 
    const column = type === 'like' ? 'like_count' : 'cooked_count';
    
    const mathOperator = action === 'add' ? '+' : '-';
    const sql = `UPDATE recipes SET ${column} = ${column} ${mathOperator} 1 WHERE id = ?`;
    
    db.run(sql, [recipeId], function(err) {
        if (err) {
            console.error("Etkileşim hatası:", err);
            return res.status(500).json({ success: false });
        }
        res.json({ success: true });
    });
});

module.exports = router;