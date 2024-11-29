const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

class AutomatedBackupTool {
    constructor({ database, storage, retention, awsCredentials, dbCredentials }) {
        this.database = database;
        this.storage = storage;
        this.retention = retention || 7; // Default to config value if not provided
        this.backupDir = path.join(__dirname, '../backups'); // Directory to store backups
        this.ensureBackupDir();

        // Store AWS credentials in the class instance
        this.awsCredentials = awsCredentials;

        // Configure AWS credentials if provided
        if (awsCredentials) {
            AWS.config.update({
                accessKeyId: awsCredentials.accessKeyId,
                secretAccessKey: awsCredentials.secretAccessKey,
                region: awsCredentials.region || 'us-east-1' // Default region
            });
        }

        this.s3 = new AWS.S3();

        // Store database credentials
        this.dbCredentials = dbCredentials;

    }

    ensureBackupDir() {
        if (!fs.existsSync(this.backupDir)) {
            fs.mkdirSync(this.backupDir);
        }
    }

    async connectPostgres() {
        const client = new Client(this.dbCredentials.postgres);
        await client.connect();
        console.log('Connected to PostgreSQL');
        return client;
    }

    async connectMongoDB() {
        const client = new MongoClient(this.dbCredentials.mongodb.url);
        await client.connect();
        console.log('Connected to MongoDB');
        return client;
    }

    async backupPostgres() {
        const backupFile = path.join(this.backupDir, `postgres_backup_${Date.now()}.dump`);
        
        // Set the PGPASSWORD environment variable temporarily
        // Added -Fc for custom format, --no-owner and --no-privileges to avoid permission issues during restore
        const command = `PGPASSWORD=${this.dbCredentials.postgres.password} pg_dump -Fc --no-owner --no-privileges -h ${this.dbCredentials.postgres.host} -U ${this.dbCredentials.postgres.user} -d ${this.dbCredentials.postgres.database} -f ${backupFile}`;
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error backing up PostgreSQL: ${stderr}`);
                    return reject(error);
                }
                console.log(`PostgreSQL backup created at: ${backupFile}`);
                resolve(backupFile);
            });
        });
    }

    async backupMongoDB() {
        const backupFile = path.join(this.backupDir, `mongodb_backup_${Date.now()}.gz`);
        const command = `mongodump --uri=${this.dbCredentials.mongodb.url}/${this.dbCredentials.mongodb.database} --gzip --archive=${backupFile}`;
        
        return new Promise((resolve, reject) => {
            exec(command, (error, stdout, stderr) => {
                if (error) {
                    console.error(`Error backing up MongoDB: ${stderr}`);
                    return reject(error);
                }
                console.log(`MongoDB backup created at: ${backupFile}`);
                resolve(backupFile);
            });
        });
    }

    async deleteOldBackups() {
        const files = fs.readdirSync(this.backupDir);
        const now = Date.now();
        const retentionMillis = this.retention * 24 * 60 * 60 * 1000; // Convert days to milliseconds

        files.forEach(file => {
            const filePath = path.join(this.backupDir, file);
            const stats = fs.statSync(filePath);
            const fileAge = now - stats.mtimeMs;

            if (fileAge > retentionMillis) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    }

    async uploadToS3(filePath) {

        const fileContent = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const params = {
            Bucket: this.awsCredentials.bucket,
            Key: `backups/${fileName}`, // You can customize the path in the bucket
            Body: fileContent,
        };

        return new Promise((resolve, reject) => {
            this.s3.upload(params, (error, data) => {
                if (error) {
                    console.error(`Error uploading to S3: ${error.message}`);
                    return reject(error);
                }
                console.log(`Backup uploaded to S3: ${data.Location}`);
                resolve(data.Location);
            });
        });
    }

    async backup() {
        let dbClient;
        let backupFile;

        if (this.database === 'postgres') {
            dbClient = await this.connectPostgres();
            backupFile = await this.backupPostgres();
        } else if (this.database === 'mongodb') {
            dbClient = await this.connectMongoDB();
            backupFile = await this.backupMongoDB();
        } else {
            throw new Error('Unsupported database type. Please choose "postgres" or "mongodb".');
        }

        console.log(`Selected storage provider: ${this.storage}`);

        if (this.storage === 'aws') {
            await this.uploadToS3(backupFile);
        }

        // Delete old backups based on retention policy
        await this.deleteOldBackups();

        // Close connection
        await dbClient.end();
    }
}

module.exports = AutomatedBackupTool;
