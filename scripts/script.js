'use strict'

const observer = new MutationObserver(list => {
    for (const { addedNodes } of list) {
        for (const node of addedNodes) {
            if (!node.tagName)
                continue

            if (node.classList.contains('reactions-menu')) {
                const button = document.createElement('button')
                button.className = 'reactions-menu__reaction'
                button.tabIndex = -1
                button.type = 'button'

                const span = document.createElement('span')
                span.className = 'reactions-menu__reaction-description'
                span.textContent = 'Curious'
                button.appendChild(span)

                const img = document.createElement('img')
                img.className = 'reactions-icon reactions-menu__icon reactions-icon__creation--medium'
                img.src = 'https://static.licdn.com/sc/h/bimmb5t9du8lir3fmy721w8gu'
                img.alt = 'curious'
                button.appendChild(img)

                button.onclick = createReaction(node.parentElement.querySelector('.react-button__trigger'))
                node.appendChild(button)
            }
        }
    }
})

observer.observe(document.body, { childList: true, subtree: true })

const createReaction = trigger => async e => {
    const pressed = trigger.classList.contains('react-button--active')

    const urnElement = trigger.closest('[data-id], [data-urn]')
    if(!urnElement)
        return
        
    const urn = urnElement.dataset.id ?? urnElement.dataset.urn

    // the MAYBE reaction only seems to work with the update API, so we need to like it first
    if (!pressed) {
        const response = await likePost(urn)
        if (!response.ok)
            return
    }

    const response = await updateReaction(urn)
    if (!response.ok)
        return

    trigger.classList.add('react-button--active')
    trigger.setAttribute('aria-pressed', 'true')

    // update UI
    // FIXME: the text is no longer in sync when updating the reaction
    const wrapper = trigger.querySelector('div.artdeco-button__text')

    const img = document.createElement('img')
    img.className = 'reactions-icon artdeco-button__icon reactions-react-button__icon reactions-icon__creation--small'
    img.src = 'https://static.licdn.com/sc/h/9v68n3giwr4el6ep9ada2fqcw'

    const span = wrapper.querySelector('span.react-button__text')
    span.className = 'artdeco-button__text react-button__text react-button__text--curious'
    span.textContent = 'Curious'

    wrapper.querySelector('svg, img')?.replaceWith(img)
 
    // close popup
    const menu = document.querySelector('.reactions-menu')
    menu.parentElement.removeChild(menu)
}

const likePost = async urn => {
    const body = {
        reactionType: 'LIKE'
    }

    return await fetch(`https://www.linkedin.com/voyager/api/voyagerSocialDashReactions?threadUrn=${encodeRFC3986URIComponent(urn)}`, {
        "headers": {
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "content-type": "application/json; charset=UTF-8",
            "csrf-token": getSession()
        },
        "body": JSON.stringify(body),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
}

const updateReaction = async urn => {
    const body = {
        threadUrn: urn,
        newReactionType: 'MAYBE'
    }

    return await fetch("https://www.linkedin.com/voyager/api/voyagerSocialDashReactions?action=updateReaction", {
        "headers": {
            "accept": "application/vnd.linkedin.normalized+json+2.1",
            "content-type": "application/json; charset=UTF-8",
            "csrf-token": getSession(),
        },
        "body": JSON.stringify(body),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    })
}

const getSession = () => {
    const session = getCookie('JSESSIONID')
    return session.substring(1, session.length - 1)
}

// https://stackoverflow.com/a/24103596/1751640
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
}

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent#encoding_for_rfc3986
function encodeRFC3986URIComponent(str) {
    return encodeURIComponent(str).replace(
        /[!'()*]/g,
        (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}