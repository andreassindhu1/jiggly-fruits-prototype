import React, { useState, useRef, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import JigglyLogo from "./assets/Jiggly_logo1.svg";
import QrisImage from "./assets/qris-jiggly.jpg";
import { supabase } from "./lib/supabaseClient";

/* =======================
   DATA BUAH & TOPPING
======================= */

const FRUITS = [
  {
    id: "strawberry",
    name: "Strawberry",
    calories: 32,
    sugar: "low",
    forDiet: true,
    forGain: false,
  },
  {
    id: "mangga",
    name: "Mangga",
    calories: 99,
    sugar: "high",
    forDiet: false,
    forGain: true,
  },
  {
    id: "melon",
    name: "Melon",
    calories: 34,
    sugar: "low",
    forDiet: true,
    forGain: false,
  },
  {
    id: "naga",
    name: "Buah Naga",
    calories: 50,
    sugar: "medium",
    forDiet: true,
    forGain: true,
  },
  {
    id: "semangka",
    name: "Semangka",
    calories: 30,
    sugar: "low",
    forDiet: true,
    forGain: false,
  },
];

const TOPPINGS = [
  { id: "jelly-mangga", name: "Jelly Mangga", sweetness: "high" },
  { id: "jelly-strawberry", name: "Jelly Strawberry", sweetness: "medium" },
  { id: "jelly-leci", name: "Jelly Leci", sweetness: "medium" },
  { id: "fla-vanila", name: "Fla Vanila", sweetness: "high" },
];

/* =======================
   HELPER FUNCTIONS
======================= */

function calculateBMI(heightCm, weightKg) {
  const h = parseFloat(heightCm);
  const w = parseFloat(weightKg);
  if (!h || !w) return null;
  const hMeter = h / 100;
  return w / (hMeter * hMeter);
}

function getBMICategory(bmi) {
  if (bmi == null) return "-";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getPrice(portion) {
  if (portion === "500") return 25000;
  return 15000;
}

function formatRupiah(num) {
  if (num == null) return "-";
  return "Rp " + num.toLocaleString("id-ID");
}

/* =======================
   LOGIKA REKOMENDASI
======================= */

function getRecommendations(form) {
  let candidates;

  if (form.goal === "diet") {
    candidates = FRUITS.filter(
      (f) =>
        f.forDiet &&
        f.calories <= 60 &&
        (f.sugar === "low" || f.sugar === "medium")
    );
  } else {
    candidates = FRUITS.filter(
      (f) => f.forGain || f.calories >= 80 || f.sugar === "high"
    );
  }

  if (form.sweetness === "low") {
    candidates = candidates.filter((f) => f.sugar === "low");
  } else if (form.sweetness === "high") {
    candidates = candidates.filter((f) => f.sugar !== "low");
  }

  if (form.likedFruits.length > 0) {
    candidates = candidates.filter((f) => form.likedFruits.includes(f.id));
  }

  if (form.dislikedFruits.length > 0) {
    candidates = candidates.filter(
      (f) => !form.dislikedFruits.includes(f.id)
    );
  }

  if (candidates.length === 0) {
    candidates = FRUITS.filter(
      (f) => !form.dislikedFruits.includes(f.id)
    );
  }

  let toppings;
  if (form.goal === "diet") {
    toppings = TOPPINGS.filter(
      (t) => t.id !== "fla-vanila" && t.sweetness !== "high"
    );
  } else {
    toppings = TOPPINGS;
  }

  const maxFruit =
    form.portion === "500"
      ? Math.min(4, candidates.length)
      : Math.min(3, candidates.length);

  const selectedFruits = candidates.slice(0, maxFruit);

  const portionFactor = form.portion === "500" ? 1.6 : 1;
  const totalCalories = Math.round(
    selectedFruits.reduce((sum, f) => sum + f.calories, 0) * portionFactor
  );

  const price = getPrice(form.portion);

  return {
    fruits: selectedFruits,
    toppings,
    totalCalories,
    price,
  };
}

/* =======================
   "AI" CAPTION LOKAL
======================= */

function generateAiText(form, result) {
  const name = form.name || "Customer Jiggly Fruitz";
  const goalText =
    form.goal === "diet"
      ? "lebih ringan dan membantu tujuan diet kamu"
      : "lebih padat kalori untuk bantu menaikkan berat badan dengan cara yang tetap segar";

  const portionText =
    form.portion === "300" ? "300 ml (cup kecil)" : "500 ml (cup besar)";
  const priceText = formatRupiah(result.price);

  const buahList =
    result.fruits && result.fruits.length > 0
      ? result.fruits.map((f) => `- ${f.name}`).join("\n")
      : "- (belum ada buah terpilih)";

  const toppingList =
    result.toppings && result.toppings.length > 0
      ? result.toppings.map((t) => `- ${t.name}`).join("\n")
      : "- Tanpa topping khusus";

  return (
    `Halo ${name}! 🧃

Berdasarkan jawaban kamu, kami sarankan salad dengan karakter:
• ${goalText}
• Porsi ${portionText}
• Perkiraan kalori sekitar ${result.totalCalories} kkal
• Harga ${priceText}

Kombinasi buah pilihan:
${buahList}

Topping yang cocok:
${toppingList}

Salad ini cocok dinikmati saat belajar, nugas, atau santai bareng teman.
Kalau sudah oke, tinggal konfirmasi ke tim Jiggly Fruitz di booth ya! ✨`
  );
}

/* =======================
   STATE AWAL FORM
======================= */

const initialFormState = {
  name: "",
  age: "",
  gender: "L",
  height: "",
  weight: "",
  goal: "diet",
  likedFruits: [],
  dislikedFruits: [],
  sweetness: "medium",
  portion: "300",
};

/* =======================
   HEADER
======================= */

function Header({ isAdmin }) {
  return (
    <header className="header">
      <div className="header-left">
        <div className="brand-logo">
          <img src={JigglyLogo} alt="Jiggly Fruitz" />
        </div>
        <div>
          <div className="brand-title">Jiggly Fruitz</div>
          <div className="brand-subtitle">
            {isAdmin
              ? "Admin Kitchen Dashboard"
              : "Smart Fruit Salad Recommendation"}
          </div>
        </div>
      </div>
      <div className="header-right">
        {!isAdmin && (
          <Link to="/admin" className="header-link">
            Admin
          </Link>
        )}
        {isAdmin && (
          <Link to="/" className="header-link">
            Customer View
          </Link>
        )}
        <span className="badge badge-soft">
          {isAdmin ? "Admin Mode" : "Prototype • Supabase"}
        </span>
      </div>
    </header>
  );
}

/* =======================
   CUSTOMER PAGE ("/")
======================= */

function CustomerPage({
  form,
  bmi,
  bmiCategory,
  result,
  aiText,
  showPayment,
  heroFade,
  fruitLift,
  formSectionRef,
  resultSectionRef,
  handleInputChange,
  handleSelectGoal,
  handleSelectSweetness,
  handleSelectPortion,
  handleFruitCheckbox,
  handleSubmit,
  handleReset,
  handleGoToForm,
  handleEdit,
  handleShowPayment,
}) {
  return (
    <div className="app-shell">
      <Header isAdmin={false} />

      {/* HERO */}
      <section
        className="hero"
        style={{
          opacity: heroFade,
          transform: `translateY(${(1 - heroFade) * -20}px)`,
          transition: "opacity 220ms linear, transform 220ms linear",
        }}
      >
        <div className="hero-inner">
          <div className="hero-copy">
            <p className="hero-pill">Selamat datang di booth Jiggly Fruitz</p>
            <h1 className="hero-title">
              Salad buah segar, dipilih khusus sesuai selera dan tujuanmu.
            </h1>
            <p className="hero-subtitle">
              Isi beberapa preferensi sederhana, dan sistem Jiggly Fruitz akan
              merekomendasikan kombinasi buah, topping, dan porsi yang pas
              untuk diet ataupun menambah berat badan.
            </p>

            <div className="hero-actions">
              <button
                type="button"
                className="hero-button"
                onClick={handleGoToForm}
              >
                Mulai Pemesanan
              </button>
              <span className="hero-note">
                atau scroll ke bawah untuk mulai mengisi
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card hero-card-mini">
              <div className="hero-card-header">
                <span className="hero-card-title">Diet Fresh</span>
                <span className="hero-card-pill">Diet • 300 ml</span>
              </div>
              <ul className="hero-card-list">
                <li>🍓 Strawberry • gula rendah</li>
                <li>🍈 Melon • segar rendah kalori</li>
                <li>🍉 Semangka • ekstra segar</li>
              </ul>
              <div className="hero-card-footer">
                <span className="hero-card-price">Rp 15.000</span>
                <span className="hero-card-kcal">~ 180 kkal</span>
              </div>
            </div>

            <div className="hero-card hero-card-mini">
              <div className="hero-card-header">
                <span className="hero-card-title">Weight Gain Boost</span>
                <span className="hero-card-pill">Gain • 500 ml</span>
              </div>
              <ul className="hero-card-list">
                <li>🥭 Mangga • kalori tinggi</li>
                <li>🐉 Buah Naga • gula medium</li>
                <li>🍮 Fla Vanila • creamy</li>
              </ul>
              <div className="hero-card-footer">
                <span className="hero-card-price">Rp 25.000</span>
                <span className="hero-card-kcal">~ 320 kkal</span>
              </div>
            </div>

            <div className="hero-card hero-card-mini">
              <div className="hero-card-header">
                <span className="hero-card-title">Snack Santai</span>
                <span className="hero-card-pill">300 ml</span>
              </div>
              <ul className="hero-card-list">
                <li>🍓 Strawberry</li>
                <li>🥭 Jelly Mangga</li>
                <li>🍮 Fla Vanila</li>
              </ul>
              <div className="hero-card-footer">
                <span className="hero-card-price">Rp 15.000</span>
                <span className="hero-card-kcal">~ 220 kkal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="steps">
        <div className="steps-inner">
          <div className="step-item">
            <div className="step-number">1</div>
            <div className="step-title">Isi data & preferensi</div>
            <div className="step-text">
              Pilih tujuan (diet / weight gain), buah favorit, tingkat
              kemanisan, dan ukuran porsi.
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">2</div>
            <div className="step-title">Lihat rekomendasi</div>
            <div className="step-text">
              Sistem menyusun kombinasi buah, topping, harga, dan estimasi
              kalori, lengkap dengan penjelasan otomatis.
            </div>
          </div>
          <div className="step-item">
            <div className="step-number">3</div>
            <div className="step-title">Scan & bayar</div>
            <div className="step-text">
              Jika sudah cocok, lanjut ke QRIS dan konfirmasi ke tim Jiggly
              Fruitz untuk pembuatan salad.
            </div>
          </div>
        </div>
      </section>

      {/* MAIN LAYOUT */}
      <main className="layout-grid">
        {/* buah dekorasi */}
        <div className="fruit-background">
          <div
            className="fruit-bubble fruit-bubble-1 fruit-big"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -340}px)`,
            }}
          >
            🍓
          </div>
          <div
            className="fruit-bubble fruit-bubble-2 fruit-small"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -320}px)`,
            }}
          >
            🥭
          </div>
          <div
            className="fruit-bubble fruit-bubble-3"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -360}px)`,
            }}
          >
            🍈
          </div>
          <div
            className="fruit-bubble fruit-bubble-4 fruit-small"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -300}px)`,
            }}
          >
            🍉
          </div>
          <div
            className="fruit-bubble fruit-bubble-5 fruit-big"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -380}px)`,
            }}
          >
            🐉
          </div>
          <div
            className="fruit-bubble fruit-bubble-6 fruit-small"
            style={{
              opacity: fruitLift,
              transform: `translateY(${fruitLift * -310}px)`,
            }}
          >
            🍧
          </div>
        </div>

        {/* FORM */}
        <section ref={formSectionRef} className="card">
          <form onSubmit={handleSubmit}>
            <h2 className="card-title">Customer Profile</h2>
            <p className="card-subtitle">
              Data ini digunakan untuk menyesuaikan rekomendasi salad.
            </p>

            <div className="field-grid">
              <div className="field">
                <label>Nama</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleInputChange}
                  placeholder="Nama customer"
                  required
                />
              </div>

              <div className="field">
                <label>Usia</label>
                <input
                  type="number"
                  name="age"
                  value={form.age}
                  onChange={handleInputChange}
                  placeholder="Contoh: 21"
                  min="1"
                />
              </div>
            </div>

            <div className="field-grid">
              <div className="field">
                <label>Jenis Kelamin</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleInputChange}
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="field">
                <label>Tinggi / Berat (opsional)</label>
                <div className="field-inline">
                  <input
                    type="number"
                    name="height"
                    value={form.height}
                    onChange={handleInputChange}
                    placeholder="Tinggi (cm)"
                    min="1"
                  />
                  <input
                    type="number"
                    name="weight"
                    value={form.weight}
                    onChange={handleInputChange}
                    placeholder="Berat (kg)"
                    min="1"
                  />
                </div>
              </div>
            </div>

            <div className="bmi-summary">
              <span className="bmi-label">BMI</span>
              <span className="bmi-value">
                {bmi ? bmi.toFixed(1) : "--"} ({bmiCategory})
              </span>
            </div>

            <hr className="divider" />

            <h3 className="section-title">Tujuan Pembelian</h3>
            <div className="pill-row">
              <button
                type="button"
                className={`pill ${
                  form.goal === "diet" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectGoal("diet")}
              >
                Diet (low-calorie)
              </button>
              <button
                type="button"
                className={`pill ${
                  form.goal === "gain" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectGoal("gain")}
              >
                Menambah berat badan
              </button>
            </div>

            <h3 className="section-title">Preferensi Buah</h3>

            <div className="section-subgrid">
              <div>
                <div className="section-subtitle">Buah favorit</div>
                <div className="chip-grid">
                  {FRUITS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      className={`chip ${
                        form.likedFruits.includes(f.id) ? "chip-active" : ""
                      }`}
                      onClick={() =>
                        handleFruitCheckbox("likedFruits", f.id)
                      }
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="section-subtitle">Buah yang tidak disukai</div>
                <div className="chip-grid">
                  {FRUITS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      className={`chip chip-outline ${
                        form.dislikedFruits.includes(f.id)
                          ? "chip-active-outline"
                          : ""
                      }`}
                      onClick={() =>
                        handleFruitCheckbox("dislikedFruits", f.id)
                      }
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <h3 className="section-title">Tingkat Kemanisan</h3>
            <div className="pill-row">
              <button
                type="button"
                className={`pill ${
                  form.sweetness === "low" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectSweetness("low")}
              >
                Rendah
              </button>
              <button
                type="button"
                className={`pill ${
                  form.sweetness === "medium" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectSweetness("medium")}
              >
                Sedang
              </button>
              <button
                type="button"
                className={`pill ${
                  form.sweetness === "high" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectSweetness("high")}
              >
                Tinggi
              </button>
            </div>

            <h3 className="section-title">Ukuran Porsi</h3>
            <div className="pill-row">
              <button
                type="button"
                className={`pill ${
                  form.portion === "300" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectPortion("300")}
              >
                300 ml
              </button>
              <button
                type="button"
                className={`pill ${
                  form.portion === "500" ? "pill-active" : ""
                }`}
                onClick={() => handleSelectPortion("500")}
              >
                500 ml
              </button>
            </div>
            <p className="portion-price-hint">
              300 ml: {formatRupiah(15000)} • 500 ml: {formatRupiah(25000)}
            </p>

            <button type="submit" className="btn-primary">
              Generate Rekomendasi
            </button>
          </form>
        </section>

        {/* REKOMENDASI */}
        <section ref={resultSectionRef} className="card">
          <h2 className="card-title">Rekomendasi Salad</h2>
          <p className="card-subtitle">
            Hasil rekomendasi akan tampil seperti kartu produk e-commerce.
          </p>

          {!result && (
            <div className="empty-state">
              Isi preferensi di sebelah kiri, lalu klik{" "}
              <strong>Generate Rekomendasi</strong>.
            </div>
          )}

          {result && (
            <>
              <div className="product-card">
                <div className="product-header">
                  <div>
                    <div className="product-title">
                      {form.goal === "diet"
                        ? "Salad Diet Friendly"
                        : "Salad Weight Gain Boost"}
                    </div>
                    <div className="product-subtitle">
                      Untuk {form.name || "Customer"} • Porsi {form.portion} ml
                    </div>
                  </div>
                  <div className="product-tags">
                    <span className="badge">
                      {form.goal === "diet" ? "Low Calorie" : "High Calorie"}
                    </span>
                    <span className="badge badge-soft">
                      {bmi ? `BMI ${bmi.toFixed(1)}` : "BMI opsional"}
                    </span>
                  </div>
                </div>

                <div className="product-body">
                  <div className="product-section">
                    <div className="product-section-title">Buah Utama</div>
                    <ul className="list">
                      {result.fruits.map((f) => (
                        <li key={f.id}>
                          <span>{f.name}</span>
                          <span className="list-meta">
                            {f.calories} kcal • gula {f.sugar}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="product-section">
                    <div className="product-section-title">Topping</div>
                    <ul className="list">
                      {result.toppings.map((t) => (
                        <li key={t.id}>
                          <span>{t.name}</span>
                          <span className="list-meta">
                            manis: {t.sweetness}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="product-footer">
                    <div className="price-summary">
                      Harga:{" "}
                      <span className="price-value">
                        {formatRupiah(result.price)}
                      </span>
                    </div>
                    <div className="calorie-summary">
                      Est. Kalori ~{" "}
                      <span className="calorie-value">
                        {result.totalCalories} kcal
                      </span>
                    </div>
                    <div className="hint-text">
                      *Harga berdasarkan ukuran kemasan, bukan kombinasi buah /
                      topping. Estimasi kalori masih kasar dan bisa disesuaikan.
                    </div>
                  </div>
                </div>

                {aiText && (
                  <div className="ai-box">
                    <div className="ai-text">{aiText}</div>
                  </div>
                )}

                <div className="product-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleEdit}
                  >
                    Ubah Data
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-secondary-strong"
                    onClick={handleShowPayment}
                  >
                    Lanjut Pembayaran
                  </button>
                </div>

                <div className="product-small-link">
                  <span className="product-small-text">
                    Ingin mulai dari awal?{" "}
                  </span>
                  <button
                    type="button"
                    className="link-button"
                    onClick={handleReset}
                  >
                    Reset &amp; buat pesanan baru
                  </button>
                </div>
              </div>

              {showPayment && (
                <div className="qris-card">
                  <div className="qris-title">QRIS Pembayaran</div>
                  <p className="qris-text">
                    Scan QRIS ini dengan aplikasi pembayaran favorit kamu untuk
                    menyelesaikan transaksi Jiggly Fruitz.
                  </p>
                  <div className="qris-placeholder">
                    <img
                      src={QrisImage}
                      alt="QRIS Jiggly Fruitz"
                      className="qris-image"
                    />
                  </div>
                </div>
              )}

              <hr className="divider" />

              <h3 className="section-title">Database Buah (Internal)</h3>
              <div className="fruit-grid">
                {FRUITS.map((f) => (
                  <div key={f.id} className="fruit-card">
                    <div className="fruit-name">{f.name}</div>
                    <div className="fruit-meta">
                      {f.calories} kcal / 100g • gula {f.sugar}
                    </div>
                    <div className="fruit-tags">
                      {f.forDiet && <span className="tiny-badge">Diet</span>}
                      {f.forGain && (
                        <span className="tiny-badge tiny-badge-alt">
                          Weight Gain
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}

/* =======================
   ADMIN PAGE ("/admin")
======================= */

function AdminPage({ orders, updateOrderStatus }) {
  return (
    <div className="app-shell">
      <Header isAdmin={true} />

      <section className="card admin-card">
        <div className="admin-header">
          <div>
            <h2 className="card-title">Dashboard Admin</h2>
            <p className="card-subtitle">
              Tampilan cepat untuk tim dapur Jiggly Fruitz. Fokus ke buah,
              ukuran, dan jenis paket.
            </p>
          </div>
          <div className="admin-badge">
            <span className="badge badge-soft">
              Total pesanan: {orders.length}
            </span>
          </div>
        </div>

        {orders.length === 0 && (
          <div className="empty-state">
            Belum ada pesanan. Pesanan akan muncul di sini setelah customer
            menekan <strong>Lanjut Pembayaran</strong> di halaman utama.
          </div>
        )}

        {orders.length > 0 && (
          <div className="admin-order-list">
            {orders.map((order) => (
              <div key={order.id} className="admin-order-item">
                <div className="admin-order-main">
                  <div className="admin-order-left">
                    <div className="admin-order-code">
                      {order.code} • {order.name}
                    </div>
                    <div className="admin-order-meta">
                      <span className="pill-simple">
                        {order.goal === "diet" ? "Diet" : "Weight Gain"}
                      </span>
                      <span className="pill-simple">
                        {order.portion === "300" ? "300 ml" : "500 ml"}
                      </span>
                      <span className="pill-simple time-pill">
                        {order.createdAt}
                      </span>
                    </div>
                    <div className="admin-order-fruits">
                      Buah:{" "}
                      <span>
                        {order.fruits && order.fruits.length > 0
                          ? order.fruits.join(", ")
                          : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="admin-order-right">
                    <div className="admin-order-price">
                      {formatRupiah(order.price)}
                    </div>
                    <div
                      className={`admin-status ${
                        order.status === "new"
                          ? "admin-status-new"
                          : "admin-status-done"
                      }`}
                    >
                      {order.status === "new" ? "Belum dibuat" : "Selesai"}
                    </div>
                    {order.status === "new" && (
                      <button
                        type="button"
                        className="btn-admin-small"
                        onClick={() => updateOrderStatus(order.id, "done")}
                      >
                        Tandai Selesai
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

/* =======================
   APP (STATE & ROUTER)
======================= */

export default function App() {
  const [form, setForm] = useState(initialFormState);
  const [result, setResult] = useState(null);
  const [aiText, setAiText] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const [heroFade, setHeroFade] = useState(1);
  const [fruitLift, setFruitLift] = useState(0);
  const [fruitAlreadyLifted, setFruitAlreadyLifted] = useState(false);

  // ✅ orders cuma dari Supabase
  const [orders, setOrders] = useState([]);

  const formSectionRef = useRef(null);
  const resultSectionRef = useRef(null);

  const bmi = calculateBMI(form.height, form.weight);
  const bmiCategory = getBMICategory(bmi);

  /* Ambil data orders dari Supabase saat App pertama kali load */
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Supabase fetch error:", error);
          return;
        }

        const mapped = data.map((row) => {
          const createdAtLabel = row.created_at
            ? new Date(row.created_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          const goalFromRow =
            row.goal ??
            (row.salad_type &&
            row.salad_type.toLowerCase().includes("diet")
              ? "diet"
              : "gain");

          return {
            id: row.id,
            code: "JF-" + (row.id ? row.id.slice(-4).toUpperCase() : "XXXX"),
            name: row.customer_name || "Customer",
            goal: goalFromRow,
            portion: row.size || "300",
            price: row.price ?? 0,
            fruits: (row.toppings || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean),
            createdAt: createdAtLabel,
            status: row.status || "new",
          };
        });

        setOrders(mapped);
      } catch (err) {
        console.error("Unexpected Supabase fetch error:", err);
      }
    };

    fetchOrders();
  }, []);

  // 1) Hero fade mengikuti scroll
  useEffect(() => {
    const handleScrollHero = () => {
      const y = window.scrollY;
      const maxHero = 400;
      const heroT = Math.max(0, Math.min(1, 1 - y / maxHero));
      setHeroFade(heroT);
    };

    window.addEventListener("scroll", handleScrollHero);
    handleScrollHero();

    return () => window.removeEventListener("scroll", handleScrollHero);
  }, []);

  // 2) Buah naik sekali waktu user lewat hero
  useEffect(() => {
    if (fruitAlreadyLifted) return;

    const handleScrollFruit = () => {
      const y = window.scrollY;
      const threshold = 260;

      if (y > threshold) {
        setFruitLift(1);
        setFruitAlreadyLifted(true);
      }
    };

    window.addEventListener("scroll", handleScrollFruit);
    handleScrollFruit();

    return () => window.removeEventListener("scroll", handleScrollFruit);
  }, [fruitAlreadyLifted]);

  /* ===== HANDLERS FORM & LOGIC ===== */

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectGoal = (goal) => {
    setForm((prev) => ({ ...prev, goal }));
  };

  const handleSelectSweetness = (sweetness) => {
    setForm((prev) => ({ ...prev, sweetness }));
  };

  const handleSelectPortion = (portion) => {
    setForm((prev) => ({ ...prev, portion }));
  };

  const handleFruitCheckbox = (field, fruitId) => {
    setForm((prev) => {
      const current = new Set(prev[field]);
      if (current.has(fruitId)) current.delete(fruitId);
      else current.add(fruitId);
      return { ...prev, [field]: Array.from(current) };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const rec = getRecommendations(form);
    setResult(rec);
    setAiText(generateAiText(form, rec));
    setShowPayment(false);
  };

  const handleReset = () => {
    setForm(initialFormState);
    setResult(null);
    setAiText("");
    setShowPayment(false);
  };

  const handleGoToForm = () => {
    if (formSectionRef.current) {
      formSectionRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleEdit = () => {
    setShowPayment(false);
  };

  // Supabase-only: simpan pesanan ke Supabase lalu ke state
  const handleShowPayment = async () => {
    if (!result) {
      console.warn("handleShowPayment dipanggil tapi result masih null");
      return;
    }

    setShowPayment(true);

    try {
      const { data, error } = await supabase
        .from("orders")
        .insert([
          {
            customer_name: form.name || "Customer",
            salad_type: form.goal === "diet" ? "Diet" : "Weight Gain",
            size: form.portion,
            toppings: result.fruits.map((f) => f.name).join(", "),
            price: result.price,
            status: "new",
          },
        ])
        .select();

      if (error) {
        console.error("Supabase insert error:", error);
        alert("Supabase insert error: " + error.message);
        return;
      }

      const row = data[0];

      const createdAtLabel = row.created_at
        ? new Date(row.created_at).toLocaleTimeString("id-ID", {
            hour: "2-digit",
            minute: "2-digit",
          })
        : "";

      const newOrder = {
        id: row.id,
        code: "JF-" + (row.id ? row.id.slice(-4).toUpperCase() : "XXXX"),
        name: row.customer_name || "Customer",
        goal: form.goal,
        portion: row.size || form.portion,
        price: row.price ?? result.price,
        fruits: (row.toppings || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        createdAt: createdAtLabel,
        status: row.status || "new",
      };

      setOrders((prev) => [newOrder, ...prev]);
    } catch (err) {
      console.error("Unexpected Supabase error:", err);
      alert("Unexpected Supabase error, cek console.");
    }
  };

  // Update status juga ke Supabase
  const updateOrderStatus = async (id, status) => {
    setOrders((prev) =>
      prev.map((order) =>
        order.id === id ? { ...order, status } : order
      )
    );

    try {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);

      if (error) {
        console.error("Supabase update error:", error);
        alert("Gagal mengupdate status di database: " + error.message);
      }
    } catch (err) {
      console.error("Unexpected Supabase update error:", err);
    }
  };

  /* ===== ROUTER ===== */

  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <CustomerPage
              form={form}
              bmi={bmi}
              bmiCategory={bmiCategory}
              result={result}
              aiText={aiText}
              showPayment={showPayment}
              heroFade={heroFade}
              fruitLift={fruitLift}
              formSectionRef={formSectionRef}
              resultSectionRef={resultSectionRef}
              handleInputChange={handleInputChange}
              handleSelectGoal={handleSelectGoal}
              handleSelectSweetness={handleSelectSweetness}
              handleSelectPortion={handleSelectPortion}
              handleFruitCheckbox={handleFruitCheckbox}
              handleSubmit={handleSubmit}
              handleReset={handleReset}
              handleGoToForm={handleGoToForm}
              handleEdit={handleEdit}
              handleShowPayment={handleShowPayment}
            />
          }
        />
        <Route
          path="/admin"
          element={
            <AdminPage
              orders={orders}
              updateOrderStatus={updateOrderStatus}
            />
          }
        />
      </Routes>
    </Router>
  );
}
