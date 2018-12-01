#!/bin/bash

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",]//g')

echo "Update appconfig.js version from package.json to $PACKAGE_VERSION ..."
sed -i '' "s/version\ =\ .*$/version\ =\ '$PACKAGE_VERSION';/g" ./src/appconfig.js

