import { describe, expect, it } from "vitest";
import { pennylaneStatus } from "../lib/pennylaneStatus";

describe("Pennylane invoice tracking", () => {
  it("tracks sent invoices with the recorded sending date", () => {
    expect(pennylaneStatus({ status: "sent", pennylane_sent_at: "2026-11-12T11:04:00Z" })).toBe("sent");
  });
  it("tracks paid invoices with the recorded sending date", () => {
    expect(pennylaneStatus({ status: "paid", pennylane_sent_at: "2026-11-12T11:04:00Z" })).toBe("sent");
  });
  it("shows a failed resend even when a previous send succeeded", () => {
    expect(pennylaneStatus({ status: "sent", pennylane_sent_at: "2026-11-12T11:04:00Z", pennylane_error: "Send rejected" })).toBe("failed");
  });
  it("does not claim success for invoices without a recorded send", () => {
    expect(pennylaneStatus({ status: "paid" })).toBe("pending");
  });
  it("hides tracking on drafts", () => {
    expect(pennylaneStatus({ status: "draft" })).toBe("hidden");
  });
});