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
            
            // --- 1. فخ الرموز (مع تجاهل أول ظهور) ---
            if (content.includes("العلامتين")) {
                const symbolMatch = content.match(/العلامتين\s*([^\s\w\u0600-\u06FF])\s*و\s*([^\s\w\u0600-\u06FF])/u);
                if (symbolMatch) {
                    const pattern = new RegExp(`${escapeRegExp(symbolMatch[1])}(.*?)${escapeRegExp(symbolMatch[2])}`, 'gu');
                    const allMatches = [...content.matchAll(pattern)];
                    if (allMatches.length > 0) {
                        const target = allMatches.length > 1 ? allMatches[1] : allMatches[0];
                        await service.messaging.sendGroupMessage(message.targetGroupId, `#${target[1].trim()}`);
                    }
                }
            } 
            
            // --- 2. فخ القوسين () ---
            else if (content.includes("داخل القوسين")) {
                const match = content.match(/\((.*?)\)/);
                if (match) await service.messaging.sendGroupMessage(message.targetGroupId, `#${match[1].trim()}`);
            }

            // --- 3. فخ الأقواس المعقوفة {} ---
            else if (content.includes("الأقواس المعقوفة")) {
                const match = content.match(/\{(.*?)\}/);
                if (match) await service.messaging.sendGroupMessage(message.targetGroupId, `#${match[1].trim()}`);
            }

            // --- 4. فخ الاتجاهات (يمين / يسار) مع خاصية "تجاهل أول ظهور" ---
            else if (content.includes("يمين") || content.includes("يسار")) {
                const symMatch = content.match(/للعلامة\s*([^\s])/u);
                const dirMatch = content.match(/(اليمين|يمين|اليسار|يسار)/u);

                if (symMatch && dirMatch) {
                    const sym = symMatch[1]; 
                    const direction = dirMatch[0]; 
                    
                    // نستخدم الـ 'g' (global) هنا ليتمكن matchAll من إيجاد كافة النتائج
                    const regex = new RegExp(`([^\\s]+)\\s*${escapeRegExp(sym)}\\s*([^\\s]+)`, 'gu');
                    const allMatches = [...content.matchAll(regex)];

                    if (allMatches.length > 0) {
                        // المنطق: إذا وجدنا أكثر من نتيجة، نختار الثانية (index 1) لتجاهل الأولى
                        const targetMatch = allMatches.length > 1 ? allMatches[1] : allMatches[0];
                        
                        let answer = "";
                        if (direction.includes("يمين")) {
                            answer = targetMatch[2]; // الكلمة بعد الرمز
                        } else {
                            answer = targetMatch[1]; // الكلمة قبل الرمز
                        }
                        
                        console.log(`✅ تم معالجة الاتجاه [${direction}] بنجاح. الإجابة: ${answer}`);
                        await service.messaging.sendGroupMessage(message.targetGroupId, `#${answer}`);
                    }
                }
            }
        }
    } catch (err) {
        console.error("خطأ في معالجة الفخ:", err);
    }
});

// --- قسم المهام الدورية ---
service.on('ready', async () => {
    console.log(`🚀 النظام جاهز: فخاخ الاتجاهات (تجاهل الأولى) مفعلة.`);
    try {
        await service.group.joinById(settings.taskGroupId);
        await service.group.joinById(settings.depositGroupId);
        // ... (بقية المهام الدورية كما هي)
    } catch (e) {
        console.error("خطأ في المهام:", e);
    }
});

service.login(settings.identity, settings.secret);
