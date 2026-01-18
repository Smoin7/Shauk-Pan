const cart = [];

// ADD ITEM
function addItem() {
  const item = document.getElementById("item").value;
  const qty = Number(document.getElementById("qty").value);

  cart.push({ item, qty });
  renderCart(); // ✅ this was missing
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
