/**
 * Mitigate multi-wallet extension conflicts (Phantom evmAsk.js vs MetaMask).
 * Syra is Solana-first; a failed ethereum redefinition is harmless noise.
 */
(function () {
  "use strict";

  var REDEFINE_MSG = "Cannot redefine property: ethereum";
  var nativeDefineProperty = Object.defineProperty;

  Object.defineProperty = function definePropertyGuard(target, property, attributes) {
    if (target === window && property === "ethereum") {
      try {
        return nativeDefineProperty(target, property, attributes);
      } catch (error) {
        if (
          error instanceof TypeError &&
          String(error.message || error).indexOf(REDEFINE_MSG) !== -1
        ) {
          return target;
        }
        throw error;
      }
    }
    return nativeDefineProperty(target, property, attributes);
  };

  function isEthereumRedefineError(message) {
    return String(message || "").indexOf(REDEFINE_MSG) !== -1;
  }

  window.addEventListener(
    "error",
    function (event) {
      if (isEthereumRedefineError(event.message)) {
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    var message =
      reason && typeof reason === "object" && "message" in reason
        ? reason.message
        : String(reason || "");
    if (isEthereumRedefineError(message)) {
      event.preventDefault();
    }
  });
})();
