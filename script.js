const modal = document.querySelector("[data-rsvp-modal]");
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
  plusOneField.hidden = !allowsPlusOne;
  childrenFields.forEach((field) => {
    field.hidden = !allowsPlusOne;
  });
  companionInput.disabled = !allowsPlusOne;
  childrenCheckbox.disabled = !allowsPlusOne;

  if (!allowsPlusOne) {
    companionInput.value = "";
    childrenCheckbox.checked = false;
    childrenCount.classList.remove("is-visible");
    childrenInput.value = "";
    childrenInput.disabled = true;
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

function closeModal() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  form.reset();
  message.textContent = "";
  childrenCount.classList.remove("is-visible");
  childrenInput.disabled = true;
  setPlusOneVisibility();
}

document.querySelector("[data-open-rsvp]").addEventListener("click", openModal);

document.querySelectorAll("[data-close-rsvp]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

childrenCheckbox.addEventListener("change", () => {
  const isChecked = childrenCheckbox.checked;
  childrenCount.classList.toggle("is-visible", isChecked);
  childrenInput.disabled = !isChecked;

  if (!isChecked) {
    childrenInput.value = "";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Enviando confirmación...";

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
  }
});

setPlusOneVisibility();
