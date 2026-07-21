/* ==========================================
   Products
========================================== */

let products = [];
let editIndex = -1;

/* ==========================================
   Add Product
========================================== */

function addProduct() {

    const isEditing = editIndex !== -1;
    const name = document.getElementById("product-name").value.trim();
    const selling = Number(document.getElementById("selling-price").value);
    const cost = Number(document.getElementById("cost-price").value);
    const gst = document.getElementById("gst").value;
    const category = document.getElementById("category").value;


    const editingProduct = isEditing ? products[editIndex] : null;
    const exists = products.find(function(item){

        return item.name.toLowerCase() === name.toLowerCase() &&
            (!editingProduct || item.id !== editingProduct.id);

    });

if(exists){

    alert("Product already exists.");

    return;

}
    if(
    name === "" ||
    !Number.isFinite(selling) ||
    !Number.isFinite(cost) ||
    selling < 0 ||
    cost < 0
){
    alert("Enter a product name and valid non-negative prices.");
    return;
}

const product = {

    name,
    selling,
    cost,
    gst,
    category

};

    if(!isEditing){

saveProduct(product, function(){

    products.push(product);

    displayProducts();

}, function(){

    alert("Unable to save the product. Please try again.");

});

}
else{

product.id = products[editIndex].id;

products[editIndex] = product;

updateProductDB(product);

editIndex = -1;

    document.getElementById("product-btn").innerText = "Add Product";

}
    // Clear Form

document.getElementById("product-name").value = "";
document.getElementById("selling-price").value = "";
document.getElementById("cost-price").value = "";
document.getElementById("gst").value = "";

document.getElementById("product-name").focus();

    if(isEditing){

        displayProducts();

    }
    
}

/* ==========================================
   Display Products
========================================== */

function displayProducts(){

    let html = `

    <table class="bill-table">

        <tr>

            <th>Name</th>

            <th>Category</th>

            <th>Selling</th>

            <th>Cost</th>

            <th>GST</th>

            <th>Action</th>

        </tr>

    `;

    products.forEach(function(product,index){

        html += `

        <tr>

            <td>${product.name}</td>

            <td>${product.category || "Other"}</td>

            <td>₹${product.selling}</td>

            <td>₹${product.cost}</td>

            <td>${product.gst}%</td>

            <td>

                <button onclick="editProduct(${index})">

                    Edit

                </button>

                <button onclick="deleteProduct(${index})">

                    Delete

                </button>

            </td>

        </tr>

        `;

    });

    html += "</table>";

    document.getElementById("product-list").innerHTML = html;

}

/* ==========================================
   Edit Product
========================================== */

function editProduct(index){

    const product = products[index];

    document.getElementById("product-name").value = product.name;
    document.getElementById("selling-price").value = product.selling;
    document.getElementById("cost-price").value = product.cost;
    document.getElementById("gst").value = product.gst;
    document.getElementById("category").value = product.category || "Other";

    editIndex = index;
    document.getElementById("product-btn").innerText = "Update Product";

}

/* ==========================================
   Delete Product
========================================== */

function deleteProduct(index){

    const product = products[index];

    if(!product) return;

    if(!confirm(`Delete product ${product.name}?`)){

        return;

    }

    deleteProductDB(product.id, function(){

        products.splice(index, 1);
        editIndex = -1;

        displayProducts();

    }, function(){

        alert("Unable to delete the product. Please try again.");

    });

}


/* ==========================================
   Load Products into Billing Dropdown
========================================== */

function loadProductsDropdown(){

    const dropdown = document.getElementById("bill-product");

    if(!dropdown) return;

    dropdown.innerHTML = "<option value=''>Select Product</option>";

    products.forEach(function(product){

        dropdown.innerHTML += `
            <option value="${product.name}">
                ${product.name}
            </option>
        `;

    });

}   

/* ==========================================
   Find Product Cost
========================================== */

function findCost(productName){

    const product = products.find(function(item){

        return item.name === productName;

    });

    return product ? product.cost : 0;

}


/* ==========================================
   Search Products
========================================== */

function searchProducts(){

    const keyword = document
        .getElementById("search-product")
        .value
        .toLowerCase();

    const filtered = products.filter(function(product){

        return product.name
            .toLowerCase()
            .includes(keyword);

    });

    displayFilteredProducts(filtered);

}

/* ==========================================
   Display Filtered Products
========================================== */

function displayFilteredProducts(filteredProducts){

    let html = `

    <table class="bill-table">

        <tr>

            <th>Name</th>
            <th>Category</th>
            <th>Selling</th>
            <th>Cost</th>
            <th>GST</th>
            <th>Action</th>

        </tr>

    `;

    filteredProducts.forEach(function(product){

        const productIndex = products.indexOf(product);

        html += `

        <tr>

            <td>${product.name}</td>
            <td>${product.category || "Other"}</td>
            <td>₹${product.selling}</td>
            <td>₹${product.cost}</td>
            <td>${product.gst}%</td>

            <td>

                <button onclick="editProduct(${productIndex})">
                    Edit
                </button>

                <button onclick="deleteProduct(${productIndex})">
                    Delete
                </button>

            </td>

        </tr>

        `;

    });

    html += "</table>";

    document.getElementById("product-list").innerHTML = html;

}
