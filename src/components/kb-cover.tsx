// 知识库封面：优先显示上传的图，其次用自定义主题色，最后用名称生成的渐变。

const GRADIENTS = [
  "from-indigo-500 to-violet-600",
  "from-pink-500 to-rose-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-sky-500 to-blue-600",
  "from-fuchsia-500 to-purple-600",
];

function gradientFor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return GRADIENTS[h % GRADIENTS.length];
}

export function KbCover({
  name,
  coverImage,
  color,
  className = "",
}: {
  name: string;
  coverImage?: string | null;
  color?: string | null;
  className?: string;
}) {
  if (coverImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={coverImage}
        alt={name}
        className={`object-cover ${className}`}
      />
    );
  }

  if (color) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{
          background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, black))`,
        }}
      >
        <span className="text-3xl font-black text-white drop-shadow">
          {name.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br ${gradientFor(name)} ${className}`}
    >
      <span className="text-3xl font-black text-white drop-shadow">
        {name.charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
