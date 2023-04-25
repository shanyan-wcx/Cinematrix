const searchBtn = document.getElementById("search-btn");
const searchForm = document.forms["search-form"];
const resultTextArea = document.querySelector('.result-container textarea');

searchBtn.addEventListener("click", (event) => {
    event.preventDefault();
    const formData = new FormData(searchForm);
    const searchData = {};
    formData.forEach((value, key) => {
        searchData[key] = value;
    });
    if (searchData.title === '') {
        alert("标题不能为空！");
        return;
    }
    fetch("/search-data", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(searchData),
    }).then((res) => res.text()).then((data) => {
        console.log(data);
    }).catch((error) => {
        console.error(error);
    });
});

setInterval(() => {
    fetch('/log')
        .then(response => response.text())
        .then(data => {
            resultTextArea.value = data;
        });
}, 1000);