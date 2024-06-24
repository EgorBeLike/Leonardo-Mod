const ENV = 'prod'

chrome.runtime.onInstalled.addListener(async () => {
    let url = chrome.runtime.getURL('/html/leonardo.html')
    await chrome.tabs.create({ url })
})

const HEADERS_TO_STRIP_LOWERCASE = [
    'content-security-policy',
    'x-frame-options',
]

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
['blocking', 'responseHeaders'])

const menu = chrome.contextMenus.create({
    id: 'leonardo',
    title: 'Leonardo – самое важное', 
    contexts: ['all']
})

chrome.contextMenus.create({
    id: 'leonardo-website', 
    title: 'Открыть официальный сайт',
    parentId: menu
})

// chrome.contextMenus.create({
//     id: 'leonardo-vk', 
//     title: 'Открыть нашу группу ВКонтакте',
//     parentId: menu
// })

chrome.contextMenus.create({
    id: 'leonardo-telegram', 
    title: 'Открыть наш Telegram',
    parentId: menu
})

chrome.contextMenus.onClicked.addListener(async (menu) => {
    if (menu.menuItemId == 'leonardo' || menu.menuItemId == 'leonardo-website') {
        await chrome.tabs.create({ url: 'https://crashoff.net' })
    // } else if (menu.menuItemId == 'leonardo-vk') {
    //     await chrome.tabs.create({ url: 'https://vk.com/crashoffnet' })
    } else if (menu.menuItemId == 'leonardo-telegram') {
        await chrome.tabs.create({ url: 'https://t.me/crashoffnet' })
    }
})

const now = () => Math.floor(Date.now() / 1000).toString()

chrome.webNavigation.onCompleted.addListener(async function (details) {
    if (!localStorage.getItem('lastRequest')) {
        localStorage.setItem('lastRequest', `0:${now()}`)
    }

    const lastRequest = localStorage.getItem('lastRequest').split(':')

    lastRequest[0] = parseInt(lastRequest[0])

    if (lastRequest[1] == now()) {
        if (lastRequest[0] >= 2) {
            console.error('too many requests')
            return
        } else {
            localStorage.setItem('lastRequest', `${lastRequest[0] + 1}:${now()}`)
        }
    } else {
        localStorage.setItem('lastRequest', `0:${now()}`)
    }

    console.info('initializing leonardo')

    let url = {
        'dev': {
            css: 'https://crashoff.net/extension.css?'+Date.now(),
            js: 'https://crashoff.net/extension.js?'+Date.now(),
            img: 'https://crashoff.net/img/icon.base64?'+Date.now()
        },
        'prod': {
            css: 'https://raw.githubusercontent.com/crashoffnet/cdn/main/extension.css',
            js: 'https://raw.githubusercontent.com/crashoffnet/cdn/main/extension.js',
            img: 'https://raw.githubusercontent.com/crashoffnet/cdn/main/icon.base64'
        }
    }[ENV]

    const styleResponse = await fetch(url.css)
    const style = await styleResponse.text()

    const imageResponse = await fetch(url.img)
    const image = await imageResponse.text()

    const servicesResponse = await fetch('https://crashoff.net/api/extension')
    const services = await servicesResponse.text()
    
    chrome.tabs.executeScript(details.tabId, {code: `if(typeof window.leoInlineStyles == 'undefined'){window.leoInlineStyles=document.createElement('style');leoInlineStyles.id='leo-inline-styles';leoInlineStyles.innerHTML=\`${style}\`;document.head.appendChild(leoInlineStyles);window.leoImage=\`${image}\`;window.leoServices=${services}}`, allFrames: true})

    const scriptResponse = await fetch(url.js)
    const script = await scriptResponse.text()

    chrome.tabs.executeScript(details.tabId, {code: script, allFrames: true})
})