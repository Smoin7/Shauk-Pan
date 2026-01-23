/************************************
 * GLOBAL CART & INVENTORY CONFIG
 ************************************/

const cart = {};
const panPriceMap = {};

const INVENTORY_API =
  "https://shaikh98.app.n8n.cloud/webhook/pan-inventory";

// 🚚 Delivery charge
const DELIVERY_CHARGE = 50;


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

  // ensure total refresh
  renderCart();
}


/************************************
 * LOAD PAN INVENTORY
 ************************************/
function loadPanInventory() {
  const select = document.getElementById("item");

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
      console.error(err);
      select.innerHTML = `<option value="">Unable to load Paans</option>`;
    });
}


/************************************
 * PAGE LOAD INIT
 ************************************/
document.addEventListener("DOMContentLoaded", () => {
  toggleAddress();
  loadPanInventory();

  // 🔥 GUARANTEED delivery-charge recalculation
  document
    .getElementById("orderType")
    .addEventListener("change", renderCart);
});


/************************************
 * ADD ITEM
 ************************************/
function addItem() {
  const panType = document.getElementById("item").value;
  const qty = parseInt(document.getElementById("qty").value, 10);

  if (!panType || qty <= 0) {
    alert("Select paan and valid quantity");
    return;
  }

  if (cart[panType]) {
    alert("Item already added");
    return;
  }

  cart[panType] = {
    qty,
    price: panPriceMap[panType]
  };

  renderCart();
}


/************************************
 * RENDER CART + TOTAL (DELIVERY FIXED)
 ************************************/
function renderCart() {
  const ul = document.getElementById("cart");
  const totalEl = document.getElementById("totalPrice");
  const orderType = document.getElementById("orderType").value;

  ul.innerHTML = "";
  let total = 0;

  Object.entries(cart).forEach(([pan, data]) => {
    const lineTotal = data.qty * data.price;
    total += lineTotal;

    const li = document.createElement("li");
    li.innerHTML = `
      ${pan} × ${data.qty} = ₹${lineTotal}
      <button type="button" onclick="removeItem('${pan}')">✖</button>
    `;
    ul.appendChild(li);
  });

  // 🚚 DELIVERY CHARGE
  if (orderType === "delivery" && total > 0) {
    const li = document.createElement("li");
    li.innerHTML = `Delivery Charge = ₹${DELIVERY_CHARGE}`;
    ul.appendChild(li);

    total += DELIVERY_CHARGE;
  }

  totalEl.innerText = total;
}


/************************************
 * REMOVE ITEM
 ************************************/
function removeItem(panType) {
  delete cart[panType];
  renderCart();
}
