const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const { authenticate } = require('../middleware/authenticate');
const { errorHandler } = require('../middleware/errorHandler');
const { notFound } = require('../middleware/notFound');
const { requestLogger } = require('../middleware/requestLogger');
const { createRateLimiters } = require('../middleware/rateLimiters');
const { createAuthController } = require('../modules/auth/controllers/authController');
const authRepository = require('../modules/auth/repositories/authRepository');
const { createAuthRouter } = require('../modules/auth/routes/authRoutes');
const { createAuthService } = require('../modules/auth/services/authService');
const { createGoogleOAuthClient } = require('../modules/auth/services/googleOAuthClient');
const taskRepository = require('../modules/tasks/repositories/taskRepository');
const { createTaskController } = require('../modules/tasks/controllers/taskController');
const { createTaskRouter } = require('../modules/tasks/routes/taskRoutes');
const { createTaskService } = require('../modules/tasks/services/taskService');
const { createHttpError } = require('../utils/httpError');

function createCorsOptions(config) {
  return {
    origin(origin, callback) {
      if (!origin || config.allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Not allowed by CORS.'));
    }
  };
}

function createHealthHandler({ pool, startedAt }) {
  return async (request, response) => {
    try {
      await pool.query('SELECT 1');

      return response.status(200).json({
        status: 'ok',
        uptimeMs: Date.now() - startedAt,
        database: 'connected',
        version: process.env.npm_package_version || '1.0.0'
      });
    } catch (error) {
      return response.status(503).json({
        status: 'degraded',
        uptimeMs: Date.now() - startedAt,
        database: 'unavailable',
        version: process.env.npm_package_version || '1.0.0'
      });
    }
  };
}

function createApp({ config, logger, pool, startedAt = Date.now() }) {
  const app = express();
  const rateLimiters = createRateLimiters(config);
  const googleOAuthClient = createGoogleOAuthClient({ config });
  const authService = createAuthService({
    authRepository: {
      findUserByEmail: (email) => authRepository.findUserByEmail(pool, email),
      createUser: (payload) => authRepository.createUser(pool, payload)
    },
    logger,
    googleOAuthClient
  });
  const taskService = createTaskService({
    taskRepository: {
      countTasksForDate: (payload) => taskRepository.countTasksForDate(pool, payload),
      createTask: (payload) => taskRepository.createTask(pool, payload),
      listTasksForDate: (payload) => taskRepository.listTasksForDate(pool, payload),
      findTaskById: (taskId) => taskRepository.findTaskById(pool, taskId),
      updateTask: (payload) => taskRepository.updateTask(pool, payload),
      deleteTask: (taskId) => taskRepository.deleteTask(pool, taskId),
      findSuggestion: (payload) => taskRepository.findSuggestion(pool, payload)
    },
    logger
  });
  const authController = createAuthController({
    authService,
    config
  });
  const taskController = createTaskController({
    taskService
  });

  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          "default-src": ["'self'"],
          "script-src": ["'self'"],
          "object-src": ["'none'"]
        }
      },
      crossOriginResourcePolicy: {
        policy: 'cross-origin'
      }
    })
  );
  app.use(cors(createCorsOptions(config)));
  app.use((error, request, response, next) => {
    if (error?.message !== 'Not allowed by CORS.') {
      next(error);
      return;
    }

    next(createHttpError(403, 'Origin is not allowed by CORS policy.'));
  });
  app.use(express.json({ limit: '10kb' }));
  app.use(requestLogger(logger, config));
  app.use((request, response, next) => {
    response.setTimeout(config.requestTimeoutMs, () => {
      logger.warn('Request timed out.', {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        timeoutMs: config.requestTimeoutMs,
        userId: request.user?.id || null
      });

      if (!response.headersSent) {
        response.status(504).json({
          error: 'Request timed out. Please try again.'
        });
      }
    });

    next();
  });
  app.use('/api', rateLimiters.apiRateLimiter);

  app.get('/', (request, response) =>
    response.status(200).json({
      service: 'smart-daily-planner-backend',
      status: 'ok',
      health: '/health'
    })
  );
  app.get('/health', createHealthHandler({ pool, startedAt }));
  app.use(
    '/api/auth',
    createAuthRouter({
      authController,
      authRateLimiter: rateLimiters.authRateLimiter
    })
  );
  app.use(
    '/api/tasks',
    createTaskRouter({
      taskController,
      authenticate: authenticate(config)
    })
  );

  app.use(notFound);
  app.use(errorHandler(logger));

  return app;
}

module.exports = {
  createApp
};
