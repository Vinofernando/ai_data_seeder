import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

interface GenerateSeederParams {
  schemaSql: string;
  rowCount?: number;
}

export class DatabaseSeederService {
  async generateMockData(params: GenerateSeederParams) {
    const { schemaSql, rowCount = 5 } = params;

    const prompt = `
Anda adalah database seeder AI profesional. Analisis skema SQL DDL PostgreSQL di bawah ini (yang mungkin memiliki banyak tabel berelasi) dan buatkan data tiruan (mock data) yang realistis.

SKEMA SQL DDL:
\`\`\`sql
${schemaSql}
\`\`\`

INSTRUKSI:
1. Identifikasi SEMUA tabel yang ada di dalam skema DDL di atas (misalnya tabel parent seperti Brand/Category, dan tabel child seperti Product).
2. Buatkan ${rowCount} baris data tiruan untuk masing-masing tabel tersebut.
3. **PENTING**: Pastikan tabel parent (yang menjadi rujukan Foreign Key) di-generate terlebih dahulu urutannya, dan ID-nya direferensikan dengan benar oleh tabel child.
4. Berikan output dalam format JSON murni dengan struktur array per tabel agar tidak ada tabel yang tertinggal:
{
  "tables": [
    {
      "tableName": "Brand",
      "sqlInsert": "INSERT INTO \"Brand\" (id, name) VALUES ('brand_uuid_1', 'Samsung'), ('brand_uuid_2', 'Apple');",
      "previewData": [{ "id": "brand_uuid_1", "name": "Samsung" }]
    },
    {
      "tableName": "Product",
      "sqlInsert": "INSERT INTO \"Product\" (id, name, \"brandId\") VALUES ('prod_1', 'Galaxy S24', 'brand_uuid_1');",
      "previewData": [{ "id": "prod_1", "name": "Galaxy S24", "brandId": "brand_uuid_1" }]
    }
  ]
}
5. Jangan sertakan teks penjelasan atau markdown di luar format JSON. Hanya berikan JSON murni.
`;

    try {
      const completion = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content:
              "Anda adalah asisten database yang menghasilkan array query SQL INSERT terstruktur untuk semua tabel dalam format JSON murni.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      });

      const responseText = completion.choices[0].message.content || "";

      const cleanedJsonText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanedJsonText);
      return parsedData;
    } catch (error: any) {
      console.error("❌ Gagal men-generate seeder:", error);
      throw new Error(error.message || "Gagal berkomunikasi dengan Groq AI.");
    }
  }
}
