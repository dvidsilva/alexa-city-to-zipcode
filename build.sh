#!/bin/bash

rm skill.zip
npm install
zip -r skill.zip node_modules index.js
