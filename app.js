// ==================== ОСНОВНОЙ МОДУЛЬ ПРИЛОЖЕНИЯ ====================
let notes = [];
let currentFilter = '';
let currentTagFilter = '';
let editingId = null;

// ==================== ИНИЦИАЛИЗАЦИЯ ====================
document.addEventListener('DOMContentLoaded', () => {
    notes = Storage.load();
    renderNotes();
    updateStats();
    renderTagFilters();
});

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================
function showMessage(text, type = 'success') {
    const msgEl = document.getElementById('message');
    msgEl.textContent = text;
    msgEl.className = `message ${type} show`;

    setTimeout(() => {
        msgEl.classList.remove('show');
    }, 3000);
}

function saveNote() {
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const tagsInput = document.getElementById('noteTags');

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();
    const manualTags = tagsInput.value
        .split(',')
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length > 0 && Validator.validateTag(t));

    const validation = Validator.validateNote(title, content);
    if (!validation.isValid) {
        showMessage(validation.errors.join('. '), 'error');
        return;
    }

    const textTags = Utils.extractTagsFromText(content);
    const allTags = [...new Set([...manualTags, ...textTags])];

    if (editingId) {
        const index = notes.findIndex(n => n.id === editingId);
        if (index !== -1) {
            notes[index] = {
                ...notes[index],
                title,
                content,
                tags: allTags,
                updatedAt: new Date().toISOString()
            };
            showMessage('Заметка успешно обновлена!');
        }
    } else {
        const newNote = {
            id: Utils.generateId(),
            title,
            content,
            tags: allTags,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        notes.unshift(newNote);
        showMessage('Заметка успешно создана!');
    }

    Storage.save(notes);
    resetForm();
    renderNotes();
    updateStats();
    renderTagFilters();
}

function deleteNote(id) {
    if (!confirm('Вы уверены, что хотите удалить эту заметку?')) {
        return;
    }

    notes = notes.filter(n => n.id !== id);
    Storage.save(notes);

    if (editingId === id) {
        resetForm();
    }

    renderNotes();
    updateStats();
    renderTagFilters();
    showMessage('Заметка удалена');
}

function editNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    document.getElementById('noteTitle').value = note.title;
    document.getElementById('noteContent').value = note.content;
    document.getElementById('noteTags').value = note.tags.join(', ');
    document.getElementById('formTitle').textContent = '\u270F\uFE0F Редактирование заметки';

    editingId = id;

    document.getElementById('noteForm').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('noteForm').classList.add('active');
}

function resetForm() {
    document.getElementById('noteTitle').value = '';
    document.getElementById('noteContent').value = '';
    document.getElementById('noteTags').value = '';
    document.getElementById('formTitle').textContent = '\u2728 Новая заметка';
    document.getElementById('noteForm').classList.remove('active');
    editingId = null;
}

// ==================== РЕНДЕРИНГ ====================
function renderNotes() {
    const container = document.getElementById('notesList');
    let filteredNotes = [...notes];

    if (currentFilter) {
        const searchLower = currentFilter.toLowerCase();
        filteredNotes = filteredNotes.filter(note =>
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.tags.some(tag => tag.includes(searchLower))
        );
    }

    if (currentTagFilter) {
        filteredNotes = filteredNotes.filter(note =>
            note.tags.includes(currentTagFilter)
        );
    }

    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (filteredNotes.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска или создать новую заметку</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredNotes.map(note => {
        const highlightedContent = highlightSearch(note.content, currentFilter);
        const highlightedTitle = highlightSearch(note.title, currentFilter);

        return `
            <div class="note-card">
                <div class="note-header">
                    <div>
                        <div class="note-title">${highlightedTitle}</div>
                        <div class="note-date">
                            ${Utils.formatDate(note.createdAt)}
                            ${note.updatedAt !== note.createdAt ? ' (изменено)' : ''}
                        </div>
                    </div>
                    <div class="note-actions">
                        <button class="icon-btn edit" onclick="editNote('${note.id}')" title="Редактировать">
                            \u270F\uFE0F
                        </button>
                        <button class="icon-btn delete" onclick="deleteNote('${note.id}')" title="Удалить">
                            \uD83D\uDDD1\uFE0F
                        </button>
                    </div>
                </div>
                <div class="note-content">${highlightedContent}</div>
                ${note.tags.length > 0 ? `
                    <div class="note-tags">
                        ${note.tags.map(tag =>
                            `<span class="tag" onclick="filterByTag('${tag}')">${tag}</span>`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

function highlightSearch(text, query) {
    if (!query) return Utils.escapeHtml(text);

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedQuery})`, 'gi');
    return Utils.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>');
}

function renderTagFilters() {
    const container = document.getElementById('tagFilter');
    const allTags = [...new Set(notes.flatMap(n => n.tags))].sort();

    let html = `
        <span style="color: #6c757d; font-weight: 600;">Фильтр по тегам:</span>
        <button class="tag-btn ${currentTagFilter === '' ? 'active' : ''}" onclick="filterByTag('')">Все</button>
    `;

    allTags.forEach(tag => {
        html += `
            <button class="tag-btn ${currentTagFilter === tag ? 'active' : ''}"
                    onclick="filterByTag('${tag}')">
                #${tag}
            </button>
        `;
    });

    container.innerHTML = html;
}

// ==================== ФИЛЬТРАЦИЯ И ПОИСК ====================
function filterNotes() {
    currentFilter = document.getElementById('searchInput').value.trim();
    renderNotes();
}

function filterByTag(tag) {
    currentTagFilter = tag;
    renderNotes();
    renderTagFilters();
}

// ==================== СТАТИСТИКА ====================
function updateStats() {
    document.getElementById('totalNotes').textContent = notes.length;

    const allTags = new Set(notes.flatMap(n => n.tags));
    document.getElementById('totalTags').textContent = allTags.size;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentCount = notes.filter(n => new Date(n.createdAt) > weekAgo).length;
    document.getElementById('recentNotes').textContent = recentCount;
}

// ==================== ОБРАБОТКА ОШИБОК ====================
window.onerror = function(msg, url, line) {
    console.error(`Ошибка: ${msg} в ${url}:${line}`);
    showMessage('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.', 'error');
    return true;
};

try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
} catch (e) {
    showMessage('Внимание: локальное хранилище недоступно. Данные не будут сохраняться между сессиями.', 'error');
}
