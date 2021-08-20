MESSAGE="$@"

yarn lint --fix
yarn bundle

git add -A
git tag -f v1
git commit -m "$MESSAGE"

git push --force --tags
git push