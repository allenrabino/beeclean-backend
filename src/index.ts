import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './shared/config/index.js';
import authRoutes from './auth/http/auth.routes.js';
import emailRoutes from './email/http/email.routes.js';
import contactsRoutes from './contacts/http/contacts.routes.js';
import compressRoutes from './compress/http/compress.routes.js';
import streakRoutes from './streak/http/streak.routes.js';
import themeRoutes from './theme/http/theme.routes.js';
import chatRoutes from './chat/http/chat.routes.js';
import subscriptionsRoutes from './subscriptions/http/subscriptions.routes.js';
import quotaRoutes from './quota/http/quota.routes.js';
import progressRoutes from './progress/http/progress.routes.js';
import cleanupTaskRoutes from './cleanup-task/http/cleanup-task.routes.js';
import leaderboardRoutes from './leaderboard/http/leaderboard.routes.js';
import avatarRoutes from './avatar/http/avatar.routes.js';

// Catch silent crashes
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('UNHANDLED REJECTION:', reason);
});

// Validate environment variables
validateConfig();

const app = express();

// Middleware — allow all origins since iOS apps don't send CORS headers
// and we need flexibility for simulator + real device testing
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRoutes);
app.use('/email', emailRoutes);
app.use('/contacts', contactsRoutes);
app.use('/compress', compressRoutes);
app.use('/streak', streakRoutes);
app.use('/theme', themeRoutes);
app.use('/chats', chatRoutes);
app.use('/subscriptions', subscriptionsRoutes);
app.use('/quota', quotaRoutes);
app.use('/progress', progressRoutes);
app.use('/cleanup-task', cleanupTaskRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/avatar', avatarRoutes);

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
const host = process.env.RAILWAY_ENVIRONMENT ? '0.0.0.0' : 'localhost';
console.log(`PORT=${process.env.PORT}, RAILWAY_ENVIRONMENT=${process.env.RAILWAY_ENVIRONMENT}`);
app.listen(config.port, host, () => {
  console.log(`BeeClean Backend running on http://${host}:${config.port}`);
  console.log(`Google Auth callback: ${config.google.redirectUri}`);
});
