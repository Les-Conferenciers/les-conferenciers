export type PennylaneInvoice = {
  status: string;
  pennylane_sent_at?: string | null;
  pennylane_error?: string | null;
};

export function pennylaneStatus(invoice: PennylaneInvoice) {
  if (invoice.status !== "sent" && invoice.status !== "paid") return "hidden";
  if (invoice.pennylane_error) return "failed";
  if (invoice.pennylane_sent_at) return "sent";
  return "pending";
}