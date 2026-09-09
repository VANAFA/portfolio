# Workflow

Before running `./deploy.sh` (which commits and pushes to the live site),
start `./serve.sh` and have the user try the change locally first. Only run
`./deploy.sh` after they confirm it looks right — don't push straight to
production.

Some features can be hidden on the live site while staying visible in local
preview (none currently - the Travel Blog was the one example, now shipped).
See the README's "Hiding a work-in-progress feature" section before assuming
something is missing rather than hidden, and to hide a future WIP feature.
