

// Your web app's Firebase configuration
var firebaseConfig = {
apiKey: "AIzaSyAufRARlCO5PPx8XjyojbxkpYJLvN3QDiI",
authDomain: "signupdata-mp1.firebaseapp.com",
databaseURL: "https://signupdata-mp1.firebaseio.com",
projectId: "signupdata-mp1",
storageBucket: "signupdata-mp1.appspot.com",
messagingSenderId: "796907770826",
appId: "1:796907770826:web:37d372ed1b027c6290b533",
measurementId: "G-5RHYSJ5E5H"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
function signUp(){
    var email = document.getElementById("email")
    var password = document.getElementById("password")

    const promise = auth.createUserWithEmailAndPassword(email.value,password.value)    
    alert("Signed Up")
}
