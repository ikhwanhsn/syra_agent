// src/cli/lib/context.ts
var context = {
  verbose: false
};
function configureCliContext(options) {
  if (options.verbose !== void 0) {
    context.verbose = options.verbose;
  }
}
function isVerbose() {
  return context.verbose || process.env.X402_DEBUG === "true";
}

export {
  configureCliContext,
  isVerbose
};
//# sourceMappingURL=chunk-ITCDZXBZ.js.map