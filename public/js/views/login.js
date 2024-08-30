import app from "../config.js";

import {
  getAuth,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

import validator from "https://cdn.skypack.dev/validator";

const auth = getAuth(app);
const db = getFirestore(app);

const loginView = `
<div class="container py-5">
      <h1 class="mb-5 text-center">Login</h1>
      <!-- Form -->
      <div class="container w-50">
        <form id="loginForm" action="">
          <div class="form-group">
            <label for="email" class="mb-1">Email</label>
            <input
              type="email"
              class="form-control mb-2"
              id="email"
              name="email"
            />
          </div>
          <div class="form-group mb-4">
            <label for="password" class="mb-1">Password</label>
            <input
              type="password"
              class="form-control mb-2"
              id="password"
              name="password"
            />
          </div>
          <p class="text-center my-4">
            You do not have an account?
            <a href="#register">Register here</a>
          </p>
          <button type="submit" class="btn w-100">Log In</button>
          <div
            id="successMessage"
            class="alert alert-success mt-3"
            style="display: none"
          >
            Successful login.
          </div>
          <div
            id="errorMessage"
            class="alert alert-danger mt-3"
            style="display: none"
          ></div>
        </form>
      </div>
    </div>
`;

async function displayLoginForm() {
  let form = document.forms.loginForm;

  let successMessage = document.getElementById("successMessage");
  let errorMessage = document.getElementById("errorMessage");

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    let email = form.email.value;
    let password = form.password.value;

    console.log(email, password);

    // Validación de campos
    if (!validator.isEmail(email)) {
      errorMessage.textContent = "Email is not valid";
      errorMessage.style.display = "block";
      return;
    }

    if (!validator.isLength(password, { min: 6 })) {
      errorMessage.textContent = "Password must be at least 6 characters";
      errorMessage.style.display = "block";
      return;
    }

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        console.log("Inicio de sesión exitoso:", user);

        const userDocRef = doc(db, "usuarios", user.uid);

        getDoc(userDocRef)
          .then((docSnapshot) => {
            if (docSnapshot.exists()) {
              const userData = docSnapshot.data();
              const userRole = userData.role;

              if (userRole === "admin") {
                window.location.href = "#panel";
              } else if (userRole === "client") {
                window.location.href = "#pricing";
              }
            }
          })
          .catch((error) => {
            console.error("Error al obtener información del usuario:", error);
          });

        successMessage.style.display = "block";
        errorMessage.style.display = "none";
      })
      .catch((error) => {
        console.error("Error al iniciar sesión:", error);

        errorMessage.style.display = "block";
        if (error.code === "auth/user-not-found") {
          errorMessage.textContent =
            "Usuario no encontrado. Verifique su email y contraseña.";
        } else if (error.code === "auth/wrong-password") {
          errorMessage.textContent =
            "Contraseña incorrecta. Verifique su contraseña.";
        } else {
          errorMessage.textContent =
            "Error al iniciar sesión. Inténtelo de nuevo más tarde.";
        }
        successMessage.style.display = "none";
      });
  });
}

export default {
  view: loginView,
  displayLogin: [displayLoginForm],
};
