MESSAGE="$@"

yarn lint --fix
yarn bundle

git add -A
git commit -m "$MESSAGE"
git tag -f v1

git push --atomic origin main v1
