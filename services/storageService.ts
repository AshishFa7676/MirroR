
export const StorageService = {
  dbName: 'MIRROR_REGISTRY',
  version: 3,

  async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);
      
      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains('logs')) db.createObjectStore('logs', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('tasks')) db.createObjectStore('tasks', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('journals')) db.createObjectStore('journals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('profile')) db.createObjectStore('profile', { keyPath: 'id' }); 
        if (!db.objectStoreNames.contains('pomodoro')) db.createObjectStore('pomodoro', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('reflections')) db.createObjectStore('reflections', { keyPath: 'id' });
      };
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Optimized for bulk rewrites (tasks, profile)
  async save(storeName: string, data: any) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      try {
        if (Array.isArray(data)) {
          store.clear(); 
          data.forEach(item => store.put(item));
        } else {
          store.put(data);
        }
      } catch (e) {
        reject(e);
      }

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Optimized for single appends (logs, journals) - O(1) vs O(N)
  async add(storeName: string, item: any) {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async saveItem(storeName: string, item: any) {
    return this.add(storeName, item);
  },

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName: string, id: string): Promise<any> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  }
};
