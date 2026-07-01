export type RiskType = 'ATTENDANCE' | 'PERFORMANCE' | 'FEES';

export interface RiskStudent {
  studentId: string;
  name: string;
  admissionNo: string;
  className: string;
  riskScore: number;
  reasons: { type: RiskType; detail: string }[];
}

export interface Insights {
  summary: {
    totalFlagged: number;
    attendanceRisk: number;
    performanceRisk: number;
    feeRisk: number;
  };
  students: RiskStudent[];
}

export type GenerateKind = 'homework' | 'questions';

export interface GeneratePayload {
  kind: GenerateKind;
  subject: string;
  topic: string;
  grade: string;
  count: number;
}

export interface AiResult {
  content: string;
  source: 'ai' | 'rules';
}
