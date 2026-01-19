/************************************
 * GLOBAL CART & PRICE CONFIG
 ************************************/

// Object cart to block duplicate pan types
const cart = {};

// Static price map (replace later with Pan_Inventory fetch)
const panPriceMap = {
  "Meetha Pan": 15,
  "Saada Pan": 10,
  "Chocolate Pan": 25,
  "Fire Pan": 50
};


/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const panType = document.getElementById("item").value;
  const qty = parseInt(document.getElementById("qty").value, 10);

  if (!panType) {
    alert("Please select a pan type");
    return;
  }

  if (!qty || qty <= 0) {
    alert("Please enter a valid quantity");
    return;
  }

  // 🚫 Block duplicate pan types
  if (cart[panType]) {
    alert(`${panType} already added. Remove it first to change quantity.`);
    return;
  }

  cart[panType] = {
    qty: qty,
    price: panPriceMap[panType] || 0
  };

  renderCart();
}


/************************************
 * RENDER CART + TOTAL
 ************************************/
function renderCart() {
  const ul = document.getElementById("cart");
  const totalEl = document.getElementById("totalPrice");

  if (!ul || !totalEl) {
    console.error("cart or totalPrice element not found in DOM");
    return;
  }

  ul.innerHTML = "";
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
        style="
          margin-left:10px;
          background:none;
          border:none;
          color:red;
          font-size:16px;
          cursor:pointer;
        "
      >✖</button>
    `;

    ul.appendChild(li);
  });

  // ✅ UPDATE TOTAL IN UI (CRITICAL LINE)
  totalEl.innerText = total;

  // Debug (can remove later)
  console.log("Total calculated:", total);
}


/************************************
 * REMOVE ITEM
 ************************************/
function removeItem(panType) {
  delete cart[panType];
  renderCart();
}


/************************************
 * SUBMIT ORDER
 ************************************/
function submitOrder() {
  if (Object.keys(cart).length === 0) {
    alert("Please add at least one pan");
    return;
  }

  const items = Object.entries(cart).map(([pan, data]) => ({
    item: pan,
    qty: data.qty
  }));

  const payload = {
    name: document.getElementById("name").value,
    mobile: document.getElementById("mobile").value,
    orderType: document.getElementById("orderType").value,
    address: document.getElementById("address").value,
    branch: document.getElementById("branch").value,
    items: items
  };

  fetch("https://shaikh98.app.n8n.cloud/webhook/pan-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(() => alert("✅ Order Successful!"))
    .catch(() => alert("❌ Order Failed"));
}
