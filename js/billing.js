/* ==========================================
   Billing
========================================== */

let billItems = [];
let heldBills = [];
let billNumber = 1;
let billNumberLoaded = false;
let orderNumber = 1;
let orderNumberLoaded = false;
let isGeneratingBill = false;

/* ==========================================
   Shared POS Receipt
   The original 58mm receipt is the master markup for every paper size.
========================================== */

function render58mmReceipt(bill, printFormat){

    const format = printFormat || "58mm";
    const receiptClass =
        format === "80mm"
        ? "thermal-receipt-80mm"
        : format === "A4"
        ? "thermal-receipt-a4"
        : "thermal-receipt-58mm";
    const receiptWidth =
        format === "80mm"
        ? "80mm"
        : format === "A4"
        ? "210mm"
        : "58mm";
    const discount = Number(bill.discount) || 0;
    const parcelCharge = Number(bill.parcelCharge) || 0;
    const orderNumberHtml = Number.isInteger(Number(bill.orderNo))
        ? `<div style="text-align:center;font-weight:bold;font-size:18px;line-height:1.1;margin-bottom:6px;">ORDER<br>${String(bill.orderNo).padStart(3, "0")}</div>`
        : "";

    const itemsHtml = bill.items.map(function(item){

        return `

<div style="display:flex;gap:4px;line-height:1.35;">

    <span style="flex:1;min-width:0;word-break:break-word;">${item.name}</span>

    <span style="width:28px;text-align:center;">${item.qty}</span>

    <span style="width:52px;text-align:right;">${item.total}</span>

</div>

`;

    }).join("");

    return `

<div class="thermal-receipt ${receiptClass}" style="width:${receiptWidth};max-width:100%;margin:0 auto;font-family:monospace;font-size:11px;line-height:1.35;color:#000;">

    <div style="text-align:center;">

        <strong style="font-size:14px;">${settings.cafeName}</strong><br>

        <span>${settings.address}</span><br>

        <span>Phone: ${settings.phone}</span><br>

        <span>GSTIN: ${settings.gstin}</span>

    </div>

    <div style="border-top:1px dashed #000;margin:7px 0;"></div>

    ${orderNumberHtml}

    <div>Invoice No: ${bill.billNo}</div>

    <div>Date: ${bill.date}</div>

    <div>Customer: ${bill.customerName}</div>

    <div>Payment: ${bill.paymentMethod}</div>

    <div style="border-top:1px dashed #000;margin:7px 0 4px;"></div>

    <div style="display:flex;gap:4px;font-weight:bold;">

        <span style="flex:1;">Item</span>

        <span style="width:28px;text-align:center;">Qty</span>

        <span style="width:52px;text-align:right;">Amt</span>

    </div>

    ${itemsHtml}

    <div style="border-top:1px dashed #000;margin:5px 0;"></div>

    <div style="display:flex;"><span style="flex:1;">Subtotal</span><span>&#8377;${bill.subtotal.toFixed(2)}</span></div>

    <div style="display:flex;"><span style="flex:1;">GST</span><span>&#8377;${bill.gst.toFixed(2)}</span></div>

    ${discount > 0 ? `<div style="display:flex;"><span style="flex:1;">${bill.discountPercent > 0 ? `Discount (${bill.discountPercent}%)` : "Discount"}</span><span>-&#8377;${discount.toFixed(2)}</span></div>` : ""}

    ${parcelCharge > 0 ? `<div style="display:flex;"><span style="flex:1;">Parcel / Packing</span><span>&#8377;${parcelCharge.toFixed(2)}</span></div>` : ""}

    <div style="display:flex;font-weight:bold;"><span style="flex:1;">Grand Total</span><span>&#8377;${bill.total.toFixed(2)}</span></div>

    <div style="border-top:1px dashed #000;margin:7px 0;"></div>

    <div style="text-align:center;">

        <strong>Thank You</strong><br>

        <span>Visit Again</span><br><br>

        <span>Powered by</span><br>

        <strong>MS ZAMA Dynamics</strong>

    </div>

</div>

`;

}

function setBillNumber(nextBillNumber){

    billNumber = nextBillNumber;
    billNumberLoaded = true;

}

function setOrderNumber(nextOrderNumber){

    orderNumber = nextOrderNumber;
    orderNumberLoaded = true;

}

function getBillAdjustment(inputId){

    const input = document.getElementById(inputId);
    const amount = Number(input && input.value);

    return Number.isFinite(amount) && amount > 0 ? amount : 0;

}

/* ==========================================
   Add Item To Bill
========================================== */

function addToBill(){

    const productName = document.getElementById("bill-product").value;

    const qty = Number(document.getElementById("bill-qty").value);

    if(productName === "" || productName === "Select Product"){

        alert("Select a product.");

        return;

    }

    const product = products.find(function(item){

        return item.name === productName;

    });

    if(!product){

        alert("Selected product is unavailable. Please select it again.");

        return;

    }

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

setBillingSelectedProduct("");

}

/* ==========================================
   Display Bill
========================================== */

function displayBill(){

    let subtotal = 0;
    let totalGST = 0;

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

        subtotal += item.total;
        totalGST += (item.total * item.gst) / 100;

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

    const adjustments = document.getElementById("bill-adjustments");

    if(adjustments){

        adjustments.style.display = billItems.length > 0 ? "block" : "none";

    }

    const discountPercent = getBillAdjustment("bill-discount");
    const discount = subtotal * (discountPercent / 100);
    const parcelCharge = getBillAdjustment("parcel-charge");

    document.getElementById("grand-total").innerText =
        (subtotal + totalGST - discount + parcelCharge).toFixed(2);

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

    if(!billNumberLoaded || !orderNumberLoaded){

        alert("Bill numbers are loading. Please try again in a moment.");

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

const currentOrderNumber = orderNumber;

const customerName =
    document.getElementById("customer-name").value.trim();

const customerPhone =
    document.getElementById("customer-phone").value;

const paymentMethod =
    document.getElementById("payment-method").value;

let grandTotal = 0;
let totalGST = 0;
const parcelCharge = getBillAdjustment("parcel-charge");

billItems.forEach(function(item){

    grandTotal += item.total;

    totalGST += (item.total * item.gst) / 100;

});

const discountPercent = getBillAdjustment("bill-discount");
const discount = grandTotal * (discountPercent / 100);

if(discountPercent > 100){

    alert("Discount cannot exceed 100%.");
    isGeneratingBill = false;
    return;

}

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

    orderNo: currentOrderNumber,

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

    discountPercent,

    discount,

    parcelCharge,

    total:grandTotal + totalGST - discount + parcelCharge

};

    let renderedInvoice;

    if(settings.printFormat === "A4"){

        renderedInvoice = render58mmReceipt(bill, "A4");

    }else if(settings.printFormat === "58mm"){

        renderedInvoice = render58mmReceipt(bill, "58mm");

    }else if(settings.printFormat === "80mm"){

        renderedInvoice = render58mmReceipt(bill, "80mm");

    }else{

        renderedInvoice = render58mmReceipt(bill, "A4");

    }

    document.getElementById("invoice").innerHTML = renderedInvoice;

saveBillAndAdvanceNumber(bill, billNumber + 1, orderNumber + 1, function(){

    billHistory.push(bill);

    billNumber++;
    orderNumber++;
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

    document.getElementById("customer-name").value = "";

    document.getElementById("customer-phone").value = "";

    document.getElementById("payment-method").selectedIndex = 0;

    document.getElementById("bill-product").selectedIndex = 0;

    document.getElementById("bill-qty").value = 1;

    document.getElementById("bill-discount").value = 0;

    document.getElementById("parcel-charge").value = 0;

}


