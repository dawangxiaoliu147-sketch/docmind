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
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div className={`ui-avatar font-semibold ${className}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}
