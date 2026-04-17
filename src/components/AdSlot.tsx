type Props = {
  placement: string;
  size?: "leaderboard" | "rectangle" | "skyscraper";
};

const SIZES: Record<NonNullable<Props["size"]>, { w: number; h: number }> = {
  leaderboard: { w: 728, h: 90 },
  rectangle: { w: 300, h: 250 },
  skyscraper: { w: 160, h: 600 },
};

export function AdSlot({ placement, size = "leaderboard" }: Props) {
  const { w, h } = SIZES[size];
  return (
    <div
      data-ad-placement={placement}
      aria-hidden="true"
      style={{
        width: "100%",
        maxWidth: w,
        height: h,
        margin: "1rem auto",
        border: "1px dashed #ccc",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <small className="u-text-muted">
        Ad slot ({placement}, {w}×{h})
      </small>
    </div>
  );
}
