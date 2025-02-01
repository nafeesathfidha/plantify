import { auth, db, storage } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut,
  signInWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  deleteDoc,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";

// Check if user is logged in
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html"; // Redirect to login page
  }
});

// Logout functionality
document.getElementById("logout-btn")?.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      window.location.href = "login.html"; // Redirect to login page
    })
    .catch((error) => {
      console.error("Logout error:", error);
    });
});

// Login functionality
const loginForm = document.getElementById("login-form");
const errorMessage = document.getElementById("error-message");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "admin.html"; // Redirect to admin dashboard
    } catch (error) {
      errorMessage.textContent = "Invalid email or password.";
    }
  });
}

// Add new plant
const addPlantForm = document.getElementById("add-plant-form");
if (addPlantForm) {
  addPlantForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const plantName = document.getElementById("plant-name").value;
    const plantPrice = document.getElementById("plant-price").value;
    const plantImage = document.getElementById("plant-image").files[0];

    try {
      // Upload image to Firebase Storage
      const storageRef = ref(storage, `plant-images/${plantImage.name}`);
      await uploadBytes(storageRef, plantImage);
      const imageUrl = await getDownloadURL(storageRef);

      // Add plant data to Firestore
      await addDoc(collection(db, "plants"), {
        name: plantName,
        price: parseFloat(plantPrice),
        image: imageUrl,
      });

      alert("Plant added successfully!");
      addPlantForm.reset();
      loadPlants(); // Reload plants table
    } catch (error) {
      console.error("Error adding plant:", error);
      alert("Failed to add plant.");
    }
  });
}

// Load plants from Firestore
async function loadPlants() {
  const plantsTableBody = document.querySelector("#plants-table tbody");
  if (!plantsTableBody) return;

  plantsTableBody.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "plants"));
    querySnapshot.forEach((docSnap) => {
      const plant = docSnap.data();
      const row = `
        <tr>
          <td>${plant.name}</td>
          <td>$${plant.price.toFixed(2)}</td>
          <td><img src="${plant.image}" alt="${plant.name}" width="50"></td>
          <td>
            <button onclick="deletePlant('${docSnap.id}')">Delete</button>
          </td>
        </tr>
      `;
      plantsTableBody.innerHTML += row;
    });
  } catch (error) {
    console.error("Error loading plants:", error);
  }
}

// Delete plant
window.deletePlant = async (id) => {
  try {
    await deleteDoc(doc(db, "plants", id));
    alert("Plant deleted successfully!");
    loadPlants(); // Reload plants table
  } catch (error) {
    console.error("Error deleting plant:", error);
    alert("Failed to delete plant.");
  }
};

// Load plants on page load
loadPlants();