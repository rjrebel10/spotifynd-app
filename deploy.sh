#!/bin/bash


USERNAME=ec2-user
DEPLOYMENT_TARGET=ec2-3-16-29-137.us-east-2.compute.amazonaws.com

# This file must be removed for deployment.
rm -rf src/appconfig.jse

npm run prebuild:dev
npm run build:prod

echo "packaging app into tarball..."

cd dist && tar -zcf exports.tar.gz ./*

mv exports.tar.gz ../export/

cd ../export/


echo "deleting existing files from server..."
ssh -i ~/.ssh/testdev.pem ${USERNAME}@${DEPLOYMENT_TARGET} "cd /usr/share/nginx/html && rm -rfv ./* ; "


echo "deploying app to host ${DEPLOYMENT_TARGET} ..."
scp -i ~/.ssh/testdev.pem exports.tar.gz ${USERNAME}@${DEPLOYMENT_TARGET}:/usr/share/nginx/html

if [ $? -ne 0 ]; then
   echo "Error - scp failure"
   exit $?
fi

echo "Untaring files on host..."
ssh -i ~/.ssh/testdev.pem ${USERNAME}@${DEPLOYMENT_TARGET} "cd /usr/share/nginx/html ; tar -zxf exports.tar.gz ; find . -type d -print0 | xargs -0 chmod 775 ; find . -type f -print0 | xargs -0 chmod 664;
"


echo "----COMPLETE----"
