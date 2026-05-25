import 'dotenv/config';
import wolfjs from 'wolf.js';
import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Jimp = require('jimp');

console.log("🚀 جاري تشغيل البوت...");

const { WOLF } = wolfjs;
const client = new WOLF();

const TARGET_USER_ID = 51660277;
const CHANNEL_ID = 81889058;

client.on('ready', async () => {
    console.log("✅ البوت متصل ومستعد!");
    await client.group.joinById(CHANNEL_ID);
});

client.on('groupMessage', async (message) => {
    if (message.sourceSubscriberId == TARGET_USER_ID && message.targetGroupId == CHANNEL_ID) {
        const imageUrl = message.body || (message.attachments && message.attachments[0]?.link);

        if (imageUrl && (imageUrl.endsWith('.jpg') || imageUrl.endsWith('.jpeg') || imageUrl.endsWith('.png'))) {
            console.log("📸 اكتشفت صورة! جاري المعالجة...");
            try {
                const code = await processImage(imageUrl);
                console.log("🎯 الرمز المستخرج هو:", code);
            } catch (err) {
                console.error("❌ خطأ أثناء المعالجة:", err.message);
            }
        }
    }
});

async function processImage(url) {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    
    const processed = await sharp(Buffer.from(arrayBuffer))
        .greyscale()
        .normalize()
        .threshold(128)
        .toBuffer();

    const worker = await createWorker('eng+ara');
    const { data: { text } } = await worker.recognize(processed);
    await worker.terminate();

    return text.replace(/[^a-zA-Z0-9]/g, '').trim();
}

client.login(process.env.U_MAIL, process.env.U_PASS).catch(e => console.error("❌ خطأ تسجيل الدخول:", e));
