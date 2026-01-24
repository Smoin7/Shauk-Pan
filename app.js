/************************************
 * GLOBAL CART & CONFIG
 ************************************/
const cart = {};
const panPriceMap = {};
const DELIVERY_CHARGE = 50;

const INVENTORY_API = "https://shaikh98.app.n8n.cloud/webhook/pan-inventory";
const ORDER_API = "https://shaikh98.app.n8n.cloud/webhook/paan-order";

/************************************
 * DOM REFERENCES
 ************************************/
let itemSelect, qtyInput, cartList, totalPriceEl;
let paymentModal, paymentSummary, paymentTotal;
let nameInput, mobileInput, orderTypeSelect, addressInput, branchSelect, addressBox;

/************************************
 * INIT
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
 * ORDER TYPE
 ************************************/
function toggleAddress() {
  addressBox.style.display =
    orderTypeSelect.value === "delivery" ? "block" : "none";
}

/************************************
 * LOAD INVENTORY
 ************************************/
function loadPanInventory() {
  fetch(INVENTORY_API)
    .then(res => res.json())
    .then(data => {
      itemSelect.innerHTML = `<option value="">-- Select Paan --</option>`;
      data.pans.forEach(p => {
        panPriceMap[p.name] = p.price;
        itemSelect.innerHTML +=
          `<option value="${p.name}">${p.name} (₹${p.price})</option>`;
      });
    });
}

/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const pan = itemSelect.value;
  const qty = parseInt(qtyInput.value, 10);

  if (!pan || qty <= 0) return alert("Select valid paan & quantity");
  if (cart[pan]) return alert("Already added");

  cart[pan] = { qty, price: panPriceMap[pan] };
  renderCart();
}

/************************************
 * RENDER CART
 ************************************/
function renderCart() {
  cartList.innerHTML = "";
  let itemsTotal = 0;

  Object.entries(cart).forEach(([p, d]) => {
    const line = d.qty * d.price;
    itemsTotal += line;
    cartList.innerHTML += `
      <li>${p} × ${d.qty} = ₹${line}
        <button onclick="removeItem('${p}')">✖</button>
      </li>`;
  });

  totalPriceEl.innerText = itemsTotal;
}

/************************************
 * REMOVE ITEM
 ************************************/
function removeItem(pan) {
  delete cart[pan];
  renderCart();
}

/************************************
 * BOOK NOW → SHOW POPUP
 ************************************/
function bookNow() {
  if (!Object.keys(cart).length) return alert("Add items first");

  let html = "<ul>";
  let itemsTotal = 0;

  Object.entries(cart).forEach(([p, d]) => {
    const line = d.qty * d.price;
    itemsTotal += line;
    html += `<li>${p} × ${d.qty} = ₹${line}</li>`;
  });

  html += "</ul>";

  let finalTotal = itemsTotal;
  if (orderTypeSelect.value === "delivery") {
    html += `<p><b>Delivery Charge:</b> ₹${DELIVERY_CHARGE}</p>`;
    finalTotal += DELIVERY_CHARGE;
  }

  paymentSummary.innerHTML = html;
  paymentTotal.innerText = finalTotal;

  paymentModal.style.display = "block";
}

/************************************
 * CLOSE POPUP
 ************************************/
function closePaymentPopup() {
  paymentModal.style.display = "none";
}

/************************************
 * CONFIRM PAYMENT
 ************************************/
function confirmPayment() {
  submitOrder();
}

/************************************
 * SUBMIT ORDER → SEND TOTAL TO WEBHOOK
 ************************************/
function submitOrder() {
  let itemsTotal = 0;

  Object.values(cart).forEach(d => {
    itemsTotal += d.qty * d.price;
  });

  const deliveryCharge =
    orderTypeSelect.value === "delivery" ? DELIVERY_CHARGE : 0;

  const finalTotal = itemsTotal + deliveryCharge;

  const payload = {
    name: nameInput.value.trim(),
    mobile: mobileInput.value.trim(),
    orderType: orderTypeSelect.value,
    address:
      orderTypeSelect.value === "delivery"
        ? addressInput.value.trim()
        : "",
    branch: branchSelect.value,

    items: Object.entries(cart).map(([p, d]) => ({
      item: p,
      qty: d.qty,
      price: d.price,
      lineTotal: d.qty * d.price
    })),

    itemsTotal: itemsTotal,
    deliveryCharge: deliveryCharge,
    totalAmount: finalTotal   // ✅ THIS GOES TO n8n
  };

  fetch(ORDER_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      alert(
        `✅ Order Confirmed\nOrder ID: ${data.orderId}\nTotal: ₹${data.totalAmount}`
      );
      location.reload();
    })
    .catch(() => alert("❌ Order Failed"));
}
