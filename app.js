/************************************
 * GLOBAL CART & INVENTORY
 ************************************/
const cart = {};
const panPriceMap = {};

const DELIVERY_CHARGE = 50;
let finalDeliveryCharge = 0;

// 🔐 ORDER ID FROM n8n
let generatedOrderId = "";

/************************************
 * API ENDPOINTS
 ************************************/
const INVENTORY_API =
  "https://shaikh98.app.n8n.cloud/webhook/pan-inventory";

const ORDER_API =
  "https://shaikh98.app.n8n.cloud/webhook/paan-order";

const PAYMENT_API =
  "https://shaikh98.app.n8n.cloud/webhook/payment";

/************************************
 * DOM ELEMENT REFERENCES
 ************************************/
let itemSelect,
  qtyInput,
  cartList,
  totalPriceEl,
  paymentModal,
  paymentSummary,
  paymentTotal,
  nameInput,
  mobileInput,
  orderTypeSelect,
  addressInput,
  branchSelect,
  addressBox;

/************************************
 * INIT ON PAGE LOAD
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
  itemSelect = document.getElementById("item");
  qtyInput = document.getElementById("qty");
  cartList = document.getElementById("cart");
  totalPriceEl = document.getElementById("totalPrice");
  paymentModal = document.getElementById("paymentModal");
  paymentSummary = document.getElementById("paymentSummary");
  paymentTotal = document.getElementById("paymentTotal");
  nameInput = document.getElementById("name");
  mobileInput = document.getElementById("mobile");
  orderTypeSelect = document.getElementById("orderType");
  addressInput = document.getElementById("address");
  branchSelect = document.getElementById("branch");
  addressBox = document.getElementById("addressBox");

  toggleAddress();
  loadPanInventory();
});

/************************************
 * ORDER TYPE LOGIC
 ************************************/
function toggleAddress() {
  addressBox.style.display =
    orderTypeSelect.value === "delivery" ? "block" : "none";
}

/************************************
 * LOAD PAN INVENTORY
 ************************************/
function loadPanInventory() {
  itemSelect.innerHTML = `<option value="">Loading Paans...</option>`;

  fetch(INVENTORY_API)
    .then(res => res.json())
    .then(data => {
      itemSelect.innerHTML = `<option value="">-- Select Paan --</option>`;

      if (!data.pans || data.pans.length === 0) {
        itemSelect.innerHTML =
          `<option value="">No Paans Available</option>`;
        return;
      }

      data.pans.forEach(pan => {
        panPriceMap[pan.name] = pan.price;

        const opt = document.createElement("option");
        opt.value = pan.name;
        opt.textContent = `${pan.name} (₹${pan.price})`;
        itemSelect.appendChild(opt);
      });
    })
    .catch(() => {
      alert("❌ Failed to load paan inventory");
    });
}

/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const pan = itemSelect.value;
  const qty = parseInt(qtyInput.value, 10);

  if (!pan) return alert("Please select a Paan");
  if (!qty || qty <= 0) return alert("Enter valid quantity");
  if (cart[pan]) return alert("This Paan is already added");

  cart[pan] = {
    qty,
    price: panPriceMap[pan]
  };

  renderCart();
}

/************************************
 * RENDER CART + TOTAL
 ************************************/
function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([pan, data]) => {
    const lineTotal = data.qty * data.price;
    total += lineTotal;

    const li = document.createElement("li");
    li.innerHTML = `
      ${pan} × ${data.qty} = ₹${lineTotal}
      <button
        type="button"
        onclick="removeItem('${pan}')"
        style="margin-left:8px;background:none;border:none;cursor:pointer;"
      >✖</button>
    `;
    cartList.appendChild(li);
  });

  totalPriceEl.innerText = total;
}

/************************************
 * REMOVE ITEM
 ************************************/
function removeItem(pan) {
  delete cart[pan];
  renderCart();
}

/************************************
 * BOOK NOW → CREATE ORDER → OPEN POPUP
 ************************************/
function bookNow() {
  if (!nameInput.value.trim())
    return alert("Please enter your name");

  if (!/^\d{10}$/.test(mobileInput.value.trim()))
    return alert("Enter valid 10-digit mobile number");

  if (!branchSelect.value)
    return alert("Please select a branch");

  if (
    orderTypeSelect.value === "delivery" &&
    !addressInput.value.trim()
  )
    return alert("Please enter delivery address");

  if (Object.keys(cart).length === 0)
    return alert("Please add at least one Paan");

  let summaryHTML = "<ul>";
  let itemsTotal = 0;

  Object.entries(cart).forEach(([pan, data]) => {
    const line = data.qty * data.price;
    itemsTotal += line;
    summaryHTML += `<li>${pan} × ${data.qty} = ₹${line}</li>`;
  });

  summaryHTML += "</ul>";

  finalDeliveryCharge =
    orderTypeSelect.value === "delivery" ? DELIVERY_CHARGE : 0;

  if (finalDeliveryCharge > 0) {
    summaryHTML += `<p><b>Delivery Charge:</b> ₹${finalDeliveryCharge}</p>`;
  }

  const totalAmount = itemsTotal + finalDeliveryCharge;

  paymentSummary.innerHTML = summaryHTML;
  paymentTotal.innerText = totalAmount;

  // 🔐 CREATE ORDER IN n8n FIRST
  const payload = {
    name: nameInput.value.trim(),
    mobile: mobileInput.value.trim(),
    orderType: orderTypeSelect.value,
    address:
      orderTypeSelect.value === "delivery"
        ? addressInput.value.trim()
        : "",
    branch: branchSelect.value,

    items: Object.entries(cart).map(([pan, data]) => ({
      item: pan,
      qty: data.qty,
      price: data.price,
      lineTotal: data.qty * data.price
    })),

    itemsTotal,
    deliveryCharge: finalDeliveryCharge,
    totalAmount
  };

  fetch(ORDER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      generatedOrderId = data.orderId;
      console.log("ORDER ID FROM n8n:", generatedOrderId);

      paymentModal.style.display = "block";
    })
    .catch(() => {
      alert("❌ Failed to create order");
    });
}

/************************************
 * CLOSE PAYMENT POPUP
 ************************************/
function closePaymentPopup() {
  paymentModal.style.display = "none";
}

/************************************
 * PAY VIA UPI (50% / FULL)
 ************************************/
function payUpi(percent) {
  if (!generatedOrderId) {
    alert("Order ID not found. Please try again.");
    return;
  }

  const paymentType = percent === 50 ? "HALF" : "FULL";

  fetch(PAYMENT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: generatedOrderId,
      paymentType
    })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.paymentUrl) {
        alert("Payment URL not received");
        return;
      }

      console.log("UPI URL:", data.paymentUrl);
      window.location.href = data.paymentUrl;
    })
    .catch(() => {
      alert("❌ Payment initiation failed");
    });
}

/************************************
 * EXPOSE FUNCTIONS (GITHUB PAGES FIX)
 ************************************/
window.addItem = addItem;
window.removeItem = removeItem;
window.bookNow = bookNow;
window.payUpi = payUpi;
window.closePaymentPopup = closePaymentPopup;
