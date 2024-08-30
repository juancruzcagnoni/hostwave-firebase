import app from "../config.js";

import {
  getFirestore,
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs, 
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

import validator from "https://cdn.skypack.dev/validator";

const db = getFirestore(app);

const editView = `
<div class="container my-5 py-5">
      <h1>Edit Plan</h1>
      <form id="editPlanForm">
        <div class="mb-3">
          <label for="planTitle" class="form-label">Title</label>
          <input type="text" class="form-control" id="planTitle" />
        </div>
        <div class="mb-3">
          <label for="planPrice" class="form-label">Price</label>
          <select class="form-select" id="planPrice" required></select>
        </div>
        <div class="mb-3">
          <label for="planFeatures" class="form-label">Features</label>
          <textarea class="form-control" id="planFeatures"></textarea>
        </div>
        <button type="submit" class="btn">Save Changes</button>
        <div
          id="successMessage"
          class="alert alert-success mt-3"
          style="display: none"
        >
          Successful edit.
        </div>
        <div
          id="errorMessage"
          class="alert alert-danger mt-3"
          style="display: none"
        >
          An error occurred.
        </div>
      </form>
    </div>
`;

async function displayEdit() {
  let successMessage = document.getElementById("successMessage");
  let errorMessage = document.getElementById("errorMessage");

  const urlParams = new URLSearchParams(window.location.hash.split("?")[1]);
  const planId = urlParams.get("id");

  async function loadPlanData(planId) {
    console.log("Loading plan data for ID:", planId);

    if (planId) {
      const planDocRef = doc(db, "plans", planId);
      const planSnapshot = await getDoc(planDocRef);

      if (planSnapshot.exists()) {
        const planData = planSnapshot.data();
        document.getElementById("planTitle").value = planData.title;
        document.getElementById("planFeatures").value =
          planData.features.join("\n");
      }
    }
  }

  async function loadPrices() {
    const pricesCollection = collection(db, "prices");

    try {
      const pricesSnapshot = await getDocs(pricesCollection);
      const planPriceSelect = document.getElementById("planPrice");

      planPriceSelect.innerHTML = ""; 

      pricesSnapshot.forEach((doc) => {
        const priceData = doc.data();
        const option = document.createElement("option");
        option.value = priceData.price;
        option.textContent = priceData.price; 
        planPriceSelect.appendChild(option);
      });
    } catch (error) {
      console.error("Error fetching prices:", error);
    }
  }

  await loadPlanData(planId);
  await loadPrices();

  const editPlanForm = document.getElementById("editPlanForm");
  editPlanForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const updatedTitle = document.getElementById("planTitle").value;
    const updatedPrice = document.getElementById("planPrice").value;
    const updatedFeatures = document
      .getElementById("planFeatures")
      .value.split("\n");

    if (!validator.isLength(updatedTitle, { min: 1 })) {
      errorMessage.textContent = "Title cannot be empty";
      errorMessage.style.display = "block";
      return;
    }

    if (!validator.isDecimal(updatedPrice)) {
      errorMessage.textContent = "Invalid price";
      errorMessage.style.display = "block";
      return;
    }

    const planDocRef = doc(db, "plans", planId);
    try {
      await updateDoc(planDocRef, {
        title: updatedTitle,
        price: updatedPrice,
        features: updatedFeatures,
      });
      successMessage.style.display = "block";
      errorMessage.style.display = "none";

      window.location.href = "#panel";
    } catch (error) {
      successMessage.style.display = "none";
      errorMessage.style.display = "block";
    }
  });
}

export default {
  view: editView,
  displayEdit: [displayEdit],
};
