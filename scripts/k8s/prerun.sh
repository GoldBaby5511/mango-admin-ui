#!/bin/bash
kubectl create ns mango-admin
kubectl create configmap nginx-frontend --from-file=./default.conf -n mango-admin
