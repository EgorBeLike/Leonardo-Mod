chrome.runtime.onInstalled.addListener(async () => {
    let url = chrome.runtime.getURL('/html/leonardo.html')
    await chrome.tabs.create({ url })
	console.info("Leonardo Mod is installed")
});

const HEADERS_TO_STRIP_LOWERCASE = [
    'content-security-policy',
    'x-frame-options',
];

chrome.webRequest.onHeadersReceived.addListener(
    details => {
        return {
            responseHeaders: details.responseHeaders.filter(header =>
                !HEADERS_TO_STRIP_LOWERCASE.includes(header.name.toLowerCase()))
        }
    },
    {
      urls: ['https://*/*']
    },
['blocking', 'responseHeaders']);

function readFile(filename, byclck = false) {
	let reader = new FileReader();
	let content;
	let timer;
	reader.onload = () => {
		console.info("FileReader: " + filename + " was loaded.");
		clearTimeout(timer);
		return content;
	}
	reader.onerror = () => {
		console.error("FileReader: " + filename + " wasn't loaded. Error: " + reader.error);
		if (byclck) alert("FileReader: " + filename + " wasn't loaded. Error: " + reader.error);
		clearTimeout(timer);
		return undefined;
	}
	content = reader.readAsText(new File([""], filename));
	function infTimer(timer){
		timer = setTimeout(infTimer, Infinity, timer);
	}(timer);
}

let inject = async function (details, byclck = false) {
	try {
		if (!localStorage.getItem('lastRequest')) {
			localStorage.setItem('lastRequest', `0:${now()}`);
		}

		const lastRequest = localStorage.getItem('lastRequest').split(':');

		lastRequest[0] = parseInt(lastRequest[0]);

		if (lastRequest[1] == now()) {
			if (lastRequest[0] >= 2) {
				console.error('Too Many Requests');
				return;
			} else {
				localStorage.setItem('lastRequest', `${lastRequest[0] + 1}:${now()}`);
			}
		} else {
			localStorage.setItem('lastRequest', `0:${now()}`);
		}

		console.info('Inject into ' + details.url + " (" + details.tabId + ")");
		
		let url = {
			css: chrome.runtime.getURL('/leonardo/extension.css'),
			js: chrome.runtime.getURL('/leonardo/extension.js'),
			img: chrome.runtime.getURL('/leonardo/icon.base64'),
			srvc: 'https://crashoff.net/api/extension'
		};
		
		let reader = new FileReader();

		const style = readFile(url.css);
		
		const image = readFile(url.img);
		
		const script = readFile(url.js);
		
		if (typeof style === "undefined" || typeof image === "undefined" || typeof script === "undefined") return;
		
		const servicesResponse = await fetch(url.srvc);
		const services = await servicesResponse.text();

		chrome.tabs.executeScript(details.tabId, {code: `if(typeof window.leoInlineStyles == 'undefined'){window.leoInlineStyles=document.createElement('style');window.leoInlineStyles.id='leo-inline-styles';window.leoInlineStyles.innerHTML=\`${style}\`;document.head.appendChild(leoInlineStyles);window.leoImage=\`${image}\`;window.leoServices=${services}}`, allFrames: true});

		if(chrome.runtime.lastError){
			console.error("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
			if (byclck) alert("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
			return;
		}

		chrome.tabs.executeScript(details.tabId, {code: script, allFrames: true});
		if(chrome.runtime.lastError){
			console.error("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
			if (byclck) alert("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
			return;
		}
		
		return;
	} catch(e) {
		console.error(e);
		return;
	}
}

const menu = chrome.contextMenus.create({
	id: 'leonardo',
    title: 'Leonardo Mod By EgorBeLike', 
    contexts: ['all']
});

chrome.contextMenus.create({
    id: 'leonardo-website', 
    title: 'Открыть GitHub',
    parentId: menu
});

chrome.contextMenus.create({
    id: 'inject', 
    title: 'Включить Leonardo на этой странице принудительно',
    parentId: menu
});

/*chrome.contextMenus.create({
    id: 'leonardo-vk', 
    title: 'Открыть нашу группу ВКонтакте',
    parentId: menu
});

chrome.contextMenus.create({
    id: 'leonardo-telegram', 
    title: 'Открыть наш Telegram',
    parentId: menu
});*/

chrome.contextMenus.onClicked.addListener(async (menu) => {
    if (menu.menuItemId == 'leonardo' || menu.menuItemId == 'leonardo-website') {
        await chrome.tabs.create({ url: 'https://github.com/EgorBeLike/Leonardo-Mod' });
    } else if (menu.menuItemId == 'leonardo-vk') {
        await chrome.tabs.create({ url: 'https://vk.com/crashoffnet' });
    } else if (menu.menuItemId == 'leonardo-telegram') {
        await chrome.tabs.create({ url: 'https://t.me/crashoffnet' });
    } else if (menu.menuItemId == 'inject') {
		chrome.tabs.query({currentWindow: true, active: true, lastFocusedWindow: true }, function(tabs){
			if(chrome.runtime.lastError){
				console.error("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
				alert("Inject error (" + details.url + " ; " + details.tabId + "): " + chrome.runtime.lastError.message);
				return;
			}
			await inject({
				url: tabs[0].url,
				tabId: tabs[0].url
			}, true);
		});
    }
});

const now = () => Math.floor(Date.now() / 1000).toString();

chrome.webNavigation.onCompleted.addListener(inject);
