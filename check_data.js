require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const Post = mongoose.model('Post', new mongoose.Schema({}));
        const count = await mongoose.connection.db.collection('posts').countDocuments();
        console.log(`PO$T_COUNT:${count}`);
        await mongoose.connection.close();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
