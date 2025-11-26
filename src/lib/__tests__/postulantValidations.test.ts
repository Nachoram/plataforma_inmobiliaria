/**
 * postulantValidations.test.ts
 * Tests for postulant validation utilities
 */

import { postulantValidations } from '../postulantValidations';

// Mock supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          in: jest.fn()
        }))
      }))
    })),
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('postulantValidations', () => {
  describe('Application State Validations', () => {
    it('canCancelApplication returns true for pending and en_revision', () => {
      expect(postulantValidations.canCancelApplication('pendiente')).toBe(true);
      expect(postulantValidations.canCancelApplication('en_revision')).toBe(true);
      expect(postulantValidations.canCancelApplication('aprobada')).toBe(false);
      expect(postulantValidations.canCancelApplication('rechazada')).toBe(false);
    });

    it('canEditDocuments returns true for valid states', () => {
      expect(postulantValidations.canEditDocuments('pendiente')).toBe(true);
      expect(postulantValidations.canEditDocuments('en_revision')).toBe(true);
      expect(postulantValidations.canEditDocuments('aprobada')).toBe(true);
      expect(postulantValidations.canEditDocuments('rechazada')).toBe(false);
    });

    it('canViewContract returns true for approved/finalized/modified', () => {
      expect(postulantValidations.canViewContract('aprobada')).toBe(true);
      expect(postulantValidations.canViewContract('finalizada')).toBe(true);
      expect(postulantValidations.canViewContract('modificada')).toBe(true);
      expect(postulantValidations.canViewContract('pendiente')).toBe(false);
    });
  });

  describe('File Validations', () => {
    it('validateFileType accepts valid types', () => {
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const jpgFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });

      expect(postulantValidations.validateFileType(pdfFile).isValid).toBe(true);
      expect(postulantValidations.validateFileType(jpgFile).isValid).toBe(true);
      expect(postulantValidations.validateFileType(pngFile).isValid).toBe(true);
    });

    it('validateFileType rejects invalid types', () => {
      const exeFile = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });

      const result = postulantValidations.validateFileType(exeFile);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('no permitido');
    });

    it('validateFileSize accepts files under limit', () => {
      const smallFile = new File(['x'.repeat(1024)], 'small.txt'); // 1KB

      expect(postulantValidations.validateFileSize(smallFile, 5).isValid).toBe(true);
    });

    it('validateFileSize rejects files over limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.txt'); // 6MB

      const result = postulantValidations.validateFileSize(largeFile, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('supera el tamaño máximo');
    });

    it('validateFiles validates multiple files', () => {
      const files = [
        new File(['test'], 'test1.pdf', { type: 'application/pdf' }),
        new File(['test'], 'test2.jpg', { type: 'image/jpeg' })
      ];

      const result = postulantValidations.validateFiles(files, 5, 5);
      expect(result.isValid).toBe(true);
    });

    it('validateFiles rejects too many files', () => {
      const files = Array(6).fill(null).map((_, i) =>
        new File(['test'], `test${i}.pdf`, { type: 'application/pdf' })
      );

      const result = postulantValidations.validateFiles(files, 5, 5);
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Máximo 5 archivos');
    });
  });

  describe('Utility Functions', () => {
    it('getFileExtension returns correct extension', () => {
      expect(postulantValidations.getFileExtension('test.pdf')).toBe('pdf');
      expect(postulantValidations.getFileExtension('test.JPG')).toBe('jpg');
      expect(postulantValidations.getFileExtension('test')).toBe('');
    });

    it('formatFileSize formats correctly', () => {
      expect(postulantValidations.formatFileSize(1024)).toBe('1.00 KB');
      expect(postulantValidations.formatFileSize(1024 * 1024)).toBe('1.00 MB');
      expect(postulantValidations.formatFileSize(0)).toBe('0 Bytes');
    });

    it('sanitizeFilename removes special characters', () => {
      expect(postulantValidations.sanitizeFilename('test file.pdf')).toBe('test_file.pdf');
      expect(postulantValidations.sanitizeFilename('test@#$%file.pdf')).toBe('test____file.pdf');
    });

    it('sanitizeInput trims and limits length', () => {
      const longInput = 'x'.repeat(2000);
      const result = postulantValidations.sanitizeInput(longInput, 100);

      expect(result.length).toBe(100);
      expect(result).not.toContain('<');
      expect(result).not.toContain('>');
    });
  });
});
