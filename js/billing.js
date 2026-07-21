/* ==========================================
   Billing
========================================== */

let billItems = [];
let billNumber = 1;
let billNumberLoaded = false;
let isGeneratingBill = false;

function setBillNumber(nextBillNumber){

    billNumber = nextBillNumber;
    billNumberLoaded = true;

}

/* ==========================================
   Add Item To Bill
========================================== */

function addToBill(){

    const productName = document.getElementById("bill-product").value;

    const qty = Number(document.getElementById("bill-qty").value);

    if(productName === ""){

        alert("Select a product.");

        return;

    }

    const product = products.find(function(item){

        return item.name === productName;

    });

const existing = billItems.find(function(item){

    return item.name === product.name;

});

if(existing){

    existing.qty += qty;

    existing.total = existing.qty * existing.price;

}
else{

billItems.push({

    name: product.name,

    qty: qty,

    price: Number(product.selling),

    cost: Number(product.cost),

    gst: Number(product.gst),

    total: qty * Number(product.selling)

});

}

displayBill();

}

/* ==========================================
   Display Bill
========================================== */

function displayBill(){

    let grandTotal = 0;

    let html = `

    <table class="bill-table">

        <tr>

            <th>Product</th>

            <th>Qty</th>

            <th>Price</th>

            <th>Total</th>

            <th>Action</th>

        </tr>

    `;

    billItems.forEach(function(item,index){

        grandTotal += item.total;

        html += `

        <tr>

            <td>${item.name}</td>

            <td>

<button onclick="decreaseQty(${index})">−</button>

${item.qty}

<button onclick="increaseQty(${index})">+</button>

</td>

            <td>₹${item.price}</td>

            <td>₹${item.total}</td>

            <td>

                <button onclick="removeBillItem(${index})">

                    X

                </button>

            </td>

        </tr>

        `;

    });

    html += "</table>";

    document.getElementById("bill-items").innerHTML = html;

    document.getElementById("grand-total").innerText = grandTotal;

}

/* ==========================================
   Remove Bill Item
========================================== */

function removeBillItem(index){

    billItems.splice(index,1);

    displayBill();

}


/* ==========================================
   Increase Quantity
========================================== */

function increaseQty(index){

    billItems[index].qty++;

    billItems[index].total =
        billItems[index].qty * billItems[index].price;

    displayBill();

}

/* ==========================================
   Decrease Quantity
========================================== */

function decreaseQty(index){

    if(billItems[index].qty > 1){

        billItems[index].qty--;

        billItems[index].total =
            billItems[index].qty * billItems[index].price;

    }
    else{

        removeBillItem(index);

        return;

    }

    displayBill();

}

/* ==========================================
   Generate Bill
========================================== */

function generateBill(){

    if(!billNumberLoaded){

        alert("Invoice number is loading. Please try again in a moment.");

        return;

    }

    if(isGeneratingBill){

        return;

    }

    isGeneratingBill = true;

    // Generate Invoice Number

const today = new Date();

const datePart =
    today.getFullYear().toString() +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");

const invoiceNumber =
`${settings.invoicePrefix}-${datePart}-${String(billNumber).padStart(4,"0")}`;

const customerName =
    document.getElementById("customer-name").value.trim();

const customerPhone =
    document.getElementById("customer-phone").value;

const paymentMethod =
    document.getElementById("payment-method").value;

let html = `

<div class="card invoice">

   <div style="text-align:center;">

    <h1>${settings.cafeName}</h1>

    <p>${settings.address}</p>

    <p>Phone : ${settings.phone}</p>

    <p>GSTIN : ${settings.gstin}</p>

</div>

<hr>

<table class="bill-table">

<tr>

<td><strong>Invoice No</strong></td>

<td>${invoiceNumber}</td>

</tr>

<tr>

<td><strong>Date</strong></td>

<td>${new Date().toLocaleString()}</td>

</tr>

<tr>

<td><strong>Customer</strong></td>

<td>${customerName === "" ? "Walk-in Customer" : customerName}</td>

</tr>

<tr>

<td><strong>Phone</strong></td>

<td>${customerPhone || "-"}</td>

</tr>

<tr>

<td><strong>Payment</strong></td>

<td>${paymentMethod}</td>

</tr>

</table>

<br>
    `;

    let grandTotal = 0;
let totalGST = 0;

html += `

<table class="bill-table">

<tr>

<th>Item</th>

<th>Qty</th>

<th>Rate</th>

<th>Amount</th>

</tr>

`;

    billItems.forEach(function(item){

        html += `

<tr>

<td>${item.name}</td>

<td>${item.qty}</td>

<td>₹${item.price}</td>

<td>₹${item.total}</td>

</tr>

`;

                grandTotal += item.total;

totalGST += (item.total * item.gst) / 100;

    });

html += `

</table>

<br>

<table class="bill-table">

<tr>

    <td><strong>Subtotal</strong></td>

    <td style="text-align:right;">

        ₹${grandTotal.toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>GST</strong></td>

    <td style="text-align:right;">

        ₹${totalGST.toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>Grand Total</strong></td>

    <td style="text-align:right;">

        <strong>

        ₹${(grandTotal + totalGST).toFixed(2)}

        </strong>

    </td>

</tr>

</table>

<br>

<div style="text-align:center;margin-top:25px;">

<hr>

<p><strong>Thank You for Visiting!</strong></p>

<p>We Appreciate Your Business ❤️</p>

<p>Please Visit Again ☕</p>

<br>

<p style="font-size:12px;">

Powered by <strong>MS ZAMA Dynamics</strong>

</p>

</div>

</div>

`;

    document.getElementById("invoice").innerHTML = renderInvoice({
    html: html
});

    // Now create bill object

const bill = {

    billNo: invoiceNumber,

    date: new Date().toLocaleString(),

    customerName:
        customerName === ""
        ? "Walk-in Customer"
        : customerName,

    customerPhone:
        customerPhone === ""
        ? "-"
        : customerPhone,

    paymentMethod,

    items:[...billItems],

    subtotal:grandTotal,

    gst:totalGST,

    total:grandTotal + totalGST

};

saveBillAndAdvanceNumber(bill, billNumber + 1, function(){

    billHistory.push(bill);

    billNumber++;
    isGeneratingBill = false;

    if(document.getElementById("nav-dashboard").classList.contains("active")){

        showDashboard();

    }

}, function(){

    isGeneratingBill = false;

    alert("Unable to save the bill. Please try again.");

});

}

/* ==========================================
   Print Bill
========================================== */

function printBill(){

    const invoice = document.getElementById("invoice");

    if(!invoice || invoice.innerHTML.trim() === ""){

        alert("Generate a bill before printing.");

        return;

    }

    printInvoice(invoice.innerHTML);

}

/* ==========================================
   New Bill
========================================== */

function newBill(){

    billItems = [];

    displayBill();

    document.getElementById("invoice").innerHTML = "";

    document.getElementById("bill-product").selectedIndex = 0;

    document.getElementById("bill-qty").value = 1;

}


/* ==========================================
   Render Invoice
========================================== */

function renderInvoice(bill){

    return bill.html;

}
