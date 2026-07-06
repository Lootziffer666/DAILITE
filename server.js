import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import matchRoutes from './routes/matches.js';
import statsRoutes from './routes/stats.js';
import buildsRoutes from './routes/builds.js';
import referenceRoutes from './routes/reference.js';
import ocrRoutes from './routes/ocr.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Database connection
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Middleware
app.use(cors());
app.use(express.json());

// OpenAPI/Swagger Documentation
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'DAILITE - Dead by Daylight Analytics API',
    version: '0.1.0',
    description: 'Real-time match analytics and build coaching for Dead by Daylight',
  },
  servers: [
    {
      url: `http://localhost:${port}`,
      description: 'Development server',
    },
  ],
  paths: {
    '/api/matches': {
      post: {
        summary: 'Create a new match',
        tags: ['Matches'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  player_name: { type: 'string' },
                  killer: { type: 'string' },
                  map: { type: 'string' },
                  outcome: { type: 'string', enum: ['escape', 'die', 'sacrifice'] },
                  duration_seconds: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Match created successfully' },
          400: { description: 'Invalid request body' },
        },
      },
      get: {
        summary: 'Get all matches',
        tags: ['Matches'],
        responses: {
          200: { description: 'List of matches' },
        },
      },
    },
    '/api/matches/{id}': {
      get: {
        summary: 'Get a specific match',
        tags: ['Matches'],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: { description: 'Match details' },
          404: { description: 'Match not found' },
        },
      },
    },
    '/api/stats/summary': {
      get: {
        summary: 'Get player statistics summary',
        tags: ['Stats'],
        responses: {
          200: { description: 'Player statistics' },
        },
      },
    },
    '/api/builds/analyze': {
      post: {
        summary: 'Analyze a build against killer type',
        tags: ['Builds'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  perks: { type: 'array', items: { type: 'string' } },
                  killer_type: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Build analysis' },
          400: { description: 'Invalid build data' },
        },
      },
    },
    '/api/ocr/analyze': {
      post: {
        summary: 'Analyze Dead by Daylight screenshot via OCR',
        tags: ['OCR'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  screenshot: { type: 'string', format: 'binary' },
                },
                required: ['screenshot'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Game state extracted from screenshot',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    gameState: {
                      type: 'object',
                      properties: {
                        killer: { type: 'string' },
                        map: { type: 'string' },
                        perks: { type: 'array', items: { type: 'string' } },
                        hook_count: { type: 'integer' },
                        generator_progress: { type: 'array', items: { type: 'number' } },
                        objectives: { type: 'object' },
                        escaped: { type: 'boolean' },
                        confidence: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'No screenshot provided' },
          500: { description: 'OCR analysis failed' },
        },
      },
    },
    '/api/ocr/status': {
      get: {
        summary: 'Get OCR system status',
        tags: ['OCR'],
        responses: {
          200: {
            description: 'OCR system status',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    ocr_initialized: { type: 'boolean' },
                    tesseract_version: { type: 'string' },
                    supported_languages: { type: 'array', items: { type: 'string' } },
                    status: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/matches', matchRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/builds', buildsRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/ocr', ocrRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`DAILITE API running on http://localhost:${port}`);
  console.log(`Swagger docs: http://localhost:${port}/api-docs`);
});
