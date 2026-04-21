const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

async function checkAdmins() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blog');
        const User = mongoose.model('User', new mongoose.Schema({
            email: String,
            role: String,
            name: String
        }));

        const admins = await User.find({ role: { $in: ['admin', 'editor'] } });
        console.log('Admins found:');
        admins.forEach(admin => {
            console.log(`- ${admin.name} (${admin.email}): ${admin.role}`);
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkAdmins();
