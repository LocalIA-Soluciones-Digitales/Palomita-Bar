import { StarIcon, StarHalfIcon } from "@/components/icons";

export function Stars({ rating, className }: { rating: number; className?: string }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25 && rating - fullStars < 0.75;
  const roundedFull = rating - fullStars >= 0.75 ? fullStars + 1 : fullStars;

  return (
    <div className={`flex text-noche-primary ${className ?? ""}`}>
      {Array.from({ length: roundedFull }).map((_, i) => (
        <StarIcon key={`full-${i}`} className="h-4 w-4" />
      ))}
      {hasHalf ? <StarHalfIcon className="h-4 w-4" /> : null}
      {Array.from({ length: Math.max(0, 5 - roundedFull - (hasHalf ? 1 : 0)) }).map((_, i) => (
        <StarIcon key={`empty-${i}`} className="h-4 w-4 text-noche-ink-faint" />
      ))}
    </div>
  );
}
