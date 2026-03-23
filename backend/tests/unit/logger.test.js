jest.mock('winston', () => {
  const createLogger = jest.fn((options) => options);
  const combine = jest.fn((...items) => items);
  const timestamp = jest.fn(() => 'timestamp');
  const errors = jest.fn((options) => ({ type: 'errors', options }));
  const printf = jest.fn((formatter) => formatter);
  const Console = jest.fn((options) => ({ type: 'console-transport', ...options }));

  return {
    createLogger,
    format: {
      combine,
      timestamp,
      errors,
      printf
    },
    transports: {
      Console
    }
  };
});

describe('createLogger', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    jest.resetModules();
    process.env.NODE_ENV = originalNodeEnv;
  });

  test('marks console transport as silent in test environment', () => {
    process.env.NODE_ENV = 'test';
    const { createLogger } = require('../../src/utils/logger');
    const logger = createLogger('info');

    expect(logger.level).toBe('info');
    expect(logger.transports[0]).toEqual(
      expect.objectContaining({
        type: 'console-transport',
        silent: true
      })
    );
  });

  test('keeps console transport active outside test environment', () => {
    process.env.NODE_ENV = 'production';
    const { createLogger } = require('../../src/utils/logger');
    const logger = createLogger('warn');

    expect(logger.level).toBe('warn');
    expect(logger.transports[0]).toEqual(
      expect.objectContaining({
        type: 'console-transport',
        silent: false
      })
    );
    expect(logger.defaultMeta).toEqual({
      service: 'smart-daily-planner-backend'
    });
  });
});
