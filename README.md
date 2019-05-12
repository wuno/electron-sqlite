# lite

## Project setup
```
yarn
```

### Compiles and hot-reloads for development
```
yarn electron:serve
```

### Compiles and minifies for production
```
yarn electron:build
```

### Lints and fixes files
```
yarn run lint
```

### Build Electron 
# Must be on Mac OS to build for Mac OS
```
yarn electron:build -mwl
```

### Special Considerations
# The sqlite3 bindings do not install correctly unless very specific versions of Electron and node-sqlite are being used together. In our case we are using, 

- "sqlite3": "4.0.6"
- "electron": "3.0.16"