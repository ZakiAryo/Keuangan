import { z } from "zod";
import { ApiError } from "@/lib/api";

const id = z.string().uuid();
const money = z.coerce.number().positive();
const date = z.string().date();

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#70e1b0"),
  icon: z.string().trim().max(40).nullable().optional(),
});

export const walletSchema = z.object({
  name: z.string().trim().min(1).max(80),
  type: z.string().trim().min(1).max(40),
  initial_balance: z.coerce.number().min(0).default(0),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#70e1b0"),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: money,
  description: z.string().trim().min(1).max(180),
  transaction_date: date,
  category_id: id,
  wallet_id: id,
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const budgetSchema = z.object({
  category_id: id,
  month: date,
  amount: money,
});

export const transferSchema = z
  .object({
    from_wallet_id: id,
    to_wallet_id: id,
    amount: money,
    fee: z.coerce.number().min(0).default(0),
    transfer_date: date,
    notes: z.string().trim().max(1000).nullable().optional(),
  })
  .refine((value) => value.from_wallet_id !== value.to_wallet_id, {
    message: "Wallet asal dan tujuan harus berbeda.",
    path: ["to_wallet_id"],
  });

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>,
) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ApiError(400, "Request body harus berupa JSON yang valid.");
  }
  return schema.parse(body);
}
