import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = 'AIzaSyBPR7jm6_v0ESdnLanaln8DLHQWLTFulZs'; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function listModels() {
    try {
        const response = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).getGenerativeModel; // هذا لا يهم، نريد فقط استدعاء المكتبة
        const models = await genAI.listModels();
        console.log("الموديلات المتاحة لك هي:");
        models.models.forEach(m => console.log(m.name));
    } catch (e) {
        console.error("خطأ في الاتصال:", e.message);
    }
}
listModels();

