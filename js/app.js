/* ==========================================
   Application startup, branding and licensing
========================================== */

function initializeApplication(){

    updateClientBranding();

    if(settings.licenseActivated === true){

        document.getElementById("app").hidden = false;
        document.getElementById("activation-screen").hidden = true;
        showDashboard();

        return;

    }

    showActivationScreen();

}

function ensureInstallationId(onReady){

    if(settings.installationId){

        onReady();

        return;

    }

    settings.installationId = createInstallationId();

    saveSettingsDB(settings, onReady);

}

function createInstallationId(){

    if(window.crypto && crypto.randomUUID){

        return crypto.randomUUID().toUpperCase();

    }

    return "MZ-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).slice(2, 10).toUpperCase();

}

function showActivationScreen(){

    document.getElementById("app").hidden = true;

    const screen = document.getElementById("activation-screen");

    screen.hidden = false;
    screen.innerHTML = `
        <div class="activation-card">
            <img class="activation-logo" src="assets/ms-zama-logo.png" alt="MS ZAMA Dynamics" onerror="this.style.display='none'">
            <h1>MS ZAMA POS Lite</h1>
            <p>Licensed Software by<br><strong>MS ZAMA Dynamics</strong></p>
            <label for="activation-business-name">Business Name:</label>
            <input id="activation-business-name" type="text" autocomplete="organization">
            <label for="activation-key">Activation Key:</label>
            <input id="activation-key" type="text" autocomplete="off">
            <button onclick="activateSoftware()">Activate Software</button>
            <p class="installation-id">Installation ID: <code>${settings.installationId}</code></p>
        </div>
    `;

}

function getExpectedActivationKey(){

    return ["PC", "ZAMA", "2026"].join("-");

}

function activateSoftware(){

    const businessName = document.getElementById("activation-business-name").value.trim();
    const activationKey = document.getElementById("activation-key").value.trim().toUpperCase();

    if(businessName.toLowerCase() !== "protein crunch" || activationKey !== getExpectedActivationKey()){

        alert("The business name or activation key is not valid.");

        return;

    }

    settings.licensedTo = "Protein Crunch";
    settings.licenseKey = activationKey;
    settings.licenseActivated = true;

    saveSettingsDB(settings, initializeApplication);

}

function updateClientBranding(){

    const businessBrand = document.getElementById("sidebar-business-brand");

    if(!businessBrand){

        return;

    }

    const businessName = settings.licensedTo || settings.cafeName;

    if(!businessName && !settings.businessLogo){

        businessBrand.hidden = true;

        return;

    }

    businessBrand.hidden = false;
    businessBrand.innerHTML = `${settings.businessLogo ? `<img src="${settings.businessLogo}" alt="Business logo">` : ""}<span>${businessName || "Business"}</span>`;

}
