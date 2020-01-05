#!/bin/bash -e

if [ ! -f ./parity-backup ]; then 
    echo "No backup available, nothing to do"
    exit 99
fi

supervisorctl stop all

rm -f parity
mv parity-backup parity

supervisorctl start all

echo "Recovered Parity from the stored backup"