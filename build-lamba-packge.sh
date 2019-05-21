#!/usr/bin/env bash

rm -f check-parity.zip
cd check-parity-sync-lambda
npm install
zip -r ../check-parity.zip ./*