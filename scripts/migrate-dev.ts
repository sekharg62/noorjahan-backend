import "dotenv/config";
import { execSync } from "node:child_process";

const directUrl = process.env.DIRECT_URL;
const migrationName = process.argv[2];
const createOnly = process.argv.includes("--create-only");

if (!directUrl) {
  throw new Error("DIRECT_URL is required in .env for migrations");
}

if (!migrationName) {
  throw new Error(
    "Migration name is required. Example: npm run prisma:migrate -- add_product_img_table",
  );
}

const createOnlyFlag = createOnly ? " --create-only" : "";

execSync(
  `npx prisma migrate dev --name ${migrationName}${createOnlyFlag} --url "${directUrl}"`,
  { stdio: "inherit" },
);
