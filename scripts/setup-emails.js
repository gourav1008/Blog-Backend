const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

async function createAccount() {
    console.log('Generating Ethereal SMTP credentials...');
    
    try {
        const testAccount = await nodemailer.createTestAccount();
        
        console.log('--- NEW SMTP CREDENTIALS ---');
        console.log(`EMAIL_HOST=smtp.ethereal.email`);
        console.log(`EMAIL_PORT=587`);
        console.log(`EMAIL_USER=${testAccount.user}`);
        console.log(`EMAIL_PASS=${testAccount.pass}`);
        console.log('----------------------------');
        
        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        envContent = envContent.replace(/EMAIL_USER=.*/, `EMAIL_USER=${testAccount.user}`);
        envContent = envContent.replace(/EMAIL_PASS=.*/, `EMAIL_PASS=${testAccount.pass}`);
        
        fs.writeFileSync(envPath, envContent);
        console.log('Successfully updated .env with new credentials!');
        console.log('Please restart your backend server if it doesn\'t auto-reload.');
        
    } catch (error) {
        console.error('Failed to generate test account:', error.message);
    }
}

createAccount();
