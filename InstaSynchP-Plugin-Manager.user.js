// ==UserScript==
// @name        InstaSynchP Plugin Manager
// @namespace   InstaSynchP
// @description List plugins, their version, info link and update notifications

// @version     1.0.3
// @author      Zod-
// @source      https://github.com/Zod-/InstaSynchP-Plugin-Manager
// @license     MIT

// @include     http://*.instasynch.com/*
// @include     http://instasynch.com/*
// @include     http://*.instasync.com/*
// @include     http://instasync.com/*
// @grant       none
// @run-at      document-start

// @require     https://greasyfork.org/scripts/5647-instasynchp-library/code/InstaSynchP%20Library.js
// ==/UserScript==

function PluginManager(version) {
    this.version = version;
    this.name = 'InstaSynchP Plugin Manager';
    this.plugins = {
        'Core': {
            'InstaSynchP Core': 'https://greasyfork.org/en/scripts/5653-instasynchp-core',
            'InstaSynchP Event Hooks': 'https://greasyfork.org/en/scripts/5651-instasynchp-event-hooks',
            'InstaSynchP CSSLoader': 'https://greasyfork.org/en/scripts/5718-instasynchp-cssloader',
            'InstaSynchP Settings': 'https://greasyfork.org/en/scripts/5719-instasynchp-settings',
            'InstaSynchP Commands': 'https://greasyfork.org/en/scripts/6332-instasynchp-commands',
            'InstaSynchP Plugin Manager': 'https://greasyfork.org/en/scripts/6573-instasynchp-plugin-manager'
        },
        'Chat': {
            'InstaSynchP ModSpy': 'https://greasyfork.org/en/scripts/5962-instasynchp-modspy',
            'InstaSynchP Input History': 'https://greasyfork.org/en/scripts/5654-instasynchp-input-history',
            'InstaSynchP Autocomplete': 'https://greasyfork.org/en/scripts/5859-instasynchp-autocomplete',
            'InstaSynchP Emote Names': 'https://greasyfork.org/en/scripts/5910-instasynchp-emote-names'
        },
        'General': {
            'InstaSynchP Layouts': 'https://greasyfork.org/en/scripts/5734-instasynchp-layouts',
            'InstaSynchP Poll Menu': 'https://greasyfork.org/en/scripts/5868-instasynchp-poll-menu'
        },
        'Commands': {
            'InstaSynchP Shuffle Command': 'https://greasyfork.org/en/scripts/6333-instasynchp-shuffle-command'
        },
        'all': {}
    };
    this.settings = [{
        'label': 'Check Updates Timer',
        'id': 'update-timer',
        'type': 'select',
        'options': ['10m', '20m', '30m', '1h', 'on refresh'],
        'default': '30m',
        'section': ['General']
    }];
    this.fields = [{
        'id': 'plugins-count',
        'type': 'hidden',
        'value': '13'
    }];
    this.updateIntervalId = undefined;
}

PluginManager.prototype.executeOnce = function () {
    var th = this;
    cssLoader.add({
        'name': 'plugin-manager',
        'url': 'https://rawgit.com/Zod-/InstaSynchP-Plugin-Manager/d3b79768a1545b2f4d6c595d543cc9b004fdbf63/pluginManager.css',
        'autoload': true
    });

    //add the button
    $('#loginfrm > :first-child').before(
        $('<div>', {
            'id': 'plugin-manager'
        }).append(
            $('<ul>').append(
                $('<li>').append(
                    $('<a>', {
                        'class': 'clicker'
                    }).append(
                        $('<img>', {
                            'src': 'http://i.imgur.com/V3vOIkS.png'
                        })
                    ).append('Plugins').click(function () {
                        $('#update-notification').css('display', 'none');
                        if (pgmc.isOpen) {
                            th.save(true);
                        } else {
                            pgmc.open();
                        }
                    })
                ).append(
                    $('<span>', {
                        'id': 'update-notification'
                    }).text('new update!').css('display', 'none')
                )
            ).addClass('js')
        ).addClass('click-nav')
    );

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
    var th = this,
        plugin,
        pluginName;

    //add a field for each plugin
    for (var section in th.plugins) {
        if (th.plugins.hasOwnProperty(section)) {
            if (section === 'all') {
                continue;
            }
            for (pluginName in th.plugins[section]) {
                if (th.plugins[section].hasOwnProperty(pluginName)) {
                    plugin = th.plugins[section][pluginName];
                    th.plugins.all[pluginName] = {
                        url: plugin,
                        name: pluginName
                    };
                    th.fields.push({
                        'id': pluginName,
                        'label': pluginName,
                        'type': 'checkbox',
                        'default': true,
                        'section': ["Plugins", section]
                    });
                }
            }
        }
    }

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
                            'href': 'https://rawgit.com/Zod-/InstaSynchP-Plugin-Manager/d3b79768a1545b2f4d6c595d543cc9b004fdbf63/PGMconfig.css'
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
            plugin = window.plugins[pluginName];
            if (!th.plugins.all[plugin.name]) {
                continue;
            }
            plugin.enabled = pgmc.get(plugin.name);
            plugin.url = th.plugins.all[plugin.name].url;
            th.plugins.all[plugin.name] = plugin;
        }
    }
    th.searchUpdates();
};

PluginManager.prototype.searchUpdates = function () {
    var th = this,
        notify = false,
        count = Object.keys(th.plugins.all).length;
    //will only be true when page gets refreshed so pgmc.save can be used
    //insead of this.save
    if (parseInt(pgmc.get('plugins-count'), 10) !== count) {
        notify = true;
        pgmc.set('plugins-count', String(count));
        pgmc.save();
    }

    function doneLoading() {
        if (notify) {
            $('#update-notification').css('display', 'initial');
        }
    }

    function setLabel(url) {
        //get info about the script from greasyfork
        $.getJSON('{0}.json'.format(url), function (data) {
            var label = '',
                name = '',
                install = '',
                version = '',
                info = '';
            //prepare the label for the settings
            name = data.name.replace(/^InstaSynchP/i, '').replace(/Command$/i, '').trim();
            install = '<a style="color:#45FF00;font-weight: bolder;" href="{0}/{1}" target="_blank">{2}</a>'.format(url, 'code.user.js');
            info = '<a style="color:#196F9A;font-weight: bolder;" href="{0}" target="_blank">info</a>'.format(url);
            if (th.plugins.all[data.name].version) {
                version = '<span style="color:{1};font-weight: bolder;">v{0}</span>'.format(th.plugins.all[data.name].version);
                if (th.plugins.all[data.name].version === data.version) {
                    install = '';
                    version = version.format('', 'green');
                } else {
                    install = install.format('', '', 'update');
                    version = version.format('', '#F6FE30');
                    notify = true;
                }
            } else {
                install = install.format('', '', 'install');
            }
            label = '{0} {1} {2} {3}'.format(name, version, install, info);
            label.replace(/\s+/, ' ');
            //set the label
            pgmc.fields[data.name].settings.label = label;

            count -= 1;
            if (count === 0) {
                doneLoading();
            }
        });
    }
    for (var pluginName in th.plugins.all) {
        if (th.plugins.all.hasOwnProperty(pluginName)) {
            setLabel(th.plugins.all[pluginName].url);
        }
    }
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
window.plugins.pluginManager = new PluginManager('1.0.3');
