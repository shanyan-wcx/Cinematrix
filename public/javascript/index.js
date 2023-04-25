function fetchData() {
    fetch('/library-data')
        .then(response => response.json())
        .then(data => {
            for (i in data) {
                if (data[i].videos.length !== 0) {
                    const libraryContainer = document.createElement("div");
                    libraryContainer.id = i;
                    libraryContainer.classList.add("library-container");
                    const libraryTitle = document.createElement("div");
                    libraryTitle.classList.add("library-title");
                    const libraryName = document.createElement("p");
                    libraryName.classList.add("libraryName");
                    libraryName.textContent = i;
                    libraryTitle.appendChild(libraryName);
                    libraryName.addEventListener('click', function () {
                        const url = '/library/' + encodeURIComponent(libraryName.innerText);
                        window.location.href = url;
                    });
                    const whiteSpace = document.createElement("span");
                    libraryTitle.appendChild(whiteSpace);
                    const posterContainer = document.createElement("div");
                    posterContainer.classList.add("poster-container");
                    const scrollLeft = document.createElement("button");
                    const scrollRight = document.createElement("button");
                    scrollLeft.classList.add("scroll-left");
                    scrollRight.classList.add("scroll-right");
                    scrollLeft.id = "scroll-left";
                    scrollRight.id = "scroll-right";
                    scrollLeft.textContent = "◀";
                    scrollRight.textContent = "▶";
                    libraryTitle.appendChild(scrollLeft);
                    libraryTitle.appendChild(scrollRight);
                    scrollLeft.addEventListener("click", () => {
                        posterContainer.scrollBy({ left: -200, behavior: "smooth" });
                    });
                    scrollRight.addEventListener("click", () => {
                        posterContainer.scrollBy({ left: 200, behavior: "smooth" });
                    });
                    libraryContainer.appendChild(libraryTitle);
                    for (j in data[i].videos) {
                        const poster = document.createElement("div");
                        poster.classList.add("poster");
                        const posterImg = document.createElement("img");
                        posterImg.classList.add("poster-img");
                        posterImg.src = data[i].videos[j].poster;
                        posterImg.onerror = function () {
                            posterImg.src = "https://via.placeholder.com/200x300.png?text=No+Image";
                        };
                        const title = document.createElement("div");
                        title.classList.add("title");
                        title.innerText = data[i].videos[j].title;
                        poster.appendChild(posterImg);
                        poster.appendChild(title);
                        posterContainer.appendChild(poster);
                        poster.addEventListener('click', function () {
                            const url = '/detail/' + encodeURIComponent(poster.innerText);
                            window.location.href = url;
                        });
                    }
                    libraryContainer.appendChild(posterContainer);
                    document.body.appendChild(libraryContainer);
                }
            }
        }).catch(error => console.error(error));
}

fetchData();