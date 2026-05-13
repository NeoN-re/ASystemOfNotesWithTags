// Модуль утилит
const Utils = {
    generateId() { // Генерация уникального идентификатора для заметки
        return Date.now().toString(36) + Math.random().toString(36).substr(2); // Временная метка в 36-ричной системе + случайная строка
    },

    formatDate(dateString) { // Форматирование даты в читаемый вид (русская локаль)
        const date = new Date(dateString); // Парсинг строки в объект Date
        const options = { // Настройки отображения даты
            year: 'numeric', // Год: 2026
            month: 'long', // Месяц: май
            day: 'numeric', // День: 13
            hour: '2-digit', // Часы: 14
            minute: '2-digit' // Минуты: 05
        };
        return date.toLocaleDateString('ru-RU', options); // Форматирование под русскую локаль
    },

    extractTagsFromText(text) { // Извлечение тегов из текста (слова, начинающиеся с #)
        const tagRegex = /#([a-zA-Zа-яА-Я0-9_]+)/g; // Регулярка: ищет #буквы_цифры_подчёркивание
        const tags = [];  // Массив для найденных тегов
        let match; // Переменная для хранения результата поиска
        while ((match = tagRegex.exec(text)) !== null) { // Цикл по всем совпадениям регулярки в тексте
            if (Validator.validateTag(match[1])) { // Проверка тега на валидность
                tags.push(match[1].toLowerCase()); // Добавление тега в нижнем регистре
            }
        }
        return [...new Set(tags)]; // Удаление дубликатов через Set
    },

    escapeHtml(text) { // Экранирование HTML-символов (защита от XSS)
        const div = document.createElement('div'); // Создание временного div-элемента
        div.textContent = text; // Вставка текста как textContent (безопасно)
        return div.innerHTML; // Получение экранированного HTML
    }
};
