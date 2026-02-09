window.lightningEnabled = false;
window.lightningInvoice = null;

window.showLightningModal = function () {
  document.getElementById("lightningModal").classList.remove("hidden");
};

document.getElementById("enableLightningBtn").onclick = () => {
  const input = document
    .getElementById("lightningInput")
    .value.trim();

  if (!input) {
    alert("Please enter a Lightning address or click Just play.");
    return;
  }

  window.lightningInvoice = input;
  window.lightningEnabled = true;

  document.getElementById("lightningModal").classList.add("hidden");
};

document.getElementById("skipLightningBtn").onclick = () => {
  window.lightningEnabled = false;
  window.lightningInvoice = null;

  document.getElementById("lightningModal").classList.add("hidden");
};

window.showQR = function (invoice, sats) {
  const qrContainer = document.getElementById("paymentQR");

  qrContainer.innerHTML = `
    <p>Scan to reward <strong>${sats} sats</strong></p>
    <canvas id="qrCanvas"></canvas>
    <p style="word-break: break-all; font-size: 12px;">${invoice}</p>
  `;

  qrContainer.classList.remove("hidden");

  const canvas = document.getElementById("qrCanvas");

  if (!canvas) {
    console.error("QR canvas not found");
    return;
  }

  if (!window.QRCode) {
    console.error("QRCode library not loaded");
    return;
  }

  QRCode.toCanvas(
    canvas,
    invoice,
    { width: 220, margin: 1 },
    (err) => {
      if (err) console.error("QR render error:", err);
    }
  );
};

window.payForScore = async function (sats) {
  if (!window.lightningEnabled || sats <= 0) {
    return;
  }

  const qrContainer = document.getElementById("paymentQR");

  let invoice = window.lightningInvoice;

  if (invoice.includes("@")) {
    invoice = await getInvoiceFromLightningAddress(invoice, sats);
  }

  try {
    if (window.webln) {
      await window.webln.enable();
      await window.webln.sendPayment(invoice);

      qrContainer.innerHTML = `<p>✅ ${sats} sats sent</p>`;
      qrContainer.classList.remove("hidden");
      return;
    }
  } catch {}

  window.showQR(invoice, sats);
};