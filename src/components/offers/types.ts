// Re-export types from sales/types.ts as they share the same domain
export * from '../sales/types';

// Add any specific types for the buyer view here if needed
export interface OfferDetailsState {
    activeTab: 'info' | 'documents' | 'messages' | 'actions';
}

