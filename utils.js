// Модуль утилит
const Utils = {
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('ru-RU', options);
    },

    extractTagsFromText(text) {
        const tagRegex = /#([a-zA-Zа-яА-Я0-9_]+)/g;
        const tags = [];
        let match;
        while ((match = tagRegex.exec(text)) !== null) {
            if (Validator.validateTag(match[1])) {
                tags.push(match[1].toLowerCase());
            }
        }
        return [...new Set(tags)];
    },

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};
