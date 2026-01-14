const cart = [];

function addItem() {
  const item = document.getElementById("item").value;
  const qty = Number(document.getElementById("qty").value);

  cart.push({ item, qty });

function renderCart() {
  const ul = document.getElementById("cart");
  ul.innerHTML = "";

  cart.forEach((i, index) => {
    const li = document.createElement("li");
    li.innerHTML = `
      ${i.item} × ${i.qty}
      <button onclick="removeItem(${index})">❌</button>
    `;
    ul.appendChild(li);
  });
}

function removeItem(index) {
  cart.splice(index, 1);
  renderCart();
}

}

function submitOrder() {
  const data = {
    name: document.getElementById("name").value,
    mobile: document.getElementById("mobile").value,
    orderType: document.getElementById("orderType").value,
    address: document.getElementById("address").value,
    items: cart
  };

  fetch("https://YOUR-N8N-URL/webhook/pan-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  })
  .then(() => alert("✅ Order Successful!"))
  .catch(() => alert("❌ Failed"));
}
