/************************************
 * GLOBAL CART & INVENTORY
 ************************************/
const cart = {};
const panPriceMap = {};

const INVENTORY_API =
  "https://shaikh98.app.n8n.cloud/webhook/pan-inventory";

/************************************
 * ORDER TYPE
 ************************************/
function toggleAddress() {
  const orderType = document.getElementById("orderType").value;
  document.getElementById("addressBox").style.display =
    orderType === "delivery" ? "block" : "none";
}

/************************************
 * LOAD INVENTORY
 ************************************/
function loadPanInventory() {
  const select = document.getElementById("item");
  fetch(INVENTORY_API)
    .then(res => res.json())
    .then(data => {
      select.innerHTML = `<option value="">-- Select Paan --</option>`;
      data.pans.forEach(pan => {
        panPriceMap[pan.name] = pan.price;
        const opt = document.createElement("option");
        opt.value = pan.name;
        opt.textContent = `${pan.name} (₹${pan.price})`;
        select.appendChild(opt);
      });
    });
}

/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const pan = item.value;
  const qty = +qtyInput.value || 1;

  if (!pan) return alert("Select Paan");
  if (cart[pan]) return alert("Already added");

  cart[pan] = { qty, price: panPriceMap[pan] };
  renderCart();
}

/************************************
 * RENDER CART
 ************************************/
function renderCart() {
  cartList.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([pan, d]) => {
    total += d.qty * d.price;
    cartList.innerHTML += `
      <li>${pan} × ${d.qty} = ₹${d.qty * d.price}
      <button onclick="removeItem('${pan}')">✖</button></li>`;
  });

  totalPrice.innerText = total;
}

function removeItem(pan) {
  delete cart[pan];
  renderCart();
}

/************************************
 * BOOK NOW → POPUP
 ************************************/
function bookNow() {
  if (!Object.keys(cart).length)
    return alert("Add items first");

  let html = "<ul>";
  let total = 0;

  Object.entries(cart).forEach(([p, d]) => {
    total += d.qty * d.price;
    html += `<li>${p} × ${d.qty} = ₹${d.qty * d.price}</li>`;
  });

  html += "</ul>";

  paymentSummary.innerHTML = html;
  paymentTotal.innerText = total;

  paymentModal.style.display = "block";
}

function closePaymentPopup() {
  paymentModal.style.display = "none";
}

/************************************
 * CONFIRM PAYMENT → SUBMIT
 ************************************/
function confirmPayment() {
  closePaymentPopup();
  submitOrder();
}

/************************************
 * SUBMIT ORDER (n8n)
 ************************************/
function submitOrder() {
  const payload = {
    name: name.value,
    mobile: mobile.value,
    orderType: orderType.value,
    address: address.value,
    branch: branch.value,
    items: Object.entries(cart).map(([p, d]) => ({
      item: p,
      qty: d.qty
    }))
  };

  fetch("https://shaikh98.app.n8n.cloud/webhook/paan-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(() => {
      alert("✅ Order Successful!");
      location.reload();
    })
    .catch(() => alert("❌ Order Failed"));
}

/************************************
 * INIT
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
  window.cartList = document.getElementById("cart");
  window.totalPrice = document.getElementById("totalPrice");
  window.qtyInput = document.getElementById("qty");
  toggleAddress();
  loadPanInventory();
});
