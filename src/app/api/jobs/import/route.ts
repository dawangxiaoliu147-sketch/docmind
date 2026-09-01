import { verifySession } from "@/lib/dal";
import { prisma } from "@/lib/db";

// 简易 CSV 解析（支持引号包裹的字段）
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// 批量导入职位（CSV）。列名：title,company,location,salary,description,tags,requirements
// tags 用 | 分隔，requirements 用 | 分隔
export async function POST(req: Request) {
  const session = await verifySession();
  if (!session) {
    return Response.json({ error: "未登录" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "请选择 CSV 文件" }, { status: 400 });
  }

  const text = await file.text();
  const rows = parseCSV(text).filter((r) => r.some((c) => c.trim()));
  if (rows.length < 2) {
    return Response.json({ error: "CSV 内容为空" }, { status: 400 });
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (name: string) => header.indexOf(name);
  const iTitle = idx("title");
  const iCompany = idx("company");
  if (iTitle < 0 || iCompany < 0) {
    return Response.json(
      { error: "CSV 必须包含 title 和 company 两列" },
      { status: 400 },
    );
  }
  const iLocation = idx("location");
  const iSalary = idx("salary");
  const iDescription = idx("description");
  const iTags = idx("tags");
  const iReq = idx("requirements");

  const jobs = rows
    .slice(1)
    .map((r) => ({
      title: (r[iTitle] ?? "").trim(),
      company: (r[iCompany] ?? "").trim(),
      location: (r[iLocation] ?? "").trim(),
      salary: (r[iSalary] ?? "").trim(),
      description: (r[iDescription] ?? "").trim(),
      tags: (r[iTags] ?? "")
        .split(/[|,，]/)
        .map((s) => s.trim())
        .filter(Boolean),
      requirements: (r[iReq] ?? "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
    }))
    .filter((j) => j.title && j.company);

  if (jobs.length === 0) {
    return Response.json({ error: "没有解析到有效职位" }, { status: 400 });
  }

  await prisma.job.createMany({ data: jobs });
  return Response.json({ ok: true, count: jobs.length });
}
