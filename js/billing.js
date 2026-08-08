/* ==========================================
   Billing
========================================== */

let billItems = [];
let heldBills = [];
let billNumber = 1;
let billNumberLoaded = false;
let isGeneratingBill = false;
let currentGeneratedBill = null;

/* ==========================================
   Thermal receipt rendering
   A table is deliberate here: Android print drivers handle fixed table columns
   far more consistently than flex layouts on narrow paper.
========================================== */

function receiptEscape(value){

    return String(value == null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;");

}

function receiptMoney(value){

    return Number(value || 0).toFixed(2);

}

function renderThermalReceipt(bill, paperWidth){

    const widthClass = paperWidth === "80mm" ? "thermal-receipt-80mm" : "thermal-receipt-58mm";
    const items = (bill.items || []).map(function(item){

        return `<tr>
            <td class="receipt-item-name">${receiptEscape(item.name)}</td>
            <td class="receipt-qty">${receiptEscape(item.qty)}</td>
            <td class="receipt-amount">${receiptMoney(item.total)}</td>
        </tr>`;

    }).join("");

    return `<section class="thermal-receipt ${widthClass}">
        <header class="receipt-business">
            <strong>${receiptEscape(settings.cafeName)}</strong>
            <span>${receiptEscape(settings.address)}</span>
            <span>Phone: ${receiptEscape(settings.phone)}</span>
            <span>GSTIN: ${receiptEscape(settings.gstin)}</span>
        </header>
        <div class="receipt-rule"></div>
        <div class="receipt-meta"><span>Bill: ${receiptEscape(bill.billNo)}</span><span>${receiptEscape(bill.date)}</span></div>
        <div class="receipt-meta"><span>Customer: ${receiptEscape(bill.customerName)}</span><span>Pay: ${receiptEscape(bill.paymentMethod)}</span></div>
        <div class="receipt-rule"></div>
        <table class="receipt-items">
            <colgroup><col class="receipt-item-col"><col class="receipt-qty-col"><col class="receipt-amount-col"></colgroup>
            <thead><tr><th>Item</th><th>Qty</th><th>Amt</th></tr></thead>
            <tbody>${items}</tbody>
        </table>
        <div class="receipt-rule"></div>
        <table class="receipt-totals">
            <tbody>
                <tr><th>Subtotal</th><td>${receiptMoney(bill.subtotal)}</td></tr>
                <tr><th>GST</th><td>${receiptMoney(bill.gst)}</td></tr>
                <tr class="receipt-grand-total"><th>Grand Total</th><td>${receiptMoney(bill.total)}</td></tr>
            </tbody>
        </table>
        <div class="receipt-rule"></div>
        <footer class="receipt-footer"><strong>Thank You</strong><span>Please Visit Again</span><span>Powered by</span><strong>MS ZAMA Dynamics</strong></footer>
    </section>`;

}

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

let grandTotal = 0;
let totalGST = 0;

billItems.forEach(function(item){

    grandTotal += item.total;

    totalGST += (item.total * item.gst) / 100;

});

function renderA4Invoice(bill){

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

<td>${bill.billNo}</td>

</tr>

<tr>

<td><strong>Date</strong></td>

<td>${bill.date}</td>

</tr>

<tr>

<td><strong>Customer</strong></td>

<td>${bill.customerName}</td>

</tr>

<tr>

<td><strong>Phone</strong></td>

<td>${bill.customerPhone}</td>

</tr>

<tr>

<td><strong>Payment</strong></td>

<td>${bill.paymentMethod}</td>

</tr>

</table>

<br>
    `;

html += `

<table class="bill-table">

<tr>

<th>Item</th>

<th>Qty</th>

<th>Rate</th>

<th>Amount</th>

</tr>

`;

    bill.items.forEach(function(item){

        html += `

<tr>

<td>${item.name}</td>

<td>${item.qty}</td>

<td>₹${item.price}</td>

<td>₹${item.total}</td>

</tr>

`;

    });

html += `

</table>

<br>

<table class="bill-table">

<tr>

    <td><strong>Subtotal</strong></td>

    <td style="text-align:right;">

        ₹${bill.subtotal.toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>GST</strong></td>

    <td style="text-align:right;">

        ₹${bill.gst.toFixed(2)}

    </td>

</tr>

<tr>

    <td><strong>Grand Total</strong></td>

    <td style="text-align:right;">

        <strong>

        ₹${bill.total.toFixed(2)}

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

    return html;

}

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

    let renderedInvoice;

    if(settings.printFormat === "A4"){

        renderedInvoice = renderA4Invoice(bill);

    }else if(settings.printFormat === "58mm"){

        renderedInvoice = renderThermalReceipt(bill, "58mm");

    }else if(settings.printFormat === "80mm"){

        renderedInvoice = renderThermalReceipt(bill, "80mm");

    }else{

        renderedInvoice = renderA4Invoice(bill);

    }

    currentGeneratedBill = bill;
    document.getElementById("invoice").innerHTML = renderedInvoice;

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

    if(currentGeneratedBill && settings.printFormat !== "A4"){

        printInvoice(renderThermalReceipt(currentGeneratedBill, settings.printFormat), settings.printFormat);

        return;

    }

    printInvoice(invoice.innerHTML, settings.printFormat);

}

/* ==========================================
   Hold Bill
========================================== */

function holdBill(){

    const customerName = document.getElementById("customer-name").value;
    const customerPhone = document.getElementById("customer-phone").value;
    const paymentMethod = document.getElementById("payment-method").value;

    const heldBill = {

        id: Date.now(),
        customerName,
        customerPhone,
        paymentMethod,
        billItems:[...billItems]

    };

    heldBills.push(heldBill);

    saveHeldBillDB(heldBill);

    billItems = [];

    document.getElementById("invoice").innerHTML = "";

    document.getElementById("customer-name").value = "";

    document.getElementById("customer-phone").value = "";

    document.getElementById("payment-method").selectedIndex = 0;

    document.getElementById("bill-product").selectedIndex = 0;

    document.getElementById("bill-qty").value = 1;

    displayBill();

    renderHeldBills();

    alert("Bill placed on Hold.");

}

/* ==========================================
   Held Bills
========================================== */

function renderHeldBills(){

    const heldBillsContainer = document.getElementById("held-bills");

    if(!heldBillsContainer){

        return;

    }

    if(heldBills.length === 0){

        heldBillsContainer.innerHTML = "No bills on hold.";

        return;

    }

    heldBillsContainer.innerHTML = heldBills.map(function(bill, index){

        return `

<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;">

    <div>

        <strong>${bill.customerName || "Walk-in Customer"}</strong><br>

        <span>${bill.billItems.length} item${bill.billItems.length === 1 ? "" : "s"}</span>

    </div>

    <div>

        <button onclick="resumeHeldBill(${index})">Resume</button>

        <button onclick="deleteHeldBill(${index})">Delete</button>

    </div>

</div>

`;

    }).join("");

}

function resumeHeldBill(index){

    const heldBill = heldBills[index];

    if(!heldBill){

        return;

    }

    document.getElementById("customer-name").value = heldBill.customerName;

    document.getElementById("customer-phone").value = heldBill.customerPhone;

    document.getElementById("payment-method").value = heldBill.paymentMethod;

    billItems = [...heldBill.billItems];

    deleteHeldBillDB(heldBill.id);

    heldBills.splice(index, 1);

    document.getElementById("invoice").innerHTML = "";

    displayBill();

    renderHeldBills();

}

function deleteHeldBill(index){

    const heldBill = heldBills[index];

    if(!heldBill){

        return;

    }

    if(!confirm("Delete this held bill?")){

        return;

    }

    deleteHeldBillDB(heldBill.id);

    heldBills.splice(index, 1);

    renderHeldBills();

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


