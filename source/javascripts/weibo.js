/*
 * blablabla for polling latest weibos from a user
 */

function showWeibos(statuses, count) {
    count = parseInt(count, 10);
    var weibos = document.getElementById('weibos');
    var content = '';
    statuses = statuses.slice(0, count);
    var userid = statuses[0].user.idstr;

    for (var i in statuses) {
        content += '<li>' + '<p>';
        var status = statuses[i];
        var text = '';
        text += getDateAndURL(status, userid);
        text += linkifyStatus(status['text']);

        if (status['retweeted_status']) {
            status = status['retweeted_status'];
            text += '//' + linkifyUser(status['user']) + ':';
            text += linkifyStatus(status['text']);
        }

        content += text;
        content += '</p>' + '</li>';
    }

    weibos.innerHTML = content;
}

function getDateAndURL(status, userid) {
    return '<a href="http://weibo.com/' + userid + '/' + WeiboUtil.mid2url(status['mid']) + '">'
             + prettyDate(status.created_at) + '</a>';
}

// pretty much copied from twitter.js
function linkifyStatus(text) {
    // Chomp http:// off the text of the link
    text = text.replace(/(https?:\/\/)([\w\-:;?&=+.%#\/]+)/gi, '<a href="$1$2">$2</a>');
    // cannot get user url using screen name, need userid. so redirect to search the screen name
    text = text.replace(/(^|\W)@(\S+)\:/g, '$1<a href="http://s.weibo.com/weibo/$2">@$2</a>:');
    // linkify topic, not tested yet
    text = text.replace(/(^|\W)#(\S+)/g, '$1<a href="http://s.weibo.com/weibo/$2">#$2</a>');

    return text
}

function linkifyUser(user) {
    if (!user) {
        return '';
    }

    var profile_url = user.profile_url;
    var name = user.name;
    return '<a href="http://weibo.com/' + profile_url + '">@' + name + '</a>';
}
