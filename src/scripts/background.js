import ext from "./utils/ext";
import storage from "./utils/storage";

var status = '';

//TODO: Need to have facility for getting list of Github data instead of single one
function Github(tab, newURL, callback) {
  let repo = newURL.pathname.split('/');
  if (!(repo[1] && repo[2])) {
    return;
  }

  repo = `${repo[1]}/${repo[2]}`;

  var data = {
    repo: repo,
    stargazers_count: null,
    updated_at: Date.now(),
  };

  storage.get(repo, function (sd) {
    if (sd[repo] && sd[repo].stargazers_count && (Date.now() - sd[repo].updated_at) < 86400000) {
      console.info(repo, 'Reading from storage');
      callback(tab, sd[repo]);
    } else {
      setLocalData();
    }
  });

  var setLocalData = function () {
    getGithubData();
  };

  var getGithubData = function () {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open("GET", `https://api.github.com/repos/${repo}?840d485433b5226470f0718d933b7ba79f81edb1`, true);
    xhr.onreadystatechange = function () {
      if (this.readyState === 4 && this.status === 200) {
        data.stargazers_count = this.response.stargazers_count;
        data.updated_at = Date.now();
        var items = {};
        items[repo] = data;
        storage.set(items, function () {
          console.info(repo, 'data updated');
        });

        callback(tab, data);
      }
    };
    xhr.send();
  };
}

ext.browserAction.onClicked.addListener(function () {
  ext.tabs.query({currentWindow: true}, function (tabs) {
    var tabData = [];
    for (var i = 0, tab; tab = tabs[i]; i++) {
      // console.log(tab);
      new Github(tab, (new URL(tab.url)), function (currentTab, data) {
        if (data.stargazers_count) {
          data.tabId = currentTab.id;
          tabData.push(data);
          tabData.sort(function (a, b) {
            return b.stargazers_count - a.stargazers_count;
          });
          var tabIds = tabData.map(function (obj) {
            return obj.tabId;
          });

          //TODO: Need to move a single tab instead of array of tabs
          ext.tabs.move(tabIds, {index: -1}, function (tabs) {
            // console.log(tabs);
          });
        }
      });
    }
  });
});

ext.tabs.onMoved.addListener(function (tabId, moveInfo) {
  console.info(tabId, moveInfo);
});
