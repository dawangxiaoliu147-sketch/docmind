import "server-only";
import { createOpenAI } from "@ai-sdk/openai";
import { embedMany } from "ai";

// 通过 OpenAI 兼容接口连接任意供应商，只改 .env 即可切换。
// 对话模型与嵌入模型可以分别接不同供应商：
//   例如「对话用 DeepSeek + 嵌入用硅基流动」，因为 DeepSeek 不提供 embedding 接口。

// ---- 对话模型 ----
const chatBaseURL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const chatApiKey = process.env.AI_API_KEY || "sk-no-key";
const chatProvider = createOpenAI({ apiKey: chatApiKey, baseURL: chatBaseURL });

export const chatModel = chatProvider.chat(
  process.env.CHAT_MODEL || "gpt-4o-mini",
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
