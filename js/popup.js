$(function() {
	$("#startFetch").bind("click", startFetch);
    $("#hasLoginOk").bind("click",hasLoginOk);
})
function hasLoginOk() {
	chrome.runtime.sendMessage({
		type: "mustLoginIsOk"
	},
    function(response) {
    });
}
function startFetch() {
	var rule = $("#rule").val();
	var num = $("#fetchNum").val();
	var sku = $("#sku").val();
	var baseUrl = $("#baseUrl").val();
	chrome.runtime.sendMessage({
		type: "fetchUrls",
		sku: sku,
		rule: rule,
		num: num,
		baseUrl: baseUrl
	},
    function(response) {
        $("#fetchTotal").html(response);
    });
}

/* chrome.extension.onMessage.addListener(function(request,_,response){ 
    if(request.totals){
        $("#fetchTotal").html("z");
        $("#fetchTotal").html(request.totals);
    }
}) */

