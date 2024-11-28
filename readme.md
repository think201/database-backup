# 🎉 Database Backup Tool


Welcome to the **Database Backup Tool**! 🚀 Your trusty sidekick for effortlessly backing up your databases to AWS S3. Whether you're a PostgreSQL wizard or a MongoDB maestro, this tool has got your back!

## 🛠️ Features
- **Database Support**: Back up your PostgreSQL and MongoDB databases like a pro! 🥇
- **AWS S3 Integration**: Say goodbye to local storage worries and hello to the cloud! ☁️
- **Retention Policy**: Keep your backups tidy with a configurable retention policy. No more clutter! 🧹
- **Easy Peasy Setup**: Get started in no time with our simple setup process. 🎈

## 📦 Installation

Ready to roll? Install the package with a single command:

```bash
npm install database-backup
```

## 🚀 Usage

Let’s get this backup party started! Here’s how to use the Database Backup Tool:

```javascript
require('dotenv').config(); // Load environment variables from .env file
const AutomatedBackupTool = require('database-backup');

const backupTool = new AutomatedBackupTool({
    database: 'postgres', // Change to 'mongodb' if you want to test MongoDB
    storage: 'aws',
    retention: 7, // Keep backups for 7 days (because who needs clutter?)
    awsCredentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION 
    },
    dbCredentials: {
        postgres: {
            host: process.env.POSTGRES_HOST,
            port: process.env.POSTGRES_PORT,
            user: process.env.POSTGRES_USER,
            password: process.env.POSTGRES_PASSWORD,
            database: process.env.POSTGRES_DATABASE
        },
        mongodb: {
            url: process.env.MONGODB_URL
        }
    }
});

backupTool.backup()
    .then(() => {
        console.log('🎉 Backup process completed successfully! 🎉');
    })
    .catch(error => {
        console.error('😱 Error during backup process:', error);
    });
```

## 🌱 Environment Variables

To make this tool work its magic, you need to set up some environment variables. Create a `.env` file in the root of your project and fill it with your secrets:

```plaintext
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DATABASE=your_database

# AWS Credentials
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_aws_region
```

