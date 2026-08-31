// 用户头像：有图显示图，无图显示首字母圆形。

export function Avatar({
  name,
  src,
  className = "h-8 w-8 text-sm",
}: {
  name: string;
  src?: string | null;
  className?: string;
}) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-indigo-600 font-semibold text-white ${className}`}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
