/**
 * Four-Tier Schema Alignment for quiz/exam question validation.
 *
 * Tier 1: Ground Truth Index Validation — options[correct_index] matches answer_value
 * Tier 2: Realignment via Schema Fields — answer_value found in options at different index → auto-fix
 * Tier 3: Regex Fallback on explanation_html — extract numbers, match against options
 * Tier 4: Apology Token Detection — reject if explanation contains self-correction language
 *
 * Returns the validated question (with corrected indices) or null if uncorrectable.
 */

// Regex for self-correction/apology tokens — tuned to avoid false positives on instructional prose.
const APOLOGY_REGEX = /(?:oh\s+)?maaf|salah\s+(?:hitung|perhitungan)|koreksi\s+hasil/i;

const CLASS_CONSTRAINTS: Record<number, { maxNum: number; ops: string; steps: number; maxSentences: number }> = {
  1: { maxNum: 50, ops: "Penjumlahan dan pengurangan saja", steps: 1, maxSentences: 1 },
  2: { maxNum: 100, ops: "Penjumlahan dan pengurangan saja", steps: 1, maxSentences: 2 },
  3: { maxNum: 500, ops: "Penjumlahan, pengurangan, perkalian dasar", steps: 2, maxSentences: 2 },
  4: { maxNum: 500, ops: "Penjumlahan, pengurangan, perkalian dasar", steps: 2, maxSentences: 2 },
  5: { maxNum: 1_000, ops: "Penjumlahan, pengurangan, perkalian, pembagian", steps: 3, maxSentences: 3 },
  6: { maxNum: 1_000, ops: "Penjumlahan, pengurangan, perkalian, pembagian", steps: 3, maxSentences: 3 },
  7: { maxNum: 10_000, ops: "Penjumlahan, pengurangan, perkalian, pembagian", steps: 4, maxSentences: 4 },
  8: { maxNum: 10_000, ops: "Penjumlahan, pengurangan, perkalian, pembagian", steps: 4, maxSentences: 4 },
  9: { maxNum: 10_000, ops: "Penjumlahan, pengurangan, perkalian, pembagian, operasi campuran", steps: 4, maxSentences: 4 },
};

export function getClassConstraints(kelas: number | null) {
  if (!kelas || kelas < 1 || kelas > 9) return null;
  return CLASS_CONSTRAINTS[kelas];
}

export function getClassConstraintBlock(kelas: number | null): string {
  const c = getClassConstraints(kelas);
  if (!c) return "";
  return [
    `MAKSIMAL ANGKA: Semua angka dalam soal dan pilihan TIDAK BOLEH lebih besar dari ${c.maxNum}.`,
    `OPERASI: ${c.ops}.`,
    `MAKSIMAL LANGKAH: ${c.steps} langkah penyelesaian per soal.`,
    `MAKSIMAL KALIMAT: ${c.maxSentences} kalimat per soal.`,
  ].join("\n");
}

export function normalizeDigits(val: string): string {
  return val.replace(/[^\d]/g, "");
}

/**
 * Validate and auto-correct a single question using Four-Tier alignment.
 * Returns the question object (mutated in place) or null if it must be dropped.
 */
export function validateAndAlignQuestion(q: any): any | null {
  if (!q.question || !Array.isArray(q.options) || q.options.length !== 4) {
    return null;
  }

  const answerValue = q.answer_value;
  if (answerValue === undefined || answerValue === null) {
    console.warn("[quiz-validation] Dropped: no answer_value");
    return null;
  }

  const cleanAnswer = String(answerValue).trim();
  const normAnswer = normalizeDigits(cleanAnswer);

  // Tier 4: Apology Token Detection — reject self-correction text
  if (q.explanation_html && APOLOGY_REGEX.test(q.explanation_html)) {
    console.warn(`[quiz-validation] Tier 4: Self-correction detected in explanation, dropping question: "${q.question?.slice(0, 50)}"`);
    return null;
  }

  // Normalize all options (strip non-digit formatting like ".", "meter", "Rp", etc.)
  const normOptions = q.options.map((o: string) => normalizeDigits(String(o).trim()));

  // Detect duplicate normalized options
  const seen = new Set<string>();
  for (const no of normOptions) {
    if (seen.has(no)) {
      console.warn(`[quiz-validation] Duplicate option normalized=${no} in: ${q.options.join(" | ")}`);
    }
    seen.add(no);
  }

  // Tier 1: Ground Truth Index Validation
  const optionAtCorrectIndex = String(q.options[q.correct_index] || "").trim();
  if (normalizeDigits(optionAtCorrectIndex) === normAnswer) {
    return q;
  }

  // Tier 2: Realignment via Schema Fields
  const correctOptionIndex = normOptions.indexOf(normAnswer);
  if (correctOptionIndex !== -1) {
    console.info(`[quiz-validation] Tier 2: Corrected index ${q.correct_index} → ${correctOptionIndex} for "${answerValue}"`);
    q.correct_index = correctOptionIndex;
    return q;
  }

  // Tier 2b: Numeric fallback (parseFloat for decimals)
  const answerNum = parseFloat(normAnswer);
  if (!isNaN(answerNum)) {
    const numericIndex = normOptions.findIndex(
      (no: string) => parseFloat(no) === answerNum
    );
    if (numericIndex !== -1) {
      console.info(`[quiz-validation] Tier 2b: Numeric fallback for "${answerValue}" → index ${numericIndex}`);
      q.correct_index = numericIndex;
      return q;
    }
  }

  // Tier 3: Regex Fallback on explanation_html
  if (q.explanation_html) {
    // Extract all numbers from explanation HTML (including formatted like 1.250, 2.450)
    const numbersInExplanation = q.explanation_html.match(/\b\d+(?:[.,]\d+)*\b/g);
    if (numbersInExplanation) {
      for (const numStr of numbersInExplanation) {
        const normNum = normalizeDigits(numStr);
        if (!normNum) continue;
        const matchedIndex = normOptions.findIndex(
          (no: string) => no === normNum || no.includes(normNum) || normNum.includes(no)
        );
        if (matchedIndex !== -1) {
          console.info(`[quiz-validation] Tier 3: Matched "${numStr}" in explanation → option index ${matchedIndex}`);
          q.correct_index = matchedIndex;
          q.answer_value = q.options[matchedIndex];
          return q;
        }
      }
    }
  }

  console.warn(`[quiz-validation] Dropped: answer_value "${answerValue}" not alignable with [${q.options.join(", ")}]`);
  return null;
}
