'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
/* eslint-disable no-useless-constructor */

class Footer extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
    <footer class="mastfoot mb-auto footer">
      <div class="container-fluid mb-auto">
        <div class="row d-flex justify-content-center">
          <div class="">
            <p style="font-size: 19px; padding: 0px; margin: 0px;">Made with 💖 by <a href="https://tripsit.me"
            style="text-decoration: none; color: white;">TripSit.Me</a> © 2022. All
              rights reserved.</br></p>
          </div>
        </div>
      </div>
    </footer>
    `;
  }
}

customElements.define('footer-component', Footer);
