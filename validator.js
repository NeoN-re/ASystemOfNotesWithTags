// ==================== МОДУЛЬ ВАЛИДАЦИИ ====================
const Validator = {
    validateTag(tag) {
        return /^[a-zA-Zа-яА-Я0-9_]+$/.test(tag);
    },

    validateNote(title, content) {
        const errors = [];

        if (!title || title.trim().length === 0) {
            errors.push('Заголовок обязателен для заполнения');
        } else if (title.trim().length < 2) {
            errors.push('Заголовок должен содержать минимум 2 символа');
        }

        if (!content || content.trim().length === 0) {
            errors.push('Содержание обязательно для заполнения');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};
