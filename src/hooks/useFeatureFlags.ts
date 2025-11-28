// Tipos para feature flags
export type FeatureFlag = 'offer_details_refactor' | 'advanced_cache' | 'performance_monitoring' | 'toast_notifications';

export interface FeatureFlagsState {
  offer_details_refactor: boolean;
  advanced_cache: boolean;
  performance_monitoring: boolean;
  toast_notifications: boolean;
}
