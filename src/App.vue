<template>
  <div id="app">
    <img alt="Vue logo" src="./assets/logo.png">
    <br>
    <button @click="fireSQL">Get SQL</button>
    <br>
    SQL: {{sql}}
    <br>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron';

export default {
  name: 'app',
  data: function() {
    return {
      sql: '',
    };
  },
  created() {
    ipcRenderer.on('window-sql', (event, sql) => {
      console.log('THIS RAN SHOW SQL', sql);
      this.sql = sql;
    });
  },
  methods: {
    fireSQL() {
      ipcRenderer.send('fire-sql', 'get sql random string');
    },
    getSQL() {
      ipcRenderer.send('get-sql', 'get sql random string');
    },
  },
};
</script>