import { describe, it, expect } from "vitest";
import { linesFromProposalSpeakers, commissionFromProposalSpeakers } from "@/lib/proposalContractLines";

describe("montants proposition -> contrat", () => {
  it("la ligne conférencier reprend le cachet de la proposition, pas le total avec commission", () => {
    const lines = linesFromProposalSpeakers([{ speaker_fee: 3500, agency_commission: 1500, travel_costs: 0, speakers: { name: "X" } } as any]);
    expect(lines).toHaveLength(1);
    expect(lines[0].amount_ht).toBe(3500);
  });
  it("la commission vient de la proposition", () => {
    expect(commissionFromProposalSpeakers([{ speaker_fee: 3500, agency_commission: 1200 }])).toBe(1200);
  });
  it("les frais de déplacement deviennent une ligne séparée", () => {
    const lines = linesFromProposalSpeakers([{ speaker_fee: 3000, travel_costs: 400 }]);
    expect(lines.map(l => [l.type, l.amount_ht])).toEqual([["speaker", 3000], ["travel", 400]]);
  });
});
