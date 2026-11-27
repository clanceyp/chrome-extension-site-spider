// Wrapped in an IIFE: the script is re-injected into the same isolated world on every click,
// so top-level declarations would throw "Identifier has already been declared".
(() => {
    function init(settings) {
        console.log(settings)
        const id = "site-spider-results";
        const spiderAttributes = ["data-spider-status", "data-spider-match", "data-spider-title", "data-spider-original-title"];
        const cleanUp = () => {
            document.getElementById(id).remove();
            document.querySelectorAll(spiderAttributes.map(attr => `[${ attr }]`).join(","))
                .forEach(element => {
                    // Restore original title if it existed, only touch titles the spider changed
                    if (element.hasAttribute("data-spider-title")) {
                        const originalTitle = element.getAttribute("data-spider-original-title");
                        if (originalTitle !== null) {
                            element.setAttribute("title", originalTitle);
                        } else {
                            element.removeAttribute("title");
                        }
                    }
                    spiderAttributes.forEach(attr => element.removeAttribute(attr));
                });
        }
        const setSpiderTitle = (element, title) => {
            // Save original title if it exists and hasn't been saved yet
            if (!element.hasAttribute("data-spider-title")) {
                element.setAttribute("data-spider-title", "");
                if (element.hasAttribute("title")) {
                    element.setAttribute("data-spider-original-title", element.getAttribute("title"));
                }
            }
            element.setAttribute("title", title);
        }
        if (document.getElementById(id)) {
            cleanUp();
            return;
        }
        const maxCheckLength = -1;
        const isGetRequest = settings.requestType.toLowerCase() === "get";
        let isContentSearch = false;
        let count = 0;
        const links = document.querySelectorAll("a[href]");
        let siteSpiderResultsElement;
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
                element.style.left = `${ initX + e.pageX-firstX }px` ;
                element.style.top = `${ initY + e.pageY-firstY }px`;
            }

            function stopDrag() {
                element.classList.remove("spider-dragging");
                document.removeEventListener('mousemove', dragIt, false);
                document.removeEventListener('mouseup', stopDrag, false);
            }

            element.addEventListener('mousedown', function(e) {
                if (!e.target.closest('h2')) {
                    return;
                }
                e.preventDefault();
                element.classList.add("spider-dragging");
                const rect = element.getBoundingClientRect();
                initX = rect.left;
                initY = rect.top;
                firstX = e.pageX;
                firstY = e.pageY;

                document.addEventListener('mousemove', dragIt, false);
                document.addEventListener('mouseup', stopDrag, false);
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
            return `<tr class="status--${ anchor.status } content-match--${ anchor.contentMatch }" data-sort="${ anchor.sort }">
        <td>
            <a href="${ anchor.href }" target="_blank" title="${ anchor.href }" class="block">
                <span class="spider-status">${ anchor.status }</span> ${ anchor.pathname }
            </a>
        </td>
    </tr>`;
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
            siteSpiderResultsElement.querySelector(".table tbody")
                .insertAdjacentHTML("beforeend", getRowHTML(anchor));
            main.scrollTop = main.scrollHeight;
        }
        function getDefaultContent() {
            const help = isGetRequest
                ? "One search term per line. Leave empty to only validate the page links."
                : `Content search needs request type GET (currently <strong>${ settings.requestType }</strong>), only the page links will be validated.`;
            return `<header class="m-null py-medium">
        <h2 class="m-null txt-c p-null">Site Spider</h2>
    </header>
    <form class="spider-search mx-medium" data-spider-search>
        <label for="site-spider-search-terms" class="spider-label">Content to find</label>
        <textarea id="site-spider-search-terms" class="spider-textarea" rows="4" ${ isGetRequest ? "" : "disabled" }></textarea>
        <small class="spider-help">${ help }</small>
        <button type="submit" class="spider-button">Go</button>
    </form>`
        }
        function startSearch() {
            const searchInput = siteSpiderResultsElement.querySelector("#site-spider-search-terms");
            settings.searchTerms = isGetRequest ? splitLines(searchInput.value) : [];
            isContentSearch = isGetRequest && settings.searchTerms.length > 0;
            populateLinksArray();
            validateAllLinks();
        }
        function setSiteSpiderResults() {
            siteSpiderResultsElement = document.createElement('div');
            siteSpiderResultsElement.id = id;
            siteSpiderResultsElement.innerHTML = getDefaultContent();
            // TODO: add polyfill for customElements.define() Not yet implemented in chrome extensions
            siteSpiderResultsElement.setAttribute("is", "site-spider-div")
            document.querySelector("body").appendChild(siteSpiderResultsElement);
            attachDrag(siteSpiderResultsElement);

            const form = siteSpiderResultsElement.querySelector("[data-spider-search]");
            const searchInput = form.querySelector("#site-spider-search-terms");
            // set via value (not innerHTML) so search terms containing markup aren't parsed
            searchInput.value = settings.searchTerms.join("\n");
            searchInput.addEventListener("keydown", e => {
                // Ctrl/Cmd + Enter submits, plain Enter adds a new line
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    form.requestSubmit();
                }
            });
            form.addEventListener("submit", e => {
                e.preventDefault();
                startSearch();
            }, { once: true });
            (isGetRequest ? searchInput : form.querySelector("button")).focus();
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
                const href = settings.ignoreHash ? link.href.split("#")[0] : link.href;
                const ops = testLink(href);
                if (  ops.valid && !isLimit(count) ) {
                    link.setAttribute("data-spider-status", "0");
                    linksArray.push({
                        label: getLinkLabel( link ),
                        href,
                        pathname: ops.url.pathname,
                        status: 0,
                        contentMatch: 0,
                        validated: false,
                        sort: 0,
                        element: link
                    })
                    count = count + 1;
                }
                const statusMessage = ops.message || "";
                link.setAttribute("data-spider-status", statusMessage);
                if (statusMessage) {
                    setSpiderTitle(link, statusMessage);
                }
            });
        }
        function getContent() {
            const contentSearchStatus = () => {
                if (!isContentSearch) {
                    return "";
                }
                return `Content <strong data-content-match>0</strong>`
            }
            return `
    <header class="m-null py-medium">
        <h2 class="m-null txt-c p-null">
            Site Spider
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" preserveAspectRatio="none" viewBox="0 0 490 490">
                <path fill="none" stroke="#aaaaaa" stroke-width="36" 
                    stroke-linecap="round" d="m280,278a153,153 0 1,0-2,2l170,170m-91-117 110,110-26,26-110-110"/>
            </svg>
        </h2>
        <div class="m-null p-medium txt-c">
            Links total ${ linksArray.length }. 
            Checked <span data-validated>0</span>.
            Method <span>${ settings.requestType }</span>.
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
    </main>
    <footer>
        <div class="m-null p-medium txt-c">
            <span class="status--200 content-match--true p-vsmall">Content Match: true</span>
        </div>
    </footer>
    `;
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
                siteSpiderResultsElement.querySelector(".table tbody").innerHTML = getAllTableRows();
                updateValidatedCount();
                siteSpiderResultsElement.querySelector("main").scrollTop = 0;
            }

        }
        // stop in-flight work once the results panel has been closed, so the page stays reset
        const isActive = () => siteSpiderResultsElement.isConnected;
        async function validateLink() {
            if (!isActive()) {
                return false;
            }
            const link = linksArray.find(link => !link.validated);

            if (link) {
                link.validated = true;
                try {
                    fetch(link.href, {
                        method: settings.requestType
                    }).then(response => {
                        if (!isActive()) {
                            return;
                        }
                        link.status = response.status;
                        link.element.setAttribute("data-spider-status", link.status);
                        if (link.status !== 200) {
                            setSpiderTitle(link.element, link.status);
                        }
                        return response.text();
                    }).then(text => {
                        if (!isActive()) {
                            return;
                        }
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
                    link.element.setAttribute("data-spider-status", link.status);
                    setSpiderTitle(link.element, link.status);
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
        function validateAllLinks() {
            setTimeout(() => {
                siteSpiderResultsElement.innerHTML = getContent();
                for (let step = 0; step < settings.concurrentRequests; step++) {
                    validateLink();
                }
            }, 10);
        }

        setSiteSpiderResults();
    }

    // line separated list, ignoring empty lines (an empty term would match every page)
    const splitLines = value => (value || "").split(/\r?\n|\r/g).filter(line => line.trim());


    // Default settings fallback
    const defaultSettings = {
        concurrentRequests: 1,
        requestType: "GET",
        ignoreList: ["logout"],
        searchTerms: [],
        ignoreHash: true
    };

    function parseSettings(settingsString) {
        try {
            const parsed = JSON.parse(settingsString);
            const settings = parsed[0];
            if (!settings || !settings.data) {
                console.warn("Site Spider: Invalid settings structure, using defaults");
                return defaultSettings;
            }

            // options page saves items as { key, value }, install defaults use { name, value }
            const getValue = name => settings.data.find(item => (item.key || item.name) === name)?.value;
            const ignoreHash = getValue("ignoreHash");

            return {
                concurrentRequests: parseInt(getValue("concurrentRequests")) || defaultSettings.concurrentRequests,
                requestType: getValue("preferredRequestType") || defaultSettings.requestType,
                ignoreList: getValue("ignoreList") !== undefined ? splitLines(getValue("ignoreList")) : defaultSettings.ignoreList,
                searchTerms: getValue("searchTerms") !== undefined ? splitLines(getValue("searchTerms")) : defaultSettings.searchTerms,
                ignoreHash: ignoreHash === undefined ? defaultSettings.ignoreHash : String(ignoreHash) === "true"
            };
        } catch (error) {
            console.error("Site Spider: Error parsing settings, using defaults", error);
            return defaultSettings;
        }
    }

    chrome.storage.local.get(["settings"]).then(result => {
        console.log("Site Spider: Retrieved settings from storage", result);

        if (!result.settings) {
            console.warn("Site Spider: No settings found in storage, using defaults");
            init(defaultSettings);
            return;
        }

        const settings = parseSettings(result.settings);
        console.log("Site Spider: Using settings", settings);
        init(settings);
    }).catch(error => {
        console.error("Site Spider: Error retrieving settings from storage, using defaults", error);
        init(defaultSettings);
    });
})();
