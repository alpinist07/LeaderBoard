// firebase-config.js

// TODO: 본인의 Firebase 프로젝트 설정 값으로 교체해주세요.
const firebaseConfig = {
  apiKey: "AIzaSyD2fK3K2WVAHuNe3UOqBRcPGKbMVnZf5rs",
  authDomain: "leaderboard-5b191.firebaseapp.com",
  projectId: "leaderboard-5b191",
  storageBucket: "leaderboard-5b191.firebasestorage.app",
  messagingSenderId: "1094707930803",
  appId: "1:1094707930803:web:cdf155ff4968fb36bff2c6",
  measurementId: "G-LBCVHG9K45"
};

// Firebase 앱 초기화
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore(); // Firestore 데이터베이스 인스턴스