import { describe, it, expect } from 'vitest';
import { exportSettings, parseImportedSettings } from '../utils/settingsBackup';

describe('settingsBackup utilities', () => {
    const mockSettings = {
        theme: 'dark',
        accentColor: '#3b82f6',
        language: 'en',
        preferences: {
            services: {
                sortBy: 'name',
                groupBy: 'none'
            }
        }
    };

    describe('exportSettings', () => {
        it('should export settings to JSON format', () => {
            const result = exportSettings(mockSettings);
            const parsed = JSON.parse(result);

            expect(parsed).toHaveProperty('version');
            expect(parsed).toHaveProperty('exportDate');
            expect(parsed).toHaveProperty('settings');
        });

        it('should include all settings fields', () => {
            const result = exportSettings(mockSettings);
            const parsed = JSON.parse(result);

            expect(parsed.settings.theme).toBe('dark');
            expect(parsed.settings.accentColor).toBe('#3b82f6');
            expect(parsed.settings.preferences).toBeDefined();
        });
    });

    describe('parseImportedSettings', () => {
        it('should parse valid settings JSON', () => {
            const jsonString = JSON.stringify({
                version: '1.0',
                exportDate: '2024-01-01',
                settings: mockSettings
            });

            const result = parseImportedSettings(jsonString);
            expect(result.theme).toBe('dark');
            expect(result.accentColor).toBe('#3b82f6');
        });

        it('should throw error for invalid JSON', () => {
            expect(() => parseImportedSettings('invalid')).toThrow();
        });

        it('should throw error for missing settings object', () => {
            const jsonString = JSON.stringify({ version: '1.0' });
            expect(() => parseImportedSettings(jsonString)).toThrow('Invalid settings file format');
        });
    });
});
