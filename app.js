// ===== CART STORAGE =====
const cart = [];

// ===== ADD ITEM TO CART =====
function addItem() {
  const itemEl = document.getElementById("item");
  const qtyEl = document.getElementById("qty");

  if (!itemEl || !qtyEl) {
    console.error("Item or Qty element not found");
    return;
  }

  const item = itemEl.value;
  const qty = Number(qtyEl.value);

  if (!item || qty < 1) {
    alert("Please select item and quantity");
    return;
  }

  cart.push({ item, qty });
  renderCart();
}

// ===== RENDER CART =====
function renderCart() {
  const ul = document.getElementById("cart");

  if (!ul) {
    console.error("Cart element not found");
    return;
  }

  ul.innerHTML = "";

  cart.forEach((i, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${i.item} × ${i.qty}
      <button type="button" onclick="removeItem(${index})">❌</button>
    `;
    ul.appendChild(li);
  });
}

// ===== REMOVE ITEM =====
function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

// ===== SUBMIT ORDER =====
function submitOrder() {
  if (cart.length === 0) {
    alert("Cart is empty");
    return;
  }

  const data = {
    name: document.getElementById("name")?.value || "",
    mobile: document.getElementById("mobile")?.value || "",
    orderType: document.getElementById("orderType")?.value || "",
    address: document.getElementById("address")?.value || "",
    items: cart
  };

  fetch("https://YOUR-N8N-URL/webhook/pan-order", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  })
    .then(() => {
      alert("✅ Order Successful!");
      cart.length = 0; // clear cart
      renderCart();
    })
    .catch((err) => {
      console.error(err);
      alert("❌ Order Failed");
    });
}
