// ==UserScript==
// @name        InstaSynchP Plugin Manager
// @namespace   InstaSynchP
// @description List plugins, their version, info link and update notifications

// @version     1.1.3
// @author      Zod-
// @source      https://github.com/Zod-/InstaSynchP-Plugin-Manager
// @license     MIT

// @include     *://instasync.com/r/*
// @include     *://*.instasync.com/r/*
// @grant       none
// @run-at      document-start

// @require     https://greasyfork.org/scripts/2855-gm-config/code/GM_config.js
// @require     https://greasyfork.org/scripts/5647-instasynchp-library/code/InstaSynchP%20Library.js?version=37716
// ==/UserScript==

function PluginManager(version) {
  "use strict";
  this.version = version;
  this.name = 'InstaSynchP Plugin Manager';
  this.pluginNames = {
    'Core': ['Core', 'Event Hooks', 'CSSLoader', 'Settings', 'Commands', 'Plugin Manager', 'Logger'],
    'Chat': ['ModSpy', 'UserSpy', 'Input History', 'Autocomplete', 'Emote Names', 'Name Completion', 'SysMessage Hide', 'Timestamp'],
    'General': ['Layouts', 'Poll Menu', 'Bibby'],
    'Commands': ['Shuffle Command', 'Bump Command', 'TrimWall'],
    'Playlist': ['Wallcounter']
  };
  this.plugins = [];
  this.settings = [{
    'label': 'Check Updates Timer',
    'id': 'update-timer',
    'type': 'select',
    'options': ['10m', '20m', '30m', '1h', 'on refresh'],
    'default': '30m',
    'section': ['General']
  }];
  this.fields = [];
  this.updateIntervalId = undefined;
}

PluginManager.prototype.executeOnce = function () {
  "use strict";
  var th = this;
  cssLoader.add({
    'name': 'plugin-manager',
    'url': 'https://cdn.rawgit.com/Zod-/InstaSynchP-Plugin-Manager/d3b79768a1545b2f4d6c595d543cc9b004fdbf63/pluginManager.css',
    'autoload': true
  });

  //add the button
  $('#plugin_manager').click(function () {
    $('.updates').text('');
    if (pgmc.isOpen) {
      th.save(true);
    } else {
      pgmc.open();
    }
  });

  function startTimer(setting) {
    if (th.updateIntervalId) {
      clearInterval(th.updateIntervalId);
      th.updateIntervalId = undefined;
    }
    if (setting === 'on refresh') {
      return;
    }
    th.updateIntervalId = setInterval(function () {
      th.searchUpdates();
    }, getTime(setting) * 1000);
  }

  events.on(th, 'SettingChange[update-timer]', function (ignore, newVal) {
    th.searchUpdates();
    startTimer(newVal);
  });

  startTimer(gmc.get('update-timer'));
};

PluginManager.prototype.executeOnceCore = function () {
  "use strict";
  var th = this,
    plugin,
    pluginName;

  function createPluginField(name, index) {
      var fullName = 'InstaSynchP {0}'.format(name);
      th.pluginNames[section][index] = fullName;
      th.fields.push({
        'id': fullName,
        'label': name,
        'type': 'checkbox',
        'default': true,
        'section': ["Plugins", section]
      });
    }
    //add a field for each plugin
  for (var section in th.pluginNames) {
    if (!th.pluginNames.hasOwnProperty(section)) {
      continue;
    }
    th.pluginNames[section].forEach(createPluginField);
    th.plugins = th.plugins.concat(th.pluginNames[section]);
  }
  //hidden value so we know when there is a new one
  th.fields.push({
    'id': 'plugins-count',
    'type': 'hidden',
    'value': String(Object.keys(th.plugins).length)
  });
  window.pgmc = new GM_configStruct({
    'id': 'PGM_config',
    'title': 'InstaSynchP Plugin Manager',
    'fields': th.fields,
    'events': {
      'open': function (args) {
        //context of the iframe
        $('#PGM_config').each(function () {
          var context = this.contentWindow.document || this.contentDocument;
          //load css
          $('head', context).append(
            $('<link>', {
              'type': 'text/css',
              'rel': 'stylesheet',
              'href': 'https://cdn.rawgit.com/Zod-/InstaSynchP-Plugin-Manager/cdc223790a32cd743e7c26f8704dd5baeff59df0/PGMconfig.css'
            })
          );

          //collapse items in sections when clicking the header
          $('#PGM_config .section_header', context).click(function () {
            $(this).parent().children().filter(":not(:first-child)").slideToggle(250);
            if (!$(this).parent().children().eq(0).hasClass('section_desc')) {
              var next = $(this).parent().next();
              while (next.children().eq(0).hasClass('section_desc')) {
                next.slideToggle(250);
                next = next.next();
              }
            }
          });

          //add save & close button
          $('#PGM_config_buttons_holder > :last-child', context).before(
            $('#PGM_config_closeBtn', context).clone(false).attr({
              id: 'PGM_config_save_closeBtn',
              title: 'Save Close'
            }).text("Save Close").click(function () {
              th.save(true);
            })
          );

          //add save & refresh button
          $('#PGM_config_buttons_holder > :last-child', context).before(
            $('#PGM_config_closeBtn', context).clone(false).attr({
              id: 'PGM_config_save_refreshBtn',
              title: 'Save and refresh the page'
            }).text("Save Refresh").click(function () {
              th.save(true, true);
            })
          );

          //disable core checkboxes
          $('#PGM_config .section_header_holder', context).each(function () {
            if ($(this).children().eq(0).text() === 'Core') {
              $(this).find('input[type="checkbox"]').attr('disabled', true);
            }
          });

          //remove update/install buttons on all but Core
          $('#PGM_config .section_header_holder', context).each(function () {
            if ($(this).children().eq(0).text() === 'Core') {
              $(this).find('a').each(function () {
                if ($(this).parent().text().split(' ')[0].trim() !== 'Core' &&
                  $(this).text().match(/^(update|install)$/ig)) {
                  $(this).remove();
                }
              });
            }
          });
        });
        $('#PGM_config').css('height', '90%').css('top', '55px').css('left', '5px').css('width', '375px');

        events.fire('PluginManagerOpen');
      },
      'save': function () {
        events.fire('PluginManagerSave');
      },
      'reset': function () {
        events.fire('PluginManagerReset');
      },
      'close': function () {
        events.fire('PluginManagerClose');
      },
      'change': function (args) {
        var setting;
        //fire an event for each setting that changed
        for (setting in args) {
          if (args.hasOwnProperty(setting)) {
            events.fire('PluginManagerChange[{0}]'.format(setting), [args[setting].old, args[setting].new]);
          }
        }
      }
    }
  });

  events.on(th, 'PluginManagerSaveInternal', function (data) {
    pgmc.save();
    if (data.close) {
      pgmc.close();
    }
    if (data.refresh) {
      location.reload();
    }
  });

  //check loaded plugins and disable them accordingly
  for (pluginName in window.plugins) {
    if (window.plugins.hasOwnProperty(pluginName)) {
      window.plugins[pluginName].enabled = pgmc.get(window.plugins[pluginName].name, true);
    }
  }
  th.searchUpdates();
};

PluginManager.prototype.searchUpdates = function () {
  "use strict";
  var th = this,
    updatesCount = 0;
  //will only be true when page gets refreshed so pgmc.save can be used
  //insead of this.save
  if (parseInt(pgmc.get('plugins-count'), 10) !== th.plugins.length) {
    updatesCount += Math.abs(th.plugins.length - parseInt(pgmc.get('plugins-count'), 10));
    pgmc.set('plugins-count', String(th.plugins.length));
    pgmc.save();
  }

  function doneLoading() {
    if (updatesCount > 0) {
      $('.updates').text(updatesCount);
    }
  }

  function setLabel(url, data) {
    if (!th.plugins.contains(data.name)) {
      return;
    }
    var label = '',
      name = '',
      install = '',
      version = '',
      info = '',
      feedback = '',
      plugin = window.plugins[data.name] || {};

    for (var p in window.plugins) {
      if (window.plugins.hasOwnProperty(p)) {
        if (window.plugins[p].name === data.name) {
          plugin = window.plugins[p];
        }
      }
    }
    //prepare the label for the settings
    name = data.name.replace(/^InstaSynchP/i, '').replace(/Command$/i, '').trim();
    install = '<a class="install_link links shadow" href="{0}/{1}" target="_blank">{2}</a>'.format(url, 'code.user.js');
    info = '<a class="info_link links"  href="{0}" target="_blank">info</a>'.format(url);
    feedback = '<a class="feedback_link links" href="{0}/{1}" target="_blank">{1}</a>'.format(url, 'feedback');
    if (plugin.version) {
      version = '<span class="{1} version_link links">v{0}</span>'.format(plugin.version, '{0}');
      if (plugin.version === data.version) {
        install = '';
        version = version.format('current_version_link');
      } else {
        updatesCount += 1;
        install = install.format('', '', 'update');
        version = version.format('outdated_version_link');
      }
    } else {
      install = install.format('', '', 'install');
    }
    label = '{0} {1} {2} {3} {4}'.format(name, version, install, info, feedback);
    label.replace(/\s+/, ' ');
    //set the label
    pgmc.fields[data.name].settings.label = label;
    pgmc.fields[data.name].settings.title = data.description;
    //reload when GUI is open
    pgmc.fields[data.name].reload();

    //disabled checkboxes and remove update/install links
    $('#PGM_config').each(function () {
      var context = this.contentWindow.document || this.contentDocument;
      //disable core checkboxes
      $('#PGM_config .section_header_holder', context).each(function () {
        if ($(this).children().eq(0).text() === 'Core') {
          $(this).find('input[type="checkbox"]').attr('disabled', true);
        }
      });

      //remove update/install buttons on all but Core
      $('#PGM_config .section_header_holder', context).each(function () {
        if ($(this).children().eq(0).text() !== 'Core') {
          return;
        }
        $(this).find('a').each(function () {
          if ($(this).parent().text().split(' ')[0].trim() !== 'Core' &&
            $(this).text().match(/^(update|install)$/ig)) {
            $(this).remove();
          }
        });

      });
    });
  }

  $.getJSON('https://greasyfork.org/en/scripts.json?set=1666', function (data) {
    data.forEach(function (plugin) {
      setLabel(plugin.url, plugin);
    });
    doneLoading();
  });

};

PluginManager.prototype.save = function (close, refresh) {
  "use strict";
  //post message to site and catch in the script scope fix for #21
  window.postMessage(JSON.stringify({
    action: 'PluginManagerSaveInternal',
    data: {
      close: close,
      refresh: refresh
    }
  }), "*");
};

window.plugins = window.plugins || {};
window.plugins.pluginManager = new PluginManager('1.1.3');
