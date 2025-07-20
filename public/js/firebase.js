import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

let app, auth, db;

export const initFirebase = async () => {
    const response = await fetch('/__/firebase/init.json');
    const firebaseConfig = await response.json();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
};

export { app, auth, db };