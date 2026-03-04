import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

const adapter = new PrismaLibSql({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function main() {
  const existingBoard = await prisma.board.findFirst();
  if (existingBoard) {
    console.log("Database already seeded, skipping.");
    return;
  }

  console.log("Seeding database...");

  const board = await prisma.board.create({
    data: {
      name: "My First Board",
      description: "A starter board to get you going.",
      color: null,
      position: 1000,
    },
  });

  const columns = [
    { name: "To Do", position: 0 },
    { name: "In Progress", position: 1000 },
    { name: "Blocked", position: 2000 },
    { name: "Completed", position: 3000 },
  ];

  for (const col of columns) {
    await prisma.column.create({
      data: {
        name: col.name,
        position: col.position,
        boardId: board.id,
      },
    });
  }

  const labels = [
    { name: "Bug", color: "red" },
    { name: "Feature", color: "blue" },
    { name: "Won't Fix", color: "volcano" },
    { name: "Backlog", color: "default" },
  ];

  for (const label of labels) {
    await prisma.label.create({
      data: {
        name: label.name,
        color: label.color,
        boardId: board.id,
      },
    });
  }

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
