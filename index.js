import 'dotenv/config';
import wolfjs from 'wolf.js';
const { WOLF } = wolfjs;

const settings = {
    identity: process.env.U_MAIL || 'your_email@example.com',
    secret: process.env.U_PASS || 'your_password',
    taskGroupId: 81889058,
    depositGroupId: 81889058
};

const MY_INFO = {
    myId: "80055399" 
};

const service = new WOLF();

// دالة لتنظيف النص من الرموز غير المرئية التي تظهر في الصور
const cleanText = (text) => {
    return text.replace(/[\u200E\u200F\u202A-\u202E\u2066-\u2069]/g, '');
};

service.on('groupMessage', async (message) => {
    try {
        const rawContent = message.body;
        // تنظيف النص فوراً
        const content = cleanText(rawContent);

        const isTargetGroup = message.targetGroupId === settings.taskGroupId || message.targetGroupId === settings.depositGroupId;
        if (!isTargetGroup) return;

        // التحقق من أن الرسالة موجهة لعضويتك
        if (content.includes("اختبار تحقق سريع") && content.includes(MY_INFO.myId)) {
            
            // 1. استخراج العلامات (الرموز) من نص السؤال
            // يبحث عن نمط "بين العلامتين X و Y"
            const symbolMatch = content.match(/(?:بين|الواقع بين) العلامتين\s*([^\s])\s*و?\s*([^\s])/u);

            if (symbolMatch) {
                const sym1 = symbolMatch[1];
                const sym2 = symbolMatch[2];
                console.log(`تم العثور على العلامات: ${sym1} و ${sym2}`);

                // 2. التركيز فقط على السطر بعد النقطتين ":"
                const parts = content.split(':');
                const targetLine = parts.length > 1 ? parts.slice(1).join(':') : content;

                // 3. البحث عن الإجابة المحصورة بين العلامتين المستخرجتين
                const escape = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = new RegExp(`${escape(sym1)}(.*?)${escape(sym2)}`, 'u');
                
                const result = targetLine.match(pattern);

                if (result && result[1]) {
                    const answer = result[1].trim();
                    console.log(`✅ الإجابة المستخرجة: ${answer}`);
                    
                    setTimeout(async () => {
                        await service.messaging.sendGroupMessage(message.targetGroupId, `#${answer}`);
                    }, 3000);
                } else {
                    console.log("❌ لم يتم العثور على نص بين العلامات في الجزء المحدد.");
                }
            } else {
                console.log("❌ لم يتم استخراج العلامات من السؤال.");
            }
        }
    } catch (err) {
        console.error("خطأ في معالجة الفخ:", err);
    }
});

// --- قسم المهام الدورية ---
service.on('ready', async () => {
    console.log(`🚀 البوت يعمل: نظام استخراج الرموز الذكي مفعل.`);
    try {
        await service.group.joinById(settings.taskGroupId);
        await service.group.joinById(settings.depositGroupId);

        // المهام الدورية
        setInterval(async () => {
            await service.messaging.sendGroupMessage(settings.taskGroupId, "!مد مهام");
            setTimeout(async () => {
                await service.messaging.sendGroupMessage(settings.depositGroupId, "!مد تحالف ايداع كل");
            }, 2000);
        }, 60000); 

        setInterval(async () => {
            await service.messaging.sendGroupMessage(settings.taskGroupId, "!مد صندوق فتح");
        }, 180000); 
    } catch (e) {
        console.error("خطأ في بدء المهام:", e);
    }
});

service.login(settings.identity, settings.secret);
