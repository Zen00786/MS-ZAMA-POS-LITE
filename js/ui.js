/* ==========================================
   Active Navigation
========================================== */

function setActiveMenu(menuId){

    // Remove active class from all menu items
    document.querySelectorAll("#sidebar li").forEach(item => {
        item.classList.remove("active");
    });

    // Add active class to selected menu
    document.getElementById(menuId).classList.add("active");

}

/* ==========================================
   UI Functions
========================================== */

const content = document.getElementById("content");

/* Phone navigation drawer. Desktop navigation remains unchanged. */
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");
const sidebarBackdrop = document.getElementById("sidebar-backdrop");
const appContainer = document.getElementById("app");

function setSidebarOpen(isOpen){

    appContainer.classList.toggle("sidebar-open", isOpen);
    document.body.classList.toggle("sidebar-open", isOpen);
    sidebarToggle.setAttribute("aria-expanded", String(isOpen));
    sidebarToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");

}

sidebarToggle.onclick = function(){

    setSidebarOpen(!appContainer.classList.contains("sidebar-open"));

};

sidebarBackdrop.onclick = function(){

    setSidebarOpen(false);

};

sidebar.onclick = function(event){

    if(event.target.closest("li")){
        setSidebarOpen(false);
    }

};

document.addEventListener("keydown", function(event){

    if(event.key === "Escape"){
        setSidebarOpen(false);
    }

});





function showDashboard(){

    content.innerHTML = `

        <div class="page-title">

            <h1>Dashboard</h1>

            <p>Welcome to ZPOS Lite</p>

        </div>

        <div class="dashboard-grid">

            <div class="card">

                <h3>Today's Sales</h3>

                <h2>₹${getTotalSales().toFixed(2)}</h2>

            </div>

            <div class="card">

                <h3>Total Bills</h3>

               <h2>${getTotalBills()}</h2>

            </div>

            <div class="card">

                <h3>Today's Profit</h3>

                <h2>₹${getTotalProfit().toFixed(2)}</h2>

            </div>

            <div class="card">

                <h3>Products</h3>

        <h2>${products.length}</h2>

            </div>

        </div>

    `;

}

/* ==========================================
   Products Page
========================================== */

function showProducts(){

    content.innerHTML = `

    <div class="page-title">

        <h1>Products</h1>

        <p>Add and manage your products.</p>

    </div>

    <br>

    <div class="card">

        <h2>Add Product</h2>

        <br>

<input id="product-name" type="text" placeholder="Product Name">

<br><br>

<input id="selling-price" type="number" placeholder="Selling Price">

<br><br>

<input id="cost-price" type="number" placeholder="Cost Price">

<br><br>

<label>Category</label>

<br><br>

<select id="category">

    <option>Beverages</option>

    <option>Food</option>

    <option>Dessert</option>

    <option>Other</option>

</select>

<br><br>

<label>GST</label>

<br><br>

<select id="gst">

    <option value="0">0%</option>

    <option value="5">5%</option>

    <option value="12">12%</option>

    <option value="18">18%</option>

    <option value="28">28%</option>

</select>

<br><br>

<button id="product-btn" onclick="addProduct()">
    Add Product
</button>

<hr style="margin:30px 0;">

<input
    id="search-product"
    type="text"
    placeholder="Search Product..."
    onkeyup="searchProducts()"
>

<br><br>

<h2>Product List</h2>
</div>

<div id="product-list">

    No products added.

</div>

    `;

loadProducts(displayProducts);

}

/* ==========================================
   Billing Page
========================================== */

function showBilling(){

    if(window.matchMedia("(max-width: 767px)").matches){
        setSidebarOpen(false);
    }

    content.innerHTML = `

        <div class="page-title">

            <h1>New Bill</h1>

            <p>Create a customer bill.</p>

        </div>

        <div class="card billing-card">

            <h2>Billing</h2>

            <br>

<input
    id="customer-name"
    type="text"
    placeholder="Customer Name (Optional)"
>

<br><br>

<input
    id="customer-phone"
    type="text"
    placeholder="Phone Number (Optional)"
>

<br><br>

<select id="payment-method">

    <option>Cash</option>

    <option>UPI</option>

    <option>Card</option>

</select>

<br><br>

            <br>

            <span class="billing-product-label">Search Product<br><br></span>

<input
    id="bill-product-search"
    class="billing-product-search"
    type="search"
    placeholder="🔍 Search products..."
    autocomplete="off"
    aria-label="Search products"
>

<div id="bill-product-results" class="billing-product-results" role="listbox" aria-label="Product results"></div>

<div class="billing-selected-product">
    <span>Selected Product</span>
    <div id="bill-selected-product" class="billing-selected-product-value" aria-live="polite">No product selected</div>
</div>

            <select id="bill-product">

                <option>Select Product</option>

            </select>

            Quantity

            <br><br>

            <input
                id="bill-qty"
                type="number"
                value="1"
            >

            <br><br>

           <button onclick="addToBill()">

    Add To Bill

</button>

            <hr style="margin:30px 0;">

<h2>Current Bill</h2>

<div id="bill-items">

    No items added.

</div>

<div id="bill-adjustments" style="display:none;max-width:360px;margin-top:14px;padding:10px;border:1px solid #ddd;border-radius:6px;">

    <strong style="font-size:14px;">Bill Adjustments</strong>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;">
        <label for="bill-discount" style="margin:0;">Discount (%)</label>
        <input id="bill-discount" type="number" min="0" max="100" step="0.01" value="0" oninput="displayBill()" style="width:80px;">
    </div>

    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:8px;">
        <label for="parcel-charge" style="margin:0;">Parcel / Packing</label>
        <input id="parcel-charge" type="number" min="0" step="0.01" value="0" oninput="displayBill()" style="width:80px;">
    </div>

</div>

<br>

<h2>

    Grand Total : ₹<span id="grand-total">0</span>

</h2>


<br>

<button onclick="generateBill()">

    Generate Bill

</button>

<div id="invoice-container">

    <div id="invoice" style="margin-top:30px;"></div>

</div>

<br><br>

<button onclick="printBill()">

    Print Bill

</button>

<br><br>

<button onclick="newBill()">

    New Bill

</button>

<button onclick="holdBill()">

    Hold Bill

</button>

        </div>

        <div class="card">

            <h2>Held Bills</h2>

            <div id="held-bills">

                No bills on hold.

            </div>

        </div>

    `;

    loadProducts(function(){

        loadProductsDropdown();
        setupBillingProductSearch();

    });

    renderHeldBills();

}

function setBillingSelectedProduct(productName){

    const indicator = document.getElementById("bill-selected-product");

    if(!indicator){
        return;
    }

    indicator.textContent = productName || "No product selected";
    indicator.classList.toggle("has-selection", Boolean(productName));

}

/* Product search only updates the existing billing selector. */
function setupBillingProductSearch(){

    const search = document.getElementById("bill-product-search");
    const results = document.getElementById("bill-product-results");
    const dropdown = document.getElementById("bill-product");

    if(!search || !results || !dropdown){
        return;
    }

    function renderProductResults(){

        const keyword = search.value.trim().toLowerCase();

        results.innerHTML = "";

        if(!keyword){
            return;
        }

        const matchingProducts = products.filter(function(product){
            return product.name.toLowerCase().includes(keyword);
        });

        matchingProducts.forEach(function(product){

            const option = document.createElement("button");
            option.type = "button";
            option.className = "billing-product-option";
            option.setAttribute("role", "option");
            option.textContent = product.name;

            option.onclick = function(){
                dropdown.value = product.name;
                search.value = "";
                results.innerHTML = "";
                setBillingSelectedProduct(product.name);
            };

            results.appendChild(option);

        });

    }

    search.addEventListener("input", renderProductResults);
    renderProductResults();

}

/* ==========================================
   Navigation
========================================== */

document.getElementById("nav-dashboard").onclick = function(){

    setActiveMenu("nav-dashboard");
    showDashboard();

};

document.getElementById("nav-products").onclick = function(){

    setActiveMenu("nav-products");
    showProducts();

};

document.getElementById("nav-billing").onclick = function(){

    setActiveMenu("nav-billing");

    showBilling();

};

document.getElementById("nav-history").onclick = function(){

    setActiveMenu("nav-history");

    showHistory();

};

document.getElementById("nav-reports").onclick = function(){

    setActiveMenu("nav-reports");

    showReports();

};

document.getElementById("nav-settings").onclick = function(){

    setActiveMenu("nav-settings");

    showSettings();

};
