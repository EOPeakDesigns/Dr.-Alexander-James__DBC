const CARD_DATA_PATH = "./data/card.json";
const INSTALL_DISMISSED_KEY = "install_dismissed_v1";
const THEME_KEY = "card_theme_v1";
const LANG_KEY = "card_lang_v1";
const DEFAULT_AVATAR = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face";

let state = {
    card: null,
    lang: "en",
    theme: "system",
    deferredInstallPrompt: null,
    activeModalTrigger: null
};

const elements = {
    html: document.documentElement,
    ownerName: document.getElementById("ownerName"),
    ownerTitle: document.getElementById("ownerTitle"),
    ownerBio: document.getElementById("ownerBio"),
    eyebrowText: document.getElementById("eyebrowText"),
    avatarHint: document.getElementById("avatarHint"),
    profileImage: document.getElementById("profileImage"),
    contactList: document.getElementById("contactList"),
    socialList: document.getElementById("socialList"),
    openVideoBtn: document.getElementById("openVideoBtn"),
    saveContactBtn: document.getElementById("saveContactBtn"),
    shareCardBtn: document.getElementById("shareCardBtn"),
    openQRBtn: document.getElementById("openQRBtn"),
    qrImage: document.getElementById("qrImage"),
    qrModal: document.getElementById("qrModal"),
    videoModal: document.getElementById("videoModal"),
    downloadQRBtn: document.getElementById("downloadQRBtn"),
    videoContainer: document.getElementById("videoContainer"),
    toast: document.getElementById("appToast"),
    themeToggle: document.getElementById("themeToggle"),
    langToggle: document.getElementById("langToggle"),
    installBanner: document.getElementById("installBanner"),
    installMessage: document.getElementById("installMessage"),
    installNowBtn: document.getElementById("installNowBtn"),
    dismissInstallBtn: document.getElementById("dismissInstallBtn"),
    qrEyebrow: document.getElementById("qrEyebrow"),
    qrTitle: document.getElementById("qrTitle"),
    qrDesc: document.getElementById("qrDesc"),
    videoEyebrow: document.getElementById("videoEyebrow"),
    videoTitle: document.getElementById("videoTitle"),
    videoCaption: document.getElementById("videoCaption")
};

init().catch(console.error);

function stabilizeViewport() {
    const root = document.documentElement;
    root.scrollLeft = 0;
    root.scrollTop = 0;
    window.scrollTo(0, 0);
}

async function init() {
    stabilizeViewport();
    state.card = await loadCardData();
    state.lang = localStorage.getItem(LANG_KEY) || state.card.defaultLanguage || "en";
    state.theme = localStorage.getItem(THEME_KEY) || "system";
    initInstallFlow();
    hydrateUI();
    bindEvents();
    applyTheme();
    watchSystemThemeChanges();
    registerServiceWorker();
    stabilizeViewport();
    window.addEventListener("orientationchange", () => {
        window.setTimeout(stabilizeViewport, 150);
    });
    window.addEventListener("pageshow", (event) => {
        if (event.persisted) stabilizeViewport();
    });
}

function getEffectiveTheme() {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (state.theme === "system") return prefersDark ? "dark" : "light";
    return state.theme;
}

function getThemeIconType() {
    if (state.theme === "light") return "sun";
    if (state.theme === "dark") return "moon";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "moon" : "sun";
}

function watchSystemThemeChanges() {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
        if (state.theme !== "system") return;
        applyTheme();
    });
}

async function loadCardData() {
    const response = await fetch(CARD_DATA_PATH);
    if (!response.ok) throw new Error("Failed loading card data.");
    return response.json();
}

function getLocalizedProfile() {
    const profile = state.card.profile;
    return profile.i18n?.[state.lang] || profile.i18n.en;
}

function getDisplayName() {
    const localized = getLocalizedProfile();
    return localized.name || state.card.profile.name;
}

function hydrateUI() {
    const t = labels();
    const profile = state.card.profile;
    const langProfile = getLocalizedProfile();
    const displayName = getDisplayName();
    elements.ownerName.textContent = displayName;
    elements.ownerTitle.textContent = langProfile.title;
    elements.ownerBio.textContent = langProfile.bio;
    elements.eyebrowText.textContent = langProfile.eyebrow;
    elements.avatarHint.textContent = "";
    elements.profileImage.alt = `${displayName} ${langProfile.title}`;
    setAvatarFallbacks();
    elements.qrImage.src = state.card.assets.qr;
    elements.qrImage.alt = `${displayName} QR`;
    elements.qrEyebrow.textContent = t.qrEyebrow;
    elements.qrTitle.textContent = t.qrTitle;
    elements.qrDesc.textContent = t.qrDescription;
    elements.videoEyebrow.textContent = t.videoEyebrow;
    elements.videoTitle.textContent = t.videoTitle;
    elements.videoCaption.textContent = t.videoCaption;
    renderActionIcons();
    elements.downloadQRBtn.innerHTML = `${iconMarkup("save")}<span>${t.downloadQr}</span>`;
    elements.installMessage.textContent = t.installMessage;
    elements.installNowBtn.textContent = t.installNow;
    elements.dismissInstallBtn.setAttribute("aria-label", t.dismiss);
    elements.langToggle.setAttribute("title", t.languageToggle);
    elements.langToggle.setAttribute("aria-label", t.languageToggle);
    elements.saveContactBtn.setAttribute("title", t.saveContact);
    elements.shareCardBtn.setAttribute("title", t.shareCard);
    elements.openQRBtn.setAttribute("title", t.openQr);
    renderContacts();
    renderSocials();
    applyDocumentLocale();
    updateMeta();
}

function renderActionIcons() {
    const nextLang = state.lang === "en" ? "AR" : "EN";
    const t = labels();
    const modeLabel = state.theme === "dark" ? t.themeDark : state.theme === "light" ? t.themeLight : t.themeSystem;
    elements.saveContactBtn.innerHTML = iconMarkup("save");
    elements.shareCardBtn.innerHTML = iconMarkup("share");
    elements.openQRBtn.innerHTML = iconMarkup("qr");
    elements.themeToggle.innerHTML = `${iconMarkup(getThemeIconType())}<span class="mode-pill">${modeLabel}</span>`;
    elements.langToggle.innerHTML = `${iconMarkup("lang")}<span class="lang-pill">${nextLang}</span>`;
}

function setAvatarFallbacks() {
    const candidates = [
        state.card.assets.avatar,
        state.card.assets.avatarTypo,
        DEFAULT_AVATAR
    ].filter(Boolean);
    let index = 0;
    elements.profileImage.src = candidates[index];
    elements.profileImage.onerror = () => {
        index += 1;
        if (candidates[index]) elements.profileImage.src = candidates[index];
    };
}

function renderContacts() {
    const t = labels();
    const c = state.card.contact;
    const phoneHref = `tel:${sanitizePhone(c.phone)}`;
    const mapHref = c.mapsUrl;
    const website = c.website;
    const localizedAddress = state.lang === "ar" && c.addressAr ? c.addressAr : c.address;
    elements.contactList.innerHTML = `
        ${contactItem("call", t.call, phoneHref, c.phone, {
            copyType: "phone",
            whatsappUrl: c.whatsapp ? `https://wa.me/${sanitizePhone(c.whatsapp)}` : null,
            whatsappLabel: t.whatsapp
        })}
        ${contactItem("email", t.email, `mailto:${c.email}`, c.email, { copyType: "email" })}
        ${contactItem("website", t.website, website, website, { newTab: true })}
        ${contactItem("address", t.address, mapHref, localizedAddress, { newTab: true })}
    `;
    elements.contactList.querySelectorAll(".copy-btn").forEach((button) => {
        button.addEventListener("click", () => copyText(button.dataset.copyValue, labels().copied));
    });
}

function renderSocials() {
    elements.socialList.innerHTML = state.card.socials.map((social) => `
        <a class="social-link icon-social social-link--${social.name.toLowerCase()}" href="${social.url}" target="_blank" rel="noopener noreferrer" aria-label="${social.name}" title="${social.name}">
            ${socialIconMarkup(social.name)}
        </a>
    `).join("");
}

function contactItem(type, label, href, value, options = {}) {
    const { copyType = null, newTab = false, whatsappUrl = null, whatsappLabel = "" } = options;
    const actions = [];

    if (whatsappUrl) {
        actions.push(`
            <a class="whatsapp-btn icon-action-btn" href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" aria-label="${whatsappLabel}" title="${whatsappLabel}">
                ${contactIconMarkup("whatsapp")}
            </a>
        `);
    }

    if (copyType) {
        actions.push(`
            <button class="copy-btn icon-action-btn" type="button" data-copy-value="${value}" aria-label="${labels().copy} ${copyType}" title="${labels().copy}">
                ${iconMarkup("copy")}
            </button>
        `);
    }

    return `
        <div class="contact-item">
            <a class="contact-link" href="${href}" aria-label="${label}: ${value}" title="${label}" ${newTab ? 'target="_blank" rel="noopener noreferrer"' : ""}>
                <span class="contact-type-icon" aria-hidden="true">${contactIconMarkup(type)}</span>
                <span class="contact-value">${value}</span>
            </a>
            ${actions.length ? `<div class="contact-actions">${actions.join("")}</div>` : ""}
        </div>
    `;
}

function bindEvents() {
    elements.openQRBtn.addEventListener("click", (e) => openModal(elements.qrModal, e.currentTarget));
    elements.openVideoBtn.addEventListener("click", (e) => openVideoModal(e.currentTarget));
    elements.shareCardBtn.addEventListener("click", shareCard);
    elements.saveContactBtn.addEventListener("click", downloadVCard);
    elements.downloadQRBtn.addEventListener("click", downloadQr);
    elements.themeToggle.addEventListener("click", cycleTheme);
    elements.langToggle.addEventListener("click", toggleLanguage);
    elements.installNowBtn.addEventListener("click", handleInstall);
    elements.dismissInstallBtn.addEventListener("click", dismissInstall);
    document.querySelectorAll(".close-btn").forEach((btn) => btn.addEventListener("click", () => closeModal(btn.dataset.closeModal)));
    [elements.qrModal, elements.videoModal].forEach((modal) => {
        modal.addEventListener("click", (event) => {
            if (event.target === modal) closeModal(modal.id);
        });
    });
    document.addEventListener("keydown", handleEscAndTrap);
}

function handleEscAndTrap(event) {
    const openModalEl = document.querySelector(".modal-overlay.open");
    if (!openModalEl) return;
    if (event.key === "Escape") {
        event.preventDefault();
        closeModal(openModalEl.id, true);
        return;
    }
    if (event.key !== "Tab") return;
    trapFocus(openModalEl, event);
}

function openVideoModal(trigger) {
    const v = state.card.featureVideo;
    elements.videoContainer.innerHTML = v.type === "embed"
        ? `<iframe class="video-frame" src="${v.src}" title="${labels().videoTitle}" loading="lazy" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`
        : `<video class="video-frame" controls preload="none"><source src="${v.src}" type="video/mp4"></video>`;
    openModal(elements.videoModal, trigger);
}

function closeModal(modalId, byEscape = false) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (modalId === "videoModal") elements.videoContainer.innerHTML = "";
    if (state.activeModalTrigger) {
        if (byEscape) {
            state.activeModalTrigger.blur();
        } else {
            state.activeModalTrigger.focus();
        }
        state.activeModalTrigger = null;
    }
}

function openModal(modal, trigger) {
    state.activeModalTrigger = trigger;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstFocusable = modal.querySelector("button, a, input, [tabindex]:not([tabindex='-1'])");
    if (firstFocusable) firstFocusable.focus();
}

function trapFocus(modal, event) {
    const focusables = modal.querySelectorAll("button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])");
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

function sanitizePhone(phone) {
    return (phone || "").replace(/[^\d+]/g, "");
}

async function copyText(text, successText) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            const input = document.createElement("textarea");
            input.value = text;
            document.body.appendChild(input);
            input.select();
            document.execCommand("copy");
            input.remove();
        }
        announce(successText);
    } catch {
        announce(labels().copyFallback);
    }
}

function buildVcf() {
    const c = state.card.contact;
    const p = state.card.profile;
    const langProfile = getLocalizedProfile();
    return [
        "BEGIN:VCARD",
        "VERSION:3.0",
        `FN:${getDisplayName()}`,
        `ORG:${p.organization || ""}`,
        `TITLE:${(langProfile.title || "").replace(/,/g, "\\,")}`,
        `TEL;TYPE=CELL:${c.phone}`,
        `EMAIL;TYPE=INTERNET:${c.email}`,
        `URL:${c.website}`,
        `ADR;TYPE=WORK:;;${c.address};;;;`,
        "END:VCARD"
    ].join("\n");
}

function downloadVCard() {
    const blob = new Blob([buildVcf()], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.card.profile.name.replace(/\s+/g, "-")}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
    announce(labels().vcardStarted);
}

async function shareCard() {
    const url = getDeployedUrl();
    if (navigator.share) {
        await navigator.share({ title: getDisplayName(), text: labels().shareText, url });
        return;
    }
    await copyText(url, labels().shareCopied);
}

function downloadQr() {
    const a = document.createElement("a");
    a.href = state.card.assets.qr;
    a.download = "business-card-qr.png";
    a.click();
    announce(labels().downloadStarted);
}

function applyTheme() {
    const selected = state.theme;
    const effective = getEffectiveTheme();
    document.body.dataset.theme = effective;
    updateThemeMeta(effective === "dark" ? "#020617" : "#1e3a8a");
    const t = labels();
    const modeLabel = selected === "dark" ? t.themeDark : selected === "light" ? t.themeLight : t.themeSystem;
    elements.themeToggle.setAttribute("title", `${t.themeToggle}: ${modeLabel}`);
    elements.themeToggle.setAttribute("aria-label", `${t.themeToggle}: ${modeLabel}`);
    renderActionIcons();
}

function cycleTheme() {
    const cycle = ["system", "light", "dark"];
    const next = cycle[(cycle.indexOf(state.theme) + 1) % cycle.length];
    state.theme = next;
    localStorage.setItem(THEME_KEY, next);
    applyTheme();
}

function toggleLanguage() {
    state.lang = state.lang === "en" ? "ar" : "en";
    localStorage.setItem(LANG_KEY, state.lang);
    hydrateUI();
}

function applyDocumentLocale() {
    elements.html.lang = state.lang;
    elements.html.dir = state.lang === "ar" ? "rtl" : "ltr";
    requestAnimationFrame(stabilizeViewport);
}

function labels() {
    return state.card.labels[state.lang] || state.card.labels.en;
}

function updateThemeMeta(color) {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", color);
}

function updateMeta() {
    const localized = getLocalizedProfile();
    document.title = `${getDisplayName()} - ${localized.title}`;
    const description = localized.bio;
    const pageUrl = getDeployedUrl();
    const ogImage = getAbsoluteAssetUrl("assets/apple-touch-icon.png");
    setMeta("description", description);
    setMeta("og:title", document.title, true);
    setMeta("og:description", description, true);
    setMeta("og:url", pageUrl, true);
    setMeta("og:image", ogImage, true);
    setMeta("twitter:title", document.title, true);
    setMeta("twitter:description", description, true);
    setMeta("twitter:image", ogImage, true);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", pageUrl);
}

function setMeta(name, content, isProperty = false) {
    const selector = isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    const el = document.querySelector(selector);
    if (el) el.setAttribute("content", content);
}

function getDeployedUrl() {
    if (location.protocol.startsWith("http")) {
        return new URL("./", location.href).href;
    }
    const fallback = state.card?.shareFallbackUrl?.trim();
    return fallback || "https://example.com";
}

function getAbsoluteAssetUrl(relativePath) {
    return new URL(relativePath, getDeployedUrl()).href;
}

function announce(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("show");
    setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function isStandaloneMode() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

function isInstallDismissed() {
    return localStorage.getItem(INSTALL_DISMISSED_KEY) === "1";
}

function hideInstallBanner() {
    if (!elements.installBanner) return;
    elements.installBanner.classList.remove("is-visible");
    window.setTimeout(() => {
        if (!elements.installBanner.classList.contains("is-visible")) {
            elements.installBanner.classList.add("hidden");
        }
    }, 320);
}

function showInstallBanner() {
    if (!elements.installBanner) return;
    elements.installBanner.classList.remove("hidden");
    requestAnimationFrame(() => {
        requestAnimationFrame(() => elements.installBanner.classList.add("is-visible"));
    });
}

function initInstallFlow() {
    hideInstallBanner();

    if (isStandaloneMode() || isInstallDismissed()) return;

    window.addEventListener("beforeinstallprompt", (event) => {
        if (isStandaloneMode() || isInstallDismissed()) return;
        event.preventDefault();
        state.deferredInstallPrompt = event;
        showInstallBanner();
    });

    window.addEventListener("appinstalled", () => {
        state.deferredInstallPrompt = null;
        hideInstallBanner();
    });
}

async function handleInstall() {
    if (!state.deferredInstallPrompt) return;
    state.deferredInstallPrompt.prompt();
    await state.deferredInstallPrompt.userChoice;
    state.deferredInstallPrompt = null;
    hideInstallBanner();
}

function dismissInstall() {
    localStorage.setItem(INSTALL_DISMISSED_KEY, "1");
    state.deferredInstallPrompt = null;
    hideInstallBanner();
}

async function registerServiceWorker() {
    if (!("serviceWorker" in navigator)) return;
    try {
        await navigator.serviceWorker.register("./sw.js");
    } catch (error) {
        console.error("SW registration failed:", error);
    }
}

function iconMarkup(type) {
    const map = {
        save: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 4h12l2 2v14H5z" stroke="currentColor" stroke-width="1.75"/><path d="M8 4v5h8V4M8 14h8" stroke="currentColor" stroke-width="1.75"/></svg>`,
        share: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M14 6l4 4-4 4" stroke="currentColor" stroke-width="1.75"/><path d="M4 10h14M4 18h15" stroke="currentColor" stroke-width="1.75"/></svg>`,
        qr: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="3" y="3" width="7" height="7" stroke="currentColor" stroke-width="1.75"/><rect x="14" y="3" width="7" height="7" stroke="currentColor" stroke-width="1.75"/><rect x="3" y="14" width="7" height="7" stroke="currentColor" stroke-width="1.75"/><path d="M15 15h2v2h2v2h-4z" stroke="currentColor" stroke-width="1.75"/></svg>`,
        sun: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.75"/><path d="M12 3v2M12 19v2M5 5l1.4 1.4M17.6 17.6l1.4 1.4M3 12h2M19 12h2M5 19l1.4-1.4M17.6 6.4l1.4-1.4" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`,
        moon: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 13a8.8 8.8 0 11-10-10A7 7 0 0021 13z" stroke="currentColor" stroke-width="1.75"/></svg>`,
        theme: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M21 13a8.8 8.8 0 11-10-10A7 7 0 0021 13z" stroke="currentColor" stroke-width="1.75"/></svg>`,
        lang: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75"/><path d="M4 12h16M12 3c2.4 2.5 3.6 5.5 3.6 9S14.4 18.5 12 21c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3z" stroke="currentColor" stroke-width="1.55"/></svg>`,
        copy: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2.4" stroke="currentColor" stroke-width="1.75"/><rect x="4" y="4" width="11" height="11" rx="2.4" stroke="currentColor" stroke-width="1.75"/></svg>`
    };
    return map[type] || "";
}

function contactIconMarkup(type) {
    const icons = {
        call: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><path d="M4.6 5.2h3.6l1.8 4.5-1.8 1.9a14.8 14.8 0 007.6 7.6l1.9-1.8 4.5 1.8v3.6c-.8.8-2.2 1.2-3.6 1.1-8.2-1.2-13.9-6.9-15.1-15.1-.2-1.4.3-2.8 1.1-3.6z" stroke="currentColor" stroke-width="1.75"/></svg>`,
        email: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2.4" stroke="currentColor" stroke-width="1.75"/><path d="M4.5 7l7.5 5.6L19.5 7" stroke="currentColor" stroke-width="1.75"/></svg>`,
        website: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.75"/><path d="M3 12h18M12 3c2.2 2.4 3.4 5.4 3.4 9S14.2 18.6 12 21c-2.2-2.4-3.4-5.4-3.4-9S9.8 5.4 12 3z" stroke="currentColor" stroke-width="1.55"/></svg>`,
        address: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><path d="M12 21s6.8-5.5 6.8-10.7a6.8 6.8 0 10-13.6 0C5.2 15.5 12 21 12 21z" stroke="currentColor" stroke-width="1.75"/><circle cx="12" cy="10.3" r="2.3" stroke="currentColor" stroke-width="1.75"/></svg>`,
        whatsapp: `<svg class="utility-icon utility-icon--whatsapp" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/></svg>`
    };
    return icons[type] || "";
}

function socialIconMarkup(name) {
    const key = (name || "").toLowerCase();
    const icons = {
        instagram: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="4.2" stroke="currentColor" stroke-width="1.75"/><circle cx="12" cy="12" r="3.4" stroke="currentColor" stroke-width="1.75"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor"/></svg>`,
        facebook: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><path d="M14.2 8H17V4h-2.8A4.8 4.8 0 009.4 8.8V12H7v3.8h2.4V20h3.8v-4.2h2.9l.7-3.8h-3.6V9a1 1 0 011-1z" fill="currentColor"/></svg>`,
        linkedin: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><rect x="4.2" y="9" width="3.6" height="10.8" rx="0.8" stroke="currentColor" stroke-width="1.75"/><circle cx="6" cy="6" r="1.8" stroke="currentColor" stroke-width="1.75"/><path d="M11 9v10.8m0-6c0-2.6 1.6-4.3 4-4.3s4 1.7 4 4.3v6" stroke="currentColor" stroke-width="1.75"/></svg>`,
        x: `<svg class="utility-icon" viewBox="0 0 24 24" fill="none"><path d="M4 4h4.1l3.9 5.5L16.7 4H20l-6.1 7.2L20 20h-4.1l-4.2-5.9L6.6 20H3.3l6.5-7.6L4 4z" fill="currentColor"/></svg>`
    };
    return icons[key] || `<span>${name}</span>`;
}
