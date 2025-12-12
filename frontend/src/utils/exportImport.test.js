import { describe, it, expect } from 'vitest';
import { exportServicesToJSON, exportServicesToCSV, parseImportedJSON, parseImportedCSV, validateService } from '../utils/exportImport';

describe('exportImport utilities', () => {
    const mockServices = [
        {
            name: 'Test Service',
            ip: '192.168.1.100',
            port: 8080,
            vendor: 'TestVendor',
            group: 'Production',
            tags: 'web,api',
            mac_address: '00:11:22:33:44:55',
            maintenance: false,
            monitored: true,
            description: 'Test service description'
        },
        {
            name: 'Another Service',
            ip: '192.168.1.101',
            port: 3000,
            vendor: null,
            group: null,
            tags: null,
            mac_address: null,
            maintenance: true,
            monitored: false,
            description: ''
        }
    ];

    describe('exportServicesToJSON', () => {
        it('should export services to JSON format', () => {
            const result = exportServicesToJSON(mockServices);
            const parsed = JSON.parse(result);

            expect(parsed).toHaveProperty('version');
            expect(parsed).toHaveProperty('exportDate');
            expect(parsed).toHaveProperty('services');
            expect(parsed.services).toHaveLength(2);
            expect(parsed.services[0].name).toBe('Test Service');
        });

        it('should include all service fields', () => {
            const result = exportServicesToJSON(mockServices);
            const parsed = JSON.parse(result);
            const service = parsed.services[0];

            expect(service).toHaveProperty('name');
            expect(service).toHaveProperty('ip');
            expect(service).toHaveProperty('port');
            expect(service).toHaveProperty('vendor');
            expect(service).toHaveProperty('maintenance');
        });
    });

    describe('exportServicesToCSV', () => {
        it('should export services to CSV format', () => {
            const result = exportServicesToCSV(mockServices);
            const lines = result.split('\n');

            expect(lines[0]).toContain('Name');
            expect(lines[0]).toContain('IP');
            expect(lines[0]).toContain('Port');
            expect(lines.length).toBe(3); // header + 2 services
        });

        it('should properly quote CSV values', () => {
            const result = exportServicesToCSV(mockServices);
            expect(result).toContain('"Test Service"');
            expect(result).toContain('"192.168.1.100"');
        });
    });

    describe('parseImportedJSON', () => {
        it('should parse valid JSON', () => {
            const jsonString = JSON.stringify({
                version: '1.0',
                exportDate: '2024-01-01',
                services: mockServices
            });

            const result = parseImportedJSON(jsonString);
            expect(result).toHaveLength(2);
            expect(result[0].name).toBe('Test Service');
        });

        it('should throw error for invalid JSON', () => {
            expect(() => parseImportedJSON('invalid')).toThrow();
        });

        it('should throw error for missing services array', () => {
            const jsonString = JSON.stringify({ version: '1.0' });
            expect(() => parseImportedJSON(jsonString)).toThrow('missing services array');
        });
    });

    describe('parseImportedCSV', () => {
        it('should parse valid CSV', () => {
            const csv = 'Name,IP,Port,Vendor,Group,Tags,MAC Address,Maintenance,Monitored,Description\n"Test","192.168.1.1","80","","","","","No","Yes",""';
            const result = parseImportedCSV(csv);

            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('Test');
            expect(result[0].ip).toBe('192.168.1.1');
            expect(result[0].port).toBe(80);
        });

        it('should skip rows without name or IP', () => {
            const csv = 'Name,IP,Port,Vendor,Group,Tags,MAC Address,Maintenance,Monitored,Description\n"","192.168.1.1","80","","","","","No","Yes",""\n"Test","","80","","","","","No","Yes",""';
            const result = parseImportedCSV(csv);

            expect(result).toHaveLength(0);
        });
    });

    describe('validateService', () => {
        it('should return true for valid service', () => {
            const service = { name: 'Test', ip: '192.168.1.1' };
            expect(validateService(service)).toBe(true);
        });

        it('should return false for service without name', () => {
            const service = { ip: '192.168.1.1' };
            expect(validateService(service)).toBe(false);
        });

        it('should return false for service without IP', () => {
            const service = { name: 'Test' };
            expect(validateService(service)).toBe(false);
        });
    });
});
