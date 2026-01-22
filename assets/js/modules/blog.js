export function setupBlogPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    // Sadece ID varsa işlem yap, yoksa sessiz kal 
    if (recipeId) {
        loadRecipeDetail(recipeId);
        loadComments(recipeId);
    }
}

async function loadRecipeDetail(id) {
    try {
        const res = await fetch(`/api/recipe-details/${id}`);
        const recipe = await res.json();

        // HTML elementlerini doldur
        document.getElementById('main-recipe-img').src = recipe.image_url || '../assets/images/default-cake.jpg';
        document.getElementById('recipe-title').innerText = recipe.title;
        document.getElementById('prep-time').innerText = recipe.prep_time || "30";
        document.getElementById('recipe-author').innerText = recipe.username || "Sweet Lab Şefi";

        // Malzemeleri parçalayarak liste yap (Satır başlarına göre)
        const ingredientsList = document.getElementById('ingredients-list');
        ingredientsList.innerHTML = recipe.ingredients.split('\n').map(item =>
            `<li><i class="fas fa-check text-pink me-2"></i> ${item}</li>`
        ).join('');

        document.getElementById('instructions-text').innerText = recipe.description;
    } catch (err) {
        console.error("Tarif yükleme hatası:", err);
    }
}

export async function loadComments(recipeId) {
    try {
        const res = await fetch(`/api/comments/${recipeId}`);
        const comments = await res.json();

        const container = document.getElementById('comments-container');
        document.getElementById('comment-count').innerText = comments.length;

        if (comments.length === 0) {
            container.innerHTML = `<p class="text-muted text-center py-4">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>`;
            return;
        }

        container.innerHTML = comments.map(c => `
            <div class="comment mb-4 pb-3 border-bottom reveal">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h6 class="fw-bold mb-0" style="color: #C76B86;">${c.username}</h6>
                    <small class="text-muted" style="font-size: 0.75rem;">
                        <i class="far fa-clock me-1"></i> ${new Date(c.created_at).toLocaleDateString('tr-TR')}
                    </small>
                </div>
                <p class="text-secondary mb-2" style="font-size: 0.95rem;">${c.comment}</p>
                <button class="btn btn-sm text-pink p-0 fw-bold" onclick="window.replyTo('${c.username}', ${c.id})" style="font-size: 0.8rem;">
                    <i class="fas fa-reply me-1"></i> Yanıtla
                </button>
            </div>
        `).join('');
    } catch (err) {
        console.error("Yorum yükleme hatası:", err);
    }
}

// Global Yorum Yapma Fonksiyonu
window.postComment = async function () {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');

    // 1. Kendi ID'ne (comment-input) göre kutuyu alıyoruz
    const commentInput = document.getElementById('comment-text');
    const comment = commentInput.value.trim();

    // 2. Yanıtla'ya basıldıysa hafızadaki parentId'yi alıyoruz
    const parentId = commentInput.dataset.parentId || null;

    if (!comment) {
        Swal.fire('Uyarı', 'Lütfen bir yorum yazın.', 'warning');
        return;
    }

    try {
        const res = await fetch('/api/add-comment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                recipe_id: recipeId,
                comment: comment,
                parent_id: parentId 
            })
        });
        const data = await res.json();

        if (data.success) {
            commentInput.value = "";

            // 3. İşlem bitince yanıt hafızasını temizliyoruz
            delete commentInput.dataset.parentId;

            loadComments(recipeId); // Yorumları güncelle
            Swal.fire({ icon: 'success', title: 'Yorumun Paylaşıldı!', timer: 1500, showConfirmButton: false });
        } else {
            Swal.fire('Hata', 'Yorum yapabilmek için giriş yapmalısın.', 'error');
        }
    } catch (err) {
        console.error("Yorum gönderme hatası:", err);
    }
};