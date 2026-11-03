#!/usr/bin/env bash
# Nightly encrypted backup (A22).
#
#   GPG_RECIPIENT=zidan@example.com scripts/backup.sh
#   GPG_RECIPIENT=... RCLONE_REMOTE=gdrive:zidan-backup scripts/backup.sh
#
# What it does, in order: dumps the database, proves the dump is readable, encrypts it to the
# client's public key, fingerprints the encrypted file, copies it to Drive when a remote is
# configured, then deletes local copies past the retention window.
#
# The plaintext dump never touches the backup directory. It lives in a private temp dir that the
# trap removes on every exit path, success or failure, so a crash cannot leave a readable copy of
# the client's KTP data on disk.
#
# Key custody (A22): this machine holds the PUBLIC key only. Encryption is therefore asymmetric —
# a passphrase in an env var would be a second secret to leak, and a secret we hold is exactly
# what the ruling forbids. There is no decrypt path in this script: restore is run by the client
# with the private key they hold.
#
# Environment:
#   DATABASE_URL      required, the database to dump
#   GPG_RECIPIENT     required, key id or address of the client's public key
#   BACKUP_DIR        default ./var/backups
#   RETENTION_DAYS    default 30 (A22)
#   RCLONE_REMOTE     optional, e.g. gdrive:zidan-backup. Absent: the Drive leg is skipped and
#                     said so — A22 records that leg as consent-dependent, not demonstrated.
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is not set}"
: "${GPG_RECIPIENT:?GPG_RECIPIENT is not set — the client public key; there is no default}"

BACKUP_DIR=${BACKUP_DIR:-var/backups}
RETENTION_DAYS=${RETENTION_DAYS:-30}
RCLONE_REMOTE=${RCLONE_REMOTE:-}
STAMP=$(date -u +%Y%m%dT%H%M%SZ)

command -v pg_dump >/dev/null || { echo "pg_dump not found on PATH" >&2; exit 1; }
command -v gpg >/dev/null || { echo "gpg not found on PATH" >&2; exit 1; }

# The key must already be in this machine's keyring. Importing on the fly would mean carrying the
# key file around, which is the practice A22 replaced.
gpg --batch --list-keys "$GPG_RECIPIENT" >/dev/null 2>&1 || {
  echo "Public key for '$GPG_RECIPIENT' is not in the keyring; import it first." >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"
WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

DUMP="$WORK/backup.dump"
TARGET="$BACKUP_DIR/biro-jasa-$STAMP.dump.gpg"

# Prisma URLs carry ?schema=public, which libpq rejects as an unknown parameter. Drop that key
# only: sslmode and the rest are transport settings pg_dump does understand.
DUMP_URL=$(printf '%s' "$DATABASE_URL" | sed -E 's/([?&])schema=[^&]*&?/\1/; s/[?&]+$//')

echo "Dumping…"
pg_dump --format=custom --no-owner --no-privileges --file="$DUMP" "$DUMP_URL"

# A dump that cannot be listed cannot be restored. Check before spending an encryption on it.
pg_restore --list "$DUMP" >/dev/null || { echo "Dump failed its integrity check; nothing written." >&2; exit 1; }

echo "Encrypting…"
gpg --batch --yes --trust-model always --output "$TARGET" --encrypt --recipient "$GPG_RECIPIENT" "$DUMP"

# The fingerprint travels next to the ciphertext in `sha256sum` format, so a restore is one
# command: cd to the folder, `sha256sum -c <file>.sha256`. It proves the copy is the one we wrote.
( cd "$BACKUP_DIR" && sha256sum "$(basename "$TARGET")" > "$(basename "$TARGET").sha256" )

SIZE=$(du -h "$TARGET" | cut -f1)
echo "Wrote $TARGET ($SIZE)"

if [ -n "$RCLONE_REMOTE" ] && command -v rclone >/dev/null; then
  echo "Copying to $RCLONE_REMOTE…"
  rclone copy "$TARGET" "$RCLONE_REMOTE" --include "$(basename "$TARGET")"
  rclone copy "$TARGET.sha256" "$RCLONE_REMOTE" --include "$(basename "$TARGET").sha256"
  rclone delete "$RCLONE_REMOTE" --min-age "${RETENTION_DAYS}d" --include "*.dump.gpg*"
  echo "Copied. Remote copies older than ${RETENTION_DAYS} days deleted."
else
  # Never silently claim the off-box leg happened.
  echo "Drive copy skipped: RCLONE_REMOTE unset or rclone missing (A22: consent-dependent)."
fi

# Local copies are a cache, not the backup. 30 days, same window as Drive (A22).
find "$BACKUP_DIR" -maxdepth 1 -name 'biro-jasa-*.dump.gpg*' -mtime "+$RETENTION_DAYS" -delete
echo "Local copies older than ${RETENTION_DAYS} days removed."
