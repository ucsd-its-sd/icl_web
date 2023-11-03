(() => {
  // const templates = {},
  // registerTemplate = (name, template) => {
  //   if (Object.keys(templates).any((key) => key == name)) {
  //     throw "Could not register existing template";
  //   }
  //   templates[name] = template;
  // },
  const templateFromID = (id) => {
      // const templateName = id.replace('template-', ''),
      const $el = document.getElementById(id),
        content = $el.innerHTML
          .replaceAll("{<!--}", "")
          .replaceAll("{-->}", ""),
        template = generateTemplate(content);
      // registerTemplate(templateName, template);
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
  // runTemplate = (name, args) => {
  //   if (!name || !args) {
  //     throw "fuck";
  //   }
  //   if (!Object.keys(templates).any((key) => key == name)) {
  //     throw "invalid template";
  //   }
  //   return templates[name](args);
  // };

  window.icl.templateFromID = templateFromID;
  // window.icl.t = runTemplate;
})();
