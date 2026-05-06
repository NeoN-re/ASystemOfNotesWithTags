// Модуль хранения
const Storage = {
    STORAGE_KEY: 'notes_app_data',

    load() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Ошибка загрузки данных:', e);
            return [];
        }
    },

    save(notes) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
            return true;
        } catch (e) {
            console.error('Ошибка сохранения данных:', e);
            showMessage('Ошибка сохранения: возможно, превышен лимит хранилища', 'error');
            return false;
        }
    }
};
