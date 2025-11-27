import { useState, useEffect, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  maxEntries?: number; // Maximum number of entries (default: 10)
}

class OfferCache {
  private cache = new Map<string, CacheEntry<any>>();
  private options: Required<CacheOptions>;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl ?? 5 * 60 * 1000, // 5 minutes default
      maxEntries: options.maxEntries ?? 10
    };
  }

  set<T>(key: string, data: T): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + this.options.ttl
    };

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.options.maxEntries) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.options.maxEntries,
      ttl: this.options.ttl
    };
  }
}

// Singleton instance
const offerCache = new OfferCache();

export const useOfferCache = () => {
  const [, forceUpdate] = useState(0);

  const refresh = useCallback(() => {
    forceUpdate(prev => prev + 1);
  }, []);

  return {
    cache: offerCache,
    refresh
  };
};

// Hook específico para datos de oferta
export const useOfferDataCache = (offerId: string) => {
  const { cache, refresh } = useOfferCache();

  const getCachedOfferData = useCallback(() => {
    const cacheKey = `offer_${offerId}`;
    return cache.get(cacheKey);
  }, [offerId, cache]);

  const setCachedOfferData = useCallback((data: any) => {
    const cacheKey = `offer_${offerId}`;
    cache.set(cacheKey, data);
    refresh();
  }, [offerId, cache, refresh]);

  const invalidateOfferCache = useCallback(() => {
    const cacheKey = `offer_${offerId}`;
    cache.delete(cacheKey);
    refresh();
  }, [offerId, cache, refresh]);

  const isOfferCached = useCallback(() => {
    const cacheKey = `offer_${offerId}`;
    return cache.has(cacheKey);
  }, [offerId, cache]);

  return {
    getCachedOfferData,
    setCachedOfferData,
    invalidateOfferCache,
    isOfferCached
  };
};

// Hook para documentos de oferta
export const useOfferDocumentsCache = (offerId: string) => {
  const { cache, refresh } = useOfferCache();

  const getCachedDocuments = useCallback(() => {
    const cacheKey = `offer_${offerId}_documents`;
    return cache.get(cacheKey);
  }, [offerId, cache]);

  const setCachedDocuments = useCallback((documents: any[]) => {
    const cacheKey = `offer_${offerId}_documents`;
    cache.set(cacheKey, documents);
    refresh();
  }, [offerId, cache, refresh]);

  const invalidateDocumentsCache = useCallback(() => {
    const cacheKey = `offer_${offerId}_documents`;
    cache.delete(cacheKey);
    refresh();
  }, [offerId, cache, refresh]);

  return {
    getCachedDocuments,
    setCachedDocuments,
    invalidateDocumentsCache
  };
};

// Hook para comunicaciones de oferta
export const useOfferCommunicationsCache = (offerId: string) => {
  const { cache, refresh } = useOfferCache();

  const getCachedCommunications = useCallback(() => {
    const cacheKey = `offer_${offerId}_communications`;
    return cache.get(cacheKey);
  }, [offerId, cache]);

  const setCachedCommunications = useCallback((communications: any[]) => {
    const cacheKey = `offer_${offerId}_communications`;
    cache.set(cacheKey, communications);
    refresh();
  }, [offerId, cache, refresh]);

  const invalidateCommunicationsCache = useCallback(() => {
    const cacheKey = `offer_${offerId}_communications`;
    cache.delete(cacheKey);
    refresh();
  }, [offerId, cache, refresh]);

  return {
    getCachedCommunications,
    setCachedCommunications,
    invalidateCommunicationsCache
  };
};

export default offerCache;
