const modal = document.querySelector("[data-rsvp-modal]");
const form = document.querySelector("[data-rsvp-form]");
const message = document.querySelector("[data-form-message]");
const childrenCheckbox = document.querySelector("[data-children-checkbox]");
const childrenCount = document.querySelector("[data-children-count]");
const childrenInput = childrenCount.querySelector("input");

function openModal() {
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
    companionName: formData.get("companionName").trim(),
    hasChildren: childrenCheckbox.checked,
    childrenCount: childrenCheckbox.checked ? Number(formData.get("childrenCount")) : 0,
  };

  try {
    const response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error("No se pudo guardar la confirmación.");
    }

    message.textContent = "Confirmación guardada. ¡Gracias!";
    setTimeout(closeModal, 1400);
  } catch (error) {
    message.textContent = "No se pudo enviar. Abre la página desde el servidor local.";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && modal.classList.contains("is-open")) {
    closeModal();
  }
});
