const createBtn = document.getElementById('create');
const modal = document.querySelector('.modal');
const confirmBtn = document.getElementById('create-media-library');
const cancelBtn = document.getElementById('cancel-media-library');
const inputName = document.getElementById('media-library-name');
const inputPath = document.getElementById('media-library-path');
const sidebar = document.querySelector('.sidebar ul');

// 根据当前页面的路由更新侧边栏选项的样式
function updateSidebarStyle(sidebarLinks, currentPath) {
    sidebarLinks.forEach(link => {
        const href = link.getAttribute('href');
        // 如果当前页面路由和选项链接的路由相同，给该选项添加active类名
        if (href === decodeURI(currentPath)) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

async function addEvent(createBtn) {
    // 点击创建按钮，打开模态框
    createBtn.addEventListener('click', function () {
        modal.style.display = 'block';
    });

    // 点击确认按钮
    confirmBtn.addEventListener('click', async function () {
        // 获取媒体库名称
        const name = inputName.value.trim();
        const path = inputPath.value.trim();

        // 如果名称为空，弹出提示框
        if (!name) {
            alert('媒体库名称不能为空！');
            return;
        }

        // 如果路径为空，弹出提示框
        if (!path) {
            alert('媒体库路径不能为空！');
            return;
        }

        // 如果名称含有非法字符，弹出提示框
        if (name.indexOf('\:') !== -1 || name.indexOf('\*') !== -1 || name.indexOf('?') !== -1 || name.indexOf('\"') !== -1 || name.indexOf('\<') !== -1 || name.indexOf('\>') !== -1 || name.indexOf('\|') !== -1) {
            alert('媒体库名称不能含有非法字符 : * ? " < > |');
            return;
        }

        // 如果路径含有非法字符，弹出提示框
        if (path.indexOf('\:') !== -1 || path.indexOf('\*') !== -1 || path.indexOf('?') !== -1 || path.indexOf('\"') !== -1 || path.indexOf('\<') !== -1 || path.indexOf('\>') !== -1 || path.indexOf('\|') !== -1) {
            alert('媒体库路径不能含有非法字符 : * ? " < > |');
            return;
        }

        // 如果侧边栏已经存在相同名称的选项卡，弹出提示框
        const response = await fetch('/sidebar');
        const library = await response.json();
        if (library[`${name}`]) {
            alert('媒体库已存在！');
            return;
        }

        // 创建新选项卡
        const newLink = document.createElement('a');
        newLink.href = `/library/${name}`;
        newLink.id = name;
        newLink.textContent = name;
        const newListItem = document.createElement('li');
        newListItem.appendChild(newLink);
        sidebar.insertBefore(newListItem, sidebar.children[1]);
        var data = name + ':' + path;
        fetch('/create-library', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ data })
        }).then(() => updateSidebar());
        inputName.value = '';
        inputPath.value = '';

        // 关闭模态框
        modal.style.display = 'none';
    });

    // 点击取消按钮或空白位置，关闭模态框
    window.addEventListener('click', function (event) {
        if (event.target == modal || event.target == cancelBtn) {
            inputName.value = '';
            inputPath.value = '';
            modal.style.display = 'none';
        }
    });
}

//更新侧边栏
async function updateSidebar() {
    const response = await fetch('/sidebar');
    const data = await response.json();
    sidebar.innerHTML = '<li><a href="/" id="home">首页</a></li>';
    Object.keys(data).forEach(key => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `/library/${key}`;
        a.id = key;
        a.textContent = key;
        li.appendChild(a);
        sidebar.appendChild(li);
    });
    const createLink = document.createElement('li');
    const createButton = document.createElement('a');
    createButton.href = '#';
    createButton.id = 'create';
    createButton.textContent = '创建媒体库';
    createLink.appendChild(createButton);
    sidebar.appendChild(createLink);
    const searchli = document.createElement('li');
    const searcha = document.createElement('a');
    searcha.href = '/search';
    searcha.id = 'search';
    searcha.textContent = '搜索';
    searchli.appendChild(searcha);
    sidebar.appendChild(searchli);
    const configli = document.createElement('li');
    const configa = document.createElement('a');
    configa.href = '/config';
    configa.id = 'config';
    configa.textContent = '设置';
    configli.appendChild(configa);
    sidebar.appendChild(configli);
    await addEvent(createButton);
    var sidebarLinks = sidebar.querySelectorAll('a');
    await updateSidebarStyle(sidebarLinks, window.location.pathname);
}

//启动时更新侧边栏
window.addEventListener('DOMContentLoaded', async () => {
    await updateSidebar();
});

const customMenu = document.createElement('ul');
customMenu.className = 'custom-menu';
const deleteOption = document.createElement('li');
deleteOption.textContent = '删除';
customMenu.appendChild(deleteOption);
document.body.appendChild(customMenu);

let openMenus = [];

sidebar.addEventListener('contextmenu', function (event) {
    if (event.target.textContent !== '首页' && event.target.textContent !== '创建媒体库' && event.target.textContent !== '搜索' && event.target.textContent !== '设置') {
        event.preventDefault();
        const { clientX, clientY } = event;
        openMenus.forEach(menu => menu.style.display = 'none');
        customMenu.style.display = 'block';
        customMenu.style.left = `${clientX}px`;
        customMenu.style.top = `${clientY}px`;
        openMenus.push(customMenu);

        const aToDelete = event.target.closest('a');
        deleteOption.onclick = function () {
            customMenu.style.display = 'none';
            openMenus = [];
            fetch('/delete-library', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: aToDelete.id })
            })
            aToDelete.remove();
            console.log(window.location.pathname);
            console.log('/library/' + encodeURIComponent(aToDelete.id));
            if (window.location.pathname === '/library/' + encodeURIComponent(aToDelete.id)) {
                const url = '/';
                window.location.href = url;
            }
        }
    } else {
        customMenu.style.display = 'none';
        openMenus = [];
    }
});

document.addEventListener('click', function (event) {
    const isCustomMenuClicked = event.target.closest('.custom-menu');
    if (!isCustomMenuClicked) {
        customMenu.style.display = 'none';
        openMenus = [];
    }
});

document.addEventListener('scroll', function (event) {
    customMenu.style.display = 'none';
    openMenus = [];
});