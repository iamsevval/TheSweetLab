export function checkLoginStatus() {
    fetch('/user')
        .then(response => response.json())
        .then(data => {
            const navProfileBtn = document.getElementById('nav-profile-btn');
            const addSection = document.getElementById('add-recipe-section');
            const guestWarning = document.getElementById('guest-warning');
            const navFav = document.getElementById('nav-favorites'); // Navbar'daki kalp ikonlu link
            const userNameDisplay = document.getElementById('user-name-display');
            const authBox = document.querySelector('.auth-box');
            const profileDashboard = document.getElementById('profile-dashboard');

            if (data.loggedIn) {
                // --- GİRİŞ YAPILMIŞSA ---

                // 1. Profil Butonunu Güncelle (CSS Sınıfı ile)
                if (navProfileBtn) {
                    navProfileBtn.classList.add('logged-in');
                    navProfileBtn.setAttribute('data-text', 'PROFİLİM');
                    navProfileBtn.setAttribute('data-hover', 'PROFİLE GİT');
                }

                // 2. Dashboard ve Menüleri Aç
                if (addSection) addSection.style.display = 'block';
                if (guestWarning) guestWarning.style.display = 'none';
                if (navFav) navFav.style.display = 'block'; // Giriş yapılmışsa Favorilerim'i göster

                // 3. Kullanıcı İsmini Yaz
                if (userNameDisplay) userNameDisplay.innerText = data.username;

                // 4. Profil Sayfasındaysa Panelleri Yönet
                if (authBox && profileDashboard) {
                    authBox.style.display = 'none';
                    profileDashboard.style.display = 'block';
                }

            } else {
                // --- GİRİŞ YAPILMAMIŞSA ---

                // 1. Profil Butonunu Eski Haline Getir
                if (navProfileBtn) {
                    navProfileBtn.classList.remove('logged-in');
                    navProfileBtn.setAttribute('data-text', 'PROFİL');
                    navProfileBtn.setAttribute('data-hover', 'GİRİŞ YAP');
                }

                // 2. Menüleri Gizle
                if (addSection) addSection.style.display = 'none';
                if (guestWarning) guestWarning.style.display = 'block';
                if (navFav) navFav.style.display = 'none'; // Giriş yoksa Favorilerim'i gizle

                // 3. Profil Sayfasındaysa Giriş Kutusunu Göster
                if (authBox && profileDashboard) {
                    authBox.style.display = 'block';
                    profileDashboard.style.display = 'none';
                }
            }
        })
        .catch(error => console.error("Login kontrol hatası:", error));
}
/* --- LOGOUT (ÇIKIŞ YAP) --- */
export function setupLogout() {
    // HTML'de <a href="/logout"> kullandığımız için buraya JS yazmaya gerek yok.
    // Backend otomatik hallediyor.
}

/* --- LOGIN (GİRİŞ YAP) --- */
export function setupLogin() {
    // HTML formun (action="/login") işi yapmasına izin veriyoruz.
}

/* --- ŞİFREMİ UNUTTUM  --- */
export function setupForgotPassword() {
    const forgotBtn = document.querySelector('.auth-content a.text-pink');

    if (forgotBtn) {
        forgotBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 1. ADIM: E-posta Adresini İste (Mevcut yapın korunuyor)
            Swal.fire({
                title: 'Şifrenizi mi Unuttunuz?',
                text: 'Lütfen e-posta adresinizi girin:',
                input: 'email',
                inputPlaceholder: 'ornek@mail.com',
                showCancelButton: true,
                confirmButtonText: 'Sıfırlama Kodu Gönder',
                confirmButtonColor: '#C76B86',
                cancelButtonText: 'İptal',
                showLoaderOnConfirm: true,
                preConfirm: (email) => {
                    return fetch('/forgot-password', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: email })
                    })
                        .then(response => {
                            if (!response.ok) {
                                return response.json().then(err => { throw new Error(err.error) });
                            }
                            return response.json();
                        })
                        .then(data => {
                            // Başarılıysa e-postayı bir sonraki adıma (then) aktar
                            return { email: email, success: true };
                        })
                        .catch(error => {
                            Swal.showValidationMessage(`Hata: ${error.message}`);
                        });
                },
                allowOutsideClick: () => !Swal.isLoading()
            }).then((result) => {
                // İlk adım başarıyla onaylandıysa otomatik olarak 2. ADIM'a geç
                if (result.isConfirmed && result.value.success) {
                    const userEmail = result.value.email;

                    // 2. ADIM: Kodu ve Yeni Şifreyi İste (Zincirleme Ekran)
                    Swal.fire({
                        title: 'Kodu Doğrula',
                        html: `
                            <p style="font-size: 0.9rem; color: #666;">${userEmail} adresine gelen 6 haneli kodu ve yeni şifrenizi girin:</p>
                            <input type="text" id="reset-code" class="swal2-input" placeholder="6 Haneli Kod">
                            <input type="password" id="new-password" class="swal2-input" placeholder="Yeni Şifreniz">
                        `,
                        confirmButtonText: 'Şifreyi Güncelle',
                        confirmButtonColor: '#C76B86',
                        showCancelButton: true,
                        cancelButtonText: 'Vazgeç',
                        showLoaderOnConfirm: true,
                        preConfirm: () => {
                            const code = document.getElementById('reset-code').value;
                            const newPassword = document.getElementById('new-password').value;

                            if (!code || !newPassword) {
                                Swal.showValidationMessage('Lütfen tüm alanları doldurun!');
                                return;
                            }

                            return fetch('/reset-password', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    email: userEmail,
                                    code: code,
                                    newPassword: newPassword
                                })
                            })
                                .then(res => {
                                    if (!res.ok) {
                                        return res.json().then(err => { throw new Error(err.error) });
                                    }
                                    return res.json();
                                })
                                .catch(err => {
                                    Swal.showValidationMessage(`Hata: ${err.message}`);
                                });
                        }
                    }).then((finalResult) => {
                        if (finalResult.isConfirmed) {
                            Swal.fire({
                                title: 'Başarılı!',
                                text: 'Şifreniz güncellendi. Artık yeni şifrenizle giriş yapabilirsiniz.',
                                icon: 'success',
                                confirmButtonColor: '#C76B86'
                            });
                        }
                    });
                }
            });
        });
    }
}

window.showUpdateModal = () => {
    Swal.fire({
        title: 'Profil Bilgilerini Güncelle',
        html: `
            <div class="text-start">
                <label class="small text-muted">Yeni Kullanıcı Adı</label>
                <input type="text" id="swal-username" class="swal2-input" style="width: 80%;" placeholder="Kullanıcı Adı">
                <label class="small text-muted mt-3">Yeni E-posta</label>
                <input type="email" id="swal-email" class="swal2-input" style="width: 80%;" placeholder="E-posta">
            </div>
        `,
        showCancelButton: true,
        confirmButtonText: 'Güncelle',
        confirmButtonColor: '#C76B86',
        cancelButtonText: 'Vazgeç',
        preConfirm: () => {
            const newUsername = document.getElementById('swal-username').value;
            const newEmail = document.getElementById('swal-email').value;
            if (!newUsername || !newEmail) {
                Swal.showValidationMessage('Lütfen tüm alanları doldurun!');
            }
            return { newUsername, newEmail };
        }
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/update-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.value)
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        Swal.fire('Başarılı!', 'Bilgileriniz güncellendi.', 'success').then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire('Hata', data.error || 'Güncelleme yapılamadı.', 'error');
                    }
                })
                .catch(() => Swal.fire('Hata', 'Sunucuya ulaşılamadı.', 'error'));
        }
    });
};
