---
layout: post
title: "自定义 Octopress 新浪微博 sidebar"
date: 2012-07-05 21:12
comments: true
categories: 
- Octopress
- Programming
---

我花了点时间给Octopress加了一个新浪微博的sidebar。
很简单，就是抓取特定用户（比如说我）最近的几条微博，然后显示在网页侧栏上。
为了不影响整个网页样式的统一，我避免了使用官方提供的微博秀（很难看）。
因为新浪所谓开放API的种种限制，我必须想办法绕开常规的开发授权流程，使脚本能在不同浏览器上正常工作。

下面的内容会分成两部分。
我先解释一下新浪微博开发授权大概是如何运作的，并且抱怨一下这东西有多不合理；然后简单描述一下我的解决方式。

这东西怎么能叫开放平台
----------------------

提醒一下，这部分基本是 rant，受不了的请跳过。

隔三差五会听到有人抱怨 [twitter API的频次限制](http://techcrunch.com/2010/06/29/twitter-api-limit/)。
尽管 twitter 的后端已经从最开始的 Rails 转移到 JVM + Scala，大量的 API 调用还是让他们难以负荷。
即便是如此，相当数量的 API 还是可以匿名的方式读取。
比如我在自己的网页上加一段 JavaScript 读取某个用户最近的 tweets 是完全开放的。
不需要授权，客户端的浏览器也不需要处于 twitter 登陆的状态。
What is publically available is publically available.

<!--more-->

新浪微博的 API 很大程度上受到了 twitter API 的影响。
后端还是基于PHP，当然 Facebook 也是。
微博[开发平台](http://open.weibo.com/)的主页上写着“开放平台”，但是这个平台几乎没有开放 API。
所有的请求都需要一个 Appkey。
也就是说你必须注册成开发者，然后获得自己的 Appkey。
但是事情没这么简单。
作为‘合法’的开发者，我们必须在开发管理界面里提供自己要开发的应用或者要接入微博的网站的信息，然后提交审核。
而提交审核的前提是提供开发者完整的个人信息，比如真实姓名和证件。
提交审核的内容还需要附上一些记录在案所用的材料，比如所申请接入网站的证书。
你说我一个 github page 哪来的证书？这等审核最终通过都何年何月了？

注册并获得 Appkey 的开发者，在应用通过审核之前可以用测试账户部署自己的应用。
但是测试账户受到很大的限制。
只有当前浏览器以测试账户的身份处于微博登陆状态时，与其相关的 Appkey 才能成功的发出 API 请求。
也就是说测试账户只能用于开发者在自己的浏览器上做测试，其他啥也干不了。

即便给了身份证，提供了审核所需要的鬼材料，最终通过了审核。
新浪老爷开放了API 访问权限。
大部分的 API 请求还是需要用户处于登陆状态。
比如我的侧栏抓取的是 `/statuses/user_timeline.json`。
如果客户端的浏览器当前登陆了微博，OK，一切正常，侧栏可以正常显示我最近的微博。
换到 iPad 上的浏览器就不灵了。谁在 iPad 上用 Safari 登陆微博？
我只能指望别人在移动设备上用 native app 登陆。
或者说我如何能指望每个浏览我网页的浏览器是处于微博登陆状态的？
难不成我还整个登陆按钮，呼吁他先登陆微博，然后我倒霉的侧栏才能正常显示？
有任何人会在手机浏览器上敲用户名密码登陆该死的微博么？
这种限制就是给用户体验扇耳光。

OK，话说回来。
我本来的动机也不是要开发什么正经的应用，也不是要大规模地在网页上接入微博。
我只是要简单的读取一些用户信息，然后转化成 html。
新浪微博工具里的[微博秀](http://www.weibo.com/tool/weiboshow)就可以实现这个功能。
我之前的 blog 也是用它来着。
但是我不想用你的 iframe，我想用自己的 stylesheet。
Octopress 的 twitter plugin 就很简洁，和整体的 stylesheet 结合的很自然。
我为什么非要很突兀地插一个第三方 styled 的 iframe？

我觉得我的要求是合理的，所谓的‘开放平台’不够开放。

给 Octopress 添加自定义的新浪微博 sidebar
---------------------------------------------

我基本上是参照了 octopress 的 twitter sidebar。

### 1. HTML

添加 `{octopress_site}/source/_includes/asides/weibo.html`。

{% gist 3058521 %}

**Line 8**: 
Load 微博 JS SDK。
这里有个 hack。把 `appkey` 改为 *3845272542*。
这个 key 不是我的，是微博秀用的 Appkey。
这个 key 没有浏览器登陆限制。
也就是说，用它可以把一般接口开放化。
我的猜想是所有的微博秀都会用这个 key，所以简单的使用不会给后台统计数据添加可察觉到的变化。
总之，be aware and be responsible。

**Line 11**: 
我用了 [XiNGRZ](http://weibo.com/xingrz) 写的一个 helper class。
功能是把每条*微博/status* 的 `mid` 转化成 url string，从而得到每条微博的
url。

**Line 12**: 
处理 `user_timeline.json` 的脚本。下面会具体解释。

**Line 14-28**: 
API 请求，获取 `user_timelne.json`。
Callback 里调用 `weibo.js` 里的 `showWeibos()` （见下文）。

**Line 30-42**: 
一个关注按钮。
我直接用了新浪的 JS widget。
这个不是必须的。我可能之后会改。

### 2. JavaScript

下载这个 [gist](https://gist.github.com/1844413)，另存为
`{octopress_site}/source/javascripts/libs/weiboutil.js`。

添加 `{octopress_site}/source/javascripts/weibo.js`。

{% codeblock weibo.js %}
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
{% endcodeblock %}

**Line 1**:
`showWeibos()` 把传入的 `user_timeline.json` slice 成指定的长度，然后
parse 成一系列的 `<li>`。
之后把这些 list items 插入 dom 的 `#weibos`。

**Line 28**:
`getDateAndURL()` 返回一个链接。
链接指向指定的微博的永久链接。
显示的文字是微博创建的时间。
这里调用了 `twitter.js` 的 `prettyDate()`。
所以 `weibo.js` 依赖于 `twitter.js` 的正常加载。

**Line 34**:
`linkifyStatus()` reformat `status.text`，添加相应的链接。

**Line 45**:
`linkifyUser()` 返回被转发的微博的用户链接。

### 3. CSS

添加 `{octopress_site}/sass/partials/sidebar/_weibo.scss`。

{% codeblock _weibo.scss %}
#weibos {
  .loading {
    background: inline-image('bird_32_gray.png') no-repeat center .5em;
    color: darken($sidebar-bg, 18);
    text-shadow: $main-bg 0 1px;
    text-align: center;
    padding: 2.5em 0 .5em;
    &.error {
      background: inline-image('bird_32_gray_fail.png') no-repeat center .5em;
    }
  }
  p {
    position: relative;
    padding-right: 1em;
    font-size: 95%;
  }
  a[href*=weibo]:first-child {
    color: $twitter-status-link;
    float: right;
    padding: 0 0 .1em 1em;
    position: relative; right: -1.3em;
    text-shadow: #fff 0 1px;
    font-size: .7em;
    span { font-size: 1.5em; }
    text-decoration: none;
    &:hover {
      color: $sidebar-link-color-subdued-hover;
      text-decoration: none;
    }
  }
}
{% endcodeblock %}

基本沿用 `_twitter.scss`。
我只是把字体调小了一点。

为了正常加载，在 `{octopress_site}/sass/partials/_sidebar.scss`
里添加 import。
{% codeblock lang:sass %}
@import "sidebar/weibo";
{% endcodeblock %}

### 4. Config

在 `{octopress_site}/_config.yml` 里添加相应的选项。
{% codeblock _config.yml %}
# Weibo
weibo_user: 你大爷
weibo_status_count: 4
weibo_follow_button: true
{% endcodeblock %}

That's it ladies!

最后几句话
----------

新浪微博 API 的文档让人很费解。
我花了一些时间才弄明白整个流程。
开发者论坛里也有点混乱。
新的 OAuth 2 的授权机制还是不错的。
方便了基于新浪微博平台的应用开发。
但是整个平台缺少不需要授权能匿名访问的接口。
不必要的使简单的接入复杂化了。
当然，新浪更在乎正经的应用。

现有的一些小的工具或者 widget 很难看，又不能订制。
所以我只能用个 dirty hack。
Anyway 这种东西对整个平台的正常运行不会有什么影响。
最好的解决方式是新浪能开放部分 API，能够以匿名的方式访问。
或者提供更方便的 mash up scripts。
