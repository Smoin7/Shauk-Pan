// ✅ OBJECT cart (key = pan type)
const cart = {};
const panPriceMap = {
  "Saada Pan": 10,
  "Chocolate Pan": 80,
  "Kulfi Pan": 60
};

// ADD ITEM
function addItem() {
  const panType = document.getElementById('panSelect').value;
  const qty = parseInt(document.getElementById('qtyInput').value);

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
    price: panPriceMap[panType]
  };

  renderCart();
}

// RENDER CART
function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";

  let total = 0;

  Object.entries(cart).forEach(([pan, data]) => {
    const li = document.createElement("li");
    const lineTotal = data.qty * data.price;
    total += lineTotal;

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

  document.getElementById("totalPrice").innerText = `₹${total}`;
}

// REMOVE ITEM
function removeItem(panType) {
  delete cart[panType];
  renderCart();
}

// SUBMIT ORDER
function submitOrder() {
  const items = Object.entries(cart).map(([pan, data]) => ({
    item: pan,
    qty: data.qty
  }));

  const data = {
    name: document.getElementById("name").value,
    mobile: document.getElementById("mobile").value,
    orderType: document.getElementById("orderType").value,
    address: document.getElementById("address").value,
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
