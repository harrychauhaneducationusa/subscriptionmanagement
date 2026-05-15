#!/usr/bin/env bash
# Automates every Google Cloud step that gcloud can do for local "Sign in with Google".
#
# LIMITATION (Google product design, not this repo):
# The OAuth 2.0 Client ID used by passport-google-oauth20 (ID ending in
# .apps.googleusercontent.com, created under APIs & Services → Credentials) is NOT
# creatable via stable public gcloud commands. `gcloud iam oauth-clients` targets
# IAM / workforce-style OAuth clients, not the same credential type.
#
# After this script runs, you must still create the Web client in the Console (the
# script opens that page on macOS) and paste GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
# into .env, then set ENABLE_GOOGLE_OAUTH=true and VITE_ENABLE_GOOGLE_OAUTH=true.
#
# Usage:
#   ./scripts/setup-google-oauth-gcloud.sh
#   GOOGLE_CLOUD_PROJECT=my-project ./scripts/setup-google-oauth-gcloud.sh
#   PORT=4000 ./scripts/setup-google-oauth-gcloud.sh   # redirect URI uses this port

set -euo pipefail

PROJECT_ID="${GOOGLE_CLOUD_PROJECT:-subscriptionmanagement-496401}"
PORT="${PORT:-4000}"
REDIRECT_URI="${GOOGLE_CALLBACK_URL:-http://localhost:${PORT}/v1/auth/google/callback}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

echo "==> gcloud project: ${PROJECT_ID}"
gcloud config set project "${PROJECT_ID}"

echo "==> Enabling APIs commonly used with Google Sign-In (ignore errors if already enabled or restricted)"
for api in people.googleapis.com; do
  if gcloud services enable "${api}" --project="${PROJECT_ID}" 2>/dev/null; then
    echo "    enabled ${api}"
  else
    echo "    skip/fail ${api} (may already be on or lack permission)"
  fi
done

CREDS_URL="https://console.cloud.google.com/apis/credentials?project=${PROJECT_ID}"
CONSENT_URL="https://console.cloud.google.com/apis/credentials/consent?project=${PROJECT_ID}"

echo ""
echo "==> Manual step (Console only): OAuth consent screen + OAuth client ID (Web)"
echo "    Consent:  ${CONSENT_URL}"
echo "    Clients:  ${CREDS_URL}"
echo "    Add Authorized redirect URI exactly:"
echo "      ${REDIRECT_URI}"
echo ""

if [[ "$(uname -s)" == "Darwin" ]] && command -v open >/dev/null 2>&1; then
  echo "==> Opening Credentials page in your browser"
  open "${CREDS_URL}"
elif command -v xdg-open >/dev/null 2>&1; then
  echo "==> Opening Credentials page in your browser"
  xdg-open "${CREDS_URL}" >/dev/null 2>&1 || true
fi

if [[ -f "${ENV_FILE}" ]]; then
  echo "==> Ensuring .env has Google placeholders (will not overwrite non-empty values)"
  # GOOGLE_CALLBACK_URL
  if grep -q '^GOOGLE_CALLBACK_URL=' "${ENV_FILE}"; then
    sed -i.bak "s|^GOOGLE_CALLBACK_URL=.*|GOOGLE_CALLBACK_URL=${REDIRECT_URI}|" "${ENV_FILE}" && rm -f "${ENV_FILE}.bak"
  else
    printf '\nGOOGLE_CALLBACK_URL=%s\n' "${REDIRECT_URI}" >>"${ENV_FILE}"
  fi
else
  echo "    (no ${ENV_FILE}; create it from .env.example first)"
fi

echo ""
echo "Done. After you create the Web client, set in .env:"
echo "  ENABLE_GOOGLE_OAUTH=true"
echo "  GOOGLE_CLIENT_ID=....apps.googleusercontent.com"
echo "  GOOGLE_CLIENT_SECRET=..."
echo "  VITE_ENABLE_GOOGLE_OAUTH=true"
