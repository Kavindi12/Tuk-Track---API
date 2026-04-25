import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sri Lanka Police Tuk-Tuk Tracker API',
      version: '1.0.0',
      description: 'REST API for tracking three-wheelers (tuk-tuks) across Sri Lanka.',
      contact: { name: 'Police HQ ICT Division' },
    },
    servers: [{ url: '/api', description: 'API base path' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

export default swaggerJsdoc(options);