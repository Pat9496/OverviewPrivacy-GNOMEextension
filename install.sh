#!/usr/bin/env bash
set -euo pipefail

readonly UUID="overview-privacy@pat9496"
readonly REPO_DIR="$(dirname "$(readlink -f "$0")")"
readonly EXT_PARENT_DIR="${HOME}/.local/share/gnome-shell/extensions"
readonly TARGET_DIR="${EXT_PARENT_DIR}/${UUID}"

pkg_manager=""
if command -v rpm-ostree >/dev/null 2>&1; then
    pkg_manager="rpm-ostree"
elif command -v dnf >/dev/null 2>&1; then
    pkg_manager="dnf"
elif command -v apt-get >/dev/null 2>&1; then
    pkg_manager="apt-get"
elif command -v pacman >/dev/null 2>&1; then
    pkg_manager="pacman"
elif command -v zypper >/dev/null 2>&1; then
    pkg_manager="zypper"
fi

for cmd in glib-compile-schemas gnome-extensions; do
    if command -v "${cmd}" >/dev/null 2>&1; then
        continue
    fi

    pkg=""
    case "${cmd}" in
        glib-compile-schemas)
            case "${pkg_manager}" in
                rpm-ostree|dnf|pacman) pkg="glib2" ;;
                apt-get) pkg="libglib2.0-bin" ;;
                zypper) pkg="glib2-tools" ;;
            esac
            ;;
        gnome-extensions)
            case "${pkg_manager}" in
                rpm-ostree|dnf|apt-get|pacman|zypper) pkg="gnome-shell" ;;
            esac
            ;;
    esac

    if [[ -z "${pkg_manager}" || -z "${pkg}" ]]; then
        printf 'error: required command not found: %s\n' "${cmd}" >&2
        exit 1
    fi

    install_cmd=()
    case "${pkg_manager}" in
        rpm-ostree) install_cmd=(sudo rpm-ostree install -y "${pkg}") ;;
        dnf) install_cmd=(sudo dnf install -y "${pkg}") ;;
        apt-get) install_cmd=(sudo apt-get install -y "${pkg}") ;;
        pacman) install_cmd=(sudo pacman -S --noconfirm "${pkg}") ;;
        zypper) install_cmd=(sudo zypper install -y "${pkg}") ;;
    esac

    printf 'Missing required command: %s (provided by package %s)\n' "${cmd}" "${pkg}" >&2
    printf 'This will be fixed by running: %s\n' "${install_cmd[*]}" >&2

    if [[ "${pkg_manager}" == "rpm-ostree" ]]; then
        printf 'warning: rpm-ostree install changes the immutable base OS image.\n' >&2
        printf 'warning: THIS REQUIRES A REBOOT before %s is available; the current session cannot use it no matter what.\n' "${pkg}" >&2
    fi

    reply=""
    printf 'Proceed with this install command? [y/N] ' >&2
    if ! read -r reply < /dev/tty; then
        reply=""
    fi
    case "${reply}" in
        [yY]|[yY][eE][sS]) ;;
        *)
            printf 'error: installation declined; install %s manually before re-running this script.\n' "${pkg}" >&2
            exit 1
            ;;
    esac

    if ! install_output="$("${install_cmd[@]}" 2>&1)"; then
        printf 'error: %s failed:\n%s\n' "${install_cmd[*]}" "${install_output}" >&2
        exit 1
    fi
    if [[ -n "${install_output}" ]]; then
        printf '%s\n' "${install_output}"
    fi

    if [[ "${pkg_manager}" == "rpm-ostree" ]]; then
        printf 'warning: THIS REQUIRES A REBOOT before %s is available; the current session cannot use it no matter what.\n' "${pkg}" >&2
        exit 0
    fi
done

printf 'Compiling GSettings schema...\n'
glib-compile-schemas "${REPO_DIR}/schemas/"

mkdir -p "${EXT_PARENT_DIR}"

if [[ -L "${TARGET_DIR}" ]]; then
    existing_link_target="$(readlink -f "${TARGET_DIR}")"
    if [[ "${existing_link_target}" == "${REPO_DIR}" ]]; then
        printf '%s already symlinked to %s, leaving as-is.\n' "${TARGET_DIR}" "${REPO_DIR}"
    else
        # Refuse to touch: could be a symlink to an unrelated install the user relies on.
        printf 'error: %s is already a symlink pointing at %s, not %s.\n' \
            "${TARGET_DIR}" "${existing_link_target}" "${REPO_DIR}" >&2
        printf 'Remove or repoint it manually if this is stale, then re-run.\n' >&2
        exit 1
    fi
elif [[ -e "${TARGET_DIR}" ]]; then
    # Refuse to touch: could be real user data (a copy install), never rm -rf blindly.
    printf 'error: %s already exists and is not a symlink to this repo.\n' "${TARGET_DIR}" >&2
    printf 'Remove or move it manually if it should be replaced, then re-run.\n' >&2
    exit 1
else
    ln -s "${REPO_DIR}" "${TARGET_DIR}"
    printf 'Symlinked %s -> %s\n' "${TARGET_DIR}" "${REPO_DIR}"
fi

printf 'Enabling extension %s...\n' "${UUID}"
if ! enable_output="$(gnome-extensions enable "${UUID}" 2>&1)"; then
    printf 'error: gnome-extensions enable %s failed:\n%s\n' "${UUID}" "${enable_output}" >&2

    session_type="${XDG_SESSION_TYPE:-}"
    if [[ -z "${session_type}" ]] && command -v loginctl >/dev/null 2>&1 && [[ -n "${XDG_SESSION_ID:-}" ]]; then
        session_type="$(loginctl show-session "${XDG_SESSION_ID}" -p Type --value 2>/dev/null || true)"
    fi

    printf '\n' >&2
    printf 'This is expected and common if GNOME Shell was already running before this\n' >&2
    printf 'install: Shell only scans its extensions directory at session start, so it\n' >&2
    printf 'cannot see a brand-new extension UUID until a new session begins.\n' >&2

    case "${session_type}" in
        wayland)
            printf 'Session type: Wayland. A full logout/login (or reboot) is required;\n' >&2
            printf 'there is no live "restart Shell" option on Wayland.\n' >&2
            ;;
        x11)
            printf 'Session type: X11. Press Alt+F2, type r, then Enter to restart the Shell\n' >&2
            printf 'without logging out. Logout/login also works.\n' >&2
            ;;
        *)
            printf 'Session type could not be determined. On Wayland, log out and back in\n' >&2
            printf '(or reboot); there is no live Shell restart. On X11, Alt+F2 then r restarts\n' >&2
            printf 'the Shell without logging out.\n' >&2
            ;;
    esac

    printf 'After logging back in, you do not need to re-run this script:\n' >&2
    printf '  gnome-extensions enable %s\n' "${UUID}" >&2
    printf 'or the Extensions app will work on its own. Re-running this script is\n' >&2
    printf 'harmless (it is idempotent) but not required.\n' >&2
    exit 1
fi
if [[ -n "${enable_output}" ]]; then
    printf '%s\n' "${enable_output}"
fi

cat <<EOF

Install steps complete.

GNOME Shell only loads a brand-new extension UUID at session (or nested-session)
start, so enabling it just now will not take effect in your current session yet.
This is a normal, one-time step required after every fresh install (or after
changing the UUID) -- it is unrelated to the blur-mode freeze risk below. To
test:

  - Nested session (X11 host required, no logout of your real session):
      dbus-run-session -- gnome-shell --nested --wayland
  - Wayland-only host (no nested-session option): log out and back in.
    A disable/enable cycle alone is not enough; GNOME Shell itself must restart.

Open the preferences UI with:
  gnome-extensions prefs ${UUID}

Warning: the first time you open the Activities overview with blur mode active
-- before GNOME Shell has gone through the session restart above -- Shell can
freeze or crash. If that happens, you must log out and log back in to recover;
disabling the extension alone will not fix a frozen session. Once that one
session restart has happened, blur mode (including changing the blur radius)
has been confirmed to work reliably with no further restarts needed. See
README.md's "Blur Mode: Shell Freeze Risk" section for details, and consider
Black or White mode as an alternative that never requires this.

Note: extension.js's getPreviewContentActor() relies on an undocumented
GNOME Shell internal actor name. This has been confirmed working on GNOME
Shell 50; if nothing visually changes in the overview on other supported
versions (45-49), see README.md's "Verify the Actor Name" section.
EOF
