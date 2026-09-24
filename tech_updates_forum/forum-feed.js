(function () {
    "use strict";

    const MARKER = "[[TECH_TEST_FORUM]]";
    const FORUM_PAGE_ID = "3597";


    /* =========================================================
       PAGE DETECTION
       ========================================================= */

    function getCurrentUrl() {
        try {
            return new URL(
                window.location.href
            );
        } catch (error) {
            return null;
        }
    }

    function isTargetForumIndex() {
        const marker =
            document.getElementById(
                "body_litPageSummary"
            );

        const markerMatches =
            marker &&
            marker.textContent.trim() ===
                MARKER;

        const url =
            getCurrentUrl();

        const urlMatches =
            url &&
            window.location.pathname
                .toLowerCase()
                .includes(
                    "/modules/forum/forum.aspx"
                ) &&
            url.searchParams.get("id") ===
                FORUM_PAGE_ID;

        return (
            markerMatches ||
            urlMatches
        );
    }

    function isTargetForumThread() {
        const url =
            getCurrentUrl();

        if (!url) {
            return false;
        }

        return (
            window.location.pathname
                .toLowerCase()
                .includes(
                    "/modules/forum/thread.aspx"
                ) &&
            url.searchParams.get("id") ===
                FORUM_PAGE_ID
        );
    }

    function isRelevantForumPage() {
        return (
            isTargetForumIndex() ||
            isTargetForumThread()
        );
    }


    /* =========================================================
       GENERAL HELPERS
       ========================================================= */

    function escapeHtml(value) {
        return String(value || "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function getThreadId(titleLink) {
        try {
            const url =
                new URL(
                    titleLink.href,
                    window.location.origin
                );

            return (
                url.searchParams.get(
                    "tid"
                ) ||
                titleLink.href
            );
        } catch (error) {
            return titleLink.href;
        }
    }


    /* =========================================================
       INLINE SVG ICONS
       ========================================================= */

    function heartIcon() {
        return `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <path
                    d="
                        M20.84 4.61
                        a5.5 5.5 0 0 0-7.78 0
                        L12 5.67
                        l-1.06-1.06
                        a5.5 5.5 0 0 0-7.78 7.78
                        L12 21.23
                        l8.84-8.84
                        a5.5 5.5 0 0 0 0-7.78
                        Z
                    "
                />
            </svg>
        `;
    }

    function shareIcon() {
        return `
            <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
            >
                <circle
                    cx="18"
                    cy="5"
                    r="3"
                ></circle>

                <circle
                    cx="6"
                    cy="12"
                    r="3"
                ></circle>

                <circle
                    cx="18"
                    cy="19"
                    r="3"
                ></circle>

                <path
                    d="M8.6 10.5 15.4 6.5"
                ></path>

                <path
                    d="M8.6 13.5 15.4 17.5"
                ></path>
            </svg>
        `;
    }


    /* =========================================================
       FORUM INDEX:
       NATIVE LIKE / SHARE HELPERS
       ========================================================= */

    function getLikeCount(card) {
        const likeLink =
            card.querySelector(
                ".like-thread"
            );

        if (!likeLink) {
            return "0";
        }

        const likeItem =
            likeLink.closest("li");

        if (!likeItem) {
            return "0";
        }

        const text =
            likeItem.textContent || "";

        const match =
            text.match(
                /\((\d+)\)/
            );

        return match
            ? match[1]
            : "0";
    }

    function getNativeLikeLink(card) {
        return card.querySelector(
            ".like-thread"
        );
    }

    function getNativeShareLink(card) {
        return card.querySelector(
            ".share-thread"
        );
    }

    function nativeThreadIsLiked(card) {
        const likeLink =
            getNativeLikeLink(
                card
            );

        if (!likeLink) {
            return false;
        }

        const stateText = [
            likeLink.getAttribute(
                "data-original-title"
            ),
            likeLink.getAttribute(
                "title"
            ),
            likeLink.textContent
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return stateText.includes(
            "unlike"
        );
    }

    function syncLikeState(
        nativeCard,
        customCard
    ) {
        if (
            !nativeCard ||
            !customCard
        ) {
            return;
        }

        const likeButton =
            customCard.querySelector(
                ".bff-like"
            );

        const count =
            customCard.querySelector(
                ".bff-like-count"
            );

        if (
            !likeButton ||
            !count
        ) {
            return;
        }

        const newCount =
            getLikeCount(
                nativeCard
            );

        if (
            count.textContent !==
            newCount
        ) {
            count.textContent =
                newCount;
        }

        const liked =
            nativeThreadIsLiked(
                nativeCard
            );

        likeButton.classList.toggle(
            "is-liked",
            liked
        );

        likeButton.setAttribute(
            "aria-label",
            liked
                ? "Unlike this update"
                : "Like this update"
        );

        likeButton.setAttribute(
            "aria-pressed",
            liked
                ? "true"
                : "false"
        );
    }


    /* =========================================================
       FORUM INDEX:
       TRANSFORM NATIVE THREAD CARD
       ========================================================= */

    function transformCard(card) {
        if (
            card.dataset
                .birchstoneTransformed ===
            "true"
        ) {
            return;
        }

        const titleLink =
            card.querySelector(
                ".forum_title_breakword a"
            );

        if (!titleLink) {
            return;
        }

        const nativeRow =
            card.closest(
                ".row"
            );

        const threadSection =
            nativeRow?.closest(
                ".thread-section"
            );

        if (threadSection) {
            threadSection.classList.add(
                "bff-thread-section"
            );
        }

        const title =
            titleLink
                .textContent
                .trim();

        const href =
            titleLink.href;

        const preview =
            card.querySelector(
                ".LastPostPreview p"
            )
                ?.textContent
                ?.trim() || "";

        const author =
            card.querySelector(
                ".hc-name"
            )
                ?.textContent
                ?.trim() || "";

        const time =
            card.querySelector(
                ".timeago"
            )
                ?.textContent
                ?.trim() || "";

        const posts =
            card.querySelector(
                ".thread-info.posts .count a"
            )
                ?.textContent
                ?.trim() || "0";

        const likeCount =
            getLikeCount(
                card
            );

        const threadId =
            getThreadId(
                titleLink
            );

        const nativeAvatar =
            nativeRow?.querySelector(
                "img"
            );

        const avatarSrc =
            nativeAvatar?.src || "";

        const avatarAlt =
            nativeAvatar?.alt ||
            author ||
            "";

        const custom =
            document.createElement(
                "article"
            );

        custom.className =
            "bff-thread";

        custom.dataset.threadId =
            threadId;

        custom.setAttribute(
            "tabindex",
            "0"
        );

        custom.setAttribute(
            "role",
            "link"
        );

        custom.setAttribute(
            "aria-label",
            `Open update: ${title}`
        );

        custom.innerHTML = `
            <div class="bff-avatar-wrap">
                ${
                    avatarSrc
                        ? `
                            <img
                                class="bff-avatar"
                                src="${escapeHtml(avatarSrc)}"
                                alt="${escapeHtml(avatarAlt)}"
                            >
                        `
                        : ""
                }
            </div>

            <div class="bff-main">

                <div class="bff-thread-top">

                    <span class="bff-category">
                        SYSTEM UPDATE
                    </span>

                    <span class="bff-time">
                        ${escapeHtml(time)}
                    </span>

                </div>

                <h2 class="bff-title">
                    ${escapeHtml(title)}
                </h2>

                ${
                    preview
                        ? `
                            <p class="bff-preview">
                                ${escapeHtml(preview)}
                            </p>
                        `
                        : ""
                }

                <div class="bff-footer">

                    <span class="bff-author">
                        ${escapeHtml(author)}
                    </span>

                    <div class="bff-footer-right">

                        <button
                            type="button"
                            class="bff-icon-button bff-like"
                            aria-label="Like this update"
                            aria-pressed="false"
                        >
                            <span class="bff-icon">
                                ${heartIcon()}
                            </span>

                            <span class="bff-like-count">
                                ${escapeHtml(likeCount)}
                            </span>
                        </button>

                        <button
                            type="button"
                            class="bff-icon-button bff-share"
                            aria-label="Share this update"
                        >
                            <span class="bff-icon">
                                ${shareIcon()}
                            </span>
                        </button>

                        <span class="bff-posts">
                            ${escapeHtml(posts)}
                            ${
                                posts === "1"
                                    ? "post"
                                    : "posts"
                            }
                        </span>

                    </div>

                </div>

            </div>
        `;

        custom.addEventListener(
            "click",
            event => {

                if (
                    event.target.closest(
                        ".bff-icon-button"
                    )
                ) {
                    return;
                }

                window.location.href =
                    href;
            }
        );

        custom.addEventListener(
            "keydown",
            event => {

                if (
                    event.target.closest(
                        ".bff-icon-button"
                    )
                ) {
                    return;
                }

                if (
                    event.key === "Enter" ||
                    event.key === " "
                ) {
                    event.preventDefault();

                    window.location.href =
                        href;
                }
            }
        );

        const likeButton =
            custom.querySelector(
                ".bff-like"
            );

        likeButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const nativeLike =
                    getNativeLikeLink(
                        card
                    );

                if (!nativeLike) {
                    return;
                }

                nativeLike.click();

                setTimeout(
                    () => {
                        syncLikeState(
                            card,
                            custom
                        );
                    },
                    250
                );

                setTimeout(
                    () => {
                        syncLikeState(
                            card,
                            custom
                        );
                    },
                    750
                );
            }
        );

        const shareButton =
            custom.querySelector(
                ".bff-share"
            );

        shareButton?.addEventListener(
            "click",
            event => {

                event.preventDefault();
                event.stopPropagation();

                const nativeShare =
                    getNativeShareLink(
                        card
                    );

                if (!nativeShare) {
                    return;
                }

                nativeShare.click();
            }
        );

        if (nativeRow) {
            nativeRow.insertAdjacentElement(
                "afterend",
                custom
            );

            nativeRow.classList.add(
                "bff-native-row-hidden"
            );
        } else {
            card.insertAdjacentElement(
                "afterend",
                custom
            );

            card.classList.add(
                "bff-native-hidden"
            );
        }

        card.dataset
            .birchstoneTransformed =
            "true";

        syncLikeState(
            card,
            custom
        );

        const nativeObserver =
            new MutationObserver(
                () => {
                    syncLikeState(
                        card,
                        custom
                    );
                }
            );

        nativeObserver.observe(
            card,
            {
                childList: true,
                subtree: true,
                characterData: true,
                attributes: true
            }
        );
    }

    function transformThreads() {
        if (
            !isTargetForumIndex()
        ) {
            return;
        }

        const cards =
            document.querySelectorAll(
                "#forums .tl-eventcard"
            );

        cards.forEach(
            transformCard
        );
    }


    /* =========================================================
       THREAD PAGE:
       POST LIKE HELPERS
       ========================================================= */

    function getPostLikeCount(
        likeLink
    ) {
        if (!likeLink) {
            return "0";
        }

        const nativeMuted =
            likeLink.querySelector(
                ".muted"
            );

        const sourceText =
            nativeMuted
                ? nativeMuted.textContent
                : likeLink.textContent;

        const match =
            String(
                sourceText || ""
            ).match(
                /\((\d+)\)/
            );

        return match
            ? match[1]
            : "0";
    }

    function postIsLiked(
        likeLink
    ) {
        if (!likeLink) {
            return false;
        }

        const stateText = [
            likeLink.getAttribute(
                "data-original-title"
            ),
            likeLink.getAttribute(
                "title"
            ),
            likeLink.getAttribute(
                "aria-description"
            ),
            likeLink.className
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return stateText.includes(
            "unlike"
        );
    }

    function syncPostLike(
        likeLink
    ) {
        if (!likeLink) {
            return;
        }

        const customCount =
            likeLink.querySelector(
                ".bff-thread-like-count"
            );

        if (customCount) {
            const newCount =
                getPostLikeCount(
                    likeLink
                );

            if (
                customCount
                    .textContent !==
                newCount
            ) {
                customCount.textContent =
                    newCount;
            }
        }

        const liked =
            postIsLiked(
                likeLink
            );

        likeLink.classList.toggle(
            "is-liked",
            liked
        );

        likeLink.setAttribute(
            "aria-label",
            liked
                ? "Unlike this post"
                : "Like this post"
        );
    }


    /* =========================================================
       THREAD PAGE:
       STYLE EACH POST ACTION ROW
       ========================================================= */

    function styleThreadPostActions() {
        if (
            !isTargetForumThread()
        ) {
            return;
        }

        const actionRows =
            document.querySelectorAll(
                "li.social-tools"
            );

        actionRows.forEach(
            actionRow => {

                const reply =
                    actionRow.querySelector(
                        ".show-comments"
                    );

                const share =
                    actionRow.querySelector(
                        ".share-post"
                    );

                const like =
                    actionRow.querySelector(
                        ".like-post"
                    );

                if (
                    !reply &&
                    !share &&
                    !like
                ) {
                    return;
                }

                actionRow.classList.add(
                    "bff-post-action-row"
                );

                if (reply) {
                    const replyItem =
                        reply.closest("li");

                    if (replyItem) {
                        replyItem.classList.add(
                            "bff-hide-reply"
                        );
                    }
                }

                if (share) {
                    const shareItem =
                        share.closest("li");

                    shareItem
                        ?.classList.add(
                            "bff-post-share-item"
                        );

                    if (
                        share.dataset
                            .bffStyled !==
                        "true"
                    ) {
                        share.dataset
                            .bffStyled =
                            "true";

                        share.classList.add(
                            "bff-thread-share"
                        );

                        const icon =
                            document.createElement(
                                "span"
                            );

                        icon.className =
                            "bff-thread-action-icon bff-custom-share-icon";

                        icon.innerHTML =
                            shareIcon();

                        share.appendChild(
                            icon
                        );

                        const screenReader =
                            document.createElement(
                                "span"
                            );

                        screenReader.className =
                            "sr-only bff-custom-action-label";

                        screenReader.textContent =
                            "Share";

                        share.appendChild(
                            screenReader
                        );

                        share.setAttribute(
                            "aria-label",
                            "Share this post"
                        );
                    }
                }

                if (like) {
                    const likeItem =
                        like.closest("li");

                    likeItem
                        ?.classList.add(
                            "bff-post-like-item"
                        );

                    if (
                        like.dataset
                            .bffStyled !==
                        "true"
                    ) {
                        const initialCount =
                            getPostLikeCount(
                                like
                            );

                        like.dataset
                            .bffStyled =
                            "true";

                        like.classList.add(
                            "bff-thread-like"
                        );

                        const icon =
                            document.createElement(
                                "span"
                            );

                        icon.className =
                            "bff-thread-action-icon bff-custom-like-icon";

                        icon.innerHTML =
                            heartIcon();

                        like.appendChild(
                            icon
                        );

                        const count =
                            document.createElement(
                                "span"
                            );

                        count.className =
                            "bff-thread-like-count";

                        count.textContent =
                            initialCount;

                        like.appendChild(
                            count
                        );

                        like.addEventListener(
                            "click",
                            () => {
                                setTimeout(
                                    () => {
                                        syncPostLike(
                                            like
                                        );
                                    },
                                    250
                                );

                                setTimeout(
                                    () => {
                                        syncPostLike(
                                            like
                                        );
                                    },
                                    750
                                );
                            }
                        );
                    }

                    syncPostLike(
                        like
                    );
                }
            }
        );
    }


    /* =========================================================
       THREAD PAGE:
       TOP SHARE / LIKE
       ========================================================= */

    function topThreadIsLiked(
        likeButton
    ) {
        if (!likeButton) {
            return false;
        }

        const stateText = [
            likeButton.getAttribute(
                "data-original-title"
            ),
            likeButton.getAttribute(
                "aria-description"
            ),
            likeButton.getAttribute(
                "title"
            )
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return stateText.includes(
            "unlike"
        );
    }

    function syncTopThreadLike(
        likeButton
    ) {
        if (!likeButton) {
            return;
        }

        const liked =
            topThreadIsLiked(
                likeButton
            );

        likeButton.classList.toggle(
            "is-liked",
            liked
        );

        likeButton.setAttribute(
            "aria-label",
            liked
                ? "Unlike this update"
                : "Like this update"
        );

        likeButton.setAttribute(
            "aria-pressed",
            liked
                ? "true"
                : "false"
        );
    }

    function styleThreadHeaderActions() {
        if (
            !isTargetForumThread()
        ) {
            return;
        }

        const share =
            document.getElementById(
                "btnShare"
            );

        const like =
            document.getElementById(
                "btnLike"
            );

        if (share) {
            share.classList.add(
                "bff-thread-header-action",
                "bff-thread-header-share"
            );

            const nativeShareIcon =
                share.querySelector(
                    ":scope > i"
                );

            const nativeShareText =
                share.querySelector(
                    "#spnShare"
                );

            nativeShareIcon?.remove();
            nativeShareText?.remove();

            if (
                !share.querySelector(
                    ".bff-custom-top-share-icon"
                )
            ) {
                const icon =
                    document.createElement(
                        "span"
                    );

                icon.className =
                    "bff-thread-action-icon bff-custom-top-share-icon";

                icon.innerHTML =
                    shareIcon();

                share.appendChild(
                    icon
                );
            }

            share.setAttribute(
                "aria-label",
                "Share this update"
            );
        }

        if (like) {
            like.classList.add(
                "bff-thread-header-action",
                "bff-thread-header-like"
            );

            const nativeLikeIcon =
                like.querySelector(
                    ":scope > i"
                );

            const nativeLikeText =
                like.querySelector(
                    "#divLikeText"
                );

            const nativeLikers =
                like.querySelector(
                    "#divLikersLink"
                );

            nativeLikeIcon?.remove();
            nativeLikeText?.remove();
            nativeLikers?.remove();

            if (
                !like.querySelector(
                    ".bff-custom-top-like-icon"
                )
            ) {
                const icon =
                    document.createElement(
                        "span"
                    );

                icon.className =
                    "bff-thread-action-icon bff-custom-top-like-icon";

                icon.innerHTML =
                    heartIcon();

                like.appendChild(
                    icon
                );
            }

            syncTopThreadLike(
                like
            );

            if (
                like.dataset
                    .bffLikeListener !==
                "true"
            ) {
                like.dataset
                    .bffLikeListener =
                    "true";

                like.addEventListener(
                    "click",
                    () => {

                        setTimeout(
                            () => {
                                styleThreadHeaderActions();
                            },
                            250
                        );

                        setTimeout(
                            () => {
                                styleThreadHeaderActions();
                            },
                            750
                        );
                    }
                );
            }
        }
    }


    /* =========================================================
       THREAD PAGE INITIALIZER
       ========================================================= */

    function styleTechTestForumThread() {
        if (
            !isTargetForumThread()
        ) {
            return;
        }

        document.documentElement
            .classList.add(
                "bff-tech-thread"
            );

        styleThreadHeaderActions();
        styleThreadPostActions();
    }


    /* =========================================================
       STARTUP
       ========================================================= */

    function start() {
        if (
            !isRelevantForumPage()
        ) {
            return;
        }

        if (
            isTargetForumIndex()
        ) {
            document.documentElement
                .classList.add(
                    "birchstone-feed-forum"
                );

            transformThreads();
        }

        if (
            isTargetForumThread()
        ) {
            styleTechTestForumThread();
        }

        const observer =
            new MutationObserver(
                () => {

                    if (
                        isTargetForumIndex()
                    ) {
                        transformThreads();
                    }

                    if (
                        isTargetForumThread()
                    ) {
                        styleTechTestForumThread();
                    }
                }
            );

        observer.observe(
            document.body,
            {
                childList: true,
                subtree: true
            }
        );

        console.log(
            "[Birchstone Forum Feed] Active"
        );
    }

    if (
        document.readyState ===
        "loading"
    ) {
        document.addEventListener(
            "DOMContentLoaded",
            start
        );
    } else {
        start();
    }

})();
