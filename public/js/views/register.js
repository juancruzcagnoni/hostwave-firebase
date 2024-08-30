import app from "../config.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-firestore.js";

import {
  getStorage,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/10.3.0/firebase-storage.js";

import validator from "https://cdn.skypack.dev/validator";

const registerView = `
<!-- Register -->
<div class="container py-5">
    <h1 class="mb-5 text-center">Register</h1>
    <!-- Form -->
    <div class="container w-50">
        <form id="registerForm" action="">
            <div class="form-group">
                <label for="name" class="mb-1">Name</label>
                <input type="text" class="form-control mb-2" id="name" name="name">
            </div>
            <div class="form-group">
                <label for="email" class="mb-1">Email</label>
                <input type="email" class="form-control mb-2" id="email" name="email">
            </div>
            <div class="form-group mb-4">
                <label for="password" class="mb-1">Password</label>
                <input type="password" class="form-control mb-2" id="password" name="password">
            </div>

            <div class="form-group">
                <label for="profileImage" class="mb-1">Profile Image</label>
                <input type="file" class="form-control mb-2" id="profileImage" name="profileImage">
            </div>

            <p class="text-center my-4">Do you already have an account? <a href="#login">Enter here</a></p>

            <button type="submit" class="btn w-100">Register</button>

            <div id="registrationSuccess" class="alert alert-success mt-3" style="display: none;">
                Successful registration. Welcome!
            </div>

            <div id="registrationError" class="alert alert-danger mt-3" style="display: none;"></div>
        </form>
    </div>
</div>
`;

async function displayRegister() {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  let form = document.forms.registerForm;
  let { email, password, profileImage } = form;

  let registrationSuccess = document.getElementById("registrationSuccess");
  let registrationError = document.getElementById("registrationError");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (!validator.isEmail(email.value)) {
      registrationError.textContent = "Email is not valid";
      registrationError.style.display = "block";
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email.value,
        password.value
      );
      const user = userCredential.user;

      const userDocRef = doc(db, "usuarios", user.uid);
      await setDoc(userDocRef, {
          name: form.name.value,
          email: email.value,
          role: "client"
      });

      const storageRef = ref(storage, `profile_images/${user.uid}`);
      await uploadBytes(storageRef, profileImage.files[0]);

      console.log("Registered user:", user);

      registrationSuccess.style.display = "block";
      registrationError.style.display = "none";
    } catch (error) {
      console.error("Error registering user:", error);

      registrationError.style.display = "block";
      if (error.code === "auth/email-already-in-use") {
        registrationError.textContent = "Email is already in use";
      } else if (error.code === "auth/invalid-email") {
        registrationError.textContent = "The email is not valid";
      } else if (error.code === "auth/weak-password") {
        registrationError.textContent =
          "The password must be at least 6 characters";
      } else {
        registrationError.textContent =
          "Error registering user. Try it again later.";
      }

      registrationSuccess.style.display = "none";
    }
  });
}

export default {
  view: registerView,
  displayRegister: [displayRegister],
};
