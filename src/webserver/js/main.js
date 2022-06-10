'use strict';

/* eslint-disable */


function generateRandomString() {
  let randomString = '';
  const randomNumber = Math.floor(Math.random() * 10);
  for (let i = 0; i < 20 + randomNumber; i++) {
    randomString += String.fromCharCode(33 + Math.floor(Math.random() * 94));
  }
  return randomString;
}
window.onload = function () {
  if (location.href.indexOf("code") > -1) { // Detect if you logged in or not

    const code = location.href.substring(location.href.indexOf("code") + 5, location.href.indexOf("state") - 1); // Get the code OAUTH gives you
    const state = location.href.substring(location.href.indexOf("state") + 6, location.href.length); // Get the code OAUTH gives you

    if (localStorage.getItem('oauth-state') !== atob(decodeURIComponent(state))) {
      document.getElementById('welcome_txt').innerText = 'State check failed, you may have been clickjacked!<br>Please report this to Moonbear!';
      return console.log('You may have been clickjacked!');
    }

    localStorage.setItem('oauth-token', code);

    const req = new XMLHttpRequest(); // Create a new XMLHttpRequest
    req.open("POST", "https://localhost:8080/user"); // Open the XMLHttpRequest; CHANGE THE PORT TO THE PORT YOU HAVE AS YOUR VARIABLE IN OAUTH.js.
    req.send(code); // Send the code in the request
    req.onload = () => { // Will run when the request is loaded
      if (req.status === 500) { // Error
          document.getElementById('title').innerText = `There was an error with that. Please try logging in again. Error Code: ${req.status}`;
      } else if (req.status === 200) { // Successful
          document.getElementById("title").innerText = `Welcome, ${req.responseText}!`
      } else { // Other
          document.getElementById('title').innerText = `An error occured. Please try logging in again. Error Code: ${req.status}`;
      }
    }
  }

  let randomString = generateRandomString();
  let stateValue = btoa(randomString)

  if (location.href.indexOf("code") === -1) {
    localStorage.setItem('oauth-state', randomString);
    document.getElementById('login-link').href += `&state=${stateValue}`;
  }
  console.log(localStorage.getItem('oauth-state'));
  console.log(btoa(randomString));
}



// collapsible text script
const coll = document.getElementsByClassName('collapsible');
let i;

for (i = 0; i < coll.length; i++) {
  coll[i].addEventListener('click', function () {
    this.classList.toggle('active');
    const content = this.nextElementSibling;
    if (content.style.display === 'block') {
      content.style.display = 'none';
    } else {
      content.style.display = 'block';
    }
  });
}
// commands search script
$(document).ready(() => {
  $('#myInput').on('keyup', function () {
    const value = $(this).val().toLowerCase();
    $('#myCmd button').filter(function () {
      $(this).toggle($(this).text().toLowerCase().indexOf(value) > -1);
    });
  });
});
