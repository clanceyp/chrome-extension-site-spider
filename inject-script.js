function init(settings) {
    const id = "site-spider-results";
    const cleanUp = () => {
        document.getElementById(id).remove();
        document.querySelectorAll("[data-spider-status]")
            .forEach(element => element.removeAttribute("data-spider-status"));
    }
    if (document.getElementById(id)) {
        cleanUp();
        return;
    }
    const maxCheckLen = -1;
    const isContentSearch = settings.requestType.toLowerCase() === "get" && settings.searchTerm.length;
    let count = 0;
    const links = document.querySelectorAll("a[href]");
    let siteSpiderResultsElement;
    const linksArray = [];
    const getLabel = (el) => {
        if ( el.getAttribute("aria-label") ) {
            return el.getAttribute("aria-label");
        } else if ( el.getAttribute("aria-labeledby") ) {
            const id = el.getAttribute("aria-labeledby");
            return document
                    .getElementById( id.split(" ")[0] )
                    ?.innerText;
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

            window.addEventListener('mouseup', function() {
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
        return `<tr class="status--${ anchor.status } has-match--${ anchor.hasMatch }" data-sort="${ anchor.sort }">
    <td>
        <a href="${ anchor.href }" target="_blank" title="${ anchor.href }" class="block">
            <span class="spider-status">${ anchor.status }</span> ${ anchor.pathname }
        </a>
    </td>
</tr>`;
    }
    function tableRows() {
        let rows = "";
        linksArray.forEach( anchor => {
            rows += getRowHTML(anchor)
        });
        return rows;
    }
    function addTableRow(anchor) {
        const main = siteSpiderResultsElement.querySelector("main");
        siteSpiderResultsElement.querySelector(".table tbody")
            .insertAdjacentHTML("beforeend", getRowHTML(anchor));
        main.scrollTop = main.scrollHeight;
    }
    function getDefaultContent() {
        return `<header class="m-null py-medium">
    <h2 class="m-null txt-c p-null">Site Spider</h2>
    <div class="m-null p-medium txt-c">
        Links total ${ linksArray.length }. 
        Checked <span data-validated>0</span>.
        Request type <strong>${ settings.requestType }</strong>
     </div>
</header>`
    }
    function setSiteSpiderResults() {
        siteSpiderResultsElement = document.createElement('div');
        siteSpiderResultsElement.id = id;
        siteSpiderResultsElement.innerHTML = getDefaultContent();
        // TODO: add polyfill for customElements.define() Not yet implemented in chrome extensions
        siteSpiderResultsElement.setAttribute("is", "site-spider-div")
        document.querySelector("body").appendChild(siteSpiderResultsElement);
        attachDrag(siteSpiderResultsElement);
    }
    function populateLinksArray() {
        const currentUrl = `${ location.href.split("#")[0] }#`;
        const testLink = href => {
            let url;
            try {
                 url = new URL(href);
            } catch (e) {
                return { url: null, valid: false };
            }
            // const url = new URL("/", href);
            if (linksArray.find( link => link.href === href)) {
                return { url: null, valid: false }; // ignore duplicates
            }
            if (settings.ignoreList.some( ignore => href.includes(ignore) )) {
                return { url: null, valid: false }; // ignore if match in ignore list is found
            }
            return {
                url,
                valid: !href.startsWith( currentUrl ) && url.origin === location.origin
            };
        }
        const isLimit = (c) => {
            if (maxCheckLen < 0) {
                return false;
            }
            return c >= maxCheckLen;
        }

        links.forEach( (link, i) => {
            const ops = testLink(link.href);
            if (  ops.valid && !isLimit(count) ) {
                link.setAttribute("data-spider-status", "0");
                linksArray.push({
                    label: getLabel( link ),
                    href: link.href,
                    pathname: ops.url.pathname,
                    status: 0,
                    contentMatch: 0,
                    validated: false,
                    sort: 0,
                    element: link
                })
                count = count + 1;
            }
        });
    }
    function getContent() {
        const contentSearchStatus = () => {
            if (!isContentSearch) {
                return "";
            }
            return `Content ${ linksArray.filter(el => el.contentMatch).length }`
        }
        return `
<header class="m-null py-medium">
    <h2 class="m-null txt-c p-null">
        Site Spider
        <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" preserveAspectRatio="none" viewBox="0 0 490 490">
            <path fill="none" stroke="#fff" stroke-width="36" 
                stroke-linecap="round" d="m280,278a153,153 0 1,0-2,2l170,170m-91-117 110,110-26,26-110-110"/>
        </svg>
    </h2>
    <div class="m-null p-medium txt-c">
        Links total ${ linksArray.length }. 
        Checked <span data-validated>0</span>.
        Method <strong>${ settings.requestType }</strong>
        ${ contentSearchStatus() }
     </div>
</header>
<main class="mx-medium">
    <table class="table">
        <tbody>
            <tr>
                <td><div class="block">Checking links <strong data-validated>0</strong></div></td>
            </tr>
        </tbody>
    </table>
</main>`;
    }
    function updateValidatedCount() {
        siteSpiderResultsElement.querySelectorAll("[data-validated]")
            .forEach( el => el.textContent = linksArray.filter((element) => element.validated ).length);
    }
    function validationChange(link = null) {
        if ( link ) {
            addTableRow( link );
            updateValidatedCount();
        } else {
            siteSpiderResultsElement.querySelector(".table tbody").innerHTML = tableRows();
            updateValidatedCount()
        }

    }
    async function validateLink() {
        const link = linksArray.find(link => !link.validated);

        if (link) {
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
                        link.hasMatch = false;
                        if (settings.searchTerm.length && text) {
                            link.hasMatch = settings.searchTerm.some( term => text.includes(term) );
                        }
                    }
                    link.sort = link.hasMatch ? 600 : link.status;
                    if (siteSpiderResultsElement.classList.contains("foo")) {
                        return
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
    }

    populateLinksArray();
    setSiteSpiderResults();
    setTimeout(() => {
        siteSpiderResultsElement.innerHTML = getContent();
        for (let step = 0; step < settings.concurrentRequests; step++) {
            validateLink();
        }
    }, 10);
}


chrome.storage.local.get(["settings"]).then(result => {
    const settings = JSON.parse(result.settings)[0];
    init({
            "concurrentRequests": parseInt(settings.data.find( item => item.key === "concurrentRequests")?.value),
            "requestType": settings.data.find( item => item.key === "preferredRequestType")?.value,
            "ignoreList": settings.data.find( item => item.key === "ignoreList")?.value?.split(/\r?\n|\r|\n/g) || [],
            "searchTerm": settings.data.find( item => item.key === "searchTerm")?.value?.split(/\r?\n|\r|\n/g) || []
        });
});