const Cc = Components.classes;
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import('resource://gre/modules/Services.jsm');

function startup(data, reason) {
  dump('startup!\n');

  let prefs = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService).getBranch('accessibility.accessfu.');
  prefs.setIntPref('activate', 1);

  let wm = Cc['@mozilla.org/appshell/window-mediator;1']
    .getService(Ci.nsIWindowMediator);

  // Load into any existing windows
  let enumerator = wm.getEnumerator('navigator:browser');
  while (enumerator.hasMoreElements()) {
    let win = enumerator.getNext();
    loadIntoWindow(win);
  }

  wm.addListener(
    {
      onOpenWindow: function(aWindow) {
        dump('onOpenWindow\n\n');
        // Wait for the window to finish loading
        let domWindow = aWindow.QueryInterface(Ci.nsIInterfaceRequestor)
          .getInterface(Ci.nsIDOMWindowInternal);
        domWindow.addEventListener(
          'load',
          function() {
            domWindow.removeEventListener('load', arguments.callee, false);
            dump('LOAD!!!! ' + domWindow.document.documentURI + '\n');
            loadIntoWindow(domWindow);
          }, false);
      },
      onCloseWindow: function(aWindow) { },
      onWindowTitleChange: function(aWindow, aTitle) { }
    }
  );
}

function shutdown(data, reason) {
  let prefs = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefService).getBranch('accessibility.accessfu.');
  prefs.setIntPref('activate', 0);
}

function install(aData, aReason) { }

function uninstall(aData, aReason) { }

function loadIntoWindow(win) {
  if (win.document.location.pathname.substr(-11) != 'browser.xul')
    return;

  try {
    Cu.import('resource://gre/modules/accessibility/AccessFu.jsm');
    Cu.import('resource://gre/modules/accessibility/Presenters.jsm');

    AccessFu.attach(win);
    AccessFu.addPresenter(new DummyAndroidPresenter());
  } catch (x) {
    dump(x + '\n');
  }
}
