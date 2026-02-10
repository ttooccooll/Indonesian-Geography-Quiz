var map = L.map("map", {
  zoomControl: false,
});

L.tileLayer(
  "https://{s}.basemaps.cartocdn.com/rastertiles/dark_nolabels/{z}/{x}/{y}{r}.png",
  {
    subdomains: "abcd",
    maxZoom: 30,
    attribution: "&copy; OpenStreetMap &copy; CARTO",
  },
).addTo(map);

var indonesiaBounds = [
  [-11.5, 94.5],
  [6.5, 141.0],
];
map.fitBounds(indonesiaBounds);

let locations = [
  // --- Indonesian Cities ---
  { name: "Jakarta", lat: -6.2, lng: 106.8, type: "City" },
  { name: "Surabaya", lat: -7.25, lng: 112.75, type: "City" },
  { name: "Medan", lat: 3.6, lng: 98.7, type: "City" },
  { name: "Denpasar", lat: -8.65, lng: 115.2, type: "City" },
  { name: "Makassar", lat: -5.15, lng: 119.4, type: "City" },
  { name: "Bandung", lat: -6.9, lng: 107.6, type: "City" },

  // --- Major Indonesian Islands ---
  { name: "Sumatra", lat: -0.5, lng: 101.0, type: "Island" },
  { name: "Java", lat: -7.2, lng: 110.0, type: "Island" },
  { name: "Borneo", lat: 1.0, lng: 114.0, type: "Island" },
  { name: "Sulawesi", lat: -1.5, lng: 121.0, type: "Island" },
  { name: "Papua", lat: -4.0, lng: 138.0, type: "Island" },
  { name: "Bali", lat: -8.4095, lng: 115.1889, type: "Island" },

  // --- Neighboring Countries ---
  { name: "Malaysia", lat: 4.0, lng: 102.0, type: "Country" },
  { name: "Singapore", lat: 1.35, lng: 103.8, type: "Country" },
  { name: "Thailand", lat: 15.0, lng: 101.0, type: "Country" },
  { name: "Cambodia", lat: 12.7, lng: 104.9, type: "Country" },
  { name: "Vietnam", lat: 16.5, lng: 107.5, type: "Country" },
  { name: "Philippines", lat: 12.0, lng: 122.0, type: "Country" },
  { name: "Australia", lat: -25.0, lng: 133.0, type: "Country" },
  { name: "Papua New Guinea", lat: -6.3, lng: 145.0, type: "Country" },
  { name: "East Timor", lat: -8.8, lng: 125.8, type: "Country" },
];

locations
  .filter((l) => l.type === "City")
  .forEach((city) => {
    L.circleMarker([city.lat, city.lng], {
      radius: 1,
      color: "#ff0000",
      fillColor: "#ffffff",
      fillOpacity: 0.3,
      opacity: 0.8,
      interactive: false,
    }).addTo(map);
  });

let score = 0;
let streak = 0;
let mistakes = 0;
let totalClicks = 0;

let remainingCountries = [...locations];

let currentCountry = null;
const tolerancePerCountry = {
  // Cities
  Jakarta: 0.5,
  Bandung: 0.5,
  Surabaya: 0.5,
  Medan: 0.6,
  Denpasar: 0.3,
  Makassar: 0.5,

  // Islands
  Sumatra: 5,
  Java: 3.5,
  Borneo: 6,
  Sulawesi: 4,
  Papua: 7,
  Bali: 1,

  // Countries
  Malaysia: 6,
  Singapore: .5,
  Thailand: 7,
  Cambodia: 4,
  Vietnam: 6.5,
  Philippines: 7,
  Australia: 12,
  "Papua New Guinea": 5,
  "East Timor": 3,
};

const scoreEl = document.getElementById("score");
const messageEl = document.getElementById("message");
const infoEl = document.getElementById("info");

function typeIcon(type) {
  return (
    {
      City: "🏙️",
      Island: "🏝️",
      Country: "🌍",
    }[type] || "📍"
  );
}

function pickCountry() {
  if (remainingCountries.length === 0) {
    showEndScreen();
    return;
  }

  const index = Math.floor(Math.random() * remainingCountries.length);
  currentCountry = remainingCountries[index];

  infoEl.innerHTML = `${typeIcon(currentCountry.type)} Where is the <b>${currentCountry.type}</b> of <b>${currentCountry.name}</b>?`;

  mistakes = 0;

  if (messageEl.textContent === "Nope. Try again.") {
    messageEl.textContent = "Good job!";
  }
}

map.on("click", function (e) {
  totalClicks++;
  const tolerance = tolerancePerCountry[currentCountry.name] || 1;
  const dist = Math.sqrt(
    Math.pow(e.latlng.lat - currentCountry.lat, 2) +
      Math.pow(e.latlng.lng - currentCountry.lng, 2),
  );

  if (dist < tolerance) {
    L.circle([e.latlng.lat, e.latlng.lng], {
      radius: 20000,
      color: "green",
    })
      .addTo(map)
      .bindPopup(`✅ Correct! ${currentCountry.name}`)
      .openPopup();

    score++;
    streak++;
    scoreEl.textContent = `Score: ${score} | Streak: ${streak}`;

    remainingCountries = remainingCountries.filter(
      (c) => c.name !== currentCountry.name,
    );

    pickCountry();
  } else {
    mistakes++;

    score = Math.max(0, score - 1);
    streak = 0;
    scoreEl.textContent = `Score: ${score} | Streak: ${streak}`;
    messageEl.textContent = `Nope. Try again.`;

    const wrongCircle = L.circle([e.latlng.lat, e.latlng.lng], {
      radius: 20000,
      color: "red",
      fillColor: "red",
      fillOpacity: 0.6,
      opacity: 1,
    }).addTo(map);

    setTimeout(() => {
      let opacity = 1;
      const fadeInterval = setInterval(() => {
        opacity -= 0.05;
        if (opacity <= 0) {
          clearInterval(fadeInterval);
          map.removeLayer(wrongCircle);
        } else {
          wrongCircle.setStyle({
            opacity: opacity,
            fillOpacity: opacity * 0.6,
          });
        }
      }, 50);
    }, 5000);

    if (mistakes >= 3) {
      hintPulse(currentCountry.lat, currentCountry.lng);
    }
  }
});

function resetGame() {
  score = 0;
  streak = 0;
  mistakes = 0;
  totalClicks = 0;
  currentCountry = null;

  remainingCountries = [...locations];

  scoreEl.textContent = "Score: 0 | Streak: 0";
  messageEl.textContent = "Welcome!";

  document.getElementById("endScreen").classList.add("hidden");
  document.getElementById("paymentQR").classList.add("hidden");

  map.eachLayer((layer) => {
    if (layer instanceof L.Circle || layer instanceof L.Popup) {
      map.removeLayer(layer);
    }
  });

  pickCountry();
}

function hintPulse(lat, lng) {
  const pulse = L.circle([lat, lng], {
    radius: 100000,
    color: "#00bcd4",
    weight: 1,
    fillOpacity: 0,
    opacity: 0.2,
  }).addTo(map);

  let radius = 100000;
  let opacity = 0.8;

  const pulseInterval = setInterval(() => {
    radius += 25000;
    opacity -= 0.05;

    if (opacity <= 0) {
      clearInterval(pulseInterval);
      map.removeLayer(pulse);
    } else {
      pulse.setStyle({ opacity });
      pulse.setRadius(radius);
    }
  }, 60);
}

document.addEventListener("DOMContentLoaded", () => {
  const scoreEl = document.getElementById("score");
  const messageEl = document.getElementById("message");
  const infoEl = document.getElementById("info");

  window.showLightningModal();

  resetGame();

  document.getElementById("restartBtn").addEventListener("click", () => {
    resetGame();
  });
});

const faqBtn = document.getElementById("faqBtn");
const paymentsBtn = document.getElementById("paymentsBtn");

const faqPopup = document.getElementById("faqPopup");
const paymentsPopup = document.getElementById("paymentsPopup");

document.querySelectorAll(".closePopup").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.target.closest(".popup").classList.add("hidden");
  });
});

faqBtn.addEventListener("click", () => {
  faqPopup.classList.toggle("hidden");
  paymentsPopup.classList.add("hidden");
});

paymentsBtn.addEventListener("click", () => {
  paymentsPopup.classList.toggle("hidden");
  faqPopup.classList.add("hidden");
});

async function getInvoiceFromLightningAddress(address, sats) {
  const [name, domain] = address.split("@");
  const lnurlpUrl = `https://${domain}/.well-known/lnurlp/${name}`;

  const lnurlpRes = await fetch(lnurlpUrl).then((r) => r.json());

  const callback = lnurlpRes.callback;
  const msats = sats * 1000;

  const invoiceRes = await fetch(`${callback}?amount=${msats}`).then((r) =>
    r.json(),
  );

  return invoiceRes.pr;
}

function showEndScreen() {
  const endScreen = document.getElementById("endScreen");
  const finalStats = document.getElementById("finalStats");

  const accuracy =
    totalClicks > 0 ? Math.round((score / totalClicks) * 100) : 0;

  finalStats.innerHTML = `
    <strong>Final Score:</strong> ${score}<br>
    <strong>Total Clicks:</strong> ${totalClicks}<br>
    <strong>Accuracy:</strong> ${accuracy}%
  `;

  endScreen.classList.remove("hidden");
  document.getElementById("claimRewardBtn").onclick = () => {
    window.payForScore(score);
  };
}
