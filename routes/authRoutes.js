const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database');
const nodemailer = require('nodemailer');
require('dotenv').config(); 

// --- E-POSTA GÖNDERİCİ AYARLARI ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

// --- KAYIT OL (REGISTER) ---
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    db.run(sql, [username, email, hashedPassword], function (err) {
        if (err) {
            console.error(err.message);
            return res.send('<script>alert("Bu kullanıcı adı veya e-posta zaten kayıtlı!"); window.location.href="/profile.html";</script>');
        }
        res.send('<script>alert("Kayıt Başarılı! Lütfen Giriş Yapın."); window.location.href="/profile.html";</script>');
    });
});

// --- GİRİŞ YAP (LOGIN) ---
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const sql = "SELECT * FROM users WHERE username = ?";
    db.get(sql, [username], (err, user) => {
        if (err || !user) {
            return res.send('<script>alert("Kullanıcı bulunamadı!"); window.location.href="/profile.html";</script>');
        }
        const isMatch = bcrypt.compareSync(password, user.password);
        if (isMatch) {
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.role = user.role;
            req.session.save(() => {
                res.redirect('/profile.html');
            });
        } else {
            res.send('<script>alert("Hatalı şifre!"); window.location.href="/profile.html";</script>');
        }
    });
});

// --- ŞİFREMİ UNUTTUM (FORGOT PASSWORD) ---
router.post('/forgot-password', (req, res) => {
    const { email } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";
    db.get(sql, [email], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: "Bu e-posta adresiyle kayıtlı bir kullanıcı bulunamadı." });
        }

        const resetCode = Math.floor(100000 + Math.random() * 900000);

        db.run("UPDATE users SET reset_code = ? WHERE email = ?", [resetCode, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Veritabanı hatası." });

            const mailOptions = {
                from: '"Sweet Lab" <senin-epostan@gmail.com>',
                to: email,
                subject: 'Şifre Sıfırlama Kodu - Sweet Lab',
                html: `
                    <div style="font-family: Arial, sans-serif; text-align: center; color: #C76B86;">
                        <h2>Şifre Sıfırlama İsteği</h2>
                        <p>Merhaba <b>${user.username}</b>,</p>
                        <p>Şifreni sıfırlamak için kullanman gereken 6 haneli kodun:</p>
                        <h1 style="background: #FFF9FA; padding: 10px; border: 1px dashed #C76B86; display: inline-block;">${resetCode}</h1>
                    </div>`
            };

            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error("Mail hatası:", error);
                    return res.status(500).json({ error: "E-posta gönderilemedi." });
                }
                res.json({ success: true, message: "Sıfırlama kodu e-postanıza gönderildi!" });
            });
        });
    });
});

// --- YENİ ŞİFREYİ KAYDET (RESET PASSWORD) ---
router.post('/reset-password', (req, res) => {
    const { email, code, newPassword } = req.body;

    db.get("SELECT * FROM users WHERE email = ? AND reset_code = ?", [email, code], (err, user) => {
        if (err || !user) {
            return res.status(400).json({ error: "Geçersiz e-posta veya kod!" });
        }

        const hashedPassword = bcrypt.hashSync(newPassword, 10);

        db.run("UPDATE users SET password = ?, reset_code = NULL WHERE email = ?", [hashedPassword, email], (updateErr) => {
            if (updateErr) return res.status(500).json({ error: "Şifre güncellenemedi." });
            res.json({ success: true, message: "Şifreniz başarıyla güncellendi!" });
        });
    });
});

// --- ÇIKIŞ YAP (LOGOUT) ---
router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/index.html');
    });
});

router.get('/user', (req, res) => {
    if (req.session.userId) {
        res.json({
            loggedIn: true,
            username: req.session.username,
            id: req.session.userId
        });
    } else {
        res.json({ loggedIn: false });
    }
});

// --- PROFİL GÜNCELLE ---
router.post('/update-profile', (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Yetkisiz!" });
    const { newUsername, newEmail } = req.body;
    const userId = req.session.userId;
    const sql = "UPDATE users SET username = ?, email = ? WHERE id = ?";
    db.run(sql, [newUsername, newEmail, userId], function (err) {
        if (err) {
            return res.status(500).json({ error: "Bu bilgiler zaten kullanımda olabilir." });
        }
        req.session.username = newUsername;
        res.json({ success: true, message: "Profiliniz başarıyla güncellendi!" });
    });
});

module.exports = router;