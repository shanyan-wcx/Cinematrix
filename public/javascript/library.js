const posterWall = document.getElementById("posterWall");
const title = document.title.replace('Cinematrix - ', '');

function fetchData() {
    fetch('/library-data')
        .then(response => response.json())
        .then(data => {
            var videoData = data[`${title}`].videos;
            if (videoData.length !== 0) {
                for (let i = 0; i < videoData.length; i++) {
                    const videoContainer = document.createElement("div");
                    videoContainer.classList.add("video-container");

                    const posterImg = document.createElement("img");
                    posterImg.classList.add("poster-img");
                    posterImg.src = videoData[i].poster;
                    posterImg.onerror = function () {
                        posterImg.src = "https://via.placeholder.com/200x300.png?text=No+Image";
                    };

                    const videoTitle = document.createElement("div");
                    videoTitle.classList.add("video-title");
                    videoTitle.innerText = videoData[i].title;

                    videoContainer.appendChild(posterImg);
                    videoContainer.appendChild(videoTitle);

                    posterWall.appendChild(videoContainer);

                    videoContainer.addEventListener('click', function () {
                        const url = '/detail/' + encodeURIComponent(videoContainer.innerText);
                        window.location.href = url;
                    })
                }
            } else {
                document.querySelector('.content').querySelector('p').style.display = 'block';
            }

        })
        .catch(error => console.error(error));
}

fetchData();