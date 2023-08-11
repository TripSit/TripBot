#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 -U "${POSTGRES_USER}" <<-EOSQL
  CREATE USER change WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO change;
  CREATE USER moonbear WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO moonbear;
  CREATE USER tripbot_discord WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO tripbot_discord;
  CREATE USER tripbot_readonly WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO tripbot_readonly;
  CREATE USER tripsit_api WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO tripsit_api;
  CREATE USER uptime WITH PASSWORD 'P@ssw0rd';
  GRANT ALL PRIVILEGES ON DATABASE tripsit TO uptime;
EOSQL
