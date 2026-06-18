import { env } from '../config/env';

/**
 * OpenAPI 3.0 specification for the Debt Tracker API.
 * Kept in sync with the route definitions and Zod schemas by hand.
 */
export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Debt Tracker API',
    version: '1.0.0',
    description:
      'Backend API for tracking debts between you and your contacts (Node.js + TypeScript + PostgreSQL).',
    license: { name: 'MIT' },
  },
  servers: env.SERVER_URL
    ? [
        { url: env.SERVER_URL, description: 'Production' },
        { url: `http://localhost:${env.PORT}`, description: 'Local development' },
      ]
    : [{ url: `http://localhost:${env.PORT}`, description: 'Local development' }],
  tags: [
    { name: 'Auth', description: 'Registration, login, token refresh & logout' },
    { name: 'Users', description: 'Current user profile' },
    { name: 'Folders', description: 'Groups of contacts' },
    { name: 'Contacts', description: 'People you owe / who owe you' },
    { name: 'Debts', description: 'Debts and their payments' },
    { name: 'Dashboard', description: 'Aggregated summary' },
    { name: 'System', description: 'Service health' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by /api/auth/login or /api/auth/register.',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string', example: 'Invalid email or password' },
          detail: {
            type: 'string',
            description: 'Only present in non-production environments for 500 errors.',
          },
        },
        required: ['error'],
      },
      ValidationError: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Semicolon-separated "field: message" pairs.',
            example: 'email: Invalid email; password: String must contain at least 6 character(s)',
          },
        },
        required: ['error'],
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string', description: 'JWT access token' },
          refreshToken: { type: 'string', description: 'JWT refresh token' },
        },
      },
      Tokens: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      RegisterInput: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'Jane Doe' },
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          password: { type: 'string', minLength: 6, maxLength: 128, example: 'secret123' },
        },
      },
      LoginInput: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email', example: 'jane@example.com' },
          password: { type: 'string', minLength: 1, example: 'secret123' },
        },
      },
      RefreshInput: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', minLength: 10 },
        },
      },
      Folder: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: 'Family' },
          color: { type: 'string', nullable: true, example: '#ff8800' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      FolderInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'Family' },
          color: { type: 'string', maxLength: 20, example: '#ff8800' },
        },
      },
      Contact: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          folder_id: { type: 'string', format: 'uuid', nullable: true },
          name: { type: 'string', example: 'John Smith' },
          phone: { type: 'string', nullable: true, example: '+1 555 0100' },
          email: { type: 'string', format: 'email', nullable: true },
          note: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      ContactInput: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 1, maxLength: 120, example: 'John Smith' },
          phone: { type: 'string', maxLength: 40, example: '+1 555 0100' },
          email: { type: 'string', format: 'email' },
          note: { type: 'string', maxLength: 1000 },
          folder_id: { type: 'string', format: 'uuid' },
        },
      },
      Debt: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          contact_id: { type: 'string', format: 'uuid' },
          direction: { type: 'string', enum: ['they_owe_me', 'i_owe_them'] },
          amount: { type: 'number', format: 'double', example: 150.0 },
          currency: { type: 'string', example: 'USD' },
          description: { type: 'string', nullable: true },
          due_date: { type: 'string', format: 'date', nullable: true, example: '2026-07-01' },
          status: { type: 'string', enum: ['pending', 'partial', 'paid'] },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      CreateDebtInput: {
        type: 'object',
        required: ['contact_id', 'direction', 'amount'],
        properties: {
          contact_id: { type: 'string', format: 'uuid' },
          direction: { type: 'string', enum: ['they_owe_me', 'i_owe_them'] },
          amount: { type: 'number', format: 'double', minimum: 0, exclusiveMinimum: true, maximum: 1000000000, example: 150.0 },
          currency: { type: 'string', minLength: 1, maxLength: 8, default: 'USD' },
          description: { type: 'string', maxLength: 1000 },
          due_date: { type: 'string', format: 'date', example: '2026-07-01' },
        },
      },
      UpdateDebtInput: {
        type: 'object',
        properties: {
          contact_id: { type: 'string', format: 'uuid' },
          direction: { type: 'string', enum: ['they_owe_me', 'i_owe_them'] },
          amount: { type: 'number', format: 'double', minimum: 0, exclusiveMinimum: true, maximum: 1000000000 },
          currency: { type: 'string', minLength: 1, maxLength: 8 },
          description: { type: 'string', maxLength: 1000 },
          due_date: { type: 'string', format: 'date' },
          status: { type: 'string', enum: ['pending', 'partial', 'paid'] },
        },
      },
      Payment: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          debt_id: { type: 'string', format: 'uuid' },
          user_id: { type: 'string', format: 'uuid' },
          amount: { type: 'number', format: 'double', example: 50.0 },
          note: { type: 'string', nullable: true },
          paid_at: { type: 'string', format: 'date-time' },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      CreatePaymentInput: {
        type: 'object',
        required: ['amount'],
        properties: {
          amount: { type: 'number', format: 'double', minimum: 0, exclusiveMinimum: true, maximum: 1000000000, example: 50.0 },
          note: { type: 'string', maxLength: 500 },
          paid_at: { type: 'string', format: 'date-time', description: 'Defaults to now if omitted.' },
        },
      },
      DashboardSummary: {
        type: 'object',
        properties: {
          totals: {
            type: 'object',
            properties: {
              they_owe_me: { type: 'number', format: 'double' },
              i_owe_them: { type: 'number', format: 'double' },
            },
          },
          outstanding: {
            type: 'object',
            properties: {
              they_owe_me: { type: 'number', format: 'double' },
              i_owe_them: { type: 'number', format: 'double' },
              net_balance: { type: 'number', format: 'double', description: 'Positive => net owed to you.' },
            },
          },
          counts: {
            type: 'object',
            properties: {
              pending: { type: 'integer' },
              partial: { type: 'integer' },
              paid: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
          contacts_count: { type: 'integer' },
          upcoming_due: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', format: 'uuid' },
                amount: { type: 'number', format: 'double' },
                currency: { type: 'string' },
                direction: { type: 'string', enum: ['they_owe_me', 'i_owe_them'] },
                due_date: { type: 'string', format: 'date', nullable: true },
                status: { type: 'string', enum: ['pending', 'partial', 'paid'] },
                contact_name: { type: 'string' },
              },
            },
          },
        },
      },
    },
    responses: {
      Unauthorized: {
        description: 'Missing or invalid access token',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      NotFound: {
        description: 'Resource not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
      },
      ValidationFailed: {
        description: 'Request body failed validation (HTTP 422)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ValidationError' } } },
      },
    },
    parameters: {
      IdPath: {
        name: 'id',
        in: 'path',
        required: true,
        schema: { type: 'string', format: 'uuid' },
        description: 'Resource UUID',
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        security: [],
        responses: {
          200: {
            description: 'Service is up',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    time: { type: 'string', format: 'date-time' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterInput' } } },
        },
        responses: {
          201: {
            description: 'User created with tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          409: { description: 'Email already registered', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginInput' } } },
        },
        responses: {
          200: {
            description: 'Authenticated with tokens',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } } },
          },
          401: { description: 'Invalid credentials', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate refresh token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } },
        },
        responses: {
          200: {
            description: 'New token pair',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Tokens' } } },
          },
          401: { description: 'Invalid, expired or revoked refresh token', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
    '/api/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Revoke a refresh token',
        security: [],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshInput' } } },
        },
        responses: {
          200: {
            description: 'Logged out',
            content: { 'application/json': { schema: { type: 'object', properties: { message: { type: 'string', example: 'Logged out' } } } } },
          },
        },
      },
    },
    '/api/users/me': {
      get: {
        tags: ['Users'],
        summary: 'Get current user',
        responses: {
          200: { description: 'Current user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update current user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { type: 'object', required: ['name'], properties: { name: { type: 'string', minLength: 1, maxLength: 120 } } },
            },
          },
        },
        responses: {
          200: { description: 'Updated user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/folders': {
      get: {
        tags: ['Folders'],
        summary: 'List folders',
        responses: {
          200: { description: 'Array of folders', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Folder' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Folders'],
        summary: 'Create a folder',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/FolderInput' } } } },
        responses: {
          201: { description: 'Created folder', content: { 'application/json': { schema: { $ref: '#/components/schemas/Folder' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/folders/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['Folders'],
        summary: 'Get a folder',
        responses: {
          200: { description: 'Folder', content: { 'application/json': { schema: { $ref: '#/components/schemas/Folder' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Folders'],
        summary: 'Update a folder',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/FolderInput' } } } },
        responses: {
          200: { description: 'Updated folder', content: { 'application/json': { schema: { $ref: '#/components/schemas/Folder' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
      delete: {
        tags: ['Folders'],
        summary: 'Delete a folder',
        responses: {
          204: { description: 'Deleted' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/contacts': {
      get: {
        tags: ['Contacts'],
        summary: 'List contacts',
        parameters: [
          { name: 'folder_id', in: 'query', required: false, schema: { type: 'string', format: 'uuid' }, description: 'Filter by folder' },
        ],
        responses: {
          200: { description: 'Array of contacts', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Contact' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Contacts'],
        summary: 'Create a contact',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactInput' } } } },
        responses: {
          201: { description: 'Created contact', content: { 'application/json': { schema: { $ref: '#/components/schemas/Contact' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/contacts/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['Contacts'],
        summary: 'Get a contact',
        responses: {
          200: { description: 'Contact', content: { 'application/json': { schema: { $ref: '#/components/schemas/Contact' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Contacts'],
        summary: 'Update a contact',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/ContactInput' } } } },
        responses: {
          200: { description: 'Updated contact', content: { 'application/json': { schema: { $ref: '#/components/schemas/Contact' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
      delete: {
        tags: ['Contacts'],
        summary: 'Delete a contact',
        responses: {
          204: { description: 'Deleted' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/debts': {
      get: {
        tags: ['Debts'],
        summary: 'List debts',
        parameters: [
          { name: 'status', in: 'query', required: false, schema: { type: 'string', enum: ['pending', 'partial', 'paid'] } },
          { name: 'contact_id', in: 'query', required: false, schema: { type: 'string', format: 'uuid' } },
          { name: 'direction', in: 'query', required: false, schema: { type: 'string', enum: ['they_owe_me', 'i_owe_them'] } },
        ],
        responses: {
          200: { description: 'Array of debts', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Debt' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
      post: {
        tags: ['Debts'],
        summary: 'Create a debt',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreateDebtInput' } } } },
        responses: {
          201: { description: 'Created debt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Debt' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/debts/{id}': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['Debts'],
        summary: 'Get a debt',
        responses: {
          200: { description: 'Debt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Debt' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      patch: {
        tags: ['Debts'],
        summary: 'Update a debt',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UpdateDebtInput' } } } },
        responses: {
          200: { description: 'Updated debt', content: { 'application/json': { schema: { $ref: '#/components/schemas/Debt' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
      delete: {
        tags: ['Debts'],
        summary: 'Delete a debt',
        responses: {
          204: { description: 'Deleted' },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
    },
    '/api/debts/{id}/payments': {
      parameters: [{ $ref: '#/components/parameters/IdPath' }],
      get: {
        tags: ['Debts'],
        summary: 'List payments for a debt',
        responses: {
          200: { description: 'Array of payments', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Payment' } } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
        },
      },
      post: {
        tags: ['Debts'],
        summary: 'Add a payment to a debt',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/CreatePaymentInput' } } } },
        responses: {
          201: { description: 'Created payment', content: { 'application/json': { schema: { $ref: '#/components/schemas/Payment' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
          404: { $ref: '#/components/responses/NotFound' },
          422: { $ref: '#/components/responses/ValidationFailed' },
        },
      },
    },
    '/api/dashboard/summary': {
      get: {
        tags: ['Dashboard'],
        summary: 'Aggregated dashboard summary',
        responses: {
          200: { description: 'Summary', content: { 'application/json': { schema: { $ref: '#/components/schemas/DashboardSummary' } } } },
          401: { $ref: '#/components/responses/Unauthorized' },
        },
      },
    },
  },
} as const;
