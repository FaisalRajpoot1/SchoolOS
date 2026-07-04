/**
 * Pure installment-plan helpers. An invoice's net payable can be split into a
 * sequence of scheduled installments; recorded payments are allocated to those
 * installments in `seq` order (a waterfall) to derive each one's status.
 */

export type InstallmentStatus = 'PAID' | 'PARTIAL' | 'OVERDUE' | 'UPCOMING';

export interface PlanInstallment {
  seq: number;
  label: string | null;
  dueDate: Date;
  amount: number;
}

export interface AllocatedInstallment extends PlanInstallment {
  /** Portion of the total paid that falls to this installment (0..amount). */
  allocated: number;
  status: InstallmentStatus;
}

/**
 * Allocates `paid` across `installments` in ascending `seq` order and derives
 * each installment's status. `now` is the reference instant for overdue checks.
 * Earlier installments are filled first; a later one only receives money once
 * every earlier one is fully covered.
 */
export const allocateInstallments = (
  installments: PlanInstallment[],
  paid: number,
  now: Date,
): AllocatedInstallment[] => {
  const sorted = [...installments].sort((a, b) => a.seq - b.seq);
  let remaining = Math.max(0, paid);
  return sorted.map((inst) => {
    const allocated = Math.min(inst.amount, remaining);
    remaining -= allocated;
    let status: InstallmentStatus;
    if (allocated >= inst.amount) status = 'PAID';
    else if (inst.dueDate.getTime() < now.getTime()) status = 'OVERDUE';
    else if (allocated > 0) status = 'PARTIAL';
    else status = 'UPCOMING';
    return { ...inst, allocated, status };
  });
};

/** Total scheduled across a plan (sum of installment amounts). */
export const scheduledTotal = (installments: { amount: number }[]): number =>
  installments.reduce((acc, i) => acc + i.amount, 0);
