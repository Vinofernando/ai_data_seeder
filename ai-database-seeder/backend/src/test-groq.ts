import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

// Inisialisasi klien OpenAI dengan endpoint dasar (baseURL) milik Groq
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function testGroq() {
  console.log("🔍 Menghubungkan ke Groq API...");

  if (!process.env.GROQ_API_KEY) {
    console.error("❌ ERROR: GROQ_API_KEY belum diatur di file .env!");
    return;
  }

  try {
    const completion = await groq.chat.completions.create({
      // Menggunakan model Llama 3.3 yang sangat cerdas dan cepat
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "Anda adalah asisten AI yang membantu developer.",
        },
        {
          role: "user",
          content: "Halo Groq, berapa 1 + 1.",
        },
      ],
      temperature: 0.7,
    });

    console.log("\n✅ KONEKSI GROQ BERHASIL!");
    console.log("Respon AI:", completion.choices[0].message.content);
  } catch (error: any) {
    console.error("\n❌ KONEKSI GROQ GAGAL:");
    console.error(error.message || error);
  }
}

testGroq();
