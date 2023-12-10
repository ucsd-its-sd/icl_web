(() => {
  const templateFromID = (id) => {
      const $el = document.getElementById(id),
        content = $el.innerHTML
          .replaceAll("{<!--}", "")
          .replaceAll("{-->}", ""),
        template = generateTemplate(content);
      $el.remove();
      return template;
    },
    generateTemplate = (templateString) => (args) => {
      var outputString = templateString;
      if (!args) {
        return outputString;
      }
      Object.keys(args).forEach((key) => {
        outputString = outputString.replaceAll("{{" + key + "}}", args[key]);
      });
      return outputString;
    };
  window.icl.templateFromID = templateFromID;
})();
