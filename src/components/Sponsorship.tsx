type Props = {
  section: string;
};

export function Sponsorship({ section }: Props) {
  return (
    <div
      className="p-card"
      style={{ borderStyle: "dashed", textAlign: "center" }}
      aria-label={`${section} sponsorship slot`}
    >
      <p className="u-text-muted">
        <small>
          <strong>This section is unsponsored.</strong> Interested in putting your brand in front
          of MotoAmerica fans? <a href="mailto:hello@doublelonglap.com">Get in touch.</a>
        </small>
      </p>
    </div>
  );
}
