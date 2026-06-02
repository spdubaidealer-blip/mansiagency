import { promises as fs } from "fs";
import path from "path";

/**
 * Saves a File object from FormData to public/uploads
 * @param file The File object to upload
 * @returns The relative public URL path (e.g. /uploads/1712345678-123456.png)
 */
export async function uploadFile(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Define upload directory path
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  
  // Ensure the directory exists
  await fs.mkdir(uploadDir, { recursive: true });

  // Generate a unique filename using timestamp and random number
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.name) || ".png";
  const filename = `${uniqueSuffix}${ext}`;
  const filePath = path.join(uploadDir, filename);

  // Write file to local filesystem
  await fs.writeFile(filePath, buffer);

  // Return the public path
  return `/uploads/${filename}`;
}
