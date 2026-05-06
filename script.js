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
const submitFrameName = "rsvp-submit-frame";
const queryParams = new URLSearchParams(window.location.search);
const allowsPlusOne = queryParams.get("plsne")?.toLowerCase() === "true";

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
    childrenInput.required = false;
  }
}

function submitToGoogleSheets(payload) {
  const iframe = document.createElement("iframe");
  iframe.name = submitFrameName;
  iframe.hidden = true;
  document.body.appendChild(iframe);

  const submitForm = document.createElement("form");
  submitForm.action = rsvpEndpoint;
  submitForm.method = "POST";
  submitForm.target = submitFrameName;
  submitForm.hidden = true;

  Object.entries(payload).forEach(([name, value]) => {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    submitForm.appendChild(input);
  });

  document.body.appendChild(submitForm);
  submitForm.submit();

  setTimeout(() => {
    submitForm.remove();
    iframe.remove();
  }, 3000);
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
  childrenInput.required = isChecked;

  if (!isChecked) {
    childrenInput.value = "1";
  }
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  message.textContent = "Enviando confirmación...";

  const formData = new FormData(form);
  const payload = {
    guestName: formData.get("guestName").trim(),
    companionName: allowsPlusOne ? formData.get("companionName").trim() : "",
    hasChildren: allowsPlusOne ? (childrenCheckbox.checked ? "si" : "no") : "",
    childrenCount: allowsPlusOne && childrenCheckbox.checked ? Number(formData.get("childrenCount")) : "",
  };

  submitToGoogleSheets(payload);
  message.textContent = "Confirmación enviada. ¡Gracias!";
  setTimeout(closeModal, 1400);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});

setPlusOneVisibility();
