// Основной модуль приложения
let notes = []; // Хранилище всех заметок в памяти
let currentFilter = ''; // Текущая поисковая строка
let currentTagFilter = ''; // Выбранный тег для фильтрации
let editingId = null; // ID редактируемой заметки

// Инициализации
document.addEventListener('DOMContentLoaded', () => {
    notes = Storage.load(); // Загрузка заметок из localStorage
    renderNotes(); // Первичная отрисовка списка
    updateStats(); // Обновление счётчиков статистики
    renderTagFilters(); // Отрисовка кнопок фильтрации по тегам
});

// Основные функции
function showMessage(text, type = 'success') {
    const msgEl = document.getElementById('message'); // Поиск DOM-элемента для сообщений
    msgEl.textContent = text; // Вставка текста сообщения
    msgEl.className = `message ${type} show`; // Назначение CSS-классов

    setTimeout(() => { // Автоскрытие через 3 секунды
        msgEl.classList.remove('show'); // Удаление класса, запускающего анимацию исчезновения
    }, 3000);
}

function saveNote() { // Сохранение заметки
    // Получение ссылок на поля формы
    const titleInput = document.getElementById('noteTitle');
    const contentInput = document.getElementById('noteContent');
    const tagsInput = document.getElementById('noteTags');

    const title = titleInput.value.trim(); // Удаление пробелов по краям заголовка
    const content = contentInput.value.trim();  // Удаление пробелов по краям содержимого
    const manualTags = tagsInput.value  // Парсинг строки тегов в массив
        .split(',') // Разбивка по запятым
        .map(t => t.trim().toLowerCase()) // Очистка пробелов + нижний регистр
        .filter(t => t.length > 0 && Validator.validateTag(t)); // Отсев пустых и невалидных

// Валидация заголовка и содержимого
    const validation = Validator.validateNote(title, content);
    if (!validation.isValid) { // Вывод списка ошибок валидации
        showMessage(validation.errors.join('. '), 'error');
        return; // Прерывание — данные не сохраняются
    }

    const textTags = Utils.extractTagsFromText(content); // Извлечение автотегов из текста
    const allTags = [...new Set([...manualTags, ...textTags])]; // Объединение ручных и автотегов без дубликатов

    if (editingId) {
        const index = notes.findIndex(n => n.id === editingId);
        if (index !== -1) { // Поиск индекса редактируемой заметки
            notes[index] = { // Обновление полей заметки
                ...notes[index],
                title,
                content,
                tags: allTags,
                updatedAt: new Date().toISOString() // Фиксация времени изменения
            };
            showMessage('Заметка успешно обновлена!'); // Уведомление об успешном обновлении
        }
    } else {
        const newNote = { // Формирование объекта новой заметки
            id: Utils.generateId(), // Генерация уникального ID
            title,
            content,
            tags: allTags,
            createdAt: new Date().toISOString(), // Фиксация времени создания
            updatedAt: new Date().toISOString() // Совпадает с createdAt при создании
        };
        notes.unshift(newNote); // Добавление в начало массива
        showMessage('Заметка успешно создана!'); // Уведомление об успешном создании
    }

    Storage.save(notes); // Запись массива заметок в localStorage
    resetForm(); // Сброс формы в исходное состояние
    renderNotes(); // Перерисовка списка заметок
    updateStats(); // Обновление панели статистики
    renderTagFilters(); // Перерисовка кнопок фильтрации по тегам
}

function deleteNote(id) { // Удаление заметки с подтверждением
    if (!confirm('Вы уверены, что хотите удалить эту заметку?')) { // Диалог подтверждения удаления
        return; // Отмена удаления пользователем
    }

    notes = notes.filter(n => n.id !== id); // Фильтрация массива — исключение заметки с указанным ID
    Storage.save(notes); // Сохранение обновлённого массива в localStorage

    if (editingId === id) { // Если удалена редактируемая заметка — сброс формы
        resetForm();
    }

    renderNotes(); // Перерисовка списка
    updateStats(); // Обновление статистики
    renderTagFilters(); // Обновление фильтров по тегам
    showMessage('Заметка удалена'); // Уведомление об удалении
}

function editNote(id) { // Переход в режим редактирования заметки
    const note = notes.find(n => n.id === id); // Поиск заметки по ID
    if (!note) return; // Защита от отсутствия заметки

    document.getElementById('noteTitle').value = note.title; // Заполнение поля заголовка
    document.getElementById('noteContent').value = note.content; // Заполнение поля содержимого
    document.getElementById('noteTags').value = note.tags.join(', '); // Заполнение поля тегов (массив -> строка через запятую)
    document.getElementById('formTitle').textContent = '\u270F\uFE0F Редактирование заметки'; // Смена заголовка формы

    editingId = id; // Фиксация ID редактируемой заметки

    document.getElementById('noteForm').scrollIntoView({ behavior: 'smooth' }); // Плавная прокрутка к форме
    document.getElementById('noteForm').classList.add('active'); // Визуальная подсветка формы
}

function resetForm() { // Сброс формы в режим создания новой заметки
    document.getElementById('noteTitle').value = ''; // Очистка поля заголовка
    document.getElementById('noteContent').value = ''; // Очистка поля содержимого
    document.getElementById('noteTags').value = ''; // Очистка поля тегов
    document.getElementById('formTitle').textContent = 'Новая заметка'; // Возврат исходного заголовка формы
    document.getElementById('noteForm').classList.remove('active'); // Убирает визуальную подсветку формы
    editingId = null; // Сброс ID редактирования (переход в режим создания)
}

// Рендеринг
function renderNotes() { // Отрисовка списка заметок с учётом фильтров
    const container = document.getElementById('notesList'); // Ссылка на DOM-контейнер для заметок
    let filteredNotes = [...notes]; // Копия массива для безопасной фильтрации

    if (currentFilter) { // Фильтр по поисковому запросу
        const searchLower = currentFilter.toLowerCase(); // Приведение запроса к нижнему регистру
        filteredNotes = filteredNotes.filter(note => // Поиск вхождений в заголовке, содержимом и тегах
            note.title.toLowerCase().includes(searchLower) ||
            note.content.toLowerCase().includes(searchLower) ||
            note.tags.some(tag => tag.includes(searchLower)) // Проверка каждого тега
        );
    }

    if (currentTagFilter) { // Фильтр по активному тегу
        filteredNotes = filteredNotes.filter(note => // Отбор заметок, содержащих выбранный тег
            note.tags.includes(currentTagFilter)
        );
    }

    filteredNotes.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); // Сортировка по дате создания (новые сверху)

    if (filteredNotes.length === 0) { // Пустое состояние
        // Отображение заглушки при отсутствии результатов
        container.innerHTML = ` 
            <div class="empty-state">
                <h3>Ничего не найдено</h3>
                <p>Попробуйте изменить параметры поиска или создать новую заметку</p>
            </div>
        `;
        return; // Выход — заметок для отрисовки нет
    }

    container.innerHTML = filteredNotes.map(note => { // Генерация HTML-строки для карточек
        const highlightedContent = highlightSearch(note.content, currentFilter); // Подсветка совпадений в содержимом
        const highlightedTitle = highlightSearch(note.title, currentFilter); // Подсветка совпадений в заголовке

        // Возврат HTML-разметки одной карточки
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
    }).join(''); // Склейка массива строк в единую HTML-строку
}

function highlightSearch(text, query) { // Подсветка найденных фрагментов текста
    if (!query) return Utils.escapeHtml(text); // Если запрос пуст — возврат экранированного текста без подсветки

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // Экранирование спецсимволов регулярных выражений в запросе
    const regex = new RegExp(`(${escapedQuery})`, 'gi'); // Создание регистронезависимого регулярного выражения
    return Utils.escapeHtml(text).replace(regex, '<span class="highlight">$1</span>'); // Оборачивание найденных совпадений в <span class="highlight">
}

function renderTagFilters() { // Отрисовка кнопок фильтрации по тегам
    const container = document.getElementById('tagFilter'); // Ссылка на контейнер фильтров
    const allTags = [...new Set(notes.flatMap(n => n.tags))].sort(); // Сбор уникальных тегов из всех заметок + сортировка

    // Начало HTML: подпись и кнопка «Все»
    let html = `
        <span style="color: #6c757d; font-weight: 600;">Фильтр по тегам:</span>
        <button class="tag-btn ${currentTagFilter === '' ? 'active' : ''}" onclick="filterByTag('')">Все</button>
    `;

    allTags.forEach(tag => { // Генерация кнопки для каждого уникального тега
        html += `
            <button class="tag-btn ${currentTagFilter === tag ? 'active' : ''}"
                    onclick="filterByTag('${tag}')">
                #${tag}
            </button>
        `;
    });

    container.innerHTML = html; // Вставка сгенерированного HTML в контейнер
}

// Фильтрация и поиск
function filterNotes() { // Обработчик ввода в поле поиска
    currentFilter = document.getElementById('searchInput').value.trim(); // Обновление текущей поисковой строки
    renderNotes(); // Перерисовка списка с новым фильтром
}

function filterByTag(tag) { // Установка фильтра по тегу
    currentTagFilter = tag; // Фиксация выбранного тега
    renderNotes(); // Перерисовка списка заметок
    renderTagFilters(); // Перерисовка панели фильтров
}

// Статистика
function updateStats() { // Обновление трёх метрик в панели статистики
    document.getElementById('totalNotes').textContent = notes.length; // Метрика 1: Общее количество заметок

    const allTags = new Set(notes.flatMap(n => n.tags)); // Метрика 2: Количество уникальных тегов
    document.getElementById('totalTags').textContent = allTags.size; // Сбор всех тегов + удаление дубликатов

    const weekAgo = new Date(); // Метрика 3: Заметки за последние 7 дней
    weekAgo.setDate(weekAgo.getDate() - 7); // Вычисление даты недельной давности
    const recentCount = notes.filter(n => new Date(n.createdAt) > weekAgo).length; 
    document.getElementById('recentNotes').textContent = recentCount; 
}

// Обработка ошибок
window.onerror = function(msg, url, line) { // Перехват необработанных исключений JavaScript
    console.error(`Ошибка: ${msg} в ${url}:${line}`); // Вывод ошибки в консоль для отладки
    showMessage('Произошла непредвиденная ошибка. Пожалуйста, обновите страницу.', 'error'); // Показ пользователю сообщения о сбое
    return true; // Подавление стандартного диалога браузера
};

try { // Проверка доступности localStorage
    localStorage.setItem('test', 'test'); // Пробная запись
    localStorage.removeItem('test'); // Очистка пробного ключа
} catch (e) {
    showMessage('Внимание: локальное хранилище недоступно. Данные не будут сохраняться между сессиями.', 'error'); // Хранилище недоступно — предупреждение пользователя
}
