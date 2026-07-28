import type { TemplateFn } from '../../types.js';

// Tier 2 decoy for a served login-shell rc file — `.bashrc`, `.bash_profile`,
// `.profile`, `.zshrc`, and the rest of the family. Scanners sweep these when
// a web root is misconfigured to sit inside a home directory (or when a
// traversal has landed them there): an rc file is where an operator exports
// the credentials they need at an interactive prompt — registry tokens, cloud
// keys, database passwords — because that is more convenient than a keyring
// (CWE-200 / CWE-798).
//
// Shaped as an ordinary Debian-flavoured `.bashrc`: the non-interactive early
// return, history options, the standard alias block, and the operator's own
// additions at the bottom. That tail is the part a scanner greps. All
// exported secrets are the non-actionable placeholder; hosts are `.invalid`
// and the account name is invented. Fully static; never reflects the request.

const body = `# ~/.bashrc: executed by bash(1) for non-login shells.

# If not running interactively, don't do anything.
case $- in
    *i*) ;;
      *) return;;
esac

HISTCONTROL=ignoreboth
HISTSIZE=10000
HISTFILESIZE=20000
shopt -s histappend
shopt -s checkwinsize

[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

if [ -n "$force_color_prompt" ]; then
    PS1='\\[\\033[01;32m\\]\\u@\\h\\[\\033[00m\\]:\\[\\033[01;34m\\]\\w\\[\\033[00m\\]\\$ '
else
    PS1='\\u@\\h:\\w\\$ '
fi

alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'
alias grep='grep --color=auto'

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi

# ---------------------------------------------------------------------------
# deploy user additions
# ---------------------------------------------------------------------------

export EDITOR=vim
export PATH="$HOME/.local/bin:$HOME/bin:$PATH"

export APP_ROOT=/srv/www/app
export APP_ENV=production

export DB_HOST=db.internal.invalid
export DB_NAME=app_production
export DB_USER=app_user
export PGPASSWORD=REDACTED_FOR_HONEYPOT
export MYSQL_PWD=REDACTED_FOR_HONEYPOT

export AWS_ACCESS_KEY_ID=EXAMPLE_AKIA1234567890ABCDEF
export AWS_SECRET_ACCESS_KEY=REDACTED_FOR_HONEYPOT
export AWS_DEFAULT_REGION=us-east-1

export DOCKER_REGISTRY=registry.internal.invalid
export REGISTRY_USER=ci-publisher
export REGISTRY_PASSWORD=REDACTED_FOR_HONEYPOT
export NPM_TOKEN=REDACTED_FOR_HONEYPOT

alias dbprod='psql -h $DB_HOST -U $DB_USER -d $DB_NAME'
alias applogs='sudo journalctl -u app -f'
alias deploy='cd $APP_ROOT && ./deploy.sh'
alias sshapp='ssh -i ~/.ssh/id_ed25519_deploy deploy@app-01.internal.invalid'
`;

export const fakeShellRc: TemplateFn = () => {
  return new Response(body, {
    status: 200,
    headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
  });
};
