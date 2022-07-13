'use strict';

/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
/* eslint-disable no-console */
/* eslint-disable no-useless-constructor */

class Header extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    this.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container-fluid container">
      <a class="navbar-brand" href="/">
        <img src="../assets/bot.png" alt="" width="50" height="50" class="rounded-circle">
        &nbsp;
        <span>
          TripSit Discord
        </span>
      </a>
      <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
      </button>
      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
          <li class="nav-item">
            <a class="nav-link" href="../pages/home.html">
              Home
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="../pages/commands.html">
              Commands
            </a>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="linksdrop" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Documents
            </a>
            <ul class="dropdown-menu bgn" aria-labelledby="linksdrop">
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/welcome.html">
                  Welcome Info
                </a>
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/tripsit.html">
                  TripSit Process
                </a>
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/helpers.html">
                  Helper Process
                </a>
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/moderation.html">
                  Moderation Info
                </a>
              </li>
                <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/developer.html">
                  Developer Info
                </a>
              </li>
              </li>
              <li>
              <a class="dropdown-item text-muted font-weight-bold" href="../pages/discord.html">
                Discord Info
              </a>
            </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="../pages/faq.html">
                  FAQ
                </a>
              </li>
            </ul>
          </li>
          <li class="nav-item dropdown">
            <a class="nav-link dropdown-toggle" href="#" id="linksdrop" role="button" data-bs-toggle="dropdown" aria-expanded="false">
              Links
            </a>
            <ul class="dropdown-menu bgn" aria-labelledby="linksdrop">
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="https://tripsit.me" target="_blank">
                  TripSit.Me
                </a>
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="https://discord.com/api/oauth2/authorize?client_id=957780726806380545&permissions=2147502080&scope=applications.commands%20bot" target="_blank">
                  Invite Bot
                </a>
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="https://discord.gg/nd3Z88MZkh" target="_blank">
                  Support Server
                </a>
              </li>
              <li>
                <hr class="dropdown-divider">
              </li>
              <li>
                <a class="dropdown-item text-muted font-weight-bold" href="https://github.com/tripsit/tripsit-discord-bot" target="_blank">
                  Official Github
                </a>
              </li>
            </ul>
          </li>
        </ul>
        <div class="d-flex ml-auto" id="headerlogin">
          <li class="nav-item" style="list-style: none;">
            <a id='login-link' class="nav-link btn btn-outline-secondary login" href={{ discordOauthUrl }}>Login</a>
          </li>
        </div>
      </div>
    </div>
  </nav>
  </div>
    `;
  }
}

customElements.define('header-component', Header);
