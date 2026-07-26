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

    content.innerHTML = `

        <div class="page-title">

            <h1>New Bill</h1>

            <p>Create a customer bill.</p>

        </div>

        <div class="card">

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

            Product

            <br><br>

            <select id="bill-product">

                <option>Select Product</option>

            </select>

            <br><br>

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

    });

    renderHeldBills();

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
