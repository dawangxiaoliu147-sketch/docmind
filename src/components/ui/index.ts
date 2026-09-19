/**
 * 知行 · 整体 UI 组件库
 *
 * 组件全部只读场景令牌（--theme-* / --surface-*），因此在 rain / snow / cloud 三个场景下
 * 自动换肤，不需要任何 dark: 双份类名，也不需要写死颜色。
 *
 * 用法：
 *   import { Button, Card, PageHeader, MetricGrid } from "@/components/ui";
 *
 * 样式来源：src/app/ui-system.css（由 globals.css 引入）。
 * 迁移对照表见 docmind/UI-SYSTEM.md；活样本见 /ui 路由。
 */
export { cn } from "./cn";
export type { ClassValue } from "./cn";

export { Button, buttonClass } from "./button";
export type { ButtonProps, ButtonSize, ButtonVariant } from "./button";

export {
  Card,
  CardBody,
  CardDesc,
  CardFooter,
  CardGrid,
  CardHeader,
  CardTitle,
  Glass,
  Panel,
  Rail,
  Row,
} from "./card";

export { Badge, Chip, IconBox } from "./badge";
export { CountUp } from "./count-up";
export type { ChipTone } from "./badge";

export { Checkbox, Field, FieldRow, Input, Radio, Range, Select, Switch, Textarea } from "./input";

export { Tabs } from "./tabs";
export type { TabItem } from "./tabs";

export { IconButton, Tooltip } from "./tooltip";

export { KV, KVRow, Metric, MetricGrid, Progress } from "./metric";

export { Table, TBody, TD, TH, THead, TableWrap, TR } from "./table";

export { Alert, Empty, Skeleton, SkeletonCard } from "./feedback";
export type { AlertTone } from "./feedback";

export { PageBody, PageHeader, PageShell, Section, Stack } from "./page";

export { Modal } from "./modal";

export { Reveal } from "./reveal";
export { RevealObserver } from "./reveal-observer";

export { ScenicBackdrop } from "./scenic-backdrop";
export type { SceneKey } from "./scenic-backdrop";

export { PhoneShell, PhoneScreens, ScreenChat, ScreenDashboard, ScreenStats } from "./phone-shell";
