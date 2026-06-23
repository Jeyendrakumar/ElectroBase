import { createClient } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";

// Execute SQL commands directly on Turso to create tables
async function run() {
  const url = "libsql://electrobase-selvaux.aws-ap-south-1.turso.io";
  const authToken = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODIyMTYxMjAsImlkIjoiMDE5ZWY0NWEtODgwMS03ZTY1LWFjZTMtMjEzY2FkYjFiYjVhIiwicmlkIjoiYzE5ZTcyMWMtMmU3OS00NDcxLThmYzMtMjAwZDAwNjBiZTFiIn0.n50Tw-FMrhexz0oWP8_ckanW62wUvtr2A0V0hBIKBWcfHQyQK_IPB9mUrvrIlOfMWEHeXZM5FD8uVO705qsxDQ";

  console.log("Connecting to Turso to push schema tables...");
  const client = createClient({ url, authToken });

  const statements = [
    `CREATE TABLE IF NOT EXISTS "Component" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "category" TEXT NOT NULL,
      "manufacturer" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "datasheetUrl" TEXT,
      "imageUrl" TEXT,
      "footprint" TEXT,
      "packageType" TEXT,
      "pinCount" INTEGER,
      "tags" TEXT NOT NULL DEFAULT '',
      "isFeatured" INTEGER NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "PinConfiguration" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "componentId" TEXT NOT NULL,
      "pinNumber" INTEGER NOT NULL,
      "pinName" TEXT NOT NULL,
      "description" TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS "Specification" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "componentId" TEXT NOT NULL,
      "parameter" TEXT NOT NULL,
      "value" TEXT NOT NULL,
      "unit" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "slug" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "icon" TEXT
    );`,
    `CREATE TABLE IF NOT EXISTS "Footprint" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL UNIQUE,
      "description" TEXT,
      "dimensions" TEXT,
      "imageUrl" TEXT,
      "recommendedLayout" TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS "Component_category_idx" ON "Component"("category");`,
    `CREATE INDEX IF NOT EXISTS "Component_manufacturer_idx" ON "Component"("manufacturer");`,
    `CREATE INDEX IF NOT EXISTS "Component_name_idx" ON "Component"("name");`,
    `CREATE INDEX IF NOT EXISTS "PinConfiguration_componentId_idx" ON "PinConfiguration"("componentId");`,
    `CREATE INDEX IF NOT EXISTS "Specification_componentId_idx" ON "Specification"("componentId");`
  ];

  for (const sql of statements) {
    try {
      await client.execute(sql);
      console.log("Executed SQL statement successfully.");
    } catch (err) {
      console.error("Error executing statement:", err);
    }
  }

  console.log("Database schema synced successfully on Turso!");
  client.close();
}

run();
