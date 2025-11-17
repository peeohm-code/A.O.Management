import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';

describe('Logger Utility', () => {
  let consoleLogSpy: any;
  let consoleWarnSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should log info messages', () => {
    logger.info('Test info message');
    expect(consoleLogSpy).toHaveBeenCalled();
    expect(consoleLogSpy.mock.calls[0][0]).toContain('INFO');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('Test info message');
  });

  it('should log warning messages', () => {
    logger.warn('Test warning message');
    expect(consoleWarnSpy).toHaveBeenCalled();
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('WARN');
    expect(consoleWarnSpy.mock.calls[0][0]).toContain('Test warning message');
  });

  it('should log error messages', () => {
    logger.error('Test error message');
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('Test error message');
  });

  it('should include context in log messages', () => {
    logger.info('Test message', 'TestContext');
    expect(consoleLogSpy.mock.calls[0][0]).toContain('[TestContext]');
  });

  it('should include data in log messages', () => {
    const testData = { key: 'value', number: 123 };
    logger.info('Test message', 'Context', testData);
    const logOutput = consoleLogSpy.mock.calls[0][0];
    expect(logOutput).toContain('key');
    expect(logOutput).toContain('value');
  });

  it('should format timestamp correctly', () => {
    logger.info('Test message');
    const logOutput = consoleLogSpy.mock.calls[0][0];
    // Check for ISO 8601 timestamp format
    expect(logOutput).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});
