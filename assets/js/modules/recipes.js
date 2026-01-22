export function setupRecipeForm() {
    const form = document.getElementById('recipeForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // --- KATEGORİ SEÇİMİNİ AL ---
        const categoryElement = document.getElementById('r-category');
        const selectedCategory = categoryElement.value; 

        const imageInput = document.getElementById('r-image');
        if (!imageInput || !imageInput.files[0]) {
            Swal.fire('Hata', 'Lütfen tarifiniz için bir fotoğraf seçin!', 'error');
            return;
        }

        const title = document.getElementById('r-title').value;
        const prepTime = document.getElementById('r-prep-time').value;
        const cookTime = document.getElementById('r-cook-time').value;
        const servings = parseInt(document.getElementById('r-person').value);
        const ingredients = document.getElementById('r-ingredients').value;
        const description = document.getElementById('r-desc').value;

        if (servings <= 0 || isNaN(servings)) {
            Swal.fire('Hata', 'Kişi sayısı 0 veya daha az olamaz!', 'error');
            return;
        }

        const loadingElement = document.getElementById('ai-loading');
        if (loadingElement) {
            loadingElement.style.display = 'block';
            loadingElement.innerHTML = `<div class="spinner-border text-pink" role="status"></div><p class="mt-2">Şef yapay zeka tarifini inceliyor ve düzenliyor...</p>`;
        }
        form.style.display = 'none';

        try {
            // 1. AI Analizi İsteği
            const aiCheck = await fetch('/analyze-recipe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, ingredients, description })
            });

            const aiResult = await aiCheck.json();

            // EĞER AI REDDEDERSE (Spam, Küfür, Anlamsız)
            if (!aiResult.approved) {
                throw new Error(aiResult.reason || "Tarifiniz yapay zeka kriterlerine uymadı.");
            }

            // EĞER ONAYLANIRSA: AI'nın düzelttiği metinleri kullan (Kalori eklemesi yok)
            const finalTitle = aiResult.corrected_title || title;
            const finalIngredients = aiResult.corrected_ingredients || ingredients;
            const finalDescription = aiResult.corrected_description || description;

            // 2. Veri Hazırlığı (Düzeltilmiş verilerle)
            const formData = new FormData();
            formData.append('title', finalTitle);
            formData.append('category', selectedCategory);
            formData.append('prep_time', prepTime);
            formData.append('cook_time', cookTime);
            formData.append('servings', servings);
            formData.append('ingredients', finalIngredients); // AI tarafından düzenlenmiş liste
            formData.append('description', finalDescription); // AI tarafından düzeltilmiş açıklama
            formData.append('image', imageInput.files[0]);

            // 3. Backend'e Kayıt
            const response = await fetch('/add-recipe', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            // Backend'den gelen ID kontrolü
            const realId = data.new_recipe_id || data.id || data.recipeId;

            if (data.success) {
                if (!realId) {
                    // ID gelmediyse güvenli taraf için sayfayı yenile
                    Swal.fire('Başarılı', 'Tarif eklendi! (Sayfa yenileniyor...)', 'success')
                        .then(() => location.reload());
                    return;
                }

                const uploadedFile = imageInput.files[0];
                let tempImageUrl = '../assets/images/default-cake.jpg';
                if (uploadedFile) tempImageUrl = URL.createObjectURL(uploadedFile);

                form.reset();
                Swal.fire('Harika!', 'Tarifiniz başarıyla yayınlandı.', 'success');
                if (typeof loadProfileRecipes === "function") loadProfileRecipes();

                // DOM'a Ekleme (Anlık Görüntü)
                const communityContainer = document.getElementById('community-recipes');
                if (communityContainer) {
                    const loader = document.getElementById('loader');
                    if (loader) loader.remove();

                    const totalTime = (parseInt(prepTime) || 0) + (parseInt(cookTime) || 0);

                    // Kart HTML'i
                    const newCardHTML = `
                    <div class="col-md-4 col-sm-6 recipe-card-wrapper reveal active" style="display:block; opacity:1;" data-category="${selectedCategory}">
                        <div class="card recipe-card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                            <div class="recipe-img-box position-relative overflow-hidden">
                                <button class="fav-btn-modern" onclick="toggleFavorite(${realId}, this)" title="Favorilere Ekle">
                                    <i class="far fa-heart"></i>
                                </button>
                                <img src="${tempImageUrl}" class="card-img-top" style="height: 200px; object-fit: cover;">
                            </div>

                            <div class="card-body text-center p-4">
                                <h3 class="recipe-title h5 fw-bold mb-3">${title}</h3>
                                
                                <div class="recipe-meta d-flex justify-content-center align-items-center gap-3 mb-3 text-muted small">
                                    <span><i class="far fa-clock text-pink"></i> ${totalTime} Dk</span>
                                    <span class="opacity-25">|</span>
                                    <span><i class="fas fa-user-friends text-pink"></i> ${servings} Kişilik</span>
                                </div>

                                <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                                    <button class="btn btn-interaction" onclick="sendInteraction(${realId}, 'like', this)" title="Eline Sağlık">
                                        <i class="far fa-thumbs-up"></i> <span>Eline Sağlık</span> <b class="ms-1">0</b>
                                    </button>
                                    <button class="btn btn-interaction" onclick="sendInteraction(${realId}, 'cooked', this)" title="Ben de Yaptım">
                                        <i class="fas fa-hands-clapping"></i> <span>Ben de Yaptım</span> <b class="ms-1">0</b>
                                    </button>
                                </div>

                                <button class="btn btn-outline-pink w-100 rounded-pill btn-sm fw-600 mb-3" 
                                onclick="openRecipePreview(${realId})">
                                Tarifi İncele
                                </button>

                                <div class="mt-2">
                                    <span class="badge rounded-pill bg-light text-pink border border-pink-light px-3 py-1">
                                        ${selectedCategory.replace('-', ' ').toUpperCase()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>`;

                    communityContainer.insertAdjacentHTML('afterbegin', newCardHTML);
                }
            } else {
                throw new Error(data.error || 'Bir sorun oluştu.');
            }

        } catch (err) {
            Swal.fire('Hata', err.message, 'error');
            console.error(err);
        } finally {
            if (loadingElement) loadingElement.style.display = 'none';
            form.style.display = 'block';
        }
    });
}
/* YORUM GÖNDERME MOTORU */
export function setupCommentForm(recipeId) {
    const commentForm = document.getElementById('commentForm'); // Formun ID'si
    if (!commentForm) return;

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const inputField = document.getElementById('comment-text');
        const commentText = inputField.value;
        // Yanıtla'ya basıldıysa parentId doludur, basılmadıysa null gider
        const parentId = inputField.dataset.parentId || null;

        try {
            const response = await fetch('/add-comment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: commentText,
                    parentId: parentId,
                    recipeId: recipeId
                })
            });

            const data = await response.json();
            if (data.success) {
                Swal.fire('Başarılı', 'Yorumunuz eklendi!', 'success');
                inputField.value = ''; // Kutuyu temizle
                delete inputField.dataset.parentId; // Hafızayı sıfırla (Önemli)

                // Sayfayı yenilemek veya yorumları tekrar yüklemek için:
                location.reload();
            }
        } catch (err) {
            console.error("Yorum hatası:", err);
        }
    });
}

/* 2. PROFİL LİSTELEME  */


export function loadProfileRecipes() {
    const list = document.getElementById('my-recipes-list');
    if (!list) return;

    fetch('/my-recipes')
        .then(res => res.json())
        .then(recipes => {
            list.innerHTML = "";

            const countElement = document.getElementById('my-recipe-count');
            if (countElement) {
                countElement.innerText = recipes.length;
            }

            if (recipes.length === 0) {
                list.innerHTML = `
                    <div class="col-12 text-center py-4">
                        <p class="text-muted">Henüz eklenmiş bir tarifiniz yok. 🍰</p>
                    </div>`;
            } else {
                recipes.forEach(r => {
                    const imgSource = r.image_url ? r.image_url : '../assets/images/default-cake.jpg';
                    const totalTime = (parseInt(r.prep_time) || 0) + (parseInt(r.cook_time) || 0);

                    list.innerHTML += `
                        <div class="col-12 mb-3">
                            <div class="card shadow-sm border-0 rounded-4 overflow-hidden">
                                <div class="card-body d-flex justify-content-between align-items-center p-3">
                                    
                                    <div class="d-flex align-items-center" style="cursor: pointer;" 
                                         onclick="openRecipePreview(${r.id})" 
                                         title="Hızlı Bakış">
                                        <div class="position-relative">
                                            <img src="${imgSource}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 12px;">
                                        </div>
                                        <div class="ms-3">
                                            <h6 class="fw-bold mb-1" style="color: #333;">${r.title}</h6>
                                            <div class="text-muted small">
                                                <i class="far fa-clock text-pink"></i> ${totalTime} dk
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-flex gap-2">
                                        <a href="blog.html?id=${r.id}" class="btn btn-sm btn-light text-primary rounded-pill px-3" title="Yorum Yap">
                                            <i class="fas fa-comments"></i> Detay & Yorum
                                        </a>

                                        <button class="btn btn-sm btn-light text-pink rounded-pill px-3" 
                                                onclick="openEditModal(${r.id})" title="Tarifi Düzenle">
                                            <i class="fas fa-edit"></i> Düzenle
                                        </button>
                                        
                                        <button class="btn btn-sm btn-light text-danger rounded-pill px-3 delete-btn" data-id="${r.id}" title="Tarifi Sil">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>`;
                });
            }
            return fetch('/my-favorites');
        })

        .then(res => res ? res.json() : [])
        .then(favs => {
            const favCountElement = document.getElementById('my-fav-count');
            if (favCountElement) {
                favCountElement.innerText = favs.length;
            }

            document.querySelectorAll('.delete-btn').forEach(btn => {
                btn.addEventListener('click', function () {
                    confirmDelete(this.getAttribute('data-id'));
                });
            });
        })
        .catch(err => console.error("Profil yükleme hatası:", err));
}
/* TOPLULUK TARİFLERİ LİSTELEME */

export function loadCommunityRecipes() {
    const container = document.getElementById('community-recipes');
    if (!container) return;

    // 1. ÖNCE KULLANICI KİMLİĞİNİ ALIYORUZ
    fetch('/user')
        .then(u => u.json())
        .then(userData => {
            const currentUserId = userData.id; // Kullanıcı ID'si elimizde

            return fetch('/my-favorites')
                .then(res => res.json())
                .then(favs => {
                    const favIds = Array.isArray(favs) ? favs.map(f => f.id) : [];

                    return fetch('/recipes')
                        .then(res => res.json())
                        .then(recipes => {
                            container.innerHTML = "";
                            if (recipes.length === 0) {
                                container.innerHTML = "<p class='center w-100'>Henüz hiç tarif eklenmemiş. İlk sen ol! 🍰</p>";
                                return;
                            }

                            recipes.forEach(r => {
                                // 2. ANAHTARI KULLANICIYA ÖZEL YAPIYORUZ
                                // Eğer kullanıcı giriş yapmamışsa 'guest' kullanıyoruz
                                const safeId = currentUserId || 'guest';
                                const likeKey = `interaction_like_${safeId}`;
                                const cookedKey = `interaction_cooked_${safeId}`;

                                const likeHistory = JSON.parse(localStorage.getItem(likeKey)) || [];
                                const cookedHistory = JSON.parse(localStorage.getItem(cookedKey)) || [];

                                const isLikedClass = likeHistory.includes(r.id) ? 'active-interaction' : '';
                                const isCookedClass = cookedHistory.includes(r.id) ? 'active-interaction' : '';

                                const imgSource = r.image_url ? r.image_url : '../assets/images/default-cake.jpg';
                                const totalTime = (parseInt(r.prep_time) || 0) + (parseInt(r.cook_time) || 0);
                                const isFav = favIds.includes(r.id);
                                const heartClass = isFav ? 'fas' : 'far';
                                const heartStyle = isFav ? 'style="color: #C76B86;"' : '';

                                container.innerHTML += `
                                <div class="col-md-4 col-sm-6 recipe-card-wrapper reveal active" data-category="${r.category}">
                                    <div class="card recipe-card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                        <div class="recipe-img-box position-relative overflow-hidden">
                                            <button class="fav-btn-modern" onclick="toggleFavorite(${r.id}, this)" title="Favorilere Ekle">
                                                <i class="${heartClass} fa-heart" ${heartStyle}></i>
                                            </button>
                                            <img src="${imgSource}" class="card-img-top" style="height: 200px; object-fit: cover;">
                                        </div>

                                        <div class="card-body text-center p-4">
                                            <h3 class="recipe-title h5 fw-bold mb-3">${r.title}</h3>
                                            
                                            <div class="recipe-meta d-flex justify-content-center align-items-center gap-3 mb-3 text-muted small">
                                                <span><i class="far fa-clock text-pink"></i> ${totalTime} Dk</span>
                                                <span class="opacity-25">|</span>
                                                <span><i class="fas fa-user-friends text-pink"></i> ${r.servings} Kişilik</span>
                                            </div>

                                            <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                                                <button class="btn btn-interaction ${isLikedClass}" onclick="sendInteraction(${r.id}, 'like', this)" title="Eline Sağlık">
                                                    <i class="far fa-thumbs-up"></i> <span>Eline Sağlık</span> <b class="ms-1">${r.like_count || 0}</b>
                                                </button>
                                                <button class="btn btn-interaction ${isCookedClass}" onclick="sendInteraction(${r.id}, 'cooked', this)" title="Ben de Yaptım">
                                                    <i class="fas fa-hands-clapping"></i> <span>Ben de Yaptım</span> <b class="ms-1">${r.cooked_count || 0}</b>
                                                </button>
                                            </div>

                                            <button class="btn btn-outline-pink w-100 rounded-pill btn-sm fw-600 mb-3" 
                                            onclick="openRecipePreview(${r.id})">
                                            Tarifi İncele
                                            </button>

                                            <div class="mt-2">
                                                <span class="badge rounded-pill bg-light text-pink border border-pink-light px-3 py-1">
                                                    ${r.category.replace('-', ' ').toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>`;
                            });
                        });
                });
        });
}

export function loadWeeklySweet() {
    fetch('/recipes')
        .then(res => res.json())
        .then(recipes => {
            if (!recipes || recipes.length === 0) return;

            // 1. KRİTER: Deneme sayısı (cooked_count)
            // 2. KRİTER (Eşitlik durumunda): Beğeni sayısı (like_count)
            const topRecipe = recipes.sort((a, b) => {
                const cookedA = a.cooked_count || 0;
                const cookedB = b.cooked_count || 0;

                if (cookedB === cookedA) {
                    return (b.like_count || 0) - (a.like_count || 0);
                }
                return cookedB - cookedA;
            })[0];

            // HTML Elemanlarını Doldur
            const img = document.getElementById('weekly-sweet-img');
            const title = document.getElementById('weekly-sweet-title');
            const desc = document.getElementById('weekly-sweet-desc');
            const link = document.getElementById('weekly-sweet-link');

            if (img) img.src = topRecipe.image_url || '../assets/images/default-cake.jpg';
            if (title) title.innerText = topRecipe.title;

            // Açıklama kısmına deneme sayısını yazıyoruz
            if (desc) desc.innerText = `${topRecipe.cooked_count || 0} kişi tarafından denendi ve tam not aldı!`;

            // BASINCA İLGİLİ TARİFE GİTME AYARI
            if (link) {
                link.href = `blog.html?id=${topRecipe.id}`;
                link.setAttribute('data-text', 'TARİFİ HEMEN DENE');
                link.setAttribute('data-hover', 'HEMEN İNCELE'); 
                link.innerHTML = '';
            }
        })
        .catch(err => console.error("Öne çıkan tatlı yüklenemedi:", err));
}
/* YEDEK LİSTELEME */
function loadRecipesWithoutFavCheck() {
    const container = document.getElementById('community-recipes');
    if (!container) return;

    fetch('/recipes')
        .then(res => res.json())
        .then(recipes => {
            container.innerHTML = "";
            recipes.forEach(r => {
                const imgSource = r.image_url ? r.image_url : '../assets/images/default-cake.jpg';
                const totalTime = (parseInt(r.prep_time) || 0) + (parseInt(r.cook_time) || 0);
                container.innerHTML += `
                <div class="col-md-4 col-sm-6 recipe-card-wrapper active" data-category="${r.category}">
                    <div class="card recipe-card h-100 position-relative">
                        <button class="fav-btn" onclick="toggleFavorite(${r.id}, this)">
                            <i class="far fa-heart"></i>
                        </button>
                        <div class="recipe-img-box">
                             <img src="${imgSource}" class="card-img-top">
                        </div>
                        <div class="card-body text-center p-4">
                            <h3 class="recipe-title">${r.title}</h3>
                            <div class="recipe-meta d-flex justify-content-center gap-3 mb-3 text-muted small">
                                <span><i class="far fa-clock"></i> ${totalTime} Dk</span>
                                <span><i class="fas fa-user-friends"></i> ${r.servings} Kişilik</span>
                            </div>
                            <button class="btn btn-outline-pink rounded-pill px-4 btn-sm" onclick="showRecipeDetails('${r.title}', '${r.ingredients.replace(/'/g, "\\'")}', '${r.description.replace(/'/g, "\\'")}')">Tarifi İncele</button>
                        </div>
                    </div>
                </div>`;
            });
        });
}

/*  5. FAVORİLERİ YÜKLE */
export function loadFavoriteRecipes() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;

    // 1. KULLANICI ID'SİNİ AL
    fetch('/user')
        .then(u => u.json())
        .then(userData => {
            const currentUserId = userData.id;

            return fetch('/my-favorites')
                .then(res => res.json())
                .then(recipes => {
                    container.innerHTML = "";
                    if (recipes.length === 0) {
                        container.innerHTML = `<div class="col-12 text-center py-5">...</div>`;
                        return;
                    }

                    recipes.forEach(r => {
                        // 2. KULLANICIYA ÖZEL ANAHTAR
                        const safeId = currentUserId || 'guest';
                        const likeKey = `interaction_like_${safeId}`;
                        const cookedKey = `interaction_cooked_${safeId}`;

                        const likeHistory = JSON.parse(localStorage.getItem(likeKey)) || [];
                        const cookedHistory = JSON.parse(localStorage.getItem(cookedKey)) || [];

                        const isLikedClass = likeHistory.includes(r.id) ? 'active-interaction' : '';
                        const isCookedClass = cookedHistory.includes(r.id) ? 'active-interaction' : '';

                        const imgSource = r.image_url ? r.image_url : '../assets/images/default-cake.jpg';
                        const totalTime = (parseInt(r.prep_time) || 0) + (parseInt(r.cook_time) || 0);

                        container.innerHTML += `
                        <div class="col-md-4 col-sm-6 recipe-card-wrapper active" id="fav-card-${r.id}">
                            <div class="card recipe-card h-100 shadow-sm border-0 rounded-4 overflow-hidden">
                                <div class="recipe-img-box position-relative overflow-hidden">
                                    <button class="fav-btn-modern" onclick="toggleFavorite(${r.id}, this, true)" title="Favorilerden Çıkar">
                                        <i class="fas fa-heart text-pink"></i>
                                    </button>
                                    <img src="${imgSource}" class="card-img-top" style="height: 220px; object-fit: cover;">
                                </div>

                                <div class="card-body text-center p-4">
                                    <h3 class="recipe-title h5 fw-bold mb-3">${r.title}</h3>
                                    
                                    <div class="recipe-meta d-flex justify-content-center align-items-center gap-3 mb-3 text-muted small">
                                        <span><i class="far fa-clock text-pink"></i> ${totalTime} Dk</span>
                                        <span class="opacity-25">|</span>
                                        <span><i class="fas fa-user-friends text-pink"></i> ${r.servings} Kş.</span>
                                    </div>

                                    <div class="d-flex justify-content-center align-items-center gap-3 mb-3">
                                        <button class="btn btn-interaction ${isLikedClass}" onclick="sendInteraction(${r.id}, 'like', this)">
                                            <i class="far fa-thumbs-up"></i> <span>Eline Sağlık</span> <b class="ms-1">${r.like_count || 0}</b>
                                        </button>
                                        <button class="btn btn-interaction ${isCookedClass}" onclick="sendInteraction(${r.id}, 'cooked', this)">
                                            <i class="fas fa-hands-clapping"></i> <span>Ben de Yaptım</span> <b class="ms-1">${r.cooked_count || 0}</b>
                                        </button>
                                    </div>

                                    <button class="btn btn-outline-pink w-100 rounded-pill btn-sm fw-600 mb-3" 
                                    onclick="openRecipePreview(${r.id})">
                                    <i class="fas fa-info-circle me-1"></i> Tarifi İncele
                                    </button>
                                </div>
                            </div>
                        </div>`;
                    });
                });
        })
        .catch(err => {
            console.error("Favoriler yüklenirken bir hata oluştu:", err);
            container.innerHTML = "<p class='center text-danger'>Favoriler yüklenemedi.</p>";
        });
}
/**
 * FAVORİ EKLE/ÇIKAR
 */
window.toggleFavorite = (recipeId, btnElement, isFavoritePage = false) => {
    fetch('/toggle-favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeId })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                if (isFavoritePage && data.action === 'removed') {
                    const card = document.getElementById(`fav-card-${recipeId}`);
                    if (card) card.remove();
                    const grid = document.getElementById('favorites-grid');
                    if (grid && grid.children.length === 0) loadFavoriteRecipes();
                } else {
                    const icon = btnElement.querySelector('i');
                    if (data.action === 'added') {
                        icon.classList.replace('far', 'fas');
                        icon.style.color = '#C76B86';
                    } else {
                        icon.classList.replace('fas', 'far');
                        icon.style.color = 'inherit';
                    }
                }
            } else {
                Swal.fire('Hata', 'Giriş yapmış olmalısın.', 'error');
            }
        });
};

/**
 * YARDIMCI FONKSİYONLAR
 */

window.openRecipePreview = (recipeId) => {
    fetch(`/api/recipe-details/${recipeId}`)
        .then(res => {
            if (!res.ok) throw new Error("Tarif bulunamadı");
            return res.json();
        })
        .then(recipe => {
            // --- 1. MODAL VERİLERİNİ DOLDUR  ---
            if (document.getElementById('modal-title')) document.getElementById('modal-title').innerText = recipe.title;
            if (document.getElementById('modal-category')) document.getElementById('modal-category').innerText = (recipe.category || 'Genel').toUpperCase();
            if (document.getElementById('modal-img')) document.getElementById('modal-img').src = recipe.image_url || '../assets/images/default-cake.jpg';

            const modalDesc = document.getElementById('modal-description');
            if (modalDesc) modalDesc.innerHTML = "";

            // --- 2. BLOG SAYFASI VERİLERİNİ DOLDUR  ---
            if (document.getElementById('recipe-title')) document.getElementById('recipe-title').innerText = recipe.title;
            if (document.getElementById('instructions-text')) document.getElementById('instructions-text').innerText = recipe.description;
            if (document.getElementById('main-recipe-img')) document.getElementById('main-recipe-img').src = recipe.image_url || '../assets/images/default-cake.jpg';
            if (document.getElementById('prep-time')) {
                const total = (parseInt(recipe.prep_time) || 0) + (parseInt(recipe.cook_time) || 0);
                document.getElementById('prep-time').innerText = total;
            }

            // --- 3. MALZEMELERİ LİSTELE (HEM MODAL HEM BLOG İÇİN) ---
            const blogIngredients = document.getElementById('ingredients-list');
            const modalIngredients = document.getElementById('modal-ingredients-list');
            const servingsSpan = document.getElementById('current-servings');

            // Hangi liste sayfada varsa (Modal mı Blog mu) onu hedef alır
            const targetList = blogIngredients || modalIngredients;

            if (targetList && recipe.ingredients) {
                targetList.innerHTML = `<h5 class="fw-bold mb-3 mt-2" style="color: #C76B86; font-size: 1rem;"><i class="fas fa-shopping-basket me-2"></i>Malzemeler</h5>`;
                if (servingsSpan) servingsSpan.innerText = recipe.servings || 4;

                const lines = recipe.ingredients.split('\n');
                lines.forEach(line => {
                    if (!line.trim()) return;

                    // Sayıyı ve metni ayırıyoruz 
                    const match = line.match(/^(\d+(?:[.,]\d+)?)\s*(.*)/);
                    if (match) {
                        const amount = match[1].replace(',', '.');
                        const text = match[2];
                        targetList.innerHTML += `
                            <li class="mb-2 border-bottom pb-1 small">
                                <i class="fas fa-check text-pink me-2"></i>
                                <span class="ingredient-amount fw-bold text-pink" 
                                      data-base-amount="${amount}" 
                                      data-original-servings="${recipe.servings || 4}">${amount}</span>
                                <span class="text-secondary ms-1">${text}</span>
                            </li>`;

                    } else {
                        targetList.innerHTML += `<li class="mb-2 border-bottom pb-1 small text-secondary"><i class="fas fa-check text-pink me-2"></i> ${line}</li>`;
                    }
                });
            }

            const detailLink = document.querySelector('#modal-detail-link');
            if (detailLink) {
                detailLink.setAttribute('href', `blog.html?id=${recipe.id}`);
                detailLink.setAttribute('data-text', 'Tarif Detayına Git & Yorum Yap');
                detailLink.setAttribute('data-hover', 'Hemen İncele');
                detailLink.innerHTML = '';
                detailLink.style.setProperty('display', 'block', 'important');
                detailLink.style.setProperty('visibility', 'visible', 'important');
                detailLink.style.setProperty('opacity', '1', 'important');
            }

            // --- MODAL AÇMA KONTROLÜ  ---
            const modalElement = document.getElementById('recipePreviewModal');
            if (modalElement && !window.location.pathname.includes('blog.html')) {
                const myModal = new bootstrap.Modal(modalElement);
                myModal.show();
            }
        })
        .catch(err => console.error("Hata oluştu:", err));
};
function confirmDelete(id) {
    Swal.fire({
        title: 'Emin misiniz?',
        text: "Bu tarif kalıcı olarak silinecek!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C76B86',
        confirmButtonText: 'Evet, Sil'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch(`/delete-recipe/${id}`, { method: 'DELETE' })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        loadProfileRecipes();
                        Swal.fire('Silindi!', 'Tarifiniz silindi.', 'success');
                    }
                });
        }
    });
}

export function setupFilters() {
    const buttons = document.querySelectorAll('.btn-filter');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.getAttribute('data-filter') || 'all';
            const cards = document.querySelectorAll('.recipe-card-wrapper');
            cards.forEach(card => {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

/* --- TARİFLERDE ARAMA YAPMA  --- */
export function setupSearch() {
    const searchInput = document.getElementById('recipeSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase().trim();
        const cards = document.querySelectorAll('.recipe-card-wrapper');

        cards.forEach(card => {
            const titleElement = card.querySelector('.recipe-title');
            if (titleElement) {
                const titleText = titleElement.innerText.toLowerCase();

                // term boşsa hepsini göster, değilse eşleşeni göster
                if (titleText.includes(term)) {
                    card.style.setProperty('display', 'block', 'important');
                } else {
                    card.style.setProperty('display', 'none', 'important');
                }
            }
        });
    });
}
/* --- URL Parametresine Göre Otomatik Filtreleme --- */
export function handleURLFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter'); // URL'deki 'filter' değerini al

    if (filter) {
        // Sayfa tamamen yüklendikten sonra filtrele
        setTimeout(() => {
            const filterBtn = document.querySelector(`.btn-filter[data-filter="${filter}"]`);
            if (filterBtn) {
                filterBtn.click(); // Filtre butonuna otomatik tıkla

                // Sayfayı tariflerin olduğu yere kaydır
                filterBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 500); 
    }
}

window.sendInteraction = (recipeId, type, btnElement) => {
    // 1. Önce sunucudan "Ben kimim?" bilgisini alıyoruz
    fetch('/user')
        .then(res => res.json())
        .then(userData => {
            if (!userData.loggedIn) {
                Swal.fire('Hata', 'Giriş yapmış olmalısın.', 'error');
                return;
            }

            const currentUserId = userData.id;

            // 2. ANAHTARI KULLANICIYA ÖZEL YAPIYORUZ
            const storageKey = `interaction_${type}_${currentUserId}`;

            let history = JSON.parse(localStorage.getItem(storageKey)) || [];

            // Kullanıcı bu işlemi daha önce yapmış mı?
            const isAlreadyDone = history.includes(recipeId);
            const action = isAlreadyDone ? 'remove' : 'add';

            // 3. Sunucuya gönder
            fetch(`/recipe/interaction`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recipeId, type, action })
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        const countSpan = btnElement.querySelector('.count-val') || btnElement.querySelector('b');
                        let currentCount = parseInt(countSpan.innerText) || 0;

                        if (action === 'add') {
                            countSpan.innerText = currentCount + 1;
                            history.push(recipeId);
                            btnElement.classList.add('active-interaction');

                            Swal.fire({
                                title: type === 'like' ? 'Eline Sağlık!' : 'Harika!',
                                text: 'Etkileşimin kaydedildi.',
                                icon: 'success',
                                timer: 1000,
                                showConfirmButton: false
                            });
                        } else {
                            countSpan.innerText = Math.max(0, currentCount - 1);
                            history = history.filter(id => id !== recipeId);
                            btnElement.classList.remove('active-interaction');
                        }

                        // 4. Güncel listeyi KULLANICIYA ÖZEL olarak kaydet
                        localStorage.setItem(storageKey, JSON.stringify(history));

                    } else {
                        Swal.fire('Hata', 'İşlem başarısız.', 'error');
                    }
                })
                .catch(err => {
                    console.error("Etkileşim hatası:", err);
                    Swal.fire('Hata', 'Sunucuya bağlanılamadı.', 'error');
                });
        });
};

window.openEditModal = (recipeId) => {
    fetch(`/api/recipe-details/${recipeId}`)
        .then(res => res.json())
        .then(recipe => {
            // Formu mevcut bilgilerle doldur
            document.getElementById('edit-r-id').value = recipe.id;
            document.getElementById('edit-r-title').value = recipe.title;
            document.getElementById('edit-r-category').value = recipe.category;
            document.getElementById('edit-r-prep').value = recipe.prep_time;
            document.getElementById('edit-r-cook').value = recipe.cook_time;
            document.getElementById('edit-r-servings').value = recipe.servings;
            document.getElementById('edit-r-ingredients').value = recipe.ingredients;
            document.getElementById('edit-r-desc').value = recipe.description;

            // Modalı aç
            const editModal = new bootstrap.Modal(document.getElementById('editRecipeModal'));
            editModal.show();
        });
};
// Düzenleme formu gönderildiğinde çalışan GÜNCEL kısım
document.getElementById('editRecipeForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const id = document.getElementById('edit-r-id').value;

    // Metin ve Dosya verisi için FormData kullanıyoruz
    const formData = new FormData();
    formData.append('title', document.getElementById('edit-r-title').value);
    formData.append('category', document.getElementById('edit-r-category').value);
    formData.append('prep_time', document.getElementById('edit-r-prep').value);
    formData.append('cook_time', document.getElementById('edit-r-cook').value);
    formData.append('servings', document.getElementById('edit-r-servings').value);
    formData.append('ingredients', document.getElementById('edit-r-ingredients').value);
    formData.append('description', document.getElementById('edit-r-desc').value);

    // Resim seçildiyse ekle
    const imageInput = document.getElementById('edit-r-image');
    if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
    }

    try {
        const res = await fetch(`/api/update-recipe/${id}`, {
            method: 'POST',
            body: formData
        });

        const result = await res.json();

        if (result.success) {
            // 1. Modalı kapat
            const modalElement = document.getElementById('editRecipeModal');
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) modalInstance.hide();

            // 2. Başarı mesajı göster
            await Swal.fire({
                icon: 'success',
                title: 'Başarıyla Güncellendi!',
                text: 'Resim ve bilgiler güncellendi.',
                timer: 1500,
                showConfirmButton: false
            });

            // 3. Profil listesini yenile
            if (typeof loadProfileRecipes === 'function') {
                loadProfileRecipes();
            }
        } else {
            Swal.fire('Hata', result.error || 'Güncellenemedi', 'error');
        }
    } catch (err) {
        console.error("Güncelleme hatası:", err);
        Swal.fire('Hata', 'Sunucuyla bağlantı kurulamadı.', 'error');
    }
});
/**
 * 8. BLOG YORUMLARINI LİSTELEME
 */

export function renderComments(allComments) {
    const container = document.getElementById('comments-list');
    if (!container) return;

    // 1. Önce ana yorumları ve yanıtları birbirinden ayırıyoruz
    const mainComments = allComments.filter(c => !c.parent_id);
    const replies = allComments.filter(c => c.parent_id);

    let finalHtml = "";

    // 2. Ana yorumları dönüyoruz
    mainComments.forEach(parent => {
        // ANA YORUM TASARIMI
        finalHtml += `
        <div class="comment-item p-3 mb-2 bg-white rounded-4 shadow-sm border-pink-light">
            <div class="d-flex justify-content-between align-items-center">
                <strong class="text-pink">${parent.username}</strong>
                <small class="text-muted small">${parent.date || 'Şimdi'}</small>
            </div>
            <p class="mt-2 mb-1 text-secondary">${parent.comment_text}</p>
            <div class="mt-2 text-end">
                <button class="btn-reply" onclick="replyTo('${parent.username}', ${parent.id})">
                    <i class="fas fa-reply me-1"></i> Yanıtla
                </button>
            </div>
        </div>`;

        // 3. BU YORUMA AİT YANITLARI BUL VE HEMEN ALTINA EKLE
        const childReplies = replies.filter(r => r.parent_id === parent.id);

        childReplies.forEach(reply => {
            finalHtml += `
            <div class="comment-item comment-reply p-3 mb-2 shadow-sm">
                <div class="d-flex justify-content-between align-items-center">
                    <strong class="text-pink">${reply.username}</strong>
                    <small class="text-muted small">${reply.date || 'Şimdi'}</small>
                </div>
                <p class="mt-2 mb-1 text-secondary">${reply.comment_text}</p>
                <div class="mt-2 text-end">
                    <button class="btn-reply" onclick="replyTo('${reply.username}', ${parent.id})">
                        <i class="fas fa-reply me-1"></i> Yanıtla
                    </button>
                </div>
            </div>`;
        });
    });

    container.innerHTML = finalHtml;
}
window.deleteComment = (commentId) => {
    Swal.fire({
        title: 'Emin misiniz?',
        text: "Yorumunuz kalıcı olarak silinecektir!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#C76B86',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Evet, sil!',
        cancelButtonText: 'Vazgeç'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const res = await fetch(`/api/delete-comment/${commentId}`, {
                    method: 'DELETE'
                });
                const data = await res.json();

                if (data.success) {
                    Swal.fire('Silindi!', 'Yorum başarıyla kaldırıldı.', 'success');
                    // Sayfadaki yorumları yenile
                    const urlParams = new URLSearchParams(window.location.search);
                    loadComments(urlParams.get('id'));
                } else {
                    Swal.fire('Hata', data.error || 'Yorum silinemedi.', 'error');
                }
            } catch (err) {
                console.error("Silme hatası:", err);
            }
        }
    });
};
window.replyTo = (username, parentId) => {
    console.log("Yanıtla basıldı:", username, parentId); 
    const commentInput = document.getElementById('comment-text');

    if (commentInput) {
        commentInput.value = `@${username} `;
        commentInput.dataset.parentId = parentId;
        commentInput.focus();
        commentInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        console.error("Hata: 'comment-text' ID'li kutu bulunamadı!");
    }
};

window.updateServings = (change) => {
    const servingsElement = document.getElementById('current-servings');
    if (!servingsElement) return;

    let current = parseInt(servingsElement.innerText);
    let newPortion = current + change;

    if (newPortion < 1) return; 
    servingsElement.innerText = newPortion;

    // Blog sayfasındaki tüm '.ingredient-amount' sınıflarını günceller
    document.querySelectorAll('.ingredient-amount').forEach(span => {
        const baseAmount = parseFloat(span.dataset.baseAmount);
        const originalServings = parseInt(span.dataset.originalServings);

        const calculated = (baseAmount / originalServings) * newPortion;
        span.innerText = Number.isInteger(calculated) ? calculated : calculated.toFixed(1);
    });
};
/**
 * 10. SOSYAL MEDYA PAYLAŞIM MOTORU (WhatsApp & Pinterest)
 */
export function setupSocialSharing() {
    // 1. Bulunulan sayfanın linkini ve başlığını güvenli formatta al
    const currentUrl = encodeURIComponent(window.location.href);
    const pageTitle = encodeURIComponent(document.title);
    const shareText = encodeURIComponent("Harika bir tarif buldum, mutlaka bakmalısın! 🍰: ");

    // 2. WhatsApp Butonunu Güncelle
    const waBtn = document.getElementById('share-wa');
    if (waBtn) {
        // Hem mesajı hem sayfa linkini yan yana koyar
        waBtn.href = `https://api.whatsapp.com/send?text=${shareText}${currentUrl}`;
    }

    // 3. Pinterest Butonunu Güncelle
    const pinBtn = document.getElementById('share-pin');
    if (pinBtn) {
        // Sayfadaki ana tarif resmini bulmaya çalışır, yoksa boş döner
        const mainImg = document.getElementById('main-recipe-img')?.src || '';
        const encodedImg = encodeURIComponent(mainImg);

        pinBtn.href = `https://www.pinterest.com/pin/create/button/?url=${currentUrl}&media=${encodedImg}&description=${pageTitle}`;
    }
}

// Sayfa yüklendiğinde otomatik çalışması için tetikleyici ekleyelim
document.addEventListener('DOMContentLoaded', setupSocialSharing);