function init(settings) {
    console.log(settings)
    const id = "site-spider-results";
    const cleanUp = () => {
        currentLinks.length = 0;
        document.getElementById(id).remove();
        document.querySelectorAll("[data-spider-status]")
            .forEach(element => {
                element.removeAttribute("data-spider-status");
                element.removeAttribute("data-spider-match");
            });
    }
    const currentLinks = [];
    if (document.getElementById(id)) {
        cleanUp();
        return;
    }
    const maxCheckLength = -1;
    const isContentSearch = settings.requestType.toLowerCase() === "get" && settings.searchTerms.length;
    let count = 0;
    const headerHTML = `<h2 class="m-null txt-c p-null">
        Site Spider
        <svg data-pause aria-label="Pause" xmlns="http://www.w3.org/2000/svg" width="40" height="40" preserveAspectRatio="none" viewBox="0 0 490 490">
            <title>Pause</title>
            <path fill="none" stroke="#aaaaaa" stroke-width="36" 
                stroke-linecap="round" d="m280,278a153,153 0 1,0-2,2l170,170m-91-117 110,110-26,26-110-110"/>
        </svg>
    </h2>`
    const links = document.querySelectorAll("a[href]");
    let siteSpiderResultsElement;
    let isPaused = false;
    const linksArray = [];
    const getLinkLabel = (el) => {
        if ( el.getAttribute("aria-label") ) {
            return el.getAttribute("aria-label");
        } else if ( el.getAttribute("aria-labeledby") ) {
            const id = el.getAttribute("aria-labeledby");
            return document
                    .getElementById( id.split(" ")[0] )
                    ?.innerText || el.innerText;
        } else {
            return el.innerText || "missing label";
        }
    }
    function attachDrag(element) {
        // TODO; add keyboard controls to move
        let initX;
        let initY;
        let firstX;
        let firstY;

        function dragIt(e) {
            this.style.left = `${ initX + e.pageX-firstX }px` ;
            this.style.top = `${ initY + e.pageY-firstY }px`;
        }

        element.addEventListener('mousedown', function(e) {
            e.preventDefault();
            element.classList.add("spider-dragging");
            initX = this.offsetLeft;
            initY = this.offsetTop;
            firstX = e.pageX;
            firstY = e.pageY;

            this.addEventListener('mousemove', dragIt, false);
            document.addEventListener('mouseup', function() {
                element.classList.remove("spider-dragging");
                element.removeEventListener('mousemove', dragIt, false);
            }, false);

        }, false);

        // TODO test and enable if it works ok
        // function swipeIt(e) {
        //     let contact = e.touches;
        //     this.style.left = initX+contact[0].pageX-firstX + 'px';
        //     this.style.top = initY+contact[0].pageY-firstY + 'px';
        // }
        // object.addEventListener('touchstart', function(e) {
        //
        //     e.preventDefault();
        //     initX = this.offsetLeft;
        //     initY = this.offsetTop;
        //     var touch = e.touches;
        //     firstX = touch[0].pageX;
        //     firstY = touch[0].pageY;
        //
        //     this.addEventListener('touchmove', swipeIt, false);
        //
        //     window.addEventListener('touchend', function(e) {
        //         e.preventDefault();
        //         object.removeEventListener('touchmove', swipeIt, false);
        //     }, false);
        //
        // }, false);

    }
    function getRowHTML(anchor) {
        return `<li class="status--${ anchor.status } content-match--${ anchor.contentMatch }" data-sort="${ anchor.sort }">
        <a href="${ anchor.href }" target="_blank" title="${ anchor.href }" class="block">
            <span class="spider-status">${ anchor.status }</span> 
            <span class="pathname">${ anchor.pathname }</span><span class="search">${ anchor.search }</span>
        </a>
    </li>`;
    }
    function getAllTableRows() {
        let rows = "";
        linksArray.forEach( anchor => {
            rows += getRowHTML(anchor)
        });
        return rows;
    }
    function addTableRow(anchor) {
        const main = siteSpiderResultsElement.querySelector("main");
        siteSpiderResultsElement.querySelector(".content-container")
            .insertAdjacentHTML("beforeend", getRowHTML(anchor));
        if (!isPaused) {
            main.scrollTop = main.scrollHeight;
        }
    }
    function getDefaultContentHTML() {
        return `<button aria-label="close" data-action-clean-up></button><header class="m-null py-medium">
    ${ headerHTML }
    <div class="m-null p-medium txt-c">
        Links total <strong class="mono">${ linksArray.length }</strong>. 
        Request type <strong class="mono">${ settings.requestType }</strong>
        ${ contentSearchTerms() }
        <p class="m-medium">
            <button data-action-validate-links class="p-xsmall">Search</button>
        </p>
     </div>
</header>`
    }
    function setSiteSpiderResultsHTML() {
        siteSpiderResultsElement = document.createElement('div');
        siteSpiderResultsElement.id = id;
        siteSpiderResultsElement.innerHTML = getDefaultContentHTML();
        // TODO: add polyfill for customElements.define() Not yet implemented in chrome extensions
        siteSpiderResultsElement.setAttribute("is", "site-spider-div")
        document.querySelector("body").appendChild(siteSpiderResultsElement);
        attachDrag(siteSpiderResultsElement);
    }
    function populateLinksArray() {
        const currentUrl = settings.ignoreHash ? `${ location.href.split("#")[0] }#` : location.href;
        const testLink = href => {
            let url;
            try {
                 url = new URL(href);
            } catch (e) {
                return { url: null, valid: false, message: "not-valid-url" };
            }
            if (linksArray.find( link => link.href === href)) {
                return { url: null, valid: false, message: "duplicate"  }; // ignore duplicates
            }
            if (settings.ignoreList.some( ignore => href.includes(ignore) )) {
                return { url: null, valid: false, message: "ignore-list"  }; // ignore if match in ignore list is found
            }
            if (url.origin !== location.origin) {
                return { url: null, valid: false, message: "different-domain"  };
            }
            if (href.startsWith( currentUrl )) {
                return { url: null, valid: false, message: "current-page"  };
            }
            return {
                url,
                valid: true
            };
        }
        const isLimit = (c) => {
            if (maxCheckLength < 0) {
                return false;
            }
            return c >= maxCheckLength;
        }

        links.forEach( (link, i) => {
            if (settings.ignoreHash) {
                link.href = link.href.split("#")[0];
            }
            const ops = testLink(link.href);
            if (  ops.valid && !isLimit(count) ) {
                link.setAttribute("data-spider-status", "0");
                linksArray.push({
                    label: getLinkLabel( link ),
                    href: link.href,
                    pathname: ops.url.pathname,
                    search: ops.url.search,
                    status: 0,
                    contentMatch: 0,
                    validated: false,
                    sort: 0,
                    element: link
                })
                count = count + 1;
            }
            link.setAttribute("data-spider-status", ops.message || "");
        });
    }
    function contentSearchTerms(){
        return `<div data-search-terms>${ settings.searchTerms.join(", ").replace('<','&lt;') }</div>`;
    }
    function contentSearchStatus(){
        if (!isContentSearch) {
            return "";
        }
        return `Content <strong data-content-match>0</strong>`
    }
    function getContent() {
        return `
<button aria-label="close" data-action-clean-up></button>
<header class="m-null py-medium">
    ${ headerHTML }
    <div class="m-null p-medium txt-c">
         <div>
            Links total <strong class="mono">${ linksArray.length }</strong>. 
            Checked <strong class="mono" data-validated>0</strong>.
            Method <span>${ settings.requestType }</span>.
            ${ contentSearchStatus() }
        </div>
        ${ contentSearchTerms() }
     </div>
</header>
<main class="mx-medium">
    <section class="table">
        <ul class="content-container"></ul>
    </section>
</main>`;
    }
    function updateValidatedCount() {
        const validatedLinksCount = linksArray.filter((element) => element.validated ).length;
        siteSpiderResultsElement
            .querySelectorAll("[data-validated]")
            .forEach( el => el.textContent = validatedLinksCount );
        siteSpiderResultsElement
            .querySelectorAll("[data-content-match]")
            .forEach( el => el.textContent = linksArray.filter(el => !!el.contentMatch).length );
    }
    function validationChange(link = null) {
        if ( link ) {
            addTableRow( link );
            updateValidatedCount();
        } else {
            siteSpiderResultsElement.querySelector(".content-container").innerHTML = getAllTableRows();
            updateValidatedCount();
            siteSpiderResultsElement.querySelector("main").scrollTop = 0;
        }

    }
    async function validateLink() {
        const link = linksArray.find(link => !link.validated);

        if (link && !isPaused) {
            link.validated = true;
            try {
                fetch(link.href, {
                    method: settings.requestType
                }).then(response => {
                    link.status = response.status;
                    link.element.setAttribute("data-spider-status", link.status);
                    return response.text();
                }).then(text => {
                    if (settings.requestType.toLowerCase() === "get") {
                        link.contentMatch = false;
                        if (settings.searchTerms.length && text) {
                            link.contentMatch = settings.searchTerms.some( term => text.includes(term) );
                        }
                    }
                    link.sort = link.contentMatch ? 600 : link.status;
                    if (link.contentMatch) {
                        link.element.setAttribute("data-spider-match", "true");
                    }
                    validationChange(link);
                    validateLink();
                })
            } catch (error) {
                // TypeError: Failed to fetch
                link.status = "NaN";
                console.error(error)
                validationChange();
                await validateLink();
            }
        } else {
            // no links left unvalidated
            linksArray.sort((a, b) => b.sort - a.sort || a.label.localeCompare(b.label))

            validationChange();
            return false;
        }
        if (isPaused) {
            console.log("currently not processing more links");
        }
    }
    function validateAllLinks() {
        setTimeout(() => {
            siteSpiderResultsElement.innerHTML = getContent();
            for (let step = 0; step < settings.concurrentRequests; step++) {
                validateLink();
            }
        }, 10);
    }
    function applyEventListeners() {
        siteSpiderResultsElement?.addEventListener("click", (e) => {
            if (e.target.matches("[data-pause]")) {
                if (isPaused) {
                    isPaused = false;
                    validateAllLinks();
                } else {
                    isPaused = true;
                }
                siteSpiderResultsElement.querySelectorAll("[data-pause]").forEach(el => {
                    const m = isPaused ? "Continue" : "Pause";
                    el.setAttribute("aria-label", m);
                    el.querySelector("title").textContent = m;
                })
            }
            if (e.target.matches("[data-action-clean-up]")) {
                cleanUp();
            }
            if (e.target.matches("[data-action-validate-links]")) {
                validateAllLinks();
            }
        });
        document.addEventListener("keyup", e => {
            if (e.key === "Escape") {
                init({});
            }
        }, {once: true})
    }

    populateLinksArray();
    setSiteSpiderResultsHTML();
    applyEventListeners();
    // validateAllLinks();
}


chrome.storage.local.get(["settings"]).then(result => {
    const settings = JSON.parse(result.settings)[0];
    init({
            "concurrentRequests": parseInt(settings.data.find( item => item.key === "concurrentRequests")?.value),
            "requestType": settings.data.find( item => item.key === "preferredRequestType")?.value,
            "ignoreList": settings.data.find( item => item.key === "ignoreList")?.value?.split(/\r?\n|\r|\n/g) || [],
            "searchTerms": settings.data.find( item => item.key === "searchTerms")?.value?.split(/\r?\n|\r|\n/g) || [],
            "ignoreHash": settings.data.find( item => item.key === "ignoreHash")?.value === "true"
        });
});