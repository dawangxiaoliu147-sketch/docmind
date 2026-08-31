import { NextResponse } from "next/server";

// 健康检查接口：供 K8s 存活/就绪探针、负载均衡器、监控使用。
export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "docmind",
    time: new Date().toISOString(),
  });
}
