require('dotenv').config(); // Load environment variables from .env file
const AutomatedBackupTool = require('./src'); // Import from index.js

const backupTool = new AutomatedBackupTool({
    database: 'postgres', // Change to 'mongodb' if you want to test MongoDB
    storage: 'aws',
    retention: 7,
    awsCredentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
        bucket: process.env.AWS_BUCKET
    },
    dbCredentials: {
        postgres: {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DATABASE
        }
    }
});

backupTool.backup()
    .then(() => {
        console.log('Backup process completed successfully.');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error during backup process:', error);
        process.exit(1);
    });
