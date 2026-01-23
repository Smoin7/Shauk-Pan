/************************************
 * GLOBAL CART & INVENTORY CONFIG
 ************************************/

// Object cart to block duplicate pan types
const cart = {};

// Dynamic price map (filled from Pan_Inventory API)
const panPriceMap = {};

// 🔗 Inventory API (n8n)
const INVENTORY_API =
  "https://shaikh98.app.n8n.cloud/webhook/pan-inventory";


/************************************
 * ORDER TYPE LOGIC
 ************************************/
function toggleAddress() {
  const orderType = document.getElementById("orderType").value;
  const addressBox = document.getElementById("addressBox");
  const addressInput = document.getElementById("address");

  if (orderType === "delivery") {
    addressBox.style.display = "block";
  } else {
    addressBox.style.display = "none";
    addressInput.value = "";
  }
}


/************************************
 * LOAD PAN INVENTORY (NEW)
 ************************************/
function loadPanInventory() {
  const select = document.getElementById("item");

  // Initial state
  select.innerHTML = `<option value="">Loading Paans...</option>`;

  fetch(INVENTORY_API)
    .then(res => {
      if (!res.ok) throw new Error("Inventory API failed");
      return res.json();
    })
    .then(data => {
      select.innerHTML = `<option value="">-- Select Paan --</option>`;

      if (!data.pans || data.pans.length === 0) {
        select.innerHTML = `<option value="">No Paans available</option>`;
        return;
      }

      data.pans.forEach(pan => {
        panPriceMap[pan.name] = pan.price;

        const opt = document.createElement("option");
        opt.value = pan.name;
        opt.textContent = `${pan.name} (₹${pan.price})`;
        select.appendChild(opt);
      });
    })
    .catch(err => {
      console.error("Failed to load pan inventory:", err);
      select.innerHTML = `<option value="">Unable to load Paans</option>`;
      alert("⚠ Unable to load pan list. Please refresh.");
    });
}


/************************************
 * PAGE LOAD INIT
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
  toggleAddress();
  loadPanInventory();
});


/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const panType = document.getElementById("item").value;
  const qty = parseInt(document.getElementById("qty").value, 10);

  if (!panType) {
    alert("Please select a Paan type");
    return;
  }

  if (!qty || qty <= 0) {
    alert("Please enter a valid quantity");
    return;
  }

  if (!panPriceMap[panType]) {
    alert("Invalid Paan selected. Please refresh.");
    return;
  }

  if (cart[panType]) {
    alert(`${panType} already added. Remove it first to change quantity.`);
    return;
  }

  cart[panType] = {
    qty: qty,
    price: panPriceMap[panType]
  };

  renderCart();
}


/************************************
 * RENDER CART + TOTAL
 ************************************/
function renderCart() {
  const ul = document.getElementById("cart");
  const totalEl = document.getElementById("totalPrice");

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

  totalEl.innerText = total;
}


/************************************
 * REMOVE ITEM
 ************************************/
function removeItem(panType) {
  delete cart[panType];
  renderCart();
}


/************************************
 * SUBMIT ORDER (UNCHANGED)
 ************************************/
function submitOrder() {
  if (Object.keys(cart).length === 0) {
    alert("Please add at least one Paan");
    return;
  }

  const orderType = document.getElementById("orderType").value;
  const address = document.getElementById("address").value;

  if (orderType === "delivery" && !address.trim()) {
    alert("Please enter delivery address");
    return;
  }

  const items = Object.entries(cart).map(([pan, data]) => ({
    item: pan,
    qty: data.qty
  }));

  const payload = {
    name: document.getElementById("name").value,
    mobile: document.getElementById("mobile").value,
    orderType: orderType,
    address: orderType === "delivery" ? address : "",
    branch: document.getElementById("branch").value,
    items: items
  };

  fetch("https://shaikh98.app.n8n.cloud/webhook/pan-order", {
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
 * BOOK NOW (TRIGGERS N8N WITH TOTAL)
 ************************************/
function bookNow() {
  const name = document.getElementById("name").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const orderType = document.getElementById("orderType").value;
  const address = document.getElementById("address").value.trim();
  const branch = document.getElementById("branch").value;

  if (!name) {
    alert("Please enter your name");
    return;
  }

  if (!/^\d{10}$/.test(mobile)) {
    alert("Please enter a valid 10-digit mobile number");
    return;
  }

  if (!branch) {
    alert("Please select a branch");
    return;
  }

  if (orderType === "delivery" && !address) {
    alert("Please enter delivery address");
    return;
  }

  const totalAmount = parseInt(
    document.getElementById("totalPrice").innerText,
    10
  );

  if (!totalAmount || totalAmount <= 0) {
    alert("Please add at least one Paan using the Add button");
    return;
  }

  const items = Object.entries(cart).map(([pan, data]) => ({
    item: pan,
    qty: data.qty,
    price: data.price,
    lineTotal: data.qty * data.price
  }));

  const payload = {
    name: name,
    mobile: mobile,
    orderType: orderType,
    address: orderType === "delivery" ? address : "",
    branch: branch,
    items: items,
    totalAmount: totalAmount   // ✅ SENT TO N8N
  };

  fetch("https://shaikh98.app.n8n.cloud/webhook/pan-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })
    .then(() => {
      window.location.href = "payment.html";
    })
    .catch(() => {
      alert("❌ Failed to place order. Please try again.");
    });
}
