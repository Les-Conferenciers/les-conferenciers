export type ProposalSpeakerAmounts = {
  speaker_fee?: number | null;
  travel_costs?: number | null;
  agency_commission?: number | null;
  speakers?: { name?: string | null } | null;
};

export type BuiltLine = { id: string; label: string; amount_ht: number; tva_rate: number; type: "speaker" | "travel" | "custom" };

const rid = () => Math.random().toString(36).slice(2, 10);

/** Lignes de contrat issues de la proposition : cachet (sans commission) + frais de déplacement éventuels. */
export function linesFromProposalSpeakers(list: ProposalSpeakerAmounts[]): BuiltLine[] {
  const lines: BuiltLine[] = [];
  list.forEach((ps, i) => {
    lines.push({ id: rid(), label: ps.speakers?.name || `Conférencier ${i + 1}`, amount_ht: Number(ps.speaker_fee) || 0, tva_rate: 20, type: "speaker" });
    const travel = Number(ps.travel_costs) || 0;
    if (travel > 0) lines.push({ id: rid(), label: "Frais de déplacement", amount_ht: travel, tva_rate: 20, type: "travel" });
  });
  return lines;
}

/** Commission agence issue de la proposition. */
export function commissionFromProposalSpeakers(list: ProposalSpeakerAmounts[]): number {
  return list.reduce((s, ps) => s + (Number(ps.agency_commission) || 0), 0);
}
