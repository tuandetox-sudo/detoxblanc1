/**
 * firebase-config.js — Firebase project config + SDK init.
 *
 * Auto-detect mode:
 *   - Khi load trên *.web.app / *.firebaseapp.com / *.run.app → enable Firebase
 *   - Khi load local (file://, localhost) → skip, dùng localStorage
 *
 * Project: detoxblanc-demo-55472
 *
 * Module: ESM CDN (Firebase v10+) — không cần bundler.
 */

(async function (global) {
  'use strict';

  const PROJECT_CONFIG = {
    apiKey: 'AIzaSyDKiqOPET7cFRAtcX2A_HEItWw_Gi4b9Ck',
    authDomain: 'detoxblanc-demo-55472.firebaseapp.com',
    projectId: 'detoxblanc-demo-55472',
    storageBucket: 'detoxblanc-demo-55472.firebasestorage.app',
    messagingSenderId: '874496431974',
    appId: '1:874496431974:web:a236ab36d19e97e162daa7',
  };

  function shouldEnable() {
    const host = location.hostname;
    if (location.protocol === 'file:') return false;
    if (host === 'localhost' || host === '127.0.0.1') return false;
    if (host.startsWith('192.168.') || host.startsWith('10.')) return false;
    return /\.web\.app$|\.firebaseapp\.com$|\.run\.app$|detoxblanc/i.test(host);
  }

  if (!shouldEnable()) {
    global.DTX_FIREBASE = { enabled: false };
    return;
  }

  try {
    // Auto-fetch Firebase config qua __/firebase/init.json (Firebase Hosting tự serve)
    let cfg = null;
    try {
      const r = await fetch('/__/firebase/init.json');
      if (r.ok) cfg = await r.json();
    } catch (_) {}
    cfg = cfg || PROJECT_CONFIG;

    // Load Firebase ESM modules từ CDN (cùng version để khỏi mismatch)
    const VER = '10.13.2';
    const [{ initializeApp }, fbAuth, fbFirestore] = await Promise.all([
      import(`https://www.gstatic.com/firebasejs/${VER}/firebase-app.js`),
      import(`https://www.gstatic.com/firebasejs/${VER}/firebase-auth.js`),
      import(`https://www.gstatic.com/firebasejs/${VER}/firebase-firestore.js`),
    ]);

    const app = initializeApp(cfg);
    const auth = fbAuth.getAuth(app);
    const db = fbFirestore.getFirestore(app);

    global.DTX_FIREBASE = {
      enabled: true,
      app, auth, db,
      // Re-export tất cả method cần dùng để bridge.js không cần import lại
      authMethods: {
        signInWithEmailAndPassword: fbAuth.signInWithEmailAndPassword,
        createUserWithEmailAndPassword: fbAuth.createUserWithEmailAndPassword,
        signOut: fbAuth.signOut,
        onAuthStateChanged: fbAuth.onAuthStateChanged,
        sendPasswordResetEmail: fbAuth.sendPasswordResetEmail,
        updateProfile: fbAuth.updateProfile,
      },
      dbMethods: {
        collection: fbFirestore.collection,
        doc: fbFirestore.doc,
        getDocs: fbFirestore.getDocs,
        getDoc: fbFirestore.getDoc,
        addDoc: fbFirestore.addDoc,
        setDoc: fbFirestore.setDoc,
        updateDoc: fbFirestore.updateDoc,
        deleteDoc: fbFirestore.deleteDoc,
        onSnapshot: fbFirestore.onSnapshot,
        query: fbFirestore.query,
        where: fbFirestore.where,
        orderBy: fbFirestore.orderBy,
        limit: fbFirestore.limit,
        serverTimestamp: fbFirestore.serverTimestamp,
        writeBatch: fbFirestore.writeBatch,
        runTransaction: fbFirestore.runTransaction,
        increment: fbFirestore.increment,
      },
    };

    // Báo cho code khác biết Firebase ready
    global.dispatchEvent(new CustomEvent('dtx:firebase-ready', { detail: global.DTX_FIREBASE }));
    console.info('[DTX] Firebase enabled — project:', cfg.projectId);
  } catch (e) {
    console.error('[DTX] Firebase init failed:', e);
    global.DTX_FIREBASE = { enabled: false, error: e.message };
  }
})(window);
