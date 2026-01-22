export function setupChatbot() {
    const chatWindow = document.getElementById('chatWindow');
    const toggleBtns = document.querySelectorAll('.chat-toggle, .btn-outline-danger, .btn-sweet-search'); 
    const closeBtn = document.querySelector('.chat-header .fa-times');
    const sendBtn = document.querySelector('.chat-input button');
    const inputField = document.getElementById('userMsg');
    const chatBody = document.getElementById('chatBody');

    if (!chatWindow) return;

    // 1. Açma/Kapama Fonksiyonu 
    const toggleChat = () => {
        if (chatWindow.style.display === 'flex') {
            chatWindow.style.display = 'none';
        } else {
            chatWindow.style.display = 'flex';
            // Açılınca input'a odaklansın
            if(inputField) inputField.focus();
        }
    };

    // Tüm açma/kapama butonlarına topluca dinleyici ekliyoruz
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChat();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChat();
        });
    }

    const appendMessage = (text, sender, isHtml = false) => {
        if(!chatBody) return;
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', sender);
        
        if (isHtml) {
            msgDiv.innerHTML = text; // Linkler çalışsın diye
        } else {
            msgDiv.innerText = text; // Güvenlik için düz metin
        }
        
        chatBody.appendChild(msgDiv);
        chatBody.scrollTop = chatBody.scrollHeight;
    };

    // 3. AI ile Mesaj Gönderme Fonksiyonu 
    const sendMessage = async () => {
        const text = inputField.value.trim();
        if (text === "") return;

        // Kullanıcının mesajını ekle
        appendMessage(text, 'user');
        inputField.value = "";

        // Yükleniyor efekti ekle
        const loadingDiv = document.createElement('div');
        loadingDiv.classList.add('message', 'bot');
        loadingDiv.innerText = 'Tarif defterime bakıyorum... 📖';
        chatBody.appendChild(loadingDiv);
        chatBody.scrollTop = chatBody.scrollHeight;

        try {
            // Backend'e sor (API İsteği)
            const res = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text })
            });

            const data = await res.json();
            
            // Yükleniyor yazısını kaldır
            loadingDiv.remove();

            // AI Cevabını İşle ve Linkleri Oluştur
            let aiText = data.reply;
            
            // Regex ile ID'yi yakalayıp linke çevirme 
            aiText = aiText.replace(/\(ID:\s*(\d+)\)/gi, ' <a href="blog.html?id=$1" style="color:#C76B86; font-weight:bold; text-decoration:underline;">(Tarife Git ➡️)</a>');

            // Cevabı ekrana bas
            appendMessage(aiText, 'bot', true);

        } catch (err) {
            console.error(err);
            loadingDiv.remove();
            appendMessage("Şu an fırınım çok sıcak, bağlantı kuramadım. Birazdan dener misin? 🍰", 'bot');
        }
    };

    // Event Listenerlar 
    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (inputField) inputField.addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') sendMessage(); 
    });
}