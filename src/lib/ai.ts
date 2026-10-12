import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany, generateText } from "ai";

// 通过 OpenAI 兼容接口连接任意供应商，只改 .env 即可切换。
// 对话模型与嵌入模型可以分别接不同供应商：
//   例如「对话用 DeepSeek + 嵌入用硅基流动」，因为 DeepSeek 不提供 embedding 接口。

// ── 对话模型：主用 + 备用（两级）──────────────────────────────
// 主用额度用完或鉴权失败时自动切到备用，冷却期过后切回主用。
// 导出的是**代理**：各处 `model: chatModel` 在调用时才解引用，所以切换全局生效，
// 12 个调用点一行都不用改。
const chatBaseURL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const chatApiKey = process.env.AI_API_KEY || "sk-no-key";
const chatModelId = process.env.CHAT_MODEL || "gpt-4o-mini";
const chatProvider = createOpenAI({ apiKey: chatApiKey, baseURL: chatBaseURL });
const primaryChatModel = chatProvider.chat(chatModelId);

// 备用模型：只填 key 就用同一个地址与模型名；也可以整组换（地址/模型名）
const fallbackApiKey = (process.env.AI_FALLBACK_API_KEY || "").trim();
const fallbackChatModel = fallbackApiKey
  ? createOpenAI({
      apiKey: fallbackApiKey,
      baseURL: process.env.AI_FALLBACK_BASE_URL || chatBaseURL,
    }).chat(process.env.AI_FALLBACK_MODEL || chatModelId)
  : null;

/** 备用模型描述（日志/界面用），没配就是 null */
export const fallbackModelLabel = fallbackChatModel
  ? `${process.env.AI_FALLBACK_MODEL || chatModelId} @ ${
      (process.env.AI_FALLBACK_BASE_URL || chatBaseURL).replace(/^https?:\/\//, "").replace(/\/.*$/, "")
    }`
  : null;

/** 主用被判为不可用的冷却截止时间 */
let primaryDownUntil = 0;
const DOWN_MS = 10 * 60 * 1000;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 这个错误像不像"额度用完 / 没权限"。
 * 只有这类错误才值得切备用 —— 网络抖动、超时、模型输出格式问题切了也没用。
 */
export function looksLikeQuotaError(e: unknown): boolean {
  const msg = (e instanceof Error ? e.message : String(e)).toLowerCase();
  // DeepSeek 的真实鉴权错误文案是 "Authentication Fails, Your api key: ****xx is invalid"
  // —— 词序和 "invalid api key" 不一样，两种都要认（这条是实测踩出来的）
  return /insufficient|balance|quota|exceed|rate ?limit|402|429|401|unauthorized|authentication|api key.*invalid|invalid.*api key|is invalid|no permission|arrears|欠费/.test(
    msg,
  );
}

function activeModel() {
  return primaryDownUntil > Date.now() && fallbackChatModel ? fallbackChatModel : primaryChatModel;
}

/** 记一次失败：额度/鉴权类错误就切备用一段时间 */
export function noteModelFailure(e: unknown): void {
  if (!fallbackChatModel || !looksLikeQuotaError(e)) return;
  const firstTime = primaryDownUntil <= Date.now();
  primaryDownUntil = Date.now() + DOWN_MS;
  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    primaryDownUntil = 0;
    resetTimer = null;
  }, DOWN_MS);
  if (firstTime) {
    console.warn("[ai] 主用模型额度/鉴权异常，暂时切到备用模型");
  }
}

/** 当前是否在用备用模型 */
export function usingFallbackModel(): boolean {
  return activeModel() === fallbackChatModel;
}

/**
 * 带自动切换的对话模型。
 * 代理里每次取属性都重新解引用"当前该用哪个"，并把调用失败记下来（额度类错误触发切换）。
 */
export const chatModel = new Proxy({} as ReturnType<typeof chatProvider.chat>, {
  get(_target, prop) {
    const model = activeModel();
    const value = Reflect.get(model as object, prop, model);
    if (typeof value !== "function") return value;
    return (...args: unknown[]) => {
      try {
        const out = (value as (...a: unknown[]) => unknown).apply(model, args);
        if (out && typeof (out as { then?: unknown }).then === "function") {
          return (out as Promise<unknown>).catch((e: unknown) => {
            noteModelFailure(e);
            throw e;
          });
        }
        return out;
      } catch (e) {
        noteModelFailure(e);
        throw e;
      }
    };
  },
});

/**
 * 一次性生成（非流式）：主用失败且是额度类错误时，**这一次请求内**立刻用备用重试。
 * 流式对话走不了这条路（响应已经开始推了），它们靠上面的自动切换：第一次失败后，
 * 后续请求就都走备用了。
 */
export async function generateTextResilient(input: {
  system?: string;
  prompt: string;
}): Promise<{ text: string; usedFallback: boolean }> {
  const first = activeModel();
  try {
    const r = await generateText({ model: first, system: input.system, prompt: input.prompt });
    return { text: r.text, usedFallback: first === fallbackChatModel };
  } catch (e) {
    noteModelFailure(e);
    const second = activeModel();
    if (second === first) throw e;
    const r = await generateText({ model: second, system: input.system, prompt: input.prompt });
    return { text: r.text, usedFallback: true };
  }
}

// ---- 视觉模型（支持图片输入，用于「识图」，如简历智能体）----
// 不配置则回退到对话模型；DeepSeek 的视觉模型：deepseek-v4-flash-vision-exp
export const visionModel = chatProvider.chat(
  process.env.VISION_MODEL || "deepseek-v4-flash-vision-exp",
);

// ---- 嵌入模型（可独立配置，不填则复用对话模型的地址与密钥）----
const embedBaseURL = process.env.EMBEDDING_BASE_URL || chatBaseURL;
const embedApiKey = process.env.EMBEDDING_API_KEY || chatApiKey;
const embedProvider = createOpenAI({
  apiKey: embedApiKey,
  baseURL: embedBaseURL,
});
const embeddingModel = embedProvider.embeddingModel(
  process.env.EMBEDDING_MODEL || "text-embedding-3-small",
);

// 向量统一对齐到该维度（不同嵌入模型输出维度不同）
export const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM || 1536);

// 把任意维度向量对齐到 EMBEDDING_DIM：不足补 0，超出截断。
// 余弦相似度下补 0 不改变向量方向，因此不会影响检索质量。
function normalizeVector(vec: number[], dim: number): number[] {
  if (vec.length === dim) return vec;
  if (vec.length > dim) return vec.slice(0, dim);
  return [...vec, ...new Array<number>(dim - vec.length).fill(0)];
}

// 批量向量化
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const { embeddings } = await embedMany({
    model: embeddingModel,
    values: texts,
  });
  return embeddings.map((e) => normalizeVector(e, EMBEDDING_DIM));
}

// 单个文本向量化
export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}
