export function parseJSON(raw: string): any {
  let cleaned = raw.trim();

  // 1. Strip code fences
  if (cleaned.startsWith("```")) {
    const firstNewline = cleaned.indexOf("\n");
    const lastFence = cleaned.lastIndexOf("```");
    if (firstNewline !== -1 && lastFence > firstNewline) {
      cleaned = cleaned.slice(firstNewline, lastFence).trim();
    } else {
      cleaned = cleaned.replace(/^```[a-z]*\s*/i, "").trim();
      if (cleaned.endsWith("```")) {
        cleaned = cleaned.slice(0, -3).trim();
      }
    }
  }

  // 2. Replace literal newlines with spaces
  cleaned = cleaned.replace(/[\r\n]+/g, " ");

  // 3. Fix unescaped double quotes in HTML attributes inside JSON strings
  cleaned = cleaned.replace(/(<[^>]*>)/g, (match) =>
    match.replace(/(\w[\w-]*)="([^"]*)"/g, "$1='$2'")
  );

  // 4. Try clean parse
  try {
    return JSON.parse(cleaned);
  } catch {
    // 5. Fallback: extract first { ... }
    const objStart = cleaned.indexOf("{");
    const objEnd = cleaned.lastIndexOf("}");
    if (objStart !== -1) {
      const extracted = objEnd > objStart
        ? cleaned.slice(objStart, objEnd + 1)
        : cleaned.slice(objStart);
      try {
        return JSON.parse(extracted);
      } catch {
        // 6. Fix unquoted property names
        let fixed = extracted.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');

        // 7. Last resort: repair unescaped quotes + missing commas + trailing commas
        let repaired = "";
        let inStr = false;
        for (let i = 0; i < fixed.length; i++) {
          const ch = fixed[i];
          if (ch === '\\') {
            repaired += ch;
            if (i + 1 < fixed.length) { i++; repaired += fixed[i]; }
            continue;
          }
          if (ch === '"') {
            if (inStr) {
              let j = i + 1;
              while (j < fixed.length && (fixed[j] === ' ' || fixed[j] === '\t' || fixed[j] === '\n' || fixed[j] === '\r')) j++;
              if (j < fixed.length && fixed[j] === '"') {
                repaired += '", "';
                i = j;
                continue;
              }
              if (j >= fixed.length || !/[,\]}:]/.test(fixed[j])) {
                repaired += '\\"';
                continue;
              }
            }
            inStr = !inStr;
          }
          repaired += ch;
        }

        fixed = repaired
          .replace(/\}\s+\{/g, '}, {')
          .replace(/\}\s+"/g, '}, "')
          .replace(/,\s*([\]}])/g, "$1");

        // Truncation repair
        if (inStr) fixed += '"';
        const openBrackets = (fixed.match(/\[/g) || []).length;
        const closeBrackets = (fixed.match(/\]/g) || []).length;
        const openBraces = (fixed.match(/\{/g) || []).length;
        const closeBraces = (fixed.match(/\}/g) || []).length;
        for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += ']';
        for (let i = 0; i < openBraces - closeBraces; i++) fixed += '}';

        try {
          return JSON.parse(fixed);
        } catch (finalErr) {
          const errPos = (finalErr as Error).message.match(/position\s+(\d+)/)?.[1];
          const pos = errPos ? parseInt(errPos) : 0;
          const start = Math.max(0, pos - 200);
          const end = Math.min(fixed.length, pos + 200);
          console.error(
            `[parseJSON] FAIL. Error at pos ${pos}:\n` +
            `  ⟪${fixed.slice(start, end).replace(/\n/g, "\\n")}⟫\n` +
            `  First 300 chars: ${fixed.slice(0, 300).replace(/\n/g, "\\n")}\n` +
            `  Last 300 chars: ${fixed.slice(-300).replace(/\n/g, "\\n")}`
          );
          throw finalErr;
        }
      }
    }
    throw new Error("Respons LLM bukan JSON valid");
  }
}
