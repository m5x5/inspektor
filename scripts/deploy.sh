#!/bin/sh
set -xe

# Check out build branch
git checkout build-production
# Copy from build dir to root
cp -r dist/* .
# Add all files
git add --all
# Commit build files
git commit -m "Update build - `date -u`"
# Push to 5apps for deployment
git push 5apps build-production:master
# Push build branch to collab repo
git push origin build-production:build-production
# Go back to master branch
git checkout master
