import Fastify from "fastify";
import cors from "@fastify/cors";
import dotenv from "dotenv";
import { DatabaseSeederService } from "./service/database-seeder.service";

dotenv.config();

const app = Fastify({ logger: true });
const seederService = new DatabaseSeederService();

interface SeederRequestBody {
  schemaSql: string;
  rowCount?: number;
}

async function main() {
  // Daftarkan CORS agar bisa diakses oleh frontend React
  await app.register(cors, { origin: true });

  // Endpoint untuk generate mock data & SQL Insert dari DDL
  app.post<{ Body: SeederRequestBody }>(
    "/api/generate-seeder",
    async (request, reply) => {
      try {
        const { schemaSql, rowCount } = request.body;

        if (!schemaSql) {
          return reply.status(400).send({
            success: false,
            message: "Skema SQL DDL (schemaSql) tidak boleh kosong!",
          });
        }

        request.log.info("Menerima permintaan generate seeder database...");

        // Panggil service yang menggunakan Groq AI
        const result = await seederService.generateMockData({
          schemaSql,
          rowCount: rowCount || 5, // Default 5 baris jika tidak diisi
        });

        return {
          success: true,
          data: result,
        };
      } catch (error: any) {
        request.log.error(error);
        return reply.status(500).send({
          success: false,
          message:
            error.message ||
            "Terjadi kesalahan pada server saat memproses seeder.",
        });
      }
    },
  );

  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`🚀 Server backend berjalan di http://localhost:${PORT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
