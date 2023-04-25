const title = document.title.replace('Cinematrix - ', '');

function fetchData() {
    fetch(`/tmdb-info?title=${title}`)
        .then(response => response.json())
        .then(data => {
            document.body.style.backgroundImage = `url('${'https://www.themoviedb.org/t/p/original/' + data.backdrop_path || "https://via.placeholder.com/1920x1080.png?text=No+Image"}')`;
            document.body.style.backgroundRepeat = 'no-repeat';
            document.body.style.backgroundSize = '100% 100%';
            document.body.style.backgroundAttachment = 'fixed';
            document.getElementById("poster").src = 'https://image.tmdb.org/t/p/w600_and_h900_bestv2' + data.poster_path || "https://via.placeholder.com/600x900.png?text=No+Image";
            var year = '';
            if (data.title) {
                document.getElementById("title").textContent = data.title;
                document.getElementById("original_title").textContent = data.original_title;
                document.getElementById("imdbid").textContent = data.imdb_id;
                year = data.release_date;
            } else {
                document.getElementById("title").textContent = data.name;
                document.getElementById("original_title").textContent = data.original_name;
                document.getElementById("imdbid").textContent = data.external_ids.imdb_id;
                year = data.first_air_date;
            }
            document.getElementById("year_rating").textContent = `${year}　⭐${data.vote_average.toFixed(1)}`;
            if (data.overview[0] !== '　' && data.overview[1] !== '　') {
                document.getElementById("overview").textContent = `　　${data.overview}`;
            } else {
                document.getElementById("overview").textContent = data.overview;
            }
            const genres = document.getElementById("genres");
            for (i in data.genres) {
                genres.textContent += `${data.genres[i].name}`;
                if (i < data.genres.length - 1) {
                    genres.textContent += ', ';
                }
            }
            if (data.credits) {
                const crewList = document.getElementById("crew");
                data.credits.crew.forEach((member) => {
                    if (member.job === 'Director') {
                        if (document.getElementById('Director') && document.getElementById('Director').textContent.indexOf(member.name) === -1) {
                            document.getElementById('Director').textContent += `, ${member.name}`;
                        } else if (!document.getElementById('Director')) {
                            const li = document.createElement("li");
                            li.id = 'Director';
                            li.textContent = `导演：${member.name}`;
                            crewList.appendChild(li);
                        }
                    } else if (member.job === 'Story' || member.department === 'Writing') {
                        if (document.getElementById('Story') && document.getElementById('Story').textContent.indexOf(member.name) === -1) {
                            document.getElementById('Story').textContent += `, ${member.name}`;
                        } else if (!document.getElementById('Story')) {
                            const li = document.createElement("li");
                            li.id = 'Story';
                            li.textContent = `编剧：${member.name}`;
                            crewList.appendChild(li);
                        }
                    }
                });
                const crewitems = Array.from(crewList.childNodes)
                    .filter(item => item.nodeName === "LI")
                    .sort((a, b) => {
                        if (a.id === "Director") {
                            return -1;
                        } else if (b.id === "Director") {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                crewitems.forEach(item => crewList.appendChild(item));
                const castList = document.getElementById("cast-list");
                data.credits.cast.forEach((actor) => {
                    const li = document.createElement("li");
                    const img = document.createElement("img");
                    img.src = actor.profile_path ? 'https://image.tmdb.org/t/p/w138_and_h175_face' + actor.profile_path : "https://via.placeholder.com/100x100.png?text=No+Image";
                    img.alt = actor.name;
                    li.appendChild(img);
                    li.innerHTML += `<br>${actor.name}<br>${actor.character}`;
                    castList.appendChild(li);
                });
            } else {
                const crewList = document.getElementById("crew");
                data.crew.forEach((member) => {
                    if (member.job === 'Director') {
                        if (document.getElementById('Director') && document.getElementById('Director').textContent.indexOf(member.name) === -1) {
                            document.getElementById('Director').textContent += `, ${member.name}`;
                        } else if (!document.getElementById('Director')) {
                            const li = document.createElement("li");
                            li.id = 'Director';
                            li.textContent = `导演：${member.name}`;
                            crewList.appendChild(li);
                        }
                    } else if (member.job === 'Story' || member.department === 'Writing') {
                        if (document.getElementById('Story') && document.getElementById('Story').textContent.indexOf(member.name) === -1) {
                            document.getElementById('Story').textContent += `, ${member.name}`;
                        } else if (!document.getElementById('Story')) {
                            const li = document.createElement("li");
                            li.id = 'Story';
                            li.textContent = `编剧：${member.name}`;
                            crewList.appendChild(li);
                        }
                    }
                });
                const crewitems = Array.from(crewList.childNodes)
                    .filter(item => item.nodeName === "LI")
                    .sort((a, b) => {
                        if (a.id === "Director") {
                            return -1;
                        } else if (b.id === "Director") {
                            return 1;
                        } else {
                            return 0;
                        }
                    });
                crewitems.forEach(item => crewList.appendChild(item));
                const castList = document.getElementById("cast-list");
                data.cast.forEach((actor) => {
                    const li = document.createElement("li");
                    const img = document.createElement("img");
                    img.src = actor.profile_path ? 'https://image.tmdb.org/t/p/w138_and_h175_face' + actor.profile_path : "https://via.placeholder.com/100x100.png?text=No+Image";
                    img.alt = actor.name;
                    li.appendChild(img);
                    li.innerHTML += `<br>${actor.name}<br>${actor.character}`;
                    castList.appendChild(li);
                });
            }

        })
        .catch(error => console.error(error));
}

fetchData();

const poster = document.getElementById('poster');
const play_icon = document.getElementById('play-icon');
poster.addEventListener('click', function () {
    openVideo();
});
play_icon.addEventListener('click', function () {
    openVideo();
});

function openVideo() {
    fetch(`/open-video?title=${title}`).then(response => {
        if (response.ok) {
            console.log('打开视频成功！');
        } else {
            alert('视频不存在！');
            console.error('打开视频失败');
        }
    }).catch(error => {
        console.log('打开视频失败：' + error);
    });
}

document.getElementById("scroll-left").addEventListener("click", () => {
    document.querySelector(".cast").scrollBy({ left: -200, behavior: "smooth" });
});

document.getElementById("scroll-right").addEventListener("click", () => {
    document.querySelector(".cast").scrollBy({ left: 200, behavior: "smooth" });
});