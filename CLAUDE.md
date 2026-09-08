# Workflow

Before running `./deploy.sh` (which commits and pushes to the live site),
start `./serve.sh` and have the user try the change locally first. Only run
`./deploy.sh` after they confirm it looks right — don't push straight to
production.

Some features are hidden on the live site but stay visible in local preview
(currently: the Travel Blog). See the README's "Hiding a work-in-progress
feature" section before assuming something is missing rather than hidden.
