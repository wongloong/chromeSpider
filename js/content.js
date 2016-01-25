chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
	if (request.type == "fetch") {
		//淘宝抓取规则
		if (request.rule == "tb") {
			getTbSearch(request, sendResponse);
		}
	} else if (request.type == "fetchDetail") {
		if (request.rule == "tb") {
			getDetailElement(request, sendResponse);
		}
	} else if (request.type == "fetchDetailLast") {
		if (request.rule == "tb") {
			getLastDetailElement(request, sendResponse);
		}
	}
})

var countExpressions = "#J_SellCounter||.tm-ind-sellCount .tm-count";
var nameExpression = "div.tb-shop-name||a.slogo-shopname";
var mainTitleExpression = "h3.tb-main-title||h1:last";
var priceExpression = ".tb-rmb-num:last||#J_PromoPrice span";
var evaluateExpression = "#J_RateCounter||.tm-ind-reviewCount span.tm-count";
var sellerNameExpression = ".tb-seller-name";
var shopUrlExpression = ".tb-shop-name a||slogo-shopname a";

function getDetailElement(request, sendResponse) {
	var url;
	var sellCount = getElementText(countExpressions);
	var shopName = getElementText(nameExpression);
	var price = getElementText(priceExpression);
	var title = getElementText(mainTitleExpression);
	var evaluate = getElementText(evaluateExpression);
	var seller = getElementText(sellerNameExpression);
	// var shopUrl = getElementAttr();
	var detailCMD = request.last;
	if (!sellCount || sellCount == "-") {
		detailCMD = false;
        /* if (!request.last) {
            url = request.url;
        } else {
            url = window.location.href;
        }  */
		url = window.location.href;
		if (url.indexOf("item.taobao.com") < 0) {
			detailCMD = true;
		}
	}
	if (!request.last) {
		window.location.href = request.url;
	}
    if (sellCount == "-" && evaluate != "-") {
        sendMsg2Detail("mustLogin", url, "");
        alert("请登录验证");
    } else {
        sendMsg2Detail(detailCMD, url, sellCount);
    } 
    sendMsg2Detail(detailCMD, url, sellCount);
}
function getLastDetailElement(request, response) {
	var sellCount = getElementText(countExpressions);
	sendMsg2Detail(false, "abc", sellCount);
}
//获取表达式内容
function getElementText(expression) {
	var data;
	if (expression.indexOf("||") > - 1) {
		var expressions = expression.split("||");
		for (var i = 0; i < expressions.length; i++) {
			data = $.trim($(expressions[i]).text());
			if (data) {
				break;
			}
		}
	} else {
		data = $.trim($(expression).text());
	}
	return data;
}
function getElementAttr(expression, attr) {
	var data;
	if (expression.indexOf("||") > - 1) {
		var expressions = expression.split("||");
		for (var i = 0; i < expressions.length; i++) {
			data = $.trim($(expressions[i]).attr(attr));
			if (data) {
				break;
			}
		}
	} else {
		data = $.trim($(expression).attr(attr));
	}
}
function getTbSearch(request, sendResponse) {
	var reg = request.reg;
	var array = new Array();
	var urls = $(reg);
	for (var i = 0; i < urls.length; i++) {
		array.push(urls[i].href);
	}
	// alert(array.length);
	var current = $("span.current").html();
	if (Number(current) < Number(request.num)) {
		$("span.icon-btn-next-2").click();
		sendMsg(array, "next");
	} else {
		sendMsg(array, "end");
		// alert("抓取结束");
	}

}
//分页抓取
function sendMsg(urls, cmd) {　　chrome.extension.sendMessage({
		type: "save",
		"urls": urls,
		"cmd": cmd
	},
	function(response) {});
}
//细览页抓取
function sendMsg2Detail(cmd, url, sellCount) {　　chrome.extension.sendMessage({
		detailCMD: cmd,
		url: url,
		sellCount: sellCount
	},
	function(response) {});
}
function sleep(d) {
	if (!d) {
		d = Math.random() * 1500 + 1000
	}
	for (var t = Date.now(); Date.now() - t <= d;);
}
//获取当页所有detail url
function getUrl(array, urls) {
	for (var i = 0; i < urls.length; i++) {
		array.push(urls[i].href);
	}
	return array;
}

