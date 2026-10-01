const seed = [
    {
        id: "m1",
        name: "Paracetamol 500 mg",
        category: "Analgesic",
        manufacturer: "Cipla",
        batch: "PCM-24-118",
        price: 3.5,
        quantity: 128,
        reorder: 30,
        expiry: "2027-06-18"
    },
    {
        id: "m2",
        name: "Azithromycin 250 mg",
        category: "Antibiotic",
        manufacturer: "Sun Pharma",
        batch: "AZI-26-041",
        price: 18,
        quantity: 8,
        reorder: 15,
        expiry: "2026-10-04"
    },
    {
        id: "m3",
        name: "Pantoprazole 40 mg",
        category: "Gastro care",
        manufacturer: "Alkem",
        batch: "PAN-25-733",
        price: 7.25,
        quantity: 56,
        reorder: 20,
        expiry: "2027-03-12"
    },
    {
        id: "m4",
        name: "Vitamin D3 60K",
        category: "Vitamin & supplement",
        manufacturer: "Mankind",
        batch: "D3-25-229",
        price: 29,
        quantity: 12,
        reorder: 12,
        expiry: "2026-11-01"
    }
];
let meds = JSON.parse(localStorage.getItem("mp-medications") || "null") || seed;
let buys = JSON.parse(localStorage.getItem("mp-purchases") || "[]");
let sells = JSON.parse(localStorage.getItem("mp-sales") || "[]");
let audit = JSON.parse(localStorage.getItem("mp-audit") || "[]");
let wallet = Number(localStorage.getItem("mp-wallet") || 0);
let cart = JSON.parse(localStorage.getItem("mp-cart") || "[]");
const $ = x => document.getElementById(x);
const low = m => m.quantity <= m.reorder;
const days = d => Math.ceil((new Date(d + "T12:00:00") - new Date()) / 86400000);
const risk = m => days(m.expiry) <= 60;
const mon = n => "\u20B9" + new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2
}).format(n);
const date = d => new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short"
}).format(new Date(d + "T12:00:00"));
const esc = s => String(s).replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
}[c]));
function save() {
    localStorage.setItem("mp-medications", JSON.stringify(meds));
    localStorage.setItem("mp-purchases", JSON.stringify(buys));
    localStorage.setItem("mp-sales", JSON.stringify(sells));
    localStorage.setItem("mp-audit", JSON.stringify(audit.slice(0, 8)));
    localStorage.setItem("mp-wallet", String(wallet));
    localStorage.setItem("mp-cart", JSON.stringify(cart));
}
function renderCommerce() {
    const walletEl = $("wallet"), cartEl = $("cart");
    if (walletEl) walletEl.innerHTML = "<div class=\"commerce-card wallet-card\"><span>WALLET BALANCE</span><strong>" + mon(wallet) + "</strong><small>Updated just now · stored on this device</small><form id=\"walletform\"><input id=\"walletamount\" type=\"number\" min=\"1\" step=\"0.01\" placeholder=\"Amount to add\" required><button type=\"submit\">＋ Add funds</button></form></div>";
    if (cartEl) {
        const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
        cartEl.innerHTML = "<div class=\"commerce-card cart-card\"><span>YOUR CART</span>" + (cart.length ? cart.map((item, i) => "<div class=\"cart-item\"><span>" + esc(item.name) + "<small>" + item.qty + " × " + mon(item.price) + "</small></span><button type=\"button\" data-remove-cart=\"" + i + "\" aria-label=\"Remove " + esc(item.name) + "\">×</button></div>").join("") : "<p class=\"sub\">Your cart is ready for items.</p>") + "<div class=\"cart-total\"><span>Total</span><strong>" + mon(total) + "</strong></div><button type=\"button\" id=\"checkout\" " + (cart.length ? "" : "disabled") + ">Checkout</button></div>";
    }
    const walletForm = $("walletform");
    if (walletForm) walletForm.onsubmit = e => {
        e.preventDefault();
        const amount = Number($("walletamount").value);
        if (!Number.isFinite(amount) || amount <= 0) return toast("Enter a valid amount.");
        wallet += amount;
        save(); renderCommerce(); toast("Wallet funded.");
    };
    if (cartEl) {
        cartEl.querySelectorAll("[data-remove-cart]").forEach(button => button.onclick = () => {
            cart.splice(Number(button.dataset.removeCart), 1); save(); renderCommerce();
        });
        const checkout = $("checkout");
        if (checkout) checkout.onclick = () => {
            const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
            if (total > wallet) return toast("Insufficient wallet balance.");
            wallet -= total;
            cart.forEach(item => { const medicine = meds.find(m => m.id === item.id); if (medicine) medicine.quantity -= item.qty; });
            cart = []; save(); render(); toast("Checkout complete.");
        };
    }
}
function addToCart(id, qty = 1) {
    const item = meds.find(m => m.id === id), amount = Number(qty);
    if (!item || !Number.isInteger(amount) || amount < 1) return toast("Choose a valid cart quantity.");
    const existing = cart.find(entry => entry.id === id);
    if (amount + (existing ? existing.qty : 0) > item.quantity) return toast("Quantity exceeds available stock.");
    if (existing) existing.qty += amount;
    else cart.push({ id: item.id, name: item.name, price: item.price, qty: amount });
    save(); renderCommerce(); toast("Cart updated.");
}
function av(m) {
    return "<i class=\"ava " + (low(m) ? "low" : "") + "\">" + esc(m.name).slice(0, 2).toUpperCase() + "</i>";
}
function toast(t) {
    $("toast").textContent = "\u25CF " + t;
    $("toast").classList.add("show");
    setTimeout(() => $("toast").classList.remove("show"), 2200);
}
function log(t) {
    audit.unshift({
        t,
        at: "just now"
    });
    save();
}
function render() {
    let u = meds.reduce((a, m) => a + m.quantity, 0), l = meds.filter(low), v = meds.reduce((a, m) => a + m.quantity * m.price, 0), cats = [
        ...new Set(meds.map(m => m.category))
    ];
    $("units").textContent = u;
    $("records").textContent = meds.length;
    $("health").textContent = meds.length ? Math.round((1 - l.length / meds.length) * 100) + "%" : "\u2014";
    $("value").textContent = mon(v);
    $("low").textContent = l.length;
    $("safe").textContent = meds.length ? Math.round(meds.filter(m => !risk(m)).length / meds.length * 100) + "%" : "\u2014";
    $("tx").textContent = buys.length + sells.length;
    $("recent").innerHTML = meds.slice(0, 4).map(m => "<div class=\"row\">" + av(m) + "<div><span class=\"name\">" + esc(m.name) + "</span><span class=\"meta\">" + esc(m.batch) + " \u00B7 " + esc(m.manufacturer) + "</span></div><span class=\"q\"><b>" + m.quantity + " units</b>" + (low(m) ? "reorder now" : "in balance") + "</span></div>").join("");
    let al = [
        ...l.map(m => [
            "Low stock",
            m.name + " has " + m.quantity + " units; reorder level is " + m.reorder + "."
        ]),
        ...meds.filter(risk).map(m => [
            "Expiry watch",
            m.name + " expires " + (days(m.expiry) < 0 ? "in the past" : "in " + days(m.expiry) + " days") + "."
        ])
    ].slice(0, 2);
    $("alerts").innerHTML = al.length ? al.map(a => "<div class=\"notice\"><strong>! " + esc(a[0]) + "</strong>" + esc(a[1]) + "</div>").join("") : "<div class=\"notice\" style=\"background:#effaf4;color:#26714b\"><strong>\u2713 Inventory looks balanced.</strong>No immediate signals.</div>";
    $("cat").innerHTML = "<option value=\"\">All categories</option>" + cats.map(c => "<option>" + esc(c) + "</option>").join("");
    let opts = meds.map(m => "<option value=\"" + m.id + "\">" + esc(m.name) + " (" + m.quantity + " available)</option>").join("");
    $("pmed").innerHTML = opts;
    $("smed").innerHTML = opts;
    $("adminmeds").textContent = meds.length;
    $("admincats").textContent = cats.length;
    $("adminlow").textContent = l.length;
    $("reporthealth").textContent = meds.length ? Math.round((1 - l.length / meds.length) * 100) + "%" : "\u2014";
    $("reportunits").textContent = u;
    $("rpurchase").textContent = buys.length;
    $("rsale").textContent = sells.length;
    $("expiryreport").innerHTML = meds.filter(risk).slice(0, 3).map(m => "<div class=\"line\"><span>" + esc(m.name) + "</span><b>" + days(m.expiry) + "d</b></div>").join("") || "<span class=\"meta\">No expiry risks.</span>";
    $("audit").innerHTML = audit.slice(0, 3).map(a => "<div class=\"line\"><span>" + esc(a.t) + "</span><small>" + a.at + "</small></div>").join("") || "<span class=\"meta\">No changes this session.</span>";
    logs();
    table();
    renderCommerce();
}
function table() {
    let q = $("find").value.toLowerCase(), c = $("cat").value, s = $("stock").value, ms = meds.filter(m => !q || [
        m.name,
        m.category,
        m.manufacturer,
        m.batch
    ].join(" ").toLowerCase().includes(q)).filter(m => !c || m.category === c).filter(m => !s || (s === "low" ? low(m) : !low(m)));
    $("table").innerHTML = ms.map(m => "<tr><td><div class=\"med\">" + av(m) + "<div><span class=\"name\">" + esc(m.name) + "</span><span class=\"meta\">" + esc(m.manufacturer) + "</span></div></div></td><td><span class=\"tag\">" + esc(m.category) + "</span></td><td><span class=\"meta\">" + esc(m.batch) + "<br>" + date(m.expiry) + "</span></td><td>" + mon(m.price) + "</td><td><b>" + m.quantity + "</b> units " + (low(m) ? "<br><span class=\"tag low\">LOW STOCK</span>" : "") + "</td><td><button class=\"act\" onclick=\"toast('Edit panel available in Admin centre.')\">EDIT</button></td></tr>").join("");
}
function logs() {
    let html = (x, add) => x.length ? x.slice(0, 4).map(r => "<div class=\"line\"><span><b>" + esc(r.name) + "</b><br><small>" + esc(r.party) + "</small></span><b style=\"color:" + (add ? "#23734e" : "#bc3f38") + "\">" + (add ? "\uFF0B" : "\u2212") + r.qty + " units</b></div>").join("") : "<p class=\"sub\">No transactions recorded.</p>";
    $("purchases").innerHTML = html(buys, 1);
    $("sales").innerHTML = html(sells, 0);
}
function go(p) {
    document.querySelectorAll(".page").forEach(x => x.classList.toggle("on", x.id === p));
    document.querySelectorAll(".menu button").forEach(x => x.classList.toggle("on", x.dataset.p === p));
    scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
function addMenuFeatures() {
    const menu = document.querySelector(".menu");
    if (!menu || menu.querySelector("[data-menu-feature]")) return;
    const features = document.createElement("div");
    features.className = "menu-features";
    features.innerHTML = "<button type=\"button\" data-menu-feature=\"export\">⇩ Export</button><button type=\"button\" data-menu-feature=\"refresh\">↻ Refresh</button>";
    features.querySelector("[data-menu-feature='export']").onclick = () => {
        const rows = [["Name", "Category", "Manufacturer", "Batch", "Price", "Quantity", "Reorder", "Expiry"], ...meds.map(m => [m.name, m.category, m.manufacturer, m.batch, m.price, m.quantity, m.reorder, m.expiry])];
        const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
        const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
        const link = document.createElement("a");
        link.href = url;
        link.download = "medipharma-inventory.csv";
        link.click();
        URL.revokeObjectURL(url);
        toast("Inventory exported.");
    };
    features.querySelector("[data-menu-feature='refresh']").onclick = () => {
        render();
        toast("Inventory refreshed.");
    };
    menu.appendChild(features);
}
document.querySelectorAll(".menu button").forEach(x => x.onclick = () => go(x.dataset.p));
addMenuFeatures();
$("find").oninput = table;
$("cat").onchange = table;
$("stock").onchange = table;
function trans(kind) {
    let id = $(kind ? "pmed" : "smed").value, n = +$(kind ? "pqty" : "sqty").value, party = $(kind ? "party" : "customer").value.trim(), m = meds.find(x => x.id === id);
    if (!party || !Number.isInteger(n) || n < 1)
        return toast("Enter a valid quantity and reference.");
    if (!kind && n > m.quantity)
        return toast("Quantity exceeds available stock.");
    m.quantity += kind ? n : -n;
    (kind ? buys : sells).unshift({
        name: m.name,
        qty: n,
        party
    });
    log((kind ? "Purchase received: " : "Sale recorded: ") + m.name);
    save();
    render();
    $(kind ? "purchaseform" : "saleform").reset();
    toast(kind ? "Purchase recorded." : "Sale recorded.");
}
$("purchaseform").onsubmit = e => {
    e.preventDefault();
    trans(1);
};
$("saleform").onsubmit = e => {
    e.preventDefault();
    trans(0);
};
function openAuth(t) {
    $("auth").classList.add("show");
    authTab(t);
}
function closeAuth() {
    $("auth").classList.remove("show");
}
function authTab(t) {
    [
        "login",
        "register"
    ].forEach(x => {
        $(x + "Tab").classList.toggle("on", x === t);
        $(x + "Form").classList.toggle("on", x === t);
    });
    $("authTitle").textContent = t === "login" ? "Welcome back" : "Create your workspace";
}
document.querySelectorAll(".role").forEach(x => x.onclick = () => document.querySelectorAll(".role").forEach(y => y.classList.toggle("on", y === x)));
document.querySelectorAll(".authform").forEach(x => x.onsubmit = e => {
    e.preventDefault();
    closeAuth();
    toast("Demo access confirmed.");
});
render();