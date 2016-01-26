var flag = false;
var num = 100;
var array = new Array();
var fetchDetail = false;
var sku; //sku编码
var mainFetchUrl; //抓取入口
var fetchTotal; //抓取总数
var lastFlag = false;
var mustLogin = false;
var loginCount = 0;
chrome.extension.onMessage.addListener(function(request, _, response) {
	//查找是否有未遍历的url
	chrome.storage.local.get('storageUrls', function(obj) {
		if (obj['storageUrls']) {
			var continueFlag = window.confirm("找到上次未处理完成的url,是否继续处理上次url?");
			if (continueFlag) {
				array = obj['storageUrls'];
                chrome.storage.local.remove("storageUrls",function(){});
				chrome.storage.local.get('fetchTotalSave', function(obj) {
                    if(obj['fetchTotalSave']){
					    fetchTotal = obj['fetchTotalSave'];
					    //清除缓存 
					    chrome.storage.local.remove("fetchTotalSave",function(){});
                    }
				})
				sendMsg2Detail();
			} else {
				chrome.storage.local.clear();
			}
		}
	})
	//获取存储的总数
	sku = request.sku;
	//抓取分页url
	if (request.type == "fetchUrls") {
		array.length = 0;
		fetchTotal = 0;
		if (request.rule == "tb") {
			if (request.num) {
				num = request.num;
			}
			flag = true;
			chrome.tabs.query({
				active: true,
				currentWindow: true
			},
			function(tabs) {
				sendMsg(tabs[0].id, num)
			})
		}
	}
    /* if(request.type=="resetIsOk"){
        if(array.length>0){
            chrome.tabs.create({url:"http://www.baidu.com",active:true},function(tab){
                chrome.tabs.sendMessage(tab.id,{type:"refl"});
            })
        }
    }  */
    //已登录
	if (request.type == "mustLoginIsOk") {
		mustLogin = false;
			chrome.tabs.query({
				active: true,
				currentWindow: true
			},
			function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: "refl"
				},
				function(response) {});
			})
	}
    //分页抓取返回判断是否是最后一页
	var cmd = request.cmd;
	if (cmd == "next") {
		flag = true;
	} else {
		flag = false;
	}
	//请求细览页数据
	if (request.type == "save") {
		var urls = request.urls;
		Array.prototype.push.apply(array, urls);
		array = unique(array);
		// alert(array.length);
		if (cmd == "end") {
			fetchDetail = true;
			chrome.tabs.query({
				active: true,
				currentWindow: true
			},
			function(tabs) {
				chrome.tabs.update(tabs[0].id, {
					url: array.shift()
				},
				function() {})
			})
		}
	}
	var detailCMD = request.detailCMD;
    //未抓取到销售总数数据
	if (detailCMD == false) {
		if (request.url) {
			if (request.url != "abc") {
				array.unshift(request.url);
				// sendMsg2Detail();
			} else if (request.url == "abc") {
				lastFlag = true;
			}
		}
		if (array.length == 0 && fetchTotal != 0 && lastFlag) {
			alert("抓取总数量为：" + fetchTotal);
		}
	}
	/* chrome.storage.local.set({'value': "localStroage"}, function() {
          // 通知保存完成。
          message('设置已保存');
     }); */
	//需要登录
	if (detailCMD == "mustLogin") {
		mustLogin = true;
		if (request.url) {
			if (request.url != "abc") {
				//alert("url放入array中");
				array.unshift(request.url);
				loginCount++;
				if (loginCount > 2) {
					var reset = window.confirm("等前屏蔽次数大于2次，是否重启？");
					if (reset) {
						chrome.storage.local.clear();
						chrome.storage.local.set({
							"storageUrls": array,
							"fetchTotalSave": fetchTotal
						},
						function() {
							alert("存储成功，请重启后继续抓取")
						})
					}
				}
				// sendMsg2Detail();
			} else if (request.url == "abc") {
				lastFlag = true;
			}
		}
	}
    //存储抓取数量
	if (request.sellCount && request.sellCount != "-") {
		if (Number(request.sellCount)) {
			fetchTotal = Number(fetchTotal) + Number(request.sellCount);
		}
	}
});
//分页发送数据，解析url
function sendMsg(tabId, num) {
	sleep();
	var reg = "div.item div.row.row-2.title a.J_ClickStat";
	chrome.tabs.sendMessage(tabId, {
		type: "fetch",
		rule: "tb",
		reg: reg,
		num: num
	},
	function(response) {});
}

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (flag && changeInfo.status == "complete") { //分页加载完毕
		sendMsg(tabId, num);
	} else if (fetchDetail && changeInfo.status == "complete") { //细览页加载完毕
		sendMsg2Detail();
	}
});

//细览页抓取
function sendMsg2Detail() {
	if (!mustLogin) {
		if (array.length > 0) {
			sleep();
			var currentUrl = array.shift();
			chrome.tabs.query({
				active: true,
				currentWindow: true
			},
			function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: "fetchDetail",
					last: false,
					rule: "tb",
					url: currentUrl
				},
				function(response) {});
			})
		} else { //抓取最后一个页面
			chrome.tabs.query({
				active: true,
				currentWindow: true
			},
			function(tabs) {
				chrome.tabs.sendMessage(tabs[0].id, {
					type: "fetchDetailLast",
					last: true,
					rule: "tb"
				},
				function(response) {});
			})
		}
	}
}
//不加载图片提升加载时间
chrome.webRequest.onBeforeRequest.addListener(function(details) {
	return {
		cancel: true
	}
},
{
	urls: ["*://*/*"],
	types: ["image"]
},
["blocking"]);

function unique(arr) {
	var result = [],
	hash = {};
	for (var i = 0, elem;
	(elem = arr[i]) != null; i++) {
		if (!hash[elem]) {
			result.push(elem);
			hash[elem] = true;
		}
	}
	return result;
}
//代理
var config = {
	mode: "pac_script",
	pacScript: {
		data: "function FindProxyForURL(url, host) {\n" + "  if (url.substring(0,4)=='http'){\n" + "    switch(Math.ceil(Math.random()*5)){\n" + "      case 1:\n" + "        return 'SOCKS 124.160.35.2:808';\n" + "        break;\n" + "      case 2:\n" + "        return 'DIRECT';\n" + "        break;\n" + "      case 3:\n" + "        return 'SOCKS 202.103.241.169:1080';\n" + "        break;\n" + "      case 4:\n" + "        return 'SOCKS 58.59.68.91:1080';\n" + "        break;\n" + "      case 5:\n" + "        return 'SOCKS 221.4.140.85:1080';\n" + "        break;\n" + "    }\n" + "  }\n" + "  return 'DIRECT';\n" + "}"
	}
};
/* chrome.proxy.settings.set({
	value: config,
	scope: 'regular'
},
function() {}); */
//伪装UA
/* chrome.webRequest.onBeforeSendHeaders.addListener(
function(details) {
	var UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Ubuntu Chromium/47.0.2526.106 Chrome/47.0.2526.106 Safari/537.36";
	if (array.length % Math.ceil(Math.random() * 10) == 0) {
		UA = "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:43.0) Gecko/20100101 Firefox/43.0";
	}
	for (var i = 0; i < details.requestHeaders.length; i++) {
		if (details.requestHeaders[i].name == "User-Agent") {
			details.requestHeaders[i].value = UA;
		}
	}
	return {
		requestHeaders: details.requestHeaders
	};
},
{
	urls: ["*://*/
/*"]
},
["blocking", "requestHeaders"]) */
//休眠
function sleep(d) {
	if (!d) {
		d = Math.random() * 1000 + 1000
		// d = Math.random() * 1500;
	}
	for (var t = Date.now(); Date.now() - t <= d;);
}

