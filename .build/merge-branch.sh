#!/bin/bash

merge_and_push() {
    local branch=$1

    git checkout "$branch"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to checkout branch '$branch'."
        exit 1
    fi
    git merge develop --no-edit
    if [ $? -ne 0 ]; then
        echo "Error: Failed to merge 'develop' into branch '$branch'."
        exit 1
    fi
    git push origin "$branch"
    if [ $? -ne 0 ]; then
        echo "Error: Failed to push branch '$branch' to origin."
        exit 1
    fi
    echo "Merged 'develop' into branch '$branch' and pushed to origin."
}

# set up git user
git config user.name "Update branch"
git config user.email "github-actions@github.com"

git fetch origin

# Check if "develop" branch exists
git rev-parse --verify develop >/dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "Error: 'develop' branch does not exist."
    exit 1
fi

# Check if input is provided
if [ -z "$1" ]; then
    echo "Missing required inputs. Aborting operation."
    echo "Usage: $0 <comma-separated-branches>"
    exit 1
fi

# Split the input string by commas
IFS=',' read -r -a branches <<< "$1"

# Merge "develop" into each branch and push to origin
for branch in "${branches[@]}"; do
    # Skip branches named "main", containing "release" in their name, or the "develop" branch itself
    if [[ "$branch" == "main" || "$branch" == *release* || "$branch" == "develop" ]]; then
        echo "Skipping branch '$branch'."
        continue
    fi

    merge_and_push "$branch"
done

echo "All branches merged and pushed successfully."
