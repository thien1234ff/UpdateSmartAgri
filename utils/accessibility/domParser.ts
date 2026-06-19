import { DOMExtractedData, DOMElementInfo, FormInfo, TableInfo, NavigationInfo, CardInfo } from "../../types/accessibility";

function shouldIgnore(element: Element): boolean {
  if (!element) return true;
  
  let current: Element | null = element;
  while (current) {
    if (
      current.id === "a11y-assistant-panel" ||
      current.id === "a11y-assistant-button" ||
      current.getAttribute("data-a11y-ignore") === "true"
    ) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function getCleanText(element: Element): string {
  const text = (element as HTMLElement).innerText || element.textContent || "";
  return text.replace(/\s+/g, " ").trim();
}

export function parseCurrentPage(): DOMExtractedData {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      pageTitle: "",
      headings: [],
      paragraphs: [],
      buttons: [],
      forms: [],
      tables: [],
      navigation: [],
      cards: [],
      alerts: [],
      dialogs: [],
      imageAlts: [],
      ariaLabels: [],
      validationMessages: [],
      landmarks: [],
      isCartOpen: false,
      cartItems: [],
      cartTotal: "",
      isCheckoutOpen: false,
    };
  }

  const pageTitle = document.title;
  const headings: DOMElementInfo[] = [];
  const paragraphs: string[] = [];
  const buttons: DOMElementInfo[] = [];
  const forms: FormInfo[] = [];
  const tables: TableInfo[] = [];
  const navigation: NavigationInfo[] = [];
  const cards: CardInfo[] = [];
  const alerts: DOMElementInfo[] = [];
  const dialogs: DOMElementInfo[] = [];
  const imageAlts: DOMElementInfo[] = [];
  const ariaLabels: DOMElementInfo[] = [];
  const validationMessages: DOMElementInfo[] = [];
  const landmarks: DOMElementInfo[] = [];

  const getElementInfo = (el: Element): DOMElementInfo => {
    return {
      text: getCleanText(el),
      tagName: el.tagName.toLowerCase(),
      role: el.getAttribute("role") || undefined,
      ariaLabel: el.getAttribute("aria-label") || undefined,
      id: el.id || undefined,
      type: el.getAttribute("type") || undefined,
      placeholder: el.getAttribute("placeholder") || undefined,
    };
  };

  const headingElements = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
  headingElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const text = getCleanText(el);
      if (text) {
        headings.push({
          ...getElementInfo(el),
          text,
        });
      }
    }
  });

  const paragraphElements = document.querySelectorAll("p, span.description, li");
  paragraphElements.forEach((el) => {
    if (!shouldIgnore(el) && el.tagName.toLowerCase() !== "li" && !el.closest("button") && !el.closest("a") && !el.closest("nav") && !el.closest("table")) {
      const text = getCleanText(el);
      if (text && text.length > 5 && !paragraphs.includes(text)) {
        paragraphs.push(text);
      }
    }
  });

  const buttonElements = document.querySelectorAll("button, [role='button'], a.btn, input[type='submit'], input[type='button']");
  buttonElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const info = getElementInfo(el);
      if (info.text || info.ariaLabel) {
        buttons.push(info);
      }
    }
  });

  const formElements = document.querySelectorAll("form, div.form-container, div.farm-form");
  formElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const inputElements = el.querySelectorAll("input, select, textarea");
      const formInputs: DOMElementInfo[] = [];
      inputElements.forEach((input) => {
        if (!shouldIgnore(input)) {
          let labelText = "";
          const id = input.id;
          if (id) {
            const labelEl = document.querySelector(`label[for="${id}"]`);
            if (labelEl) labelText = getCleanText(labelEl);
          }
          if (!labelText) {
            const parentLabel = input.closest("label");
            if (parentLabel) labelText = getCleanText(parentLabel).replace(getCleanText(input), "").trim();
          }

          formInputs.push({
            ...getElementInfo(input),
            text: labelText || input.getAttribute("aria-label") || input.getAttribute("placeholder") || "",
          });
        }
      });

      const formButtons: DOMElementInfo[] = [];
      el.querySelectorAll("button, input[type='submit']").forEach((btn) => {
        if (!shouldIgnore(btn)) {
          formButtons.push(getElementInfo(btn));
        }
      });

      forms.push({
        id: el.id || undefined,
        ariaLabel: el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || undefined,
        inputs: formInputs,
        buttons: formButtons,
      });
    }
  });

  const tableElements = document.querySelectorAll("table, [role='table']");
  tableElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const headers: string[] = [];
      el.querySelectorAll("th").forEach((th) => {
        headers.push(getCleanText(th));
      });

      const rowsCount = el.querySelectorAll("tr").length - 1;
      const cells: string[] = [];
      el.querySelectorAll("td").forEach((td) => {
        const text = getCleanText(td);
        if (text) cells.push(text);
      });

      tables.push({
        id: el.id || undefined,
        ariaLabel: el.getAttribute("aria-label") || undefined,
        headers,
        rowsCount: Math.max(0, rowsCount),
        cells,
      });
    }
  });

  const navElements = document.querySelectorAll("nav, [role='navigation'], header div.header-bottom-row, header div.header-top-row ul");
  navElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const links: DOMElementInfo[] = [];
      el.querySelectorAll("a, button").forEach((link) => {
        if (!shouldIgnore(link)) {
          const info = getElementInfo(link);
          if (info.text) {
            links.push(info);
          }
        }
      });

      if (links.length > 0) {
        navigation.push({
          id: el.id || undefined,
          ariaLabel: el.getAttribute("aria-label") || undefined,
          links,
        });
      }
    }
  });

  const cardElements = document.querySelectorAll(".farm-card, .crop-card, .product-card, .article-card, .card, [role='article']");
  cardElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const titleEl = el.querySelector("h3, h4, h5, .card-title, .title");
      const title = titleEl ? getCleanText(titleEl) : (el.querySelector("strong") ? getCleanText(el.querySelector("strong")!) : "Thẻ tin");
      
      const contentParts: string[] = [];
      el.querySelectorAll("p, span, div").forEach((part) => {
        if (!shouldIgnore(part) && !part.closest("button") && !part.closest("a") && part.children.length === 0) {
          const text = getCleanText(part);
          if (text) contentParts.push(text);
        }
      });

      const cardButtons: DOMElementInfo[] = [];
      el.querySelectorAll("button").forEach((btn) => {
        if (!shouldIgnore(btn)) cardButtons.push(getElementInfo(btn));
      });

      const cardLinks: DOMElementInfo[] = [];
      el.querySelectorAll("a").forEach((link) => {
        if (!shouldIgnore(link)) cardLinks.push(getElementInfo(link));
      });

      cards.push({
        title,
        content: contentParts.join("; "),
        buttons: cardButtons,
        links: cardLinks,
      });
    }
  });

  const alertElements = document.querySelectorAll("[role='alert'], .alert, .status-message, .validation-message, .error-message");
  alertElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const info = getElementInfo(el);
      if (info.text) {
        alerts.push(info);
      }
    }
  });

  const dialogElements = document.querySelectorAll("[role='dialog'], [role='alertdialog'], .modal, .dialog-content");
  dialogElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const info = getElementInfo(el);
      if (info.text) {
        dialogs.push(info);
      }
    }
  });

  const imageElements = document.querySelectorAll("img");
  imageElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const alt = el.getAttribute("alt");
      if (alt) {
        imageAlts.push({
          text: alt,
          tagName: "img",
          id: el.id || undefined,
          alt,
        });
      }
    }
  });

  const ariaLabeledElements = document.querySelectorAll("[aria-label], [aria-labelledby], [aria-describedby]");
  ariaLabeledElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const ariaLabel = el.getAttribute("aria-label");
      const ariaLabelledBy = el.getAttribute("aria-labelledby");
      const ariaDescribedBy = el.getAttribute("aria-describedby");
      
      let labelText = ariaLabel || "";
      if (!labelText && ariaLabelledBy) {
        const sourceEl = document.getElementById(ariaLabelledBy);
        if (sourceEl) labelText = getCleanText(sourceEl);
      }

      let descText = "";
      if (ariaDescribedBy) {
        const sourceEl = document.getElementById(ariaDescribedBy);
        if (sourceEl) descText = getCleanText(sourceEl);
      }

      if (labelText || descText) {
        ariaLabels.push({
          text: labelText,
          tagName: el.tagName.toLowerCase(),
          id: el.id || undefined,
          ariaLabel: labelText,
          role: el.getAttribute("role") || undefined,
        });
      }
    }
  });

  const errorElements = document.querySelectorAll(".error, .text-red-500, .text-destructive, [aria-invalid='true']");
  errorElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const text = getCleanText(el);
      if (text) {
        validationMessages.push({
          text,
          tagName: el.tagName.toLowerCase(),
          id: el.id || undefined,
        });
      }
    }
  });

  const landmarkElements = document.querySelectorAll("header, footer, main, aside, section, [role='main'], [role='contentinfo'], [role='banner']");
  landmarkElements.forEach((el) => {
    if (!shouldIgnore(el)) {
      const role = el.getAttribute("role") || el.tagName.toLowerCase();
      landmarks.push({
        text: el.getAttribute("aria-label") || role,
        tagName: el.tagName.toLowerCase(),
        id: el.id || undefined,
        role: role,
      });
    }
  });

  // Extract Cart Info
  const cartTitleEl = document.querySelector("#cart-title");
  const isCartOpen = !!cartTitleEl && cartTitleEl.getBoundingClientRect().width > 0;
  const cartItems: { name: string; price: string; quantity: string; actions: string[] }[] = [];
  let cartTotal = "";

  if (isCartOpen) {
    const cartContainer = document.querySelector("#cart-items");
    if (cartContainer) {
      const itemElements = cartContainer.children;
      for (let i = 0; i < itemElements.length; i++) {
        const itemEl = itemElements[i];
        const nameEl = itemEl.querySelector("h4");
        const priceEl = itemEl.querySelector("p.text-red-600");
        const qtyEl = itemEl.querySelector("span.bg-white") || itemEl.querySelector(".px-4.py-1.bg-white");
        
        const name = nameEl ? getCleanText(nameEl) : "";
        const price = priceEl ? getCleanText(priceEl) : "";
        const quantity = qtyEl ? getCleanText(qtyEl) : "";
        
        if (name) {
          const actions: string[] = [];
          itemEl.querySelectorAll("button").forEach((btn) => {
            const label = btn.getAttribute("aria-label") || getCleanText(btn);
            const cleanLabel = label.replace(/\s+/g, " ").trim();
            if (cleanLabel) {
              actions.push(cleanLabel);
            }
          });
          cartItems.push({ name, price, quantity, actions });
        }
      }
    }
    
    const totalEl = document.querySelector("span.text-xl.font-bold.bg-gradient-to-r");
    if (totalEl) {
      cartTotal = getCleanText(totalEl);
    }
  }

  // Extract Checkout Info
  const checkoutTitleEl = document.querySelector("#checkout-title");
  const isCheckoutOpen = !!checkoutTitleEl && checkoutTitleEl.getBoundingClientRect().width > 0;

  return {
    pageTitle,
    headings,
    paragraphs,
    buttons,
    forms,
    tables,
    navigation,
    cards,
    alerts,
    dialogs,
    imageAlts,
    ariaLabels,
    validationMessages,
    landmarks,
    isCartOpen,
    cartItems,
    cartTotal,
    isCheckoutOpen,
  };
}
