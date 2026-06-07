import { ApiError } from "@/lib/api";
import { MAX_ATTACHMENT_SIZE } from "@/lib/attachment-config";

export const allowedAttachmentTypes = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
} as const;

export async function validateAttachment(file: File) {
  const extension =
    allowedAttachmentTypes[file.type as keyof typeof allowedAttachmentTypes];
  if (!extension) {
    throw new ApiError(
      400,
      "Format lampiran harus JPEG, PNG, WebP, atau PDF.",
    );
  }

  if (file.size === 0 || file.size > MAX_ATTACHMENT_SIZE) {
    throw new ApiError(400, "Ukuran lampiran harus antara 1 byte dan 10 MB.");
  }

  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  const isValid =
    (file.type === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff) ||
    (file.type === "image/png" &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a) ||
    (file.type === "image/webp" &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP") ||
    (file.type === "application/pdf" &&
      String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-");

  if (!isValid) {
    throw new ApiError(
      400,
      "Isi file tidak sesuai dengan format lampiran yang dipilih.",
    );
  }

  return {
    extension,
    displayName: sanitizeFileName(file.name),
  };
}

export function sanitizeFileName(name: string) {
  const cleaned = name
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "-")
    .trim();
  return (cleaned || "lampiran").slice(0, 180);
}
