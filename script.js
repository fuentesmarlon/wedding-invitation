const modal = document.querySelector("[data-rsvp-modal]");
const dressCodeModal = document.querySelector("[data-dress-code-modal]");
const giftsModal = document.querySelector("[data-gifts-modal]");
const form = document.querySelector("[data-rsvp-form]");
const message = document.querySelector("[data-form-message]");
const plusOneField = document.querySelector("[data-plus-one-field]");
const childrenFields = document.querySelectorAll("[data-children-field]");
const childrenCheckbox = document.querySelector("[data-children-checkbox]");
const childrenCount = document.querySelector("[data-children-count]");
const childrenInput = childrenCount.querySelector("input");
const companionInput = plusOneField.querySelector("input");
const rsvpEndpoint = "https://script.google.com/macros/s/AKfycbyiM9elDuW2ffQkcr6VwZ4Gg3H72NqmCbDMNSlyAj1SiVbmBnIIthgQ43Ph6oOnRLh8ig/exec";
const queryParams = new URLSearchParams(window.location.search);
const allowsPlusOne = queryParams.get("plsne")?.toLowerCase() === "true";

function getCleanValue(input) {
  return input.value.trim();
}

function getSheetSafeValue(value) {
  const cleanValue = String(value).trim();
  return cleanValue || " ";
}

function setPlusOneVisibility() {
  const hasChildrenSelected = allowsPlusOne && childrenCheckbox.checked;

  plusOneField.hidden = !allowsPlusOne;
  childrenFields.forEach((field) => {
    field.hidden = !allowsPlusOne;
  });
  companionInput.disabled = !allowsPlusOne;
  childrenCheckbox.disabled = !allowsPlusOne;
  childrenCount.classList.toggle("is-visible", hasChildrenSelected);
  childrenInput.disabled = !hasChildrenSelected;

  if (!hasChildrenSelected) {
    childrenInput.value = "";
  }

  if (!allowsPlusOne) {
    companionInput.value = "";
    childrenCheckbox.checked = false;
  }
}

function submitToGoogleSheets(payload) {
  return fetch(rsvpEndpoint, {
    method: "POST",
    mode: "no-cors",
    body: new URLSearchParams(payload),
  });
}

function openModal() {
  setPlusOneVisibility();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  form.elements.guestName.focus();
}

function openDressCodeModal() {
  dressCodeModal.classList.add("is-open");
  dressCodeModal.setAttribute("aria-hidden", "false");
}

function closeDressCodeModal() {
  dressCodeModal.classList.remove("is-open");
  dressCodeModal.setAttribute("aria-hidden", "true");
}

function openGiftsModal() {
  giftsModal.classList.add("is-open");
  giftsModal.setAttribute("aria-hidden", "false");
}

function closeGiftsModal() {
  giftsModal.classList.remove("is-open");
  giftsModal.setAttribute("aria-hidden", "true");
}

function setLoadingMessage() {
  message.innerHTML = `
    Enviando confirmación
    <span class="loading-dots" aria-hidden="true">
      <span></span>
      <span></span>
      <span></span>
    </span>
  `;
}

function closeModal({ showDressCode = true } = {}) {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  form.reset();
  message.replaceChildren();
  childrenCount.classList.remove("is-visible");
  childrenInput.disabled = true;
  setPlusOneVisibility();

  if (showDressCode) {
    window.setTimeout(openDressCodeModal, 280);
  }
}

document.querySelector("[data-open-rsvp]").addEventListener("click", openModal);
document.querySelector("[data-open-gifts]").addEventListener("click", openGiftsModal);

document.querySelectorAll("[data-close-rsvp]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.querySelectorAll("[data-close-dress-code]").forEach((button) => {
  button.addEventListener("click", closeDressCodeModal);
});

document.querySelectorAll("[data-close-gifts]").forEach((button) => {
  button.addEventListener("click", closeGiftsModal);
});

childrenCheckbox.addEventListener("change", () => {
  const isChecked = allowsPlusOne && childrenCheckbox.checked;
  childrenCount.classList.toggle("is-visible", isChecked);
  childrenInput.disabled = !isChecked;

  if (!isChecked) {
    childrenInput.value = "";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setLoadingMessage();

  const payload = {
    guestName: getCleanValue(form.elements.guestName),
    companionName: allowsPlusOne ? getSheetSafeValue(companionInput.value) : " ",
    hasChildren: allowsPlusOne ? (childrenCheckbox.checked ? "si" : "no") : " ",
    childrenCount: allowsPlusOne && childrenCheckbox.checked ? getSheetSafeValue(childrenInput.value) : " ",
  };

  try {
    await submitToGoogleSheets(payload);
    message.textContent = "Confirmación enviada. ¡Gracias!";
    setTimeout(closeModal, 1400);
  } catch (error) {
    message.textContent = "No se pudo enviar. Intenta de nuevo.";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
    return;
  }

  if (event.key === "Escape" && dressCodeModal.classList.contains("is-open")) {
    closeDressCodeModal();
    return;
  }

  if (event.key === "Escape" && giftsModal.classList.contains("is-open")) {
    closeGiftsModal();
  }
});

setPlusOneVisibility();
