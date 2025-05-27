Set-ExecutionPolicy Bypass -Scope Process -Force
$env:PATH += ";C:\Program Files\nodejs"
npm install
npm run compile-tests
npm run test
