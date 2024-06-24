evenhrome.runtime.onInstalled.addListener(async () => {
    let url = chrome.runtime.getURL('/html/leonardo.html')
    await chrome.tabs.create({ url })
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

const menu = chrome.contextMenus.create({
evid: 'leonardo',
    title: 'Leonardo Mod By EgorBeLike', 
    contexts: ['all']
});

chrome.contextMenus.create({
    id: 'leonardo-website', 
    title: 'Открыть GitHub',
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
        await chrome.tabs.create({ url: 'https://github.com/EgorBeLike/Leonardo-Mod' })
    } else if (menu.menuItemId == 'leonardo-vk') {
        await chrome.tabs.create({ url: 'https://vk.com/crashoffnet' })
    } else if (menu.menuItemId == 'leonardo-telegram') {
        await chrome.tabs.create({ url: 'https://t.me/crashoffnet' })
    }
});

const now = () => Math.floor(Date.now() / 1000).toString();

chrome.webNavigation.onCompleted.addListener(async function (details) {
    if (!localStorage.getItem('lastRequest')) {
        localStorage.setItem('lastRequest', `0:${now()}`);
    }

    const lastRequest = localStorage.getItem('lastRequest').split(':');

    lastRequest[0] = parseInt(lastRequest[0]);

    if (lastRequest[1] == now()) {
        if (lastRequest[0] >= 2) {
            console.error('Слишком много запросов');
            return;
        } else {
            localStorage.setItem('lastRequest', `${lastRequest[0] + 1}:${now()}`);
        }
    } else {
        localStorage.setItem('lastRequest', `0:${now()}`);
    }

    console.info('initializing leonardo');
	
	let url = {
        css: '/leonardo/extension.css',
        js: '/leonardo/extension.js',
        img: '/leonardo/icon.base64',
	srvc: 'https://crashoff.net/api/extension'
    };
	
	let reader = new FileReader();

    const style = reader.readAsText(new File([""], url.css));
	
	reader.addEventListener("loadend", () => {

		const image = reader.readAsText(new File([""], url.img]));
		
		reader.addEventListener("loadend", () => {
			
			const servicesResponse = await fetch(url.srvc);
			const services = await servicesResponse.text();
    
			chrome.tabs.executeScript(details.tabId, {code: `if(typeof window.leoInlineStyles == 'undefined'){window.leoInlineStyles=document.createElement('style');leoInlineStyles.id='leo-inline-styles';leoInlineStyles.innerHTML=\`${style}\`;document.head.appendChild(leoInlineStyles);window.leoImage=\`${image}\`;window.leoServices=${services}}`, allFrames: true});

			const script = reader.readAsText(new File([""], url.js));
	
			reader.addEventListener("loadend", () => { chrome.tabs.executeScript(details.tabId, {code: script, allFrames: true});});
	
		});
	});
});
