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

const escapeRegExp = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

service.on('groupMessage', async (message) => {
    try {
        const content = message.body;
        const isTargetGroup = message.targetGroupId === settings.taskGroupId || message.targetGroupId === settings.depositGroupId;
        if (!isTargetGroup) return;

        if (content.includes("تحقق") && content.includes(MY_INFO.myId)) {
            
            // 1. استخراج الرموز من الرسالة
            const symbolMatch = content.match(/العلامتين\s*([^\s\w\u0600-\u06FF])\s*و\s*([^\s\w\u0600-\u06FF])/u);

            if (symbolMatch) {
                const sym1 = symbolMatch[1];
                const sym2 = symbolMatch[2];
                console.log(`✅ تم تحديد العلامات: [${sym1}] و [${sym2}]`);

                // 2. البحث عن كافة المطابقات في النص كاملاً
                const pattern = new RegExp(`${escapeRegExp(sym1)}(.*?)${escapeRegExp(sym2)}`, 'gu');
                const allMatches = [...content.matchAll(pattern)];

                // 3. المنطق الجديد: إذا وجد أكثر من مطابقة، نأخذ الثانية (تجاهل الأولى الخاصة بالتعليمات)
                // إذا وجد مطابقة واحدة فقط، نستخدمها هي
                let targetResult;
                if (allMatches.length > 1) {
                    targetResult = allMatches[1]; // نأخذ المطابقة الثانية
                    console.log(`🔎 تم العثور على ${allMatches.length} مطابقات، سأستخدم الثانية (تجاهل التعليمات).`);
                } else if (allMatches.length === 1) {
                    targetResult = allMatches[0];
                    console.log(`🔎 تم العثور على مطابقة واحدة فقط.`);
                }

                if (targetResult && targetResult[1]) {
                    const answer = targetResult[1].trim();
                    console.log(`🚀 الإجابة النهائية المحددة: ${answer}`);
                    
                    setTimeout(async () => {
                        await service.messaging.sendGroupMessage(message.targetGroupId, `#${answer}`);
                    }, 3000);
                } else {
                    console.log("❌ لم أجد نصاً بين العلامتين.");
                }
            } else {
                console.log("❌ فشل استخراج العلامات من نص السؤال.");
            }
        }
    } catch (err) {
        console.error("خطأ في معالجة الفخ:", err);
    }
});

// --- قسم المهام الدورية ---
service.on('ready', async () => {
    console.log(`🚀 البوت يعمل الآن - نظام تجاهل التعليمات مفعل.`);
    try {
        await service.group.joinById(settings.taskGroupId);
        await service.group.joinById(settings.depositGroupId);

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
        console.error("خطأ في المهام:", e);
    }
});

service.login(settings.identity, settings.secret);
