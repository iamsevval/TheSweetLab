require('dotenv').config();
const express = require('express');
const router = express.Router();
const db = require('../database');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEN_AI_KEY);

router.post('/api/chat', async (req, res) => {
    const userMessage = req.body.message;

    // 1. Veritabanındaki tüm tariflerin özetini çekiyoruz
    const sql = "SELECT id, title, ingredients, category, description FROM recipes";

    db.all(sql, [], async (err, recipes) => {
        if (err) {
            return res.status(500).json({ error: "Veri çekilemedi" });
        }

        try {
            // 2. AI Modelini Hazırla
            const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            // 3. AI'ya verilecek "Sistem Talimatı" (Prompt Engineering)
            const prompt = `
            Sen "Sweet AI" adında yardımsever, tatlı dilli ve emojiler kullanan bir pastacı asistanısın.
            
            ELİNDEKİ TARİF VERİTABANI ŞU (JSON formatında):
            ${JSON.stringify(recipes)}

            KULLANICININ MESAJI: "${userMessage}"

            GÖREVLERİN:
            1. Kullanıcı elindeki malzemeleri söylerse (örn: süt, yumurta), veritabanındaki "ingredients" alanına bak ve en uygun tarifi bul.
            2. Kullanıcı "kilo aldım", "diyet", "hafif" derse, "category" alanı "diyet" olanları veya kalorisi düşük görünenleri öner.
            3. Kullanıcı "mutsuzum", "canım tatlı çekti" derse, çikolatalı veya şerbetli kategorisinden öneri yap.
            4. Eğer veritabanında uygun tarif yoksa nazikçe belirt ama genel yemek tavsiyesi ver.
            5. Bir tarif önerirken MUTLAKA tarifin ID'sini de belirt ki kullanıcıya link verebileyim.
            6. Cevabın kısa, samimi ve Türkçe olsun.

            ÖNEMLİ: Cevabında bir tarif öneriyorsan formatı şöyle yap: 
            "Senin için harika bir önerim var: [Tarif Adı] (ID: 5). Çünkü elindeki malzemelerle harika olur! 🍰"
            `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            res.json({ reply: text });

        } catch (error) {
            console.error("AI Hatası:", error);
            res.json({ reply: "Şu an fırınım çok yoğun, birazdan tekrar dener misin? 🤯" });
        }
    });
});

module.exports = router;