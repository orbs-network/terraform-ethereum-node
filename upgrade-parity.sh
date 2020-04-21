#!/bin/bash -e

PARITY_BINARY_URL=$1

supervisorctl stop all

if [ -f ./parity ]; then
    echo "Saving backup of existing version.."
    mv parity parity-backup
fi

curl -sO PARITY_BINARY_URL
chmod u+x parity

RESPONSE=$(supervisorctl start ethereum && supervisorctl start healthcheck)

echo RESPONSE

exit 0