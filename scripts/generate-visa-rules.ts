import fs from "node:fs/promises";
import path from "node:path";
import https from "node:https";

type VisaCategory =
  | "visa_free"
  | "visa_on_arrival"
  | "eta"
  | "e_visa"
  | "visa_required"
  | "no_admission"
  | "unknown";

type VisaRule = {
  category: VisaCategory;
  maxStayDays?: number;
  raw?: string;
};

const DATA_URL =
  "https://raw.githubusercontent.com/ilyankou/passport-index-dataset/master/passport-index-tidy-iso2.csv";

const RULES_ROOT = path.resolve("src/lib/data/rules");

const AUTO_START = "// --- AUTO-GENERATED VISA MATRIX START ---";
const AUTO_END = "// --- AUTO-GENERATED VISA MATRIX END ---";

function normalizeRequirement(requirement: string): VisaRule | null {
  const r = requirement.trim();
  if (r === "-1") return null;

  const n = Number(r);
  if (!Number.isNaN(n) && Number.isFinite(n) && n > 0) {
    return { category: "visa_free", maxStayDays: n };
  }

  switch (r.toLowerCase()) {
    case "visa free":
      return { category: "visa_free" };
    case "visa on arrival":
      return { category: "visa_on_arrival" };
    case "eta":
      return { category: "eta" };
    case "e-visa":
      return { category: "e_visa" };
    case "visa required":
      return { category: "visa_required" };
    case "no admission":
      return { category: "no_admission" };
    default:
      return { category: "unknown", raw: r };
  }
}

function toTsObjectLiteral(obj: Record<string, VisaRule>): string {
  const keys = Object.keys(obj).sort();
  const lines: string[] = ["{"];

  for (const k of keys) {
    const v = obj[k]!;
    const parts: string[] = [`category: "${v.category}"`];
    if (typeof v.maxStayDays === "number") parts.push(`maxStayDays: ${v.maxStayDays}`);
    if (typeof v.raw === "string") parts.push(`raw: ${JSON.stringify(v.raw)}`);

    // ISO2 keys are safe as identifiers (e.g., FR, US, JP).
    lines.push(`  ${k}: { ${parts.join(", ")} },`);
  }

  lines.push("} as const");
  return lines.join("\n");
}

async function fetchText(url: string): Promise<string> {
  // Prefer native fetch if available (Node 18+)
  const f = (globalThis as any).fetch as undefined | ((input: any) => Promise<any>);
  if (typeof f === "function") {
    const res = await f(url);
    if (!res.ok) throw new Error(`Failed to download CSV (${res.status}): ${url}`);
    return await res.text();
  }

  // Fallback for older Node
  return await new Promise<string>((resolve, reject) => {
    https
      .get(url, (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`Failed to download CSV (${res.statusCode}): ${url}`));
          return;
        }
        res.setEncoding("utf8");
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function parseTidyCsv(
  csv: string
): Array<{ passport: string; destination: string; requirement: string }> {
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = lines.shift();
  if (!header || !header.toLowerCase().startsWith("passport,destination,requirement")) {
    throw new Error("Unexpected CSV header for passport-index-tidy-iso2.csv");
  }

  const rows: Array<{ passport: string; destination: string; requirement: string }> = [];
  for (const line of lines) {
    // This dataset’s tidy ISO2 file is comma-safe (values are simple tokens), split into 3 columns.
    const [passport, destination, requirement] = line.split(",", 3);
    if (!passport || !destination || requirement == null) continue;

    rows.push({
      passport: passport.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      requirement: requirement.trim(),
    });
  }
  return rows;
}

async function ensureMarkers(filePath: string): Promise<string> {
  let content: string;

  try {
    content = await fs.readFile(filePath, "utf8");
  } catch {
    // If file doesn’t exist, create a minimal scaffold (should be rare).
    const dest = path.basename(path.dirname(filePath));
    content = `// ${dest} entry rules

export const checklist = [] as const;

${AUTO_START}
export const visaMatrix = {} as const;
${AUTO_END}
`;
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf8");
    return content;
  }

  if (!content.includes(AUTO_START) || !content.includes(AUTO_END)) {
    content =
      content.trimEnd() +
      `

${AUTO_START}
export const visaMatrix = {} as const;
${AUTO_END}
`;
    await fs.writeFile(filePath, content, "utf8");
  }

  return content;
}

function replaceGeneratedBlock(fileContent: string, generatedBlock: string): string {
  const start = fileContent.indexOf(AUTO_START);
  const end = fileContent.indexOf(AUTO_END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("Auto-generated markers not found or invalid ordering.");
  }

  const before = fileContent.slice(0, start + AUTO_START.length);
  const after = fileContent.slice(end); // includes AUTO_END and anything after it

  return `${before}
${generatedBlock}
${after}`;
}

async function main() {
  const csv = await fetchText(DATA_URL);
  const rows = parseTidyCsv(csv);

  // destination -> passport -> visa rule
  const byDestination: Record<string, Record<string, VisaRule>> = {};

  for (const { passport, destination, requirement } of rows) {
    if (passport === destination) continue;
    const rule = normalizeRequirement(requirement);
    if (!rule) continue;

    (byDestination[destination] ??= {})[passport] = rule;
  }

  const entries = await fs.readdir(RULES_ROOT, { withFileTypes: true });
  const destinations = entries
    .filter((d) => d.isDirectory())
    .map((d) => d.name.toUpperCase())
    .sort();

  let updated = 0;

  for (const dest of destinations) {
    const filePath = path.join(RULES_ROOT, dest, "rules.ts");
    const existing = await ensureMarkers(filePath);

    const visaMap = byDestination[dest] ?? {};
    const generated = `export const visaMatrix = ${toTsObjectLiteral(visaMap)};\n`;

    const next = replaceGeneratedBlock(existing, generated);
    if (next !== existing) {
      await fs.writeFile(filePath, next, "utf8");
      updated++;
    }
  }

  console.log(`Updated ${updated}/${destinations.length} destination rule files.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
