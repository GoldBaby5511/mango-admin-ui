#!/bin/sh

npm run build:test 

scp -r dist/* forest@192.168.0.57:/home/forest/forestAdminBin/ui
