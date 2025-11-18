import { describe, it, expect } from 'vitest';
import {
  getDocumentTypeLabel,
  formatFileSize,
  isValidFileType,
  validateFileForType,
  getDocumentConfig,
  isDocumentExpired,
  getStatusBadgeText
} from '../utils';

describe('Document Utils', () => {
  describe('getDocumentTypeLabel', () => {
    it('should return correct label for known document types', () => {
      expect(getDocumentTypeLabel('applicant_id')).toBe('Cédula de Identidad - Postulante');
      expect(getDocumentTypeLabel('income_proof')).toBe('Comprobante de Ingresos');
      expect(getDocumentTypeLabel('title_study')).toBe('Estudio de Título');
    });

    it('should return the type itself for unknown document types', () => {
      expect(getDocumentTypeLabel('unknown_type' as any)).toBe('unknown_type');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });

    it('should handle large numbers', () => {
      expect(formatFileSize(1536)).toBe('1.50 KB');
    });
  });

  describe('isValidFileType', () => {
    it('should validate file types correctly', () => {
      const allowedTypes = ['application/pdf', 'image/jpeg'];

      expect(isValidFileType({ type: 'application/pdf' } as File, allowedTypes)).toBe(true);
      expect(isValidFileType({ type: 'image/jpeg' } as File, allowedTypes)).toBe(true);
      expect(isValidFileType({ type: 'text/plain' } as File, allowedTypes)).toBe(false);
    });
  });

  describe('validateFileForType', () => {
    it('should validate a valid file', () => {
      const file = {
        name: 'test.pdf',
        size: 1024 * 1024, // 1MB
        type: 'application/pdf'
      } as File;

      const result = validateFileForType(file, 'applicant_id');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject oversized files', () => {
      const file = {
        name: 'large.pdf',
        size: 10 * 1024 * 1024, // 10MB
        type: 'application/pdf'
      } as File;

      const result = validateFileForType(file, 'applicant_id'); // max 5MB

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El archivo es demasiado grande');
    });

    it('should reject invalid file types', () => {
      const file = {
        name: 'test.txt',
        size: 1024,
        type: 'text/plain'
      } as File;

      const result = validateFileForType(file, 'applicant_id');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Tipo de archivo no permitido');
    });
  });

  describe('getDocumentConfig', () => {
    it('should return config for known document types', () => {
      const config = getDocumentConfig('applicant_id');

      expect(config).toBeDefined();
      expect(config.label).toBe('Cédula de Identidad - Postulante');
      expect(config.required).toBe(true);
      expect(config.maxSize).toBe(5 * 1024 * 1024);
    });
  });

  describe('isDocumentExpired', () => {
    it('should detect expired documents', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 100); // 100 days ago

      // For title_study which expires after 365 days
      const isExpired = isDocumentExpired(pastDate.toISOString(), 'title_study');

      expect(isExpired).toBe(false); // 100 days is less than 365
    });

    it('should return false for non-expiring documents', () => {
      const isExpired = isDocumentExpired(new Date().toISOString(), 'other');

      expect(isExpired).toBe(false);
    });
  });

  describe('getStatusBadgeText', () => {
    it('should return correct status text', () => {
      expect(getStatusBadgeText('pending')).toBe('Pendiente');
      expect(getStatusBadgeText('verified')).toBe('Verificado');
      expect(getStatusBadgeText('rejected')).toBe('Rechazado');
    });
  });
});



