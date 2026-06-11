"use client";

import type { ShortlistCar } from "@/lib/types";

const AvatarD = () => (
  <div
    className="font-display"
    style={{
      flex: "none",
      width: 30,
      height: 30,
      borderRadius: 9,
      background: "linear-gradient(150deg,#0E5C46,#16785C)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#fff",
      fontWeight: 800,
      fontSize: 14,
      marginTop: 2,
    }}
  >
    D
  </div>
);

function CarCard({ car }: { car: ShortlistCar }) {
  const name = car.make + " " + car.model;
  const initials = (car.make[0] + car.model[0]).toUpperCase();
  const top = car.rank === 1;
  const accent = top ? "#E8852B" : "#0E5C46";
  const specs = [
    "₹" + car.price + " L",
    car.mileage + " kmpl",
    car.fuel,
    car.safety + "★ safety",
  ];

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #EAE6DD",
        borderRadius: 16,
        padding: 16,
        display: "flex",
        gap: 16,
        boxShadow: "0 1px 3px rgba(20,23,28,.04)",
      }}
    >
      {/* rank + photo placeholder */}
      <div style={{ flex: "none", width: 108 }}>
        <div
          style={{
            position: "relative",
            height: 74,
            borderRadius: 11,
            background: "linear-gradient(135deg,#EEEAE1,#E3DED3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <span
            className="font-display"
            style={{
              fontWeight: 800,
              fontSize: 26,
              color: "#C3BCAD",
              letterSpacing: "-.02em",
            }}
          >
            {initials}
          </span>
          <span
            className="font-display"
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              width: 24,
              height: 24,
              borderRadius: 8,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              background: accent,
              color: "#fff",
            }}
          >
            {car.rank}
          </span>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
          <div
            className="font-display"
            style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-.01em", lineHeight: 1.15 }}
          >
            {name}
          </div>
          {top && (
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: ".08em",
                textTransform: "uppercase",
                color: "#E8852B",
                background: "#FBEBD8",
                padding: "3px 7px",
                borderRadius: 6,
                marginTop: 1,
              }}
            >
              Top pick
            </span>
          )}
          <div
            className="font-display"
            style={{ marginLeft: "auto", fontWeight: 700, fontSize: 16, color: "#0E5C46" }}
          >
            ₹{car.price} L
          </div>
        </div>
        <div style={{ fontSize: 13, color: "#8A857B", marginTop: 1 }}>{car.variant}</div>

        {/* specs */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 11px" }}>
          {specs.map((sp, i) => (
            <span
              key={i}
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: "#3A3F47",
                background: "#F4F2EC",
                border: "1px solid #EAE6DD",
                padding: "4px 9px",
                borderRadius: 7,
              }}
            >
              {sp}
            </span>
          ))}
        </div>

        {/* reason */}
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
            fontSize: 13.5,
            lineHeight: 1.5,
            color: "#3A3F47",
          }}
        >
          <span
            style={{
              flex: "none",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".06em",
              textTransform: "uppercase",
              color: "#0E5C46",
              background: "#E7F1EC",
              padding: "3px 7px",
              borderRadius: 6,
              marginTop: 1,
            }}
          >
            Why
          </span>
          <span style={{ flex: 1 }}>{car.reason}</span>
        </div>

        {/* match bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              height: 6,
              background: "#EFEAE0",
              borderRadius: 99,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 99,
                background: accent,
                width: car.match + "%",
                animation: "cdGrow .9s ease both",
              }}
            />
          </div>
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "#0E5C46", whiteSpace: "nowrap" }}
          >
            {car.match}% fit
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Shortlist({
  text,
  cars,
  onFollow,
}: {
  text?: string;
  cars: ShortlistCar[];
  onFollow: (kind: "compare" | "tighter" | "diesel") => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        gap: 11,
        alignItems: "flex-start",
        animation: "cdFade .4s ease both",
      }}
    >
      <AvatarD />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            background: "#fff",
            border: "1px solid #EAE6DD",
            padding: "13px 17px",
            borderRadius: "4px 16px 16px 16px",
            fontSize: 15,
            lineHeight: 1.58,
            color: "#22262C",
            marginBottom: 14,
            boxShadow: "0 1px 3px rgba(20,23,28,.04)",
          }}
        >
          {text}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {cars.map((car) => (
            <CarCard key={car.rank} car={car} />
          ))}
        </div>

        {/* grounding footnote */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 13,
            fontSize: 12.5,
            color: "#9A958B",
          }}
        >
          <span style={{ fontSize: 13 }}>🔒</span>
          <span>
            Grounded in {cars.length} cars retrieved from the catalogue — nothing invented.
          </span>
        </div>

        {/* follow-up actions */}
        <div style={{ display: "flex", gap: 9, marginTop: 13, flexWrap: "wrap" }}>
          <button
            onClick={() => onFollow("compare")}
            style={{
              background: "#0E5C46",
              color: "#fff",
              border: "none",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 13.5,
              padding: "9px 15px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            Compare top two
          </button>
          <button
            onClick={() => onFollow("tighter")}
            style={{
              background: "#fff",
              color: "#3A3F47",
              border: "1px solid #E2DDD3",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 13.5,
              padding: "9px 15px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            Stricter on budget
          </button>
          <button
            onClick={() => onFollow("diesel")}
            style={{
              background: "#fff",
              color: "#3A3F47",
              border: "1px solid #E2DDD3",
              fontFamily: "inherit",
              fontWeight: 600,
              fontSize: 13.5,
              padding: "9px 15px",
              borderRadius: 9,
              cursor: "pointer",
            }}
          >
            What about diesel?
          </button>
        </div>
      </div>
    </div>
  );
}
