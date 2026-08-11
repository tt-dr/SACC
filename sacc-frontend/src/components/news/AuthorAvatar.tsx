import { cn } from "@/lib/utils";

interface AuthorAvatarProps {
  name: string;
  avatar?: string;
  size?: number;
  className?: string;
}

export function AuthorAvatar({ name, avatar, size = 40, className }: AuthorAvatarProps) {
  const initial = name ? name.slice(0, 1) : "路";
  const style = { width: size, height: size, fontSize: Math.round(size * 0.34) };

  if (avatar) {
    return (
      <img
        src={avatar}
        alt={`${name} 的头像`}
        style={style}
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#ff9d2a] to-[#ff6a00] font-bold text-white",
        className,
      )}
    >
      {initial}
    </span>
  );
}
