require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database');
const multer = require('multer');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEN_AI_KEY);

const app = express();
const PORT = 3000;

// 1. AYARLAR 
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// 2. OTURUM (SESSION) AYARI
app.use(session({
    secret: 'sweetlab_gizli_anahtar',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Localhost için false
        maxAge: 1000 * 60 * 60 * 24 
    }
}));

// 3. STATİK DOSYALAR
app.use('/assets', express.static(path.join(__dirname, 'assets')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. ROTALAR (Routes)
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const recipeRoutes = require('./routes/recipeRoutes');

app.use(chatRoutes); // <-- Artık doğru yerde!
app.use('/', authRoutes);
app.use('/', recipeRoutes);

// 5. ÖZEL API ENDPOINTLERİ (Mevcut Özelliklerin)

// AI ANALİZ ROTASI
app.post('/analyze-recipe', async (req, res) => {
    const { title, ingredients, description } = req.body;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Sen titiz bir yemek editörüsün. Aşağıdaki tarifi analiz et ve formatla.

        GİRDİLER:
        Başlık: "${title}"
        Malzemeler: "${ingredients}"
        Yapılış: "${description}"

        KURALLAR (Malzemeler İçin - KESİN UYGULA):
        1. Her malzeme KESİNLİKLE yeni bir satırda olmalı.
        2. Miktarlar satırın en başında ve SAYISAL olmalı.
        3. Kelime -> Sayı Dönüşümleri:
           - "Yarım" veya "1/2" görürsen -> "0.5" yap.
           - "Çeyrek" veya "1/4" görürsen -> "0.25" yap.
           - "Bir buçuk" görürsen -> "1.5" yap.
        4. Bölüm Başlıkları (Örn: "Sosu İçin:", "Üzeri İçin:") varsa bunları koru, başına sayı koyma.
        5. Eğer kullanıcı zaten doğru formatta (sayı başta, alt alta) yazmışsa, ASLA değiştirme, olduğu gibi bırak.

        İSTENEN MALZEME FORMATI ÖRNEĞİ:
        2 su bardağı un
        0.5 çay bardağı süt
        1.5 yemek kaşığı kakao
        Sosu İçin:
        100 gram çikolata

        GÖREVLER:
        1. Metin spam/anlamsız mı? (Onay/Red)
        2. Malzemeleri yukarıdaki kurallara göre düzenle.
        3. Yapılış tarifini daha profesyonel ve anlaşılır hale getir.

        YANIT FORMATI (Sadece JSON):
        {
            "approved": true/false,
            "reason": "Red sebebi veya 'Başarılı'",
            "corrected_title": "Başlık",
            "corrected_ingredients": "Formatlanmış malzeme listesi",
            "corrected_description": "Düzenlenmiş yapılış"
        }
        `;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const analysis = JSON.parse(cleanJson);

        // Veritabanı kontrolü (Aynı isimde tarif var mı?)
        db.get("SELECT id FROM recipes WHERE title = ?", [analysis.corrected_title || title], (err, row) => {
            if (row) {
                return res.json({ approved: false, reason: "Bu tarif zaten sistemde mevcut!" });
            }
            res.json(analysis);
        });

    } catch (error) {
        console.error("AI Hatası:", error);
        // Hata durumunda manuel onaya düşür
        res.json({ approved: true, manual_check: true, reason: "AI servisi yanıt vermedi, manuel onay." });
    }
});

// TARİF DETAYLARINI GETİRME
app.get('/api/recipe-details/:id', (req, res) => {
    const recipeId = req.params.id;
    const sql = "SELECT * FROM recipes WHERE id = ?";
    db.get(sql, [recipeId], (err, row) => {
        if (err) {
            console.error("Veritabanı hatası:", err);
            return res.status(500).json({ error: "Sunucu hatası" });
        }
        if (!row) {
            return res.status(404).json({ error: "Tarif bulunamadı" });
        }
        res.json(row);
    });
});

// YORUM EKLEME 
app.post('/api/add-comment', (req, res) => {
    // 1. KONTROL: Kullanıcı giriş yapmış mı?
    if (!req.session.userId) {
        return res.json({ success: false, message: "Yorum yapmak için giriş yapmalısınız." });
    }

    const { recipe_id, comment, parent_id } = req.body;
    const username = req.session.username; 
    const userId = req.session.userId; // Kullanıcının ID'sini alıyoruz
    const sql = "INSERT INTO comments (recipe_id, user_id, username, comment, parent_id) VALUES (?, ?, ?, ?, ?)";
    
    db.run(sql, [recipe_id, userId, username, comment, parent_id || null], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ success: false, error: "Veritabanı hatası" });
        }
        res.json({ success: true, message: "Yorumunuz paylaşıldı!" });
    });
});

// YORUMLARI GETİRME
app.get('/api/comments/:recipeId', (req, res) => {
    const recipeId = req.params.recipeId;
    const sql = "SELECT * FROM comments WHERE recipe_id = ? ORDER BY created_at DESC";
    db.all(sql, [recipeId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// TARİF GÜNCELLEME
const uploadConfig = multer({ dest: 'uploads/' }); // upload değişkeni çakışmasın diye adını değiştirdim

app.post('/api/update-recipe/:id', uploadConfig.single('image'), (req, res) => {
    const recipeId = req.params.id;
    const { title, category, prep_time, cook_time, servings, ingredients, description } = req.body;
    const userId = req.session.userId;

    if (!userId) return res.status(401).json({ success: false, error: "Giriş yapmalısın." });

    let sql = `UPDATE recipes SET title=?, category=?, prep_time=?, cook_time=?, servings=?, ingredients=?, description=?`;
    let params = [title, category, prep_time, cook_time, servings, ingredients, description];

    if (req.file) {
        const imageUrl = `/uploads/${req.file.filename}`;
        sql += `, image_url=?`;
        params.push(imageUrl);
    }

    sql += ` WHERE id=? AND user_id=?`;
    params.push(recipeId, userId);

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Güncelleme hatası:", err.message);
            return res.status(500).json({ success: false, error: "Veritabanı hatası" });
        }
        res.json({ success: true, message: "Tarif ve resim güncellendi!" });
    });
});

// YORUM SİLME 
app.delete('/api/delete-comment/:id', (req, res) => {
    const commentId = req.params.id;
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ success: false, error: 'Giriş yapmalısın.' });
    }

    // SQLite için 'db.query' yerine 'db.get' ve 'db.run' kullanıyoruz
    const checkSql = 'SELECT user_id FROM comments WHERE id = ?';
    
    db.get(checkSql, [commentId], (err, row) => {
        if (err || !row) return res.json({ success: false, error: 'Yorum bulunamadı.' });

        if (row.user_id !== userId) {
            return res.status(403).json({ success: false, error: 'Sadece kendi yorumunu silebilirsin!' });
        }

        db.run('DELETE FROM comments WHERE id = ? OR parent_id = ?', [commentId, commentId], (err) => {
            if (err) return res.json({ success: false, error: 'Silme işlemi başarısız.' });
            res.json({ success: true });
        });
    });
});

// 6. SAYFA YÖNLENDİRMELERİ 
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.get('/:page', (req, res) => {
    const page = req.params.page;
    const fileName = page.endsWith('.html') ? page : `${page}.html`;
    res.sendFile(path.join(__dirname, 'views', fileName), (err) => {
        if (err) res.status(404).send("Sayfa Bulunamadı");
    });
});

// SUNUCUYU BAŞLAT
app.listen(PORT, () => {
    console.log(`PROJE ÇALIŞIYOR: http://localhost:${PORT}`);
});