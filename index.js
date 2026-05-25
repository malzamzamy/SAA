import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;
const client = new WOLF();

client.on('ready', async () => {
    console.log("🚀 البوت متصل وبانتظار الرسائل للفحص...");
});

// هذا المعالج لا يقوم بأي فلترة، سيطبع كل رسالة تصل
client.on('groupMessage', async (message) => {
    console.log("--- [رسالة جديدة وصلت] ---");
    console.log(JSON.stringify(message, null, 2)); // طباعة هيكل الرسالة بالكامل
});

client.login(process.env.U_MAIL, process.env.U_PASS);
