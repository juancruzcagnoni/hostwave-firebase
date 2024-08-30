import app from "../config.js";

import {
  getFirestore,
  collection,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

const db = getFirestore(app);

const pricingView = `
   <section class="py-5 pricing">
      <div class="container">
         <div class="row">
            <div class="col-md-12 text-center">
               <h2 class="mb-3" data-aos="fade-down">Our Hosting Plans</h2>
            </div>
         </div>
         <div class="row">
            <div class="col-md-6 offset-md-3 mb-5">
               <input
                  type="text"
                  id="searchInput"
                  class="form-control"
                  placeholder="Search plans..."
               />
            </div>
         </div>
         <div class="row" id="pricingRow" data-aos="fade-up"></div>
      </div>
   </section>
`;

function createPricingCard(plan) {
  const card = document.createElement("div");
  card.classList.add("col-md-4");

  const featuresList = document.createElement("ul");
  plan.features.forEach((feature) => {
    const listItem = document.createElement("li");
    listItem.innerHTML = `<i class="bi bi-check"></i> ${feature}`;
    featuresList.appendChild(listItem);
  });

  card.innerHTML = `
              <div class="card">
                  <h3>${plan.title}</h3>
                  <p>Starting at <span class="price">${plan.price}</span></p>
              </div>
          `;

  const pricingCard = card.querySelector(".card");
  pricingCard.appendChild(featuresList);

  return card;
}

async function displayPricingPlans() {
  const plansCollection = collection(db, "plans");
  const plansSnapshot = await getDocs(plansCollection);

  const pricingRow = document.getElementById("pricingRow");

  plansSnapshot.forEach((doc) => {
     const planData = doc.data();
     const pricingCard = createPricingCard(planData);
     pricingRow.appendChild(pricingCard);
  });

  const searchInput = document.getElementById("searchInput");
  searchInput.addEventListener("input", () => {
     const searchTerm = searchInput.value.toLowerCase();
     filterPlans(searchTerm);
  });
}

function filterPlans(searchTerm) {
  const pricingRow = document.getElementById("pricingRow");
  const pricingCards = pricingRow.getElementsByClassName("col-md-4");

  for (const card of pricingCards) {
     const title = card.querySelector("h3").innerText.toLowerCase();
     if (title.includes(searchTerm)) {
        card.style.display = "block";
     } else {
        card.style.display = "none";
     }
  }
}

export default {
  view: pricingView,
  displayPlans: [displayPricingPlans],
};
