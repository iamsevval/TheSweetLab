/* --- PRELOADER --- */
export function setupPreloader() {
    const preloader = document.getElementById('preloader');

    if (!preloader) return; 

    const hidePreloader = () => {
        preloader.classList.add('hide');
        // Animasyon bitince display:none yaparak tıklamaları engelle
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    };

    // Eğer sayfa JS yüklenene kadar zaten açıldıysa bekleme, hemen kapat
    if (document.readyState === 'complete') {
        setTimeout(hidePreloader, 500); 
    } else {
        // Henüz yüklenmediyse yüklenmesini bekle
        window.addEventListener('load', () => {
            setTimeout(hidePreloader, 500);
        });
    }
}

/* --- SCROLL REVEAL --- */
export function setupScrollReveal() {
    const reveal = () => {
        var reveals = document.querySelectorAll('.reveal');
        for (var i = 0; i < reveals.length; i++) {
            var windowHeight = window.innerHeight;
            var elementTop = reveals[i].getBoundingClientRect().top;
            var elementVisible = 150;
            if (elementTop < windowHeight - elementVisible) {
                reveals[i].classList.add('active');
            }
        }
    };
    window.addEventListener('scroll', reveal);
    reveal(); 
}

/* --- SLIDER --- */
export function setupSlider() {
    const slides = document.querySelectorAll('.slide');
    const nextBtn = document.querySelector('.next');
    const prevBtn = document.querySelector('.prev');

    if (slides.length === 0) return;

    let currentSlide = 0;
    let slideInterval;

    const changeSlide = (direction) => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + direction + slides.length) % slides.length;
        slides[currentSlide].classList.add('active');
    };

    const startAutoSlide = () => {
        slideInterval = setInterval(() => changeSlide(1), 5000);
    };

    const stopAutoSlide = () => {
        clearInterval(slideInterval);
    };

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            changeSlide(1);
            stopAutoSlide();
            startAutoSlide();
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            changeSlide(-1);
            stopAutoSlide();
            startAutoSlide();
        });
    }

    startAutoSlide();
}

/* --- AUTH TABS (Giriş/Kayıt Geçişi) --- */
export function setupAuthTabs() {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    // HTML'de butonlara id vererek veya sırayla seçerek:
    const loginBtn = document.querySelector("button[onclick*='login']"); 
    const registerBtn = document.querySelector("button[onclick*='register']");
    const tabBtns = document.querySelectorAll('.tab-btn');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Önce hepsinden active sil
            tabBtns.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');

            // Formları yönet
            if(e.currentTarget.innerText.includes('Giriş')) {
                if(loginForm) loginForm.style.display = 'block';
                if(registerForm) registerForm.style.display = 'none';
            } else {
                if(loginForm) loginForm.style.display = 'none';
                if(registerForm) registerForm.style.display = 'block';
            }
        });
    });
}