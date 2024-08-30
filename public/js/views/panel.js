import app from "../config.js";

import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
  setDoc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

import validator from "https://cdn.skypack.dev/validator";

const auth = getAuth(app);
const db = getFirestore(app);

const panelView = `
<!-- Create plan -->
<div class="plans-form py-5">
    <h1>Add New Hosting Plan</h1>
    <form id="addPlanForm">
        <div class="mb-3">
            <label for="planTitle" class="form-label">Title</label>
            <input type="text" class="form-control" id="planTitle" />
        </div>
        <div class="mb-3">
            <label for="planPrice" class="form-label">Price</label>
            <select class="form-select" id="planPrice"></select>
        </div>
        <div class="mb-3">
            <label for="planFeatures" class="form-label">Features (Separate with line breaks)</label>
            <textarea class="form-control" id="planFeatures"></textarea>
        </div>
        <button type="submit" class="btn">Add Plan</button>
        <div id="createError" class="alert alert-danger mt-3" style="display: none;"></div>
    </form>
</div>

<!-- Plans list -->
<section class="bg-light py-5">
  <div class="container">
    <div class="row">
      <div class="col-md-12 text-center">
        <h2 class="mb-3">Hosting Plans Management</h2>
        <div class="mb-5" id="deleteSuccessMessage" style="display: none">Plan deleted successfully!</div>
      </div>
    </div>
    <div class="row">
      <table class="table table-bordered">
        <thead>
          <tr>
            <th>Title</th>
            <th>Price</th>
            <th>Features</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody id="pricingTable"></tbody>
      </table>
    </div>
  </div>
</section>
`;

async function displayPanelView() {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const userDocRef = doc(db, "usuarios", user.uid);

      getDoc(userDocRef)
        .then((docSnapshot) => {
          if (docSnapshot.exists()) {
            const userData = docSnapshot.data();
            const userRole = userData.role;

            if (userRole === "client") {
              window.location.href = "#home";
            }
          }
        })
        .catch((error) => {
          console.error("Error al obtener información del usuario:", error);
        });
    } else {
      window.location.href = "#home";
    }
  });

  function createEditablePricingRow(plan) {
    const row = document.createElement("tr");
    row.dataset.id = plan.id;

    const titleCell = document.createElement("td");
    titleCell.innerHTML = `<div>${plan.title}</div>`;

    const priceCell = document.createElement("td");
    priceCell.innerHTML = `<div>${plan.price}</div>`;

    const featuresCell = document.createElement("td");
    featuresCell.innerHTML = `<div>${plan.features.join("\n")}</div>`;

    const actionsCell = document.createElement("td");
    const editButton = document.createElement("button");
    const deleteButton = document.createElement("button");

    editButton.textContent = "Edit";
    editButton.className = "btn-edit mb-2";
    editButton.addEventListener("click", () => {
      window.location.hash = `#edit?id=${plan.id}`;
    });

    deleteButton.textContent = "Delete";
    deleteButton.className = "btn-delete";
    deleteButton.addEventListener("click", () => {
      const planDocRef = doc(db, "plans", plan.id);

      deleteDoc(planDocRef)
        .then(() => {
          const successMessage = document.getElementById(
            "deleteSuccessMessage"
          );
          successMessage.style.display = "block";

          successMessage.style.display = "none";
          window.location.href = "#panel";
        })
        .catch((error) => {
          console.error("Error deleting plan:", error);
        });
    });
    actionsCell.appendChild(editButton);
    actionsCell.appendChild(deleteButton);

    row.appendChild(titleCell);
    row.appendChild(priceCell);
    row.appendChild(featuresCell);
    row.appendChild(actionsCell);

    return row;
  }

  async function displayPricingPlans() {
    const plansCollection = collection(db, "plans");
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

    const pricingTable = document.getElementById("pricingTable");
    pricingTable.innerHTML = "";

    const plansSnapshot = await getDocs(plansCollection);

    plansSnapshot.forEach((doc) => {
      const planData = doc.data();
      planData.id = doc.id;
      const pricingRow = createEditablePricingRow(planData);
      pricingTable.appendChild(pricingRow);
    });
  }

  displayPricingPlans();

  const addPlanForm = document.getElementById("addPlanForm");
  const createError = document.getElementById("createError");
  addPlanForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const planTitle = document.getElementById("planTitle").value;
    const planPrice = document.getElementById("planPrice").value;
    const planFeatures = document
      .getElementById("planFeatures")
      .value.split("\n");

    if (!validator.isLength(planTitle, { min: 1 })) {
      createError.textContent = "Title cannot be empty";
      createError.style.display = "block";
      return;
    }

    if (!validator.isDecimal(planPrice)) {
      createError.textContent = "Invalid price";
      createError.style.display = "block";
      return;
    }

    try {
      const newPlanDocRef = doc(collection(db, "plans"));
      await setDoc(newPlanDocRef, {
        title: planTitle,
        price: planPrice,
        features: planFeatures,
      });

      document.getElementById("planTitle").value = "";
      document.getElementById("planPrice").value = "";
      document.getElementById("planFeatures").value = "";

      displayPricingPlans();
    } catch (error) {
      console.error("Error adding plan:", error);
    }
  });
}

export default {
  view: panelView,
  displayPanel: [displayPanelView],
};
