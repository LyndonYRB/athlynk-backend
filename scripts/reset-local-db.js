import "dotenv/config";
import { prisma } from "../src/config/prisma.js";

function assertLocalDatabase() {
  const databaseUrl = process.env.DATABASE_URL || "";
  const isLocalHost =
    databaseUrl.includes("127.0.0.1") || databaseUrl.includes("localhost");
  const isFitfriendsDb = databaseUrl.includes("/fitfriends");
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction || !isLocalHost || !isFitfriendsDb) {
    throw new Error(
      "Refusing to reset database. This script only runs against the local fitfriends database."
    );
  }
}

async function main() {
  assertLocalDatabase();

  await prisma.$transaction([
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.connection.deleteMany(),
    prisma.report.deleteMany(),
    prisma.block.deleteMany(),
    prisma.swipe.deleteMany(),
    prisma.photo.deleteMany(),
    prisma.preference.deleteMany(),
    prisma.profile.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Local database reset complete.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
