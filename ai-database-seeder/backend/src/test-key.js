import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
// Muat environment variable dari file .env
dotenv.config();
// Inisialisasi SDK Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function testApiKey() {
  console.log("🔍 Mengecek API Key dan koneksi ke Gemini...");
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ ERROR: GEMINI_API_KEY belum diatur di file .env!");
    return;
  }
  try {
    // Uji coba pemanggilan model flash
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash", // Menggunakan model standar yang stabil
      contents:
        "Halo, balas dengan kata 'BERHASIL' jika kamu menerima pesan ini.",
    });
    console.log("\n✅ API KEY ANDA BERHASIL BEKERJA!");
    console.log("Respon dari Gemini:", response.text);
  } catch (error) {
    console.error("\n❌ API KEY GAGAL ATAU TERJADI KESALAHAN:");
    console.error(error.message || error);
  }
}
testApiKey();
