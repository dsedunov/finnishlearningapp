// Audio cache utility using IndexedDB for persistent storage
class AudioCache {
    constructor() {
      this.dbName = 'FinnishLearningAudioCache';
      this.storeName = 'audioBlobs';
      this.version = 1;
      this.db = null;
    }
  
    // Initialize IndexedDB
    async init() {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(this.dbName, this.version);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          this.db = request.result;
          resolve();
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains(this.storeName)) {
            const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
      });
    }
  
    // Generate hash key from text
    async generateKey(text, speaker = 'Kore') {
      const encoder = new TextEncoder();
      const data = encoder.encode(`${text}-${speaker}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  
    // Check if audio exists in cache
    async get(text, speaker = 'Kore') {
      if (!this.db) await this.init();
      
      const key = await this.generateKey(text, speaker);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.get(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            console.log('🎵 Found cached audio for:', text.substring(0, 50) + '...');
            // Check if cache is still valid (e.g., 7 days)
            const isExpired = Date.now() - result.timestamp > 7 * 24 * 60 * 60 * 1000;
            if (isExpired) {
              console.log('⏰ Cached audio expired, will regenerate');
              this.delete(key);
              resolve(null);
            } else {
              resolve(result.audioBlob);
            }
          } else {
            resolve(null);
          }
        };
      });
    }
  
    // Store audio in cache
    async set(text, audioBlob, speaker = 'Kore') {
      if (!this.db) await this.init();
      
      const key = await this.generateKey(text, speaker);
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        
        const audioData = {
          id: key,
          text: text,
          speaker: speaker,
          audioBlob: audioBlob,
          timestamp: Date.now()
        };
        
        const request = store.put(audioData);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('💾 Cached audio for:', text.substring(0, 50) + '...');
          resolve();
        };
      });
    }
  
    // Delete specific cache entry
    async delete(key) {
      if (!this.db) await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.delete(key);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }
  
    // Clear all cache (for maintenance)
    async clear() {
      if (!this.db) await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          console.log('🗑️ Audio cache cleared');
          resolve();
        };
      });
    }
  
    // Get cache size and stats
    async getStats() {
      if (!this.db) await this.init();
      
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const results = request.result;
          const totalSize = results.reduce((sum, item) => sum + item.audioBlob.size, 0);
          resolve({
            count: results.length,
            totalSize: totalSize,
            totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
          });
        };
      });
    }
  }
  
  export const audioCache = new AudioCache();
  