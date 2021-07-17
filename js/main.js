'use strict';

// Initialize Firebase
firebase.initializeApp(firebaseConfig);


const db = firebase.firestore();
const auth = firebase.auth();
let me = null;

const collection = db.collection('message');

const message = document.getElementById('message');
const form = document.querySelector('form');
const messages = document.getElementById('messages');
const login = document.getElementById('login');
const logout = document.getElementById('logout');

login.addEventListener('click', () => {
  auth.signInAnonymously();
});
logout.addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged(user => {
  if (user) {
    me = user;

    while (messages.firstChild) {
      messages.removeChild(messages.firstChild);
    }
    collection.orderBy('created').onSnapshot(snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const li = document.createElement('li');
          const d = change.doc.data();
          li.textContent = d.uid.substr(0, 3) + ':' + d.message + '　';
          const updateBtn = document.createElement('button');
          updateBtn.setAttribute('onclick', 'edit(this)');
          updateBtn.setAttribute('type', 'button');
          updateBtn.id = change.doc.id;
          updateBtn.textContent = '編集';
          li.appendChild(updateBtn);
          const deleteBtn = document.createElement('button');
          deleteBtn.setAttribute('onclick', 'del(this)');
          deleteBtn.setAttribute('type', 'button');
          deleteBtn.textContent = '削除';
          deleteBtn.id = change.doc.id;
          li.appendChild(deleteBtn);
          messages.appendChild(li);
        }
      });
    });
    console.log(`Logged in as: ${user.uid}`)
    login.classList.add('hidden');
    [logout, form, messages].forEach(el => {
      el.classList.remove('hidden');
    });
    message.focus();
    return;
  }
  login.classList.remove('hidden');
  [logout, form, messages].forEach(el => {
    el.classList.add('hidden');
  });
  me = null;
  console.log('Nobody in logged in');
});


form.addEventListener('submit', e => {
  e.preventDefault();

  const val = message.value.trim();
  if (val === '') {
    return;
  }

  collection.add({
    message: val,
    created: firebase.firestore.FieldValue.serverTimestamp(),
    uid: me ? me.uid : 'nobody'
  })
    .then(doc => {
      console.log(`${doc.id} added!`);
      message.value = '';
      message.focus();
    })
    .catch(error => {
      console.log(error);
    })

});

function edit(el) {
  const id = el.id;
  const li = document.getElementById(id).parentElement;
  li.innerText = '';
  const input = document.createElement('input');
  input.type = "text";
  input.id = id;
  collection.doc(id).get()
    .then(doc => {
      input.value = doc.data().message;
      input.focus();
    })
  li.appendChild(input);

  document.getElementById(id).addEventListener('change', function(e) {
    const id = e.target.id;
    const value = e.target.value;
    const messRef = collection.doc(id);
    messRef.update({
      message: value
    });
    const li = document.getElementById(id).parentElement;
    li.removeChild(li.firstElementChild);
    li.textContent = id.substr(0, 3) + ':' + value + '　';
    const updateBtn = document.createElement('button');
    updateBtn.setAttribute('onclick', 'edit(this)');
    updateBtn.setAttribute('type', 'button');
    updateBtn.id = id;
    updateBtn.textContent = '編集';
    li.appendChild(updateBtn);
    const deleteBtn = document.createElement('button');
    deleteBtn.setAttribute('onclick', 'del(this)');
    deleteBtn.setAttribute('type', 'button');
    deleteBtn.textContent = '削除';
    deleteBtn.id = id;
    li.appendChild(deleteBtn);
  });
}

function del(el) {
  if (!confirm('削除しますか？')) {
    return;
  }
  const id = el.id;
  const li = document.getElementById(id).parentElement;
  li.remove();
  collection.doc(id).delete();
}
