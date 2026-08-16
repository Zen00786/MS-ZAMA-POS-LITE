/* ==========================================
   Database
========================================== */

let db;

/* ==========================================
   Open Database
========================================== */

const request = indexedDB.open("ZPOSLiteDB", 6);

request.onupgradeneeded = function(event){

    db = event.target.result;

    if(!db.objectStoreNames.contains("products")){

        db.createObjectStore("products", {

            keyPath: "id",
            autoIncrement: true

        });

    }

    if(!db.objectStoreNames.contains("bills")){

        db.createObjectStore("bills", {

            keyPath: "id",
            autoIncrement: true

        });

    }

    if(!db.objectStoreNames.contains("settings")){

    db.createObjectStore("settings",{

        keyPath:"id"

    });

}

    if(!db.objectStoreNames.contains("counters")){

        db.createObjectStore("counters", {

            keyPath: "id"

        });

    }

    if(!db.objectStoreNames.contains("heldBills")){

        db.createObjectStore("heldBills", {

            keyPath: "id"

        });

    }

};

request.onsuccess = function(event){

db = event.target.result;

console.log("Database Connected");

loadProducts();
loadBills();
loadHeldBills();

let loadedCounterCount = 0;

function startApplicationWhenCountersReady(){

    loadedCounterCount++;

    if(loadedCounterCount !== 2){

        return;

    }

    loadSettings(function(){
        ensureInstallationId(function(){
            initializeApplication();
        });
    });

}

loadBillNumber(startApplicationWhenCountersReady);
loadOrderNumber(startApplicationWhenCountersReady);

};

request.onerror = function(){

    console.log("Database Error");

};


/* ==========================================
   Save Product
========================================== */

function saveProduct(product, onSuccess, onError){

    const transaction = db.transaction(["products"], "readwrite");

    const store = transaction.objectStore("products");

   const request = store.add(product);

request.onsuccess = function(event){

    product.id = event.target.result;

};

    transaction.oncomplete = function(){

        console.log("Product Saved");

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

}

/* ==========================================
   Save Bill
========================================== */

function saveBill(bill){

    const transaction = db.transaction(["bills"], "readwrite");

    const store = transaction.objectStore("bills");

    store.add(bill);

    transaction.oncomplete = function(){

        console.log("Bill Saved");

    };

}

/* ==========================================
   Load Bills
========================================== */

function loadBills(onLoaded){

    billHistory = [];

    const transaction = db.transaction(["bills"], "readonly");

    const store = transaction.objectStore("bills");

    const request = store.getAll();

    request.onsuccess = function(){

        billHistory = request.result;

        console.log("Bills Loaded", billHistory);

        if(onLoaded){

            onLoaded(billHistory);

        }

    };

}

/* ==========================================
   Held Bills
========================================== */

function saveHeldBillDB(heldBill){

    const transaction = db.transaction(["heldBills"], "readwrite");

    const store = transaction.objectStore("heldBills");

    store.put(heldBill);

}

function loadHeldBills(){

    const transaction = db.transaction(["heldBills"], "readonly");

    const store = transaction.objectStore("heldBills");

    const request = store.getAll();

    request.onsuccess = function(){

        heldBills = request.result;

        renderHeldBills();

    };

}

function deleteHeldBillDB(id){

    const transaction = db.transaction(["heldBills"], "readwrite");

    const store = transaction.objectStore("heldBills");

    store.delete(id);

}


/* ==========================================
   Load Products
========================================== */

function loadProducts(onLoaded){

    products = [];

    const transaction = db.transaction(["products"], "readonly");

    const store = transaction.objectStore("products");

    const request = store.getAll();

    request.onsuccess = function(){

        products = request.result;

        console.log(products);

        if(onLoaded){

            onLoaded(products);

        }

    };

}

/* ==========================================
   Delete Product From DB
========================================== */

function deleteProductDB(id, onSuccess, onError){

    const transaction = db.transaction(["products"], "readwrite");

    const store = transaction.objectStore("products");

    store.delete(id);

}

/* ==========================================
   Update Product
========================================== */

function updateProductDB(product){

    const transaction = db.transaction(["products"], "readwrite");

    const store = transaction.objectStore("products");

    store.put(product);

}


/* ==========================================
   Save Settings
========================================== */

function saveSettingsDB(settings, onComplete){

    const transaction =
        db.transaction(["settings"],"readwrite");

    const store =
        transaction.objectStore("settings");

    store.put({

        id:1,

        ...settings

    });

    transaction.oncomplete = function(){

        if(onComplete){

            onComplete();

        }

    };

}


/* ==========================================
   Load Settings
========================================== */

function loadSettings(onLoaded){

    const transaction =
        db.transaction(["settings"],"readonly");

    const store =
        transaction.objectStore("settings");

    const request =
        store.get(1);

    request.onsuccess = function(){

        if(request.result){

            settings = {
                ...settings,
                ...request.result
            };

        }
        else{

            saveSettingsDB(settings);

        }

        if(onLoaded){
            onLoaded(settings);
        }

    };

}

/* ==========================================
   Invoice Number Counter
========================================== */

function loadBillNumber(onLoaded){

    const transaction = db.transaction(["counters"], "readonly");

    const store = transaction.objectStore("counters");

    const request = store.get("billNumber");

    request.onsuccess = function(){

        const savedBillNumber = Number(request.result && request.result.value);

        if(Number.isInteger(savedBillNumber) && savedBillNumber > 0){

            setBillNumber(savedBillNumber);

            if(onLoaded){

                onLoaded();

            }

            return;

        }

        restoreBillNumberFromExistingBills(onLoaded);

    };

    request.onerror = function(){

        window.setTimeout(function(){

            loadBillNumber(onLoaded);

        }, 250);

    };

}

function restoreBillNumberFromExistingBills(onLoaded){

    const transaction = db.transaction(["bills"], "readonly");

    const store = transaction.objectStore("bills");

    const request = store.getAll();

    request.onsuccess = function(){

        let highestBillNumber = 0;

        request.result.forEach(function(bill){

            const match = String(bill.billNo || "").match(/-(\d+)$/);

            if(match){

                highestBillNumber = Math.max(highestBillNumber, Number(match[1]));

            }

        });

        const nextBillNumber = highestBillNumber + 1;

        saveBillNumber(nextBillNumber, function(){

            setBillNumber(nextBillNumber);

            if(onLoaded){

                onLoaded();

            }

        }, function(){

            window.setTimeout(function(){

                loadBillNumber(onLoaded);

            }, 250);

        });

    };

    request.onerror = function(){

        window.setTimeout(function(){

            loadBillNumber(onLoaded);

        }, 250);

    };

}

function saveBillNumber(nextBillNumber, onSuccess, onError){

    const transaction = db.transaction(["counters"], "readwrite");

    const store = transaction.objectStore("counters");

    store.put({

        id: "billNumber",
        value: nextBillNumber

    });

    transaction.oncomplete = function(){

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

}

/* ==========================================
   Order Number Counter
========================================== */

function loadOrderNumber(onLoaded){

    const transaction = db.transaction(["counters"], "readonly");
    const store = transaction.objectStore("counters");
    const request = store.get("orderNumberState");

    request.onsuccess = function(){

        const savedOrderNumber = Number(request.result && request.result.value);
        const savedDate = request.result && request.result.date;

        if(savedDate === getOrderNumberDateKey() && Number.isInteger(savedOrderNumber) && savedOrderNumber > 0){

            setOrderNumber(savedOrderNumber, savedDate);

            if(onLoaded){

                onLoaded();

            }

            return;

        }

        resetOrderNumberForToday(onLoaded, function(){

            window.setTimeout(function(){
                loadOrderNumber(onLoaded);
            }, 250);

        });

    };

    request.onerror = function(){

        window.setTimeout(function(){

            loadOrderNumber(onLoaded);

        }, 250);

    };

}

function resetOrderNumberForToday(onSuccess, onError){

    saveOrderNumber(1, function(){

        setOrderNumber(1, getOrderNumberDateKey());

        if(onSuccess){
            onSuccess();
        }

    }, onError);

}

function saveOrderNumber(nextOrderNumber, onSuccess, onError){

    const transaction = db.transaction(["counters"], "readwrite");
    const store = transaction.objectStore("counters");

    store.put({

        id: "orderNumber",
        value: nextOrderNumber

    });

    store.put({

        id: "orderNumberState",
        value: nextOrderNumber,
        date: getOrderNumberDateKey()

    });

    transaction.oncomplete = function(){

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

}

/* ==========================================
   Save Bill And Advance Invoice Number
========================================== */

function saveBillAndAdvanceNumber(bill, nextBillNumber, nextOrderNumber, onSuccess, onError){

    const transaction = db.transaction(["bills", "counters"], "readwrite");

    const billStore = transaction.objectStore("bills");
    const counterStore = transaction.objectStore("counters");

    const request = billStore.add(bill);

    request.onsuccess = function(event){

        bill.id = event.target.result;

    };

    counterStore.put({

        id: "billNumber",
        value: nextBillNumber

    });

    counterStore.put({

        id: "orderNumber",
        value: nextOrderNumber

    });

    counterStore.put({

        id: "orderNumberState",
        value: nextOrderNumber,
        date: getOrderNumberDateKey()

    });

    transaction.oncomplete = function(){

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

}

/* ==========================================
   Delete Bill From DB
========================================== */

function deleteBillDB(id, onSuccess, onError){

    const transaction = db.transaction(["bills"], "readwrite");

    const store = transaction.objectStore("bills");

    store.delete(id);

    transaction.oncomplete = function(){

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

    transaction.oncomplete = function(){

        if(onSuccess){

            onSuccess();

        }

    };

    transaction.onerror = function(){

        if(onError){

            onError();

        }

    };

}

/* ==========================================
   Backup And Restore
========================================== */

function sanitizeBackupFileName(value){

    return String(value || "Business").trim().replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "") || "Business";

}

function downloadJsonBackup(backup, filename){

    const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const downloadUrl = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);

}

function exportPosSetupBackup(){

    const storeNames = ["products", "settings", "counters"];
    const transaction = db.transaction(storeNames, "readonly");
    const data = {};

    storeNames.forEach(function(storeName){
        const request = storeName === "settings" ? transaction.objectStore(storeName).get(1) : transaction.objectStore(storeName).getAll();
        request.onsuccess = function(){
            data[storeName] = storeName === "settings" ? (request.result ? [request.result] : [{ id:1, ...settings }]) : request.result;
        };
    });

    transaction.oncomplete = function(){
        const date = new Date().toISOString().slice(0, 10);
        downloadJsonBackup({ app:"POS Lite", version:1, category:"pos-setup", exportedAt:new Date().toISOString(), data:data }, `POS-Lite-Setup-${sanitizeBackupFileName(settings.cafeName)}-${date}.json`);
    };
    transaction.onerror = function(){ alert("Unable to export POS Setup."); };

}

function exportBillsReportsBackup(bills, reportDetails){

    const details = reportDetails || {};
    const datePart = details.fileDate || new Date().toISOString().slice(0, 10);
    const report = {
        type: details.type || "Daily",
        from: details.from || "",
        to: details.to || "",
        generatedAt: new Date().toISOString(),
        summary: calculateSalesSummary(bills || [])
    };

    downloadJsonBackup({ app:"POS Lite", version:1, category:"bills-reports", exportedAt:report.generatedAt, report:report, data:{ bills:bills || [] } }, `POS-Lite-Bills-${sanitizeBackupFileName(settings.cafeName)}-${datePart}.json`);

}

function validatePosSetupBackup(backup){

    if(!backup || backup.app !== "POS Lite" || backup.version !== 1 || backup.category !== "pos-setup" || !backup.data){
        return { valid:false, message:"This is not a valid POS Setup backup." };
    }

    const data = backup.data;
    if(!Array.isArray(data.products) || !Array.isArray(data.settings) || !Array.isArray(data.counters) || !data.products.every(isBackupRecord) || !data.counters.every(isBackupRecord) || data.settings.length > 1 || !data.settings.every(isBackupRecord)){
        return { valid:false, message:"POS Setup backup data is incomplete or invalid." };
    }

    return { valid:true };

}

function importPosSetupBackup(backup, onSuccess, onError){

    const validation = validatePosSetupBackup(backup);
    if(!validation.valid){ onError(validation.message); return; }

    const transaction = db.transaction(["products", "settings", "counters"], "readwrite");
    ["products", "settings", "counters"].forEach(function(storeName){
        const store = transaction.objectStore(storeName);
        store.clear();
        backup.data[storeName].forEach(function(record){ store.put(record); });
    });
    transaction.oncomplete = function(){ onSuccess(); };
    transaction.onerror = function(){ onError("POS Setup could not be restored. Existing data was not changed."); };
    transaction.onabort = function(){ onError("POS Setup could not be restored. Existing data was not changed."); };

}

function validateBillsReportsBackup(backup){

    if(!backup || backup.app !== "POS Lite" || backup.version !== 1 || backup.category !== "bills-reports" || !backup.data || !Array.isArray(backup.data.bills)){
        return { valid:false, message:"This is not a valid Bills & Reports backup." };
    }

    if(!backup.data.bills.every(function(bill){ return isBackupRecord(bill) && typeof bill.billNo === "string" && Array.isArray(bill.items); })){
        return { valid:false, message:"Bills & Reports backup contains invalid bills." };
    }

    return { valid:true };

}

function importBillsReportsBackup(backup, onSuccess, onError){

    const validation = validateBillsReportsBackup(backup);
    if(!validation.valid){ onError(validation.message); return; }

    const readTransaction = db.transaction(["bills"], "readonly");
    const existingRequest = readTransaction.objectStore("bills").getAll();

    existingRequest.onsuccess = function(){
        const existingBills = existingRequest.result;
        const existingInvoiceNumbers = new Set(existingBills.map(function(bill){ return bill.billNo; }));
        const existingIds = new Set(existingBills.map(function(bill){ return bill.id; }));
        const importedInvoiceNumbers = new Set();
        const billsToAdd = backup.data.bills.filter(function(bill){
            if(existingInvoiceNumbers.has(bill.billNo) || importedInvoiceNumbers.has(bill.billNo)) return false;
            importedInvoiceNumbers.add(bill.billNo);
            return true;
        });
        const transaction = db.transaction(["bills"], "readwrite");
        const store = transaction.objectStore("bills");

        billsToAdd.forEach(function(bill){
            const record = { ...bill };
            if(existingIds.has(record.id)){ delete record.id; }
            store.add(record);
        });

        transaction.oncomplete = function(){ onSuccess(billsToAdd.length, backup.data.bills.length - billsToAdd.length); };
        transaction.onerror = function(){ onError("Bills & Reports could not be imported. Existing bills were not changed."); };
        transaction.onabort = function(){ onError("Bills & Reports could not be imported. Existing bills were not changed."); };
    };

    existingRequest.onerror = function(){ onError("Unable to read existing bills for a safe import."); };

}

function exportBackupData(){

    const storeNames = ["products", "bills", "settings", "counters", "heldBills"];
    const transaction = db.transaction(storeNames, "readonly");
    const backupData = {};

    storeNames.forEach(function(storeName){

        const store = transaction.objectStore(storeName);
        const request = storeName === "settings"
            ? store.get(1)
            : store.getAll();

        request.onsuccess = function(){

            if(storeName === "settings"){

                backupData.settings = request.result
                    ? [request.result]
                    : [{ id:1, ...settings }];

                return;

            }

            backupData[storeName] = request.result;

        };

    });

    transaction.oncomplete = function(){

        const backup = {

            app: "MS ZAMA POS Lite",
            version: 1,
            exportedAt: new Date().toISOString(),
            data: backupData

        };

        const file = new Blob([JSON.stringify(backup, null, 2)], {

            type: "application/json"

        });

        const downloadUrl = URL.createObjectURL(file);
        const link = document.createElement("a");

        link.href = downloadUrl;
        link.download = `ms-zama-pos-lite-backup-${new Date().toISOString().slice(0, 10)}.json`;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(downloadUrl);

    };

    transaction.onerror = function(){

        alert("Unable to create the backup. Please try again.");

    };

}

function importBackupData(backup, onSuccess, onError){

    const validation = validateBackupData(backup);

    if(!validation.valid){

        onError(validation.message);

        return;

    }

    const storeNames = ["products", "bills", "settings", "counters", "heldBills"];
    const transaction = db.transaction(storeNames, "readwrite");
    const protectedLicense = {
        licenseActivated: settings.licenseActivated === true,
        licenseKey: settings.licenseKey || "",
        licensedTo: settings.licensedTo || "",
        installationId: settings.installationId || ""
    };
    let completed = false;
    let failed = false;

    storeNames.forEach(function(storeName){

        const store = transaction.objectStore(storeName);

        store.clear();

        backup.data[storeName].forEach(function(record){

            if(storeName === "settings"){
                record = { ...record, ...protectedLicense };
            }

            store.put(record);

        });

    });

    if(backup.data.settings.length === 0){

        transaction.objectStore("settings").put({
            id: 1,
            ...protectedLicense
        });

    }

    transaction.oncomplete = function(){

        completed = true;

        onSuccess();

    };

    transaction.onabort = function(){

        if(!completed && !failed){

            failed = true;

            onError("Backup could not be restored. Existing data was not changed.");

        }

    };

    transaction.onerror = function(){

        if(!completed && !failed){

            failed = true;

            onError("Backup could not be restored. Existing data was not changed.");

        }

    };

}

function validateBackupData(backup){

    if(!backup || typeof backup !== "object" || Array.isArray(backup)){

        return { valid:false, message:"Invalid backup file." };

    }

    if(backup.app !== "MS ZAMA POS Lite" || backup.version !== 1 || !backup.data){

        return { valid:false, message:"This file is not a valid MS ZAMA POS Lite backup." };

    }

    const data = backup.data;
    const storeNames = ["products", "bills", "settings", "counters", "heldBills"];

    for(let index = 0; index < storeNames.length; index++){

        const storeName = storeNames[index];

        if(!Array.isArray(data[storeName]) || !data[storeName].every(isBackupRecord)){

            return { valid:false, message:"Backup data is incomplete or invalid." };

        }

    }

    if(!hasUniqueNumericIds(data.products) || !hasUniqueNumericIds(data.bills) ||
        !hasUniqueNumericIds(data.heldBills)){

        return { valid:false, message:"Backup contains invalid product or bill identifiers." };

    }

    if(data.settings.length > 1 || (data.settings[0] && data.settings[0].id !== 1)){

        return { valid:false, message:"Backup contains invalid settings data." };

    }

    const billCounter = data.counters.find(function(counter){
        return counter.id === "billNumber";
    });
    const orderCounter = data.counters.find(function(counter){
        return counter.id === "orderNumber";
    });

    if((data.counters.length !== 1 && data.counters.length !== 2) ||
        !data.counters.every(function(counter){
            return counter.id === "billNumber" || counter.id === "orderNumber";
        }) || !billCounter ||
        !Number.isInteger(billCounter.value) || billCounter.value < 1 ||
        (orderCounter && (!Number.isInteger(orderCounter.value) || orderCounter.value < 1))){

        return { valid:false, message:"Backup contains an invalid invoice counter." };

    }

    let highestBillNumber = 0;
    let highestOrderNumber = 0;

    for(let index = 0; index < data.bills.length; index++){

        const bill = data.bills[index];

        if(typeof bill.billNo !== "string" || !Array.isArray(bill.items)){

            return { valid:false, message:"Backup contains invalid bill data." };

        }

        const match = bill.billNo.match(/-(\d+)$/);

        if(match){

            highestBillNumber = Math.max(highestBillNumber, Number(match[1]));

        }

        const savedOrderNumber = Number(bill.orderNo);

        if(Number.isInteger(savedOrderNumber) && savedOrderNumber > 0){

            highestOrderNumber = Math.max(highestOrderNumber, savedOrderNumber);

        }

    }

    if(billCounter.value <= highestBillNumber){

        return { valid:false, message:"Backup invoice counter would create duplicate invoice numbers." };

    }

    if(orderCounter && orderCounter.value <= highestOrderNumber){

        return { valid:false, message:"Backup order counter would create duplicate order numbers." };

    }

    return { valid:true };

}

function isBackupRecord(record){

    return record && typeof record === "object" && !Array.isArray(record);

}

function hasUniqueNumericIds(records){

    const ids = new Set();

    for(let index = 0; index < records.length; index++){

        const id = records[index].id;

        if(!Number.isInteger(id) || id < 1 || ids.has(id)){

            return false;

        }

        ids.add(id);

    }

    return true;

}
