
import { setupSlider, setupScrollReveal, setupPreloader, setupAuthTabs } from './modules/ui.js';
import { checkLoginStatus, setupLogin, setupLogout, setupForgotPassword } from './modules/auth.js';
import {
    setupRecipeForm,
    loadProfileRecipes,
    setupFilters,
    loadCommunityRecipes,
    loadFavoriteRecipes,
    loadWeeklySweet,
    setupSearch,
    handleURLFilter
} from './modules/recipes.js';
import { setupChatbot } from './modules/chatbot.js';
import { setupBlogPage } from './modules/blog.js';

document.addEventListener('DOMContentLoaded', () => {

    // 1. UI Başlatıcıları
    setupPreloader();
    setupScrollReveal();
    setupSlider();
    setupAuthTabs();
    setupBlogPage();

    // 2. Auth Başlatıcıları
    checkLoginStatus();
    setupLogin();
    setupLogout();
    setupForgotPassword();

    // 3. Tarif İşlemleri
    setupRecipeForm();
    loadProfileRecipes();
    loadCommunityRecipes();
    loadFavoriteRecipes();
    loadWeeklySweet();
    setupFilters();
    setupSearch();
    handleURLFilter(); // Ana sayfadan gelen kategori filtresini yakalar

    // 4. Chatbot Başlat
    setupChatbot();
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const data = new FormData(this);
            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: data,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    Swal.fire({
                        title: 'Başarılı!',
                        text: 'Mesajınız yöneticiye iletildi.',
                        icon: 'success',
                        confirmButtonColor: '#C76B86'
                    });
                    this.reset();
                } else {
                    throw new Error('Form gönderilemedi');
                }
            } catch (err) {
                Swal.fire('Hata', 'Bir sorun oluştu, lütfen tekrar deneyin.', 'error');
            }
        });
    }
});
/* --- Sayfa Yüklendiğinde Hash (#) Takibi ve Otomatik Kaydırma --- */
// (Profil sayfasından "Yeni Tarif Ekle"ye basınca formun önüne kaydırır)
window.addEventListener('load', () => {
    if (window.location.hash) {
        const hash = window.location.hash;
        const targetElement = document.querySelector(hash);

        if (targetElement) {
            setTimeout(() => {
                const headerOffset = 100;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }, 600);
        }
    }
});

