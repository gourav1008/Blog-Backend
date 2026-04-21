require('dotenv').config();
const app = require('./app');
const logger = require('./config/logger');

// Verify Supabase is configured
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
    logger.warn('⚠️  SUPABASE_SERVICE_ROLE_KEY is not set. Backend admin operations will fail. Add it to .env');
}

const port = process.env.PORT || 5000;

let server = app.listen(port, () => {
    logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${port}`);
    logger.info(`📦 Database: Supabase (${process.env.SUPABASE_URL})`);
});

const exitHandler = () => {
    if (server) {
        server.close(() => {
            logger.info('Server closed');
            process.exit(1);
        });
    } else {
        process.exit(1);
    }
};

const unexpectedErrorHandler = (error) => {
    logger.error(error);
    exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    if (server) server.close();
});
