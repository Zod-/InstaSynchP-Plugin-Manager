InstaSynchP-Plugin-Manager
==========================

Disable/list plugins, their version, info link and update notifications.
It will check for updates every 30 minutes by default which can be changed in the settings.

Framework
------
Plugin Manager settings are stored in the `pgmc` object.
#### `pgmc.get`
Get the stored value
```javascript
pgmc.get('make-chat-visible')
```
#### `pgmc.set`
Set the stored value from code.
```javascript
pgmc.set('make-chat-visible', false)
```
<b>Note: Setting the value does not save it. Use `window.plugins.pluginManager.save()` to save it.</b>

#### `pluginManager.searchUpdates`
Searches for new updates
```javascript
plugins.pluginManager.searchUpdates()
```

Settings
--------
*   Time between update checks

License
-----------
The MIT License (MIT)<br>

&lt;InstaSynch - Watch Videos with friends.&gt;<br>
Copyright (c) 2014 InstaSynch

&lt;Bibbytube - Modified InstaSynch client code&gt;<br>
Copyright (C) 2014  Zod-

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
