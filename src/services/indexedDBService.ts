import { Activity } from '../types/Activity';

const DB_NAME = 'concerti-mappa-db';
const DB_VERSION = 1;
const STORE_NAME = 'attivita';

// Inizializza il database
export const initDB = (): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject(false);
    };

    request.onsuccess = () => {
      console.log('Database aperto con successo');
      resolve(true);
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Crea l'object store se non esiste
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Crea indici utili
        objectStore.createIndex('categoria', 'categoria', { unique: false });
        objectStore.createIndex('data', 'data', { unique: false });
        
        console.log('Object store creato');
      }
    };
  });
};

// Ottieni tutte le attività
export const getAllActivities = (): Promise<Activity[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject([]);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const getRequest = objectStore.getAll();

      getRequest.onsuccess = () => {
        resolve(getRequest.result as Activity[]);
      };

      getRequest.onerror = () => {
        reject([]);
      };
    };
  });
};

// Aggiungi una nuova attività
export const addActivity = (activity: Activity): Promise<Activity> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject(null);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const addRequest = objectStore.add(activity);

      addRequest.onsuccess = () => {
        resolve(activity);
      };

      addRequest.onerror = (event) => {
        console.error('Errore durante l\'aggiunta dell\'attività:', event);
        reject(null);
      };
    };
  });
};

// Aggiorna un'attività esistente
export const updateActivity = (activity: Activity): Promise<Activity> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject(null);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const putRequest = objectStore.put(activity);

      putRequest.onsuccess = () => {
        resolve(activity);
      };

      putRequest.onerror = (event) => {
        console.error('Errore durante l\'aggiornamento dell\'attività:', event);
        reject(null);
      };
    };
  });
};

// Elimina un'attività
export const deleteActivity = (id: string): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject(false);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const deleteRequest = objectStore.delete(id);

      deleteRequest.onsuccess = () => {
        resolve(true);
      };

      deleteRequest.onerror = (event) => {
        console.error('Errore durante l\'eliminazione dell\'attività:', event);
        reject(false);
      };
    };
  });
};

// Carica dati iniziali se il database è vuoto
export const caricaDatiIniziali = async (datiIniziali: Activity[]): Promise<void> => {
  try {
    const attivitaEsistenti = await getAllActivities();
    
    // Se non ci sono attività, carica i dati iniziali
    if (attivitaEsistenti.length === 0) {
      const promises = datiIniziali.map(attivita => addActivity(attivita));
      await Promise.all(promises);
      console.log('Dati iniziali caricati con successo');
    }
  } catch (error) {
    console.error('Errore durante il caricamento dei dati iniziali:', error);
  }
};

// Ottieni attività filtrate per categoria
export const getActivitiesByCategory = (categoria: string): Promise<Activity[]> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error('Errore durante l\'apertura del database:', event);
      reject([]);
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index('categoria');
      const getRequest = index.getAll(categoria);

      getRequest.onsuccess = () => {
        resolve(getRequest.result as Activity[]);
      };

      getRequest.onerror = () => {
        reject([]);
      };
    };
  });
};
