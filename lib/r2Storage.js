// lib/r2Storage.js — Cloudflare R2 (S3-compatible) storage service
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function validateEnv() {
  const required = ["R2_BUCKET", "R2_ENDPOINT", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length) throw new Error(`Missing R2 env vars: ${missing.join(", ")}`);
}

let client = null;
function getClient() {
  if (client) return client;
  validateEnv();
  client = new S3Client({
    region: "auto",
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
  });
  return client;
}

const bucket = () => process.env.R2_BUCKET;

export async function uploadBuffer(key, buffer, contentType = "application/octet-stream") {
  const c = getClient();
  await c.send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: buffer, ContentType: contentType }));
  return key;
}

export async function uploadFile(key, filePath, contentType) {
  const fs = await import("node:fs");
  const buf = fs.readFileSync(filePath);
  return uploadBuffer(key, buf, contentType);
}

export async function downloadBuffer(key) {
  const c = getClient();
  const res = await c.send(new GetObjectCommand({ Bucket: bucket(), Key: key }));
  const chunks = [];
  for await (const chunk of res.Body) chunks.push(chunk);
  return Buffer.concat(chunks);
}

export async function deleteObject(key) {
  const c = getClient();
  await c.send(new DeleteObjectCommand({ Bucket: bucket(), Key: key }));
}

export async function exists(key) {
  const c = getClient();
  try { await c.send(new HeadObjectCommand({ Bucket: bucket(), Key: key })); return true; }
  catch { return false; }
}

export async function signedUrl(key, expiresIn = 3600) {
  const c = getClient();
  return getSignedUrl(c, new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}

export async function listObjects(prefix = "") {
  const c = getClient();
  const res = await c.send(new ListObjectsV2Command({ Bucket: bucket(), Prefix: prefix }));
  return (res.Contents || []).map((o) => o.Key);
}
  uploads: "uploads/",
  generated: "generated/",
  pdfs: "pdfs/",
  exports: "exports/",
  images: "images/",
  leadMagnets: "lead-magnets/",
  customerAssets: "customer-assets/",
  temp: "temp/",
};
