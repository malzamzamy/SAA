import 'dotenv/config';
import wolfjs from 'wolf.js';

const { WOLF } = wolfjs;
const client = new WOLF();

// تأكد من هذه الأرقام جيداً (هل هي نفس المستخدم ونفس المجموعة؟)
const TARGET_USER_ID = 51660277;
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("🚀 البوت متصل! سأطبع هنا أي رسالة تصلني...");
});

client.on('groupMessage', async (message) => {
    // 1. طباعة كل رسالة تصل للقناة (لنرى هل البوت يرى الرسائل أم لا)
    console.log(`📩 رسالة جديدة من ID: ${message.sourceSubscriberId} في قناة: ${message.targetGroupId}`);
    
    // 2. التحقق من الشروط
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        console.log("✅ المستخدم والقناة مطابقين!");
        
        // التحقق من وجود مرفقات
        if (message.attachments && message.attachments.length > 0) {
            console.log("🖼️ تم العثور على صورة! الرابط هو:", message.attachments[0].link);
        } else {
            console.log("📝 هذه رسالة نصية فقط (سأتجاهلها).");
        }
    } else {
        console.log("❌ الرسالة لا تخص المستخدم أو القناة المحددة.");
    }
});

client.login(process.env.U_MAIL, process.env.U_PASS);
