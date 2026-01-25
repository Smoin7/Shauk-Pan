/************************************
 * GLOBAL CART & INVENTORY
 ************************************/
let isOrderCreating = false;

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
  addressBox,
  loadingOverlay,
  orderLoadingModal,
  orderIdSpan;

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
  orderIdSpan = document.getElementById("orderId");

  loadingOverlay = document.getElementById("loadingOverlay");
  orderLoadingModal = document.getElementById("orderLoadingModal");

  toggleAddress();
  loadPanInventory();
});

/************************************
 * UI HELPERS
 ************************************/
function showLoading() {
  if (orderLoadingModal) {
    orderLoadingModal.style.display = "block";
    return;
  }
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex";
  }
}

function hideLoading() {
  if (orderLoadingModal) {
    orderLoadingModal.style.display = "none";
  }
  if (loadingOverlay) {
    loadingOverlay.style.display = "none";
  }
}

function unlockOrderCreation() {
  isOrderCreating = false;
  hideLoading();
}

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
        itemSelect.innerHTML = `<option value="">No Paans Available</option>`;
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
    .catch(() => alert("❌ Failed to load paan inventory"));
}

/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const pan = itemSelect.value;
  const qty = parseInt(qtyInput.value, 10);

  if (!pan) return alert("Please select a Paan");
  if (!qty || qty <= 0) return alert("Enter valid quantity");

  if (cart[pan]) {
    cart[pan].qty += qty;
  } else {
    cart[pan] = { qty, price: panPriceMap[pan] };
  }

  renderCart();
}

/************************************
 * QTY CONTROLS
 ************************************/
function increaseQty(pan) {
  cart[pan].qty++;
  renderCart();
}

function decreaseQty(pan) {
  if (cart[pan].qty > 1) {
    cart[pan].qty--;
    renderCart();
  }
}

/************************************
 * RENDER CART
 ************************************/
function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([pan, data]) => {
    const lineTotal = data.qty * data.price;
    total += lineTotal;

    cartList.innerHTML += `
      <li>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="flex:1;">
            ${pan} × ${data.qty} = ₹${lineTotal}
          </span>
          <button type="button" onclick="decreaseQty('${pan}')">−</button>
          <button type="button" onclick="increaseQty('${pan}')">+</button>
          <button type="button" onclick="removeItem('${pan}')" style="color:#a00;">✖</button>
        </div>
      </li>
    `;
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
 * BOOK NOW
 ************************************/
function bookNow() {
  if (isOrderCreating) return;

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

  isOrderCreating = true;
  showLoading();

  let itemsTotal = 0;
  Object.values(cart).forEach(d => {
    itemsTotal += d.qty * d.price;
  });

  finalDeliveryCharge =
    orderTypeSelect.value === "delivery" ? DELIVERY_CHARGE : 0;

  const totalAmount = itemsTotal + finalDeliveryCharge;

  fetch(ORDER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value.trim(),
      mobile: mobileInput.value.trim(),
      orderType: orderTypeSelect.value,
      address:
        orderTypeSelect.value === "delivery"
          ? addressInput.value.trim()
          : "",
      branch: branchSelect.value,
      items: Object.entries(cart).map(([pan, d]) => ({
        item: pan,
        qty: d.qty,
        price: d.price,
        lineTotal: d.qty * d.price
      })),
      itemsTotal,
      deliveryCharge: finalDeliveryCharge,
      totalAmount
    })
  })
    .then(res => res.json())
    .then(data => {
      const row = Array.isArray(data) ? data[0] : data;

      if (!row || !row.Order_ID) {
        alert("❌ Order ID not returned");
        unlockOrderCreation();
        return;
      }

      generatedOrderId = row.Order_ID;

      if (orderIdSpan) {
        orderIdSpan.innerText = generatedOrderId;
      }

      let html = "<ul>";
      Object.entries(cart).forEach(([pan, d]) => {
        html += `<li>${pan} × ${d.qty} = ₹${d.qty * d.price}</li>`;
      });
      html += "</ul>";

      if (finalDeliveryCharge > 0) {
        html += `<p><b>Delivery Charge:</b> ₹${finalDeliveryCharge}</p>`;
      }

      html += `<hr><p><b>Order ID:</b> ${generatedOrderId}</p>`;

      paymentSummary.innerHTML = html;
      paymentTotal.innerText = totalAmount;

      hideLoading();
      isOrderCreating = false;
      paymentModal.style.display = "block";
    })
    .catch(() => {
      alert("❌ Failed to create order");
      unlockOrderCreation();
    });
}

/************************************
 * CLOSE PAYMENT POPUP
 ************************************/
function closePaymentPopup(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (paymentModal) {
    paymentModal.style.display = "none";
  }

  isOrderCreating = false;
  hideLoading();
}

/************************************
 * PAY VIA UPI
 ************************************/
function payUpi(percent, event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  if (!generatedOrderId)
    return alert("Order ID not found.");

  isOrderCreating = true;

  console.log("Triggering payment WF", generatedOrderId, percent);

  fetch(PAYMENT_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: generatedOrderId,
      paymentType: percent === 50 ? "HALF" : "FULL"
    })
  })
    .then(res => res.json())
    .then(data => {
      if (!data.paymentUrl) {
        isOrderCreating = false;
        return alert("Payment URL not received");
      }

      if (paymentModal) {
        paymentModal.style.display = "none";
      }

      window.location.href = data.paymentUrl;
    })
    .catch(() => {
      isOrderCreating = false;
      alert("❌ Payment initiation failed");
    });
}

/************************************
 * EXPOSE FUNCTIONS
 ************************************/
window.addItem = addItem;
window.removeItem = removeItem;
window.increaseQty = increaseQty;
window.decreaseQty = decreaseQty;
window.bookNow = bookNow;
window.payUpi = payUpi;
window.closePaymentPopup = closePaymentPopup;
