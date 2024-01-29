(() => {
  const templateFromID = (id) => {
      const $el = document.getElementById(id),
        content = $el.innerHTML
          // Some table elements aren't valid HTML outside of a table, so I have things encased in these
          .replaceAll("{<!--}", "")
          .replaceAll("{-->}", ""),
        template = generateTemplate(content);
      // Delete original element
      $el.remove();
      return template;
    },
    generateTemplate =
      (templateString) =>
      // Return a function
      (args) => {
        var outputString = templateString;
        if (!args) {
          return outputString;
        }
        Object.keys(args).forEach((key) => {
          outputString = outputString.replaceAll("{{" + key + "}}", args[key]);
        });
        return outputString;
      };
  // Export templateFromID
  window.icl.templateFromID = templateFromID;
})();
