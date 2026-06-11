"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createCarApi, getCars } from "@/lib/client";
import { SEED } from "@/lib/data";
import { BP, useMediaQuery } from "@/lib/useMediaQuery";
import type { BodyType, CarForm, FuelType, Transmission } from "@/lib/types";

/** Just the fields the catalogue UI renders — satisfied by both seed + API rows. */
interface CatalogCar {
  id: string;
  make: string;
  model: string;
  variant: string;
  price: number;
  body: BodyType;
  fuel: FuelType;
  mileage: number;
  safety: number;
  features: string[];
}

const labelStyle: CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 600,
  color: "#6A6F77",
  marginBottom: 5,
};
const inputStyle: CSSProperties = {
  width: "100%",
  border: "1.5px solid #E2DDD3",
  borderRadius: 9,
  padding: "9px 11px",
  fontFamily: "inherit",
  fontSize: 14,
  color: "#22262C",
  outline: "none",
  background: "#FCFBF9",
};

const emptyForm: CarForm = {
  make: "",
  model: "",
  variant: "",
  price: "",
  mileage: "",
  body: "SUV",
  fuel: "Petrol",
  transmission: "Manual",
  safety: "5",
  features: "",
  review: "",
};

function CarTile({ car, justAdded }: { car: CatalogCar; justAdded: boolean }) {
  const name = car.make + " " + car.model;
  const initials = (car.make[0] + car.model[0]).toUpperCase();
  const tags = [car.body, car.fuel, car.mileage + " kmpl", car.safety + "★"].concat(
    (car.features || []).slice(0, 1)
  );
  const cardStyle: CSSProperties = justAdded
    ? { background: "#F1F8F4", border: "1.5px solid #9FCFB8", borderRadius: 14, padding: 15, transition: "all .3s" }
    : { background: "#fff", border: "1px solid #EAE6DD", borderRadius: 14, padding: 15, boxShadow: "0 1px 3px rgba(20,23,28,.03)" };

  return (
    <div style={cardStyle}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <div
          className="font-display"
          style={{
            flex: "none",
            width: 46,
            height: 46,
            borderRadius: 10,
            background: "linear-gradient(135deg,#EEEAE1,#E3DED3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 16,
            color: "#B7B0A1",
          }}
        >
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-.01em" }}>
              {name}
            </span>
            <span style={{ marginLeft: "auto", fontWeight: 700, fontSize: 14, color: "#0E5C46" }}>
              ₹{car.price} L
            </span>
          </div>
          <div style={{ fontSize: 12.5, color: "#8A857B" }}>{car.variant}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 11 }}>
        {tags.map((t, i) => (
          <span
            key={i}
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: "#3A3F47",
              background: "#F4F2EC",
              border: "1px solid #EAE6DD",
              padding: "3px 8px",
              borderRadius: 6,
            }}
          >
            {t}
          </span>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginTop: 11,
          paddingTop: 11,
          borderTop: "1px solid #F0EDE5",
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: 99, background: "#3BB273", display: "inline-block" }} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: justAdded ? "#0E5C46" : "#8A857B" }}>
          {justAdded ? "Just embedded · searchable now" : "Embedded"}
        </span>
        <span className="font-display" style={{ marginLeft: "auto", fontSize: 11, color: "#B8B2A6" }}>
          768-dim
        </span>
      </div>
    </div>
  );
}

export default function Dataset() {
  // ≤860px: stack the form above the list. ≤600px: list goes single-column.
  const stack = useMediaQuery(BP.stack);
  const mobile = useMediaQuery(BP.mobile);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [cars, setCars] = useState<CatalogCar[]>([]);
  const [loading, setLoading] = useState(true);
  const [degraded, setDegraded] = useState(false); // backend unreachable → sample data
  const [f, setF] = useState<CarForm>(emptyForm);
  const [addedFlash, setAddedFlash] = useState(false);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getCars()
      .then((rows) => {
        if (cancelled) return;
        setCars(rows);
        setDegraded(false);
      })
      .catch(() => {
        if (cancelled) return;
        setCars(SEED.map(({ justAdded, ...c }) => c));
        setDegraded(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const set =
    <K extends keyof CarForm>(field: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [field]: e.target.value as CarForm[K] }));

  const addReady = f.make.trim() !== "" && f.model.trim() !== "" && f.price.trim() !== "" && !adding;

  const addCar = async () => {
    if (!addReady) return;
    setAdding(true);
    setFormError(null);
    const res = await createCarApi({
      make: f.make,
      model: f.model,
      variant: f.variant,
      price: f.price,
      mileage: f.mileage,
      body: f.body,
      fuel: f.fuel,
      transmission: f.transmission,
      safety: f.safety,
      features: f.features,
      review: f.review,
    });
    setAdding(false);

    if (!res.ok) {
      setFormError(res.error);
      return;
    }
    const c = res.car;
    setCars((prev) => [
      { id: c.id, make: c.make, model: c.model, variant: c.variant, price: c.price, body: c.body, fuel: c.fuel, mileage: c.mileage, safety: c.safety, features: c.features },
      ...prev,
    ]);
    setJustAddedId(c.id);
    setF(emptyForm);
    setAddedFlash(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => {
      setAddedFlash(false);
      setJustAddedId(null);
    }, 2600);
  };

  const addStyle: CSSProperties = {
    fontFamily: "inherit",
    fontWeight: 700,
    fontSize: 14,
    padding: 12,
    borderRadius: 11,
    border: "none",
    cursor: addReady ? "pointer" : "default",
    marginTop: 4,
    background: addReady ? "#0E5C46" : "#E4E0D7",
    color: addReady ? "#fff" : "#A8A296",
    boxShadow: addReady ? "0 3px 12px rgba(14,92,70,.25)" : "none",
  };

  const bodyOptions: BodyType[] = ["SUV", "Hatchback", "Sedan", "MPV"];
  const fuelOptions: FuelType[] = ["Petrol", "Diesel", "CNG", "EV"];
  const transOptions: Transmission[] = ["Manual", "Automatic"];

  return (
    <main style={{ flex: 1, width: "100%", maxWidth: 1120, margin: "0 auto", padding: mobile ? "20px 14px 48px" : "26px 24px 60px" }}>
      {/* header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 6,
        }}
      >
        <div>
          <h1 className="font-display" style={{ fontWeight: 800, fontSize: 30, letterSpacing: "-.02em", margin: 0 }}>
            Dataset
          </h1>
          <p style={{ margin: "6px 0 0", color: "#5A6068", fontSize: 14.5, maxWidth: 520, lineHeight: 1.5 }}>
            Every car you add is summarised, embedded with{" "}
            <span style={{ fontWeight: 600, color: "#22262C" }}>text-embedding-004</span>, and is
            instantly searchable by the advisor. One create path — no duplicated embedding logic.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "#fff",
            border: "1px solid #E2DDD3",
            borderRadius: 11,
            padding: "10px 15px",
          }}
        >
          <span className="font-display" style={{ fontWeight: 800, fontSize: 22, color: "#0E5C46" }}>
            {cars.length}
          </span>
          <span style={{ fontSize: 13, color: "#5A6068", fontWeight: 500, lineHeight: 1.2 }}>
            cars
            <br />
            embedded
          </span>
        </div>
      </div>

      {degraded && (
        <div
          style={{
            margin: "10px 0 0",
            padding: "10px 14px",
            background: "#FBEBD8",
            border: "1px solid #F3D6AE",
            borderRadius: 10,
            fontSize: 13,
            color: "#8A5A1E",
          }}
        >
          Showing sample data — the backend isn’t reachable. Set <strong>GEMINI_API_KEY</strong> and{" "}
          <strong>MONGODB_URI</strong> in <code>.env.local</code>, run <code>npm run seed</code>, then reload for live data.
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: stack ? "1fr" : "380px 1fr",
          gap: 22,
          marginTop: 22,
          alignItems: "start",
        }}
      >
        {/* create form */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #EAE6DD",
            borderRadius: 16,
            padding: 20,
            // Only pin the form beside the list on wide screens; once stacked
            // it sits inline so it doesn't cover the catalogue while scrolling.
            position: stack ? "static" : "sticky",
            top: 88,
            boxShadow: "0 1px 3px rgba(20,23,28,.04)",
          }}
        >
          <div className="font-display" style={{ fontWeight: 700, fontSize: 17, marginBottom: 3 }}>
            Add a car
          </div>
          <div style={{ fontSize: 13, color: "#9A958B", marginBottom: 17 }}>
            Summary → embedding → Mongo, in one step.
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Make</label>
                <input value={f.make} onChange={set("make")} placeholder="Tata" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Model</label>
                <input value={f.model} onChange={set("model")} placeholder="Nexon" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Variant</label>
              <input value={f.variant} onChange={set("variant")} placeholder="Creative+ S" style={inputStyle} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Price (₹ lakh)</label>
                <input value={f.price} onChange={set("price")} placeholder="13.6" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Mileage (kmpl)</label>
                <input value={f.mileage} onChange={set("mileage")} placeholder="17.4" style={inputStyle} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Body</label>
                <select value={f.body} onChange={set("body")} style={inputStyle}>
                  {bodyOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fuel</label>
                <select value={f.fuel} onChange={set("fuel")} style={inputStyle}>
                  {fuelOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={labelStyle}>Transmission</label>
                <select value={f.transmission} onChange={set("transmission")} style={inputStyle}>
                  {transOptions.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Safety (★)</label>
                <select value={f.safety} onChange={set("safety")} style={inputStyle}>
                  {["5", "4", "3", "2", "1"].map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={labelStyle}>
                Key features <span style={{ color: "#B8B2A6", fontWeight: 500 }}>comma-separated</span>
              </label>
              <input value={f.features} onChange={set("features")} placeholder="6 airbags, Sunroof, 360 camera" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Review snippet</label>
              <input value={f.review} onChange={set("review")} placeholder="Feels rock solid on the highway." style={inputStyle} />
            </div>

            <button onClick={addCar} disabled={!addReady} style={addStyle}>
              {adding ? "Embedding…" : "+ Embed & add to dataset"}
            </button>
            {addedFlash && (
              <div style={{ fontSize: 12.5, color: "#9A958B", textAlign: "center" }}>
                ✓ Summary built → embedded → written to MongoDB
              </div>
            )}
            {formError && (
              <div style={{ fontSize: 12.5, color: "#B4452F", textAlign: "center" }}>{formError}</div>
            )}
          </div>
        </div>

        {/* car list */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 13 }}>
            <span className="font-display" style={{ fontWeight: 700, fontSize: 15 }}>
              In the catalogue
            </span>
            <span style={{ flex: 1, height: 1, background: "#E7E3DA" }} />
          </div>
          {loading ? (
            <div style={{ color: "#9A958B", fontSize: 14, padding: "8px 2px" }}>Loading the catalogue…</div>
          ) : cars.length === 0 ? (
            <div style={{ color: "#9A958B", fontSize: 14, padding: "8px 2px" }}>
              No cars yet — add one on the left, or run <code>npm run seed</code>.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "repeat(2,1fr)", gap: 12 }}>
              {cars.map((car) => (
                <CarTile key={car.id} car={car} justAdded={car.id === justAddedId} />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
