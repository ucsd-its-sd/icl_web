(() => {
  window.icl = {
    logLevel: false,
    log: (text) => {
      if (icl.logLevel) {
        console.log(text);
      }
    },
  };
})();
