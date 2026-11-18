# UAT appeal authentication

The website and TripBot must use the same existing Keycloak public client for
appeals. The client's allowed redirect URI must include the UAT website's
`https://<uat-host>/appeal` address. The website sends an S256 PKCE challenge;
TripBot requires the original verifier when exchanging the authorization code.

## Deployment settings

The website's Drone repository needs `NEXT_PUBLIC_KEYCLOAK_URL` and
`NEXT_PUBLIC_KEYCLOAK_CLIENT_ID`. These public settings are compiled into the
browser bundle during the Docker build.

TripBot's Drone repository needs `KEYCLOAK_URL` and
`KEYCLOAK_BAN_APPEALS_CLIENT_ID`. The URL is the public identity provider origin,
and the client ID must match the website's public client ID. A public client does
not use a client secret for the authorization-code exchange.

The UAT runner mounts its host-managed compose file as
`docker-compose.host.yml`. Its `tripbot` service must pass these settings into
the running container, together with the website host used for the callback:

```yaml
environment:
  DNS_DOMAIN: ${DNS_DOMAIN}
  KEYCLOAK_URL: ${KEYCLOAK_URL}
  KEYCLOAK_BAN_APPEALS_CLIENT_ID: ${KEYCLOAK_BAN_APPEALS_CLIENT_ID}
```

`DNS_DOMAIN` must be the UAT website host, without a scheme or path. TripBot
constructs the callback as `https://${DNS_DOMAIN}/appeal`. Supplying a Drone
variable alone is insufficient if the host compose file omits the matching
environment entry.

Do not copy local environment files into images to supply these values. Keep
Drone secrets unavailable to pull requests, and retain the existing rate limits
on the token endpoint. Deploy the API and website PKCE changes together after
both PRs pass validation; restart any login attempt begun before the rollout.

## Verification

Check the actual compiled browser configuration and the container's public
configuration, rather than only checking that a container started. A fresh login
must send `state`, `code_challenge`, and `code_challenge_method=S256`, return to
the same website origin, and exchange its code with `code_verifier`. Neither the
verifier nor tokens should appear in logs or the authorization URL. Missing or
malformed verifier input must return HTTP 400 before contacting Keycloak.
