import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  ApiError,
  assertSupabaseResult,
  handleApiError,
  requirePinSession,
} from "@/lib/api";
import {
  allowedAttachmentTypes,
  sanitizeFileName,
  validateAttachment,
} from "@/lib/attachments";
import {
  ATTACHMENT_BUCKET,
  MAX_ATTACHMENT_SIZE,
} from "@/lib/attachment-config";
import { getSupabaseAdmin } from "@/lib/supabase";
import { parseJson } from "@/lib/validation";

type Context = { params: Promise<{ id: string }> };
const attachmentMetadataSchema = z.object({
  name: z.string().trim().min(1).max(255),
  type: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ]),
  size: z.number().int().positive().max(MAX_ATTACHMENT_SIZE),
});
const finalizeAttachmentSchema = attachmentMetadataSchema.extend({
  path: z.string().min(1).max(500),
});

async function getTransaction(id: string) {
  const result = await getSupabaseAdmin()
    .from("transactions")
    .select(
      "id,attachment_path,attachment_name,attachment_type,attachment_size",
    )
    .eq("id", id)
    .single();

  if (result.error) {
    throw new ApiError(
      result.error.code === "PGRST116" ? 404 : 500,
      result.error.code === "PGRST116"
        ? "Transaksi tidak ditemukan."
        : result.error.message,
    );
  }
  return result.data;
}

export async function GET(request: NextRequest, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const transaction = await getTransaction(id);

    if (
      !transaction.attachment_path ||
      !transaction.attachment_name ||
      !transaction.attachment_type
    ) {
      throw new ApiError(404, "Transaksi ini tidak memiliki lampiran.");
    }

    const download = request.nextUrl.searchParams.get("download") === "1";
    const result = await getSupabaseAdmin().storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUrl(transaction.attachment_path, 60, {
        download: download ? transaction.attachment_name : false,
      });
    if (result.error || !result.data?.signedUrl) {
      throw new ApiError(404, "File lampiran tidak ditemukan di storage.");
    }
    return NextResponse.redirect(result.data.signedUrl, 307);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    await getTransaction(id);
    const metadata = await parseJson(request, attachmentMetadataSchema);
    const extension =
      allowedAttachmentTypes[
        metadata.type as keyof typeof allowedAttachmentTypes
      ];
    const path = `${id}/${crypto.randomUUID()}.${extension}`;
    const result = await getSupabaseAdmin().storage
      .from(ATTACHMENT_BUCKET)
      .createSignedUploadUrl(path);
    if (result.error || !result.data?.token) {
      throw new ApiError(
        500,
        `Gagal membuat izin upload: ${result.error?.message ?? "Token tidak tersedia."}`,
      );
    }

    return NextResponse.json({
      data: {
        path,
        token: result.data.token,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const transaction = await getTransaction(id);
    const metadata = await parseJson(request, finalizeAttachmentSchema);
    const expectedExtension =
      allowedAttachmentTypes[
        metadata.type as keyof typeof allowedAttachmentTypes
      ];
    const pathPattern = new RegExp(
      `^${id}/[0-9a-f-]{36}\\.${expectedExtension}$`,
    );
    if (!pathPattern.test(metadata.path)) {
      throw new ApiError(400, "Path lampiran tidak valid.");
    }

    const supabase = getSupabaseAdmin();
    const downloadResult = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .download(metadata.path);
    if (downloadResult.error || !downloadResult.data) {
      throw new ApiError(400, "File upload tidak ditemukan.");
    }
    if (downloadResult.data.size !== metadata.size) {
      await supabase.storage.from(ATTACHMENT_BUCKET).remove([metadata.path]);
      throw new ApiError(400, "Ukuran file upload tidak sesuai.");
    }

    try {
      await validateAttachment(
        new File([downloadResult.data], metadata.name, {
          type: metadata.type,
        }),
      );
    } catch (error) {
      await supabase.storage.from(ATTACHMENT_BUCKET).remove([metadata.path]);
      throw error;
    }

    const updateResult = await supabase
      .from("transactions")
      .update({
        attachment_path: metadata.path,
        attachment_name: sanitizeFileName(metadata.name),
        attachment_type: metadata.type,
        attachment_size: metadata.size,
      })
      .eq("id", id)
      .select(
        "id,attachment_path,attachment_name,attachment_type,attachment_size",
      )
      .single();

    if (updateResult.error) {
      await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([metadata.path]);
      assertSupabaseResult(updateResult, "Gagal menyimpan metadata lampiran.");
    }

    if (transaction.attachment_path) {
      const removeResult = await supabase.storage
        .from(ATTACHMENT_BUCKET)
        .remove([transaction.attachment_path]);
      if (removeResult.error) {
        console.error("Gagal membersihkan lampiran lama:", removeResult.error);
      }
    }

    return NextResponse.json({ data: updateResult.data });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, context: Context) {
  try {
    await requirePinSession();
    const { id } = await context.params;
    z.string().uuid().parse(id);
    const transaction = await getTransaction(id);

    if (!transaction.attachment_path) {
      return NextResponse.json({ success: true });
    }

    const supabase = getSupabaseAdmin();
    const updateResult = await supabase
      .from("transactions")
      .update({
        attachment_path: null,
        attachment_name: null,
        attachment_type: null,
        attachment_size: null,
      })
      .eq("id", id);
    assertSupabaseResult(updateResult, "Gagal menghapus metadata lampiran.");

    const removeResult = await supabase.storage
      .from(ATTACHMENT_BUCKET)
      .remove([transaction.attachment_path]);
    if (removeResult.error) {
      console.error("Gagal menghapus file lampiran:", removeResult.error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
