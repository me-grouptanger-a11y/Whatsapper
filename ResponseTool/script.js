document.addEventListener('DOMContentLoaded', async () => {
    // UI Elements
    const categoryContainer = document.getElementById('categoryContainer');
    const cardsContainer = document.getElementById('cardsContainer');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const resultsCount = document.getElementById('resultsCount');
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toastMsg');

    // Auth & Admin Elements
    const adminBtn = document.getElementById('adminBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const adminModal = document.getElementById('adminModal');
    const editModal = document.getElementById('editModal');
    const adminTableBody = document.querySelector('#adminTable tbody');
    const addResponseBtn = document.getElementById('addResponseBtn');
    const editForm = document.getElementById('editForm');
    const editIdInput = document.getElementById('editId');
    const editSubmitBtn = document.getElementById('editSubmitBtn');

    // Close buttons binding
    document.querySelectorAll('.close-modal, .close-login-modal, .close-edit-modal').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.currentTarget.closest('.modal').classList.remove('open');
        });
    });

    let responsesData = [];
    let currentCategory = 'all';
    let currentSearchTerm = '';
    let session = null;
    let supabase = null;

    // Initialization
    async function initApp() {
        if (!window.SUPABASE_URL || !window.SUPABASE_ANON_KEY || window.SUPABASE_URL === "VOTRE_URL_SUPABASE_ICI") {
            resultsCount.innerHTML = `<span style="color:#E53E3E"><i class="ph ph-warning-circle"></i> Supabase non configuré. Veuillez éditer config.js</span>`;
            return;
        }
        
        supabase = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);

        // Get initial auth state
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        session = currentSession;
        updateAuthUI();

        // Listen for auth changes
        supabase.auth.onAuthStateChange((_event, newSession) => {
            session = newSession;
            updateAuthUI();
        });

        await fetchResponses();
    }

    function updateAuthUI() {
        if (session) {
            logoutBtn.style.display = 'flex';
            adminBtn.innerHTML = '<i class="ph ph-gear"></i> Administration';
        } else {
            logoutBtn.style.display = 'none';
            adminBtn.innerHTML = '<i class="ph ph-lock-key"></i> Connexion Admin';
            adminModal.classList.remove('open');
            editModal.classList.remove('open');
        }
    }

    // --- DB OPERATIONS ---

    async function fetchResponses() {
        try {
            const { data, error } = await supabase
                .from('responses')
                .select('*')
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            responsesData = data || [];
            renderCategories();
            filterAndRender();
        } catch (e) {
            console.error("Erreur de db:", e);
            resultsCount.textContent = "Erreur lors du chargement des réponses depuis Supabase.";
        }
    }

    // --- MAIN UI LOGIC ---

    function renderCategories() {
        const categories = [...new Set(responsesData.map(item => item.category))].sort();
        const allBtn = categoryContainer.firstElementChild;
        categoryContainer.innerHTML = '';
        categoryContainer.appendChild(allBtn);

        categories.forEach(category => {
            const btn = document.createElement('button');
            btn.className = `category-btn ${currentCategory === category ? 'active' : ''}`;
            btn.dataset.category = category;
            
            let iconHtml = '<i class="ph ph-folder"></i>';
            if(category.toLowerCase().includes('paiement') || category.toLowerCase().includes('monnaie')) iconHtml = '<i class="ph ph-credit-card"></i>';
            if(category.toLowerCase().includes('contact')) iconHtml = '<i class="ph ph-hand-waving"></i>';
            if(category.toLowerCase().includes('info')) iconHtml = '<i class="ph ph-info"></i>';
            if(category.toLowerCase().includes('technique') || category.toLowerCase().includes('diagnostic')) iconHtml = '<i class="ph ph-wrench"></i>';
            if(category.toLowerCase().includes('conclusion')) iconHtml = '<i class="ph ph-check-square"></i>';
            if(category.toLowerCase().includes('photo') || category.toLowerCase().includes('ants')) iconHtml = '<i class="ph ph-identification-card"></i>';
            if(category.toLowerCase().includes('remboursement')) iconHtml = '<i class="ph ph-money"></i>';

            btn.innerHTML = `${iconHtml} <span>${category}</span>`;
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = category;
                filterAndRender();
            });
            categoryContainer.appendChild(btn);
        });

        allBtn.className = `category-btn ${currentCategory === 'all' ? 'active' : ''}`;
        allBtn.addEventListener('click', (e) => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            currentCategory = 'all';
            filterAndRender();
        });
    }

    searchInput.addEventListener('input', (e) => {
        currentSearchTerm = e.target.value.toLowerCase().trim();
        clearSearchBtn.style.display = currentSearchTerm ? 'flex' : 'none';
        filterAndRender();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        currentSearchTerm = '';
        clearSearchBtn.style.display = 'none';
        searchInput.focus();
        filterAndRender();
    });

    function filterAndRender() {
        const filtered = responsesData.filter(item => {
            const matchesCategory = currentCategory === 'all' || item.category === currentCategory;
            const kw = Array.isArray(item.keywords) ? item.keywords.join(' ') : (item.keywords || '');
            const searchableText = `${item.title} ${item.content} ${kw}`.toLowerCase();
            const matchesSearch = currentSearchTerm === '' || searchableText.includes(currentSearchTerm);
            return matchesCategory && matchesSearch;
        });

        resultsCount.textContent = `${filtered.length} réponse${filtered.length > 1 ? 's' : ''} trouvée${filtered.length > 1 ? 's' : ''}`;
        cardsContainer.innerHTML = '';

        if (filtered.length === 0) {
            cardsContainer.innerHTML = `
                <div class="no-results">
                    <i class="ph ph-magnifying-glass-minus"></i>
                    <p>Aucune réponse trouvée pour cette recherche.</p>
                </div>
            `;
            return;
        }

        filtered.forEach(item => {
            const card = document.createElement('div');
            card.className = 'response-card';
            const formattedContent = item.content.replace(/\n/g, '<br>');

            card.innerHTML = `
                <div class="card-header">
                    <span class="card-category">${item.category}</span>
                </div>
                <h3 class="card-title">${item.title}</h3>
                <div class="card-content">
                    ${formattedContent}
                </div>
                <div class="card-footer">
                    <button class="copy-btn" data-content="${encodeURIComponent(item.content)}">
                        <i class="ph ph-copy"></i>
                        Copier la réponse
                    </button>
                </div>
            `;
            cardsContainer.appendChild(card);
        });

        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const content = decodeURIComponent(e.currentTarget.dataset.content);
                try {
                    await navigator.clipboard.writeText(content);
                    showToast("Réponse copiée !");
                } catch(err) {
                    const textArea = document.createElement("textarea");
                    textArea.value = content;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand("copy");
                    textArea.remove();
                    showToast("Réponse copiée !");
                }
            });
        });
    }

    // --- AUTH UI ---

    adminBtn.addEventListener('click', () => {
        if (session) {
            renderAdminTable();
            adminModal.classList.add('open');
        } else {
            loginError.style.display = 'none';
            loginModal.classList.add('open');
        }
    });

    logoutBtn.addEventListener('click', async () => {
        await supabase.auth.signOut();
        showToast("Déconnexion réussie");
    });

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const submitBtn = document.getElementById('loginSubmitBtn');
        
        submitBtn.textContent = "Connexion...";
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        submitBtn.textContent = "Se connecter";

        if (error) {
            loginError.textContent = "Email ou mot de passe incorrect.";
            loginError.style.display = 'block';
        } else {
            loginModal.classList.remove('open');
            document.getElementById('loginForm').reset();
            showToast("Connexion réussie");
            renderAdminTable();
            adminModal.classList.add('open');
        }
    });

    // --- ADMIN CRUD LOGIC ---

    function renderAdminTable() {
        adminTableBody.innerHTML = '';
        responsesData.forEach((item) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><span class="card-category">${item.category}</span></td>
                <td><strong>${item.title}</strong></td>
                <td>
                    <button class="action-btn btn-edit" data-id="${item.id}"><i class="ph ph-pencil-simple"></i></button>
                    <button class="action-btn btn-delete" data-id="${item.id}"><i class="ph ph-trash"></i></button>
                </td>
            `;
            adminTableBody.appendChild(tr);
        });

        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', (e) => openEditForm(e.currentTarget.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm("Êtes-vous sûr de vouloir supprimer cette réponse de la base cloud ?")) {
                    const id = e.currentTarget.dataset.id;
                    const { error } = await supabase.from('responses').delete().eq('id', id);
                    if (error) {
                        alert("Erreur: Impossible de supprimer.");
                    } else {
                        showToast("Réponse supprimée");
                        await fetchResponses(); // refresh
                        renderAdminTable();
                    }
                }
            });
        });
    }

    addResponseBtn.addEventListener('click', () => {
        openEditForm(null);
    });

    function openEditForm(id) {
        const titleEl = document.getElementById('editModalTitle');
        const catInput = document.getElementById('editCategory');
        const titleInput = document.getElementById('editTitle');
        const kwInput = document.getElementById('editKeywords');
        const contentInput = document.getElementById('editContent');

        if (!id) {
            titleEl.textContent = "Ajouter dans le Cloud";
            editIdInput.value = "";
            catInput.value = "";
            titleInput.value = "";
            kwInput.value = "";
            contentInput.value = "";
        } else {
            titleEl.textContent = "Modifier dans le Cloud";
            const item = responsesData.find(r => r.id === id);
            editIdInput.value = item.id;
            catInput.value = item.category;
            titleInput.value = item.title;
            kwInput.value = Array.isArray(item.keywords) ? item.keywords.join(', ') : (item.keywords || '');
            contentInput.value = item.content;
        }

        editModal.classList.add('open');
    }

    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        editSubmitBtn.textContent = "Enregistrement...";
        editSubmitBtn.disabled = true;

        const id = editIdInput.value;
        const payload = {
            category: document.getElementById('editCategory').value.trim(),
            title: document.getElementById('editTitle').value.trim(),
            keywords: document.getElementById('editKeywords').value.split(',').map(k => k.trim()).filter(k=>k),
            content: document.getElementById('editContent').value.trim()
        };

        try {
            if (id === "") {
                const { error } = await supabase.from('responses').insert([payload]);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('responses').update(payload).eq('id', id);
                if (error) throw error;
            }
            showToast("Sauvegarde réussie dans le Cloud !");
            editModal.classList.remove('open');
            await fetchResponses();
            renderAdminTable();
        } catch (error) {
            console.error(error);
            alert("Erreur lors de l'enregistrement. Vérifiez vos permissions.");
        } finally {
            editSubmitBtn.textContent = "Enregistrer";
            editSubmitBtn.disabled = false;
        }
    });

    function showToast(msg) {
        toastMsg.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // Run
    initApp();
});
