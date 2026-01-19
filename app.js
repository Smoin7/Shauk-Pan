const cart = [];

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

  // add once
  cart[panType] = {
    qty: qty,
    price: panPriceMap[panType] // fetched from Pan_Inventory
  };

  renderCart();
}

// RENDER CART
function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";

  cart.forEach((i, index) => {
    const li = document.createElement("li");

    li.innerHTML = `
      ${i.item} × ${i.qty}
      <button 
        type="button"
        onclick="removeItem(${index})"
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
}

// REMOVE ITEM
function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

// SUBMIT ORDER
function submitOrder() {
  const data = {
    name: document.getElementById("name").value,
    mobile: document.getElementById("mobile").value,
    orderType: document.getElementById("orderType").value,
    address: document.getElementById("address").value,
    items: cart
  };

  fetch("https://shaikh98.app.n8n.cloud/webhook/pan-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => alert("✅ Order Successful!"))
  .catch(() => alert("❌ Failed"));
}
