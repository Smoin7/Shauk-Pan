// ✅ OBJECT cart (blocks duplicate pan types)
const cart = {};

// Price map (later you can fetch from Pan_Inventory)
const panPriceMap = {
  "Meetha Pan": 15,
  "Saada Pan": 10,
  "Chocolate Pan": 25,
  "Fire Pan": 50
};

// ADD ITEM
function addItem() {
  const panType = document.getElementById('item').value; // ✅ FIX
  const qty = parseInt(document.getElementById('qty').value); // ✅ FIX

  if (!panType) {
    alert('Please select a pan type');
    return;
  }

  if (!qty || qty <= 0) {
    alert('Please enter valid quantity');
    return;
  }

  // 🚫 BLOCK DUPLICATE PAN TYPE
  if (cart[panType]) {
    alert(`${panType} already added. You cannot add it again.`);
    return;
  }

  cart[panType] = {
    qty: qty,
    price: panPriceMap[panType] || 0
  };

  renderCart();
}

// RENDER CART
function renderCart() {
  const ul = document.getElementById("cart");
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
        style="margin-left:10px;color:red;border:none;background:none;cursor:pointer;"
      >✖</button>
    `;

    ul.appendChild(li);
  });
}

// REMOVE ITEM
function removeItem(panType) {
  delete cart[panType];
  renderCart();
}

// SUBMIT ORDER
function submitOrder() {
  if (Object.keys(cart).length === 0) {
    alert("Please add at least one pan");
    return;
  }

  const items = Object.entries(cart).map(([pan, data]) => ({
    item: pan,
    qty: data.qty
  }));

  const data = {
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
    body: JSON.stringify(data)
  })
    .then(() => alert("✅ Order Successful!"))
    .catch(() => alert("❌ Failed"));
}
