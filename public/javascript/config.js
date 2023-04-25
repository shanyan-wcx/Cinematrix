const saveBtn = document.getElementById('save-btn');

saveBtn.addEventListener('click', (event) => {
    event.preventDefault();
    const MyAPIFilms_token = document.getElementById('MyAPIFilms_token').value;
    const assrt_token = document.getElementById('assrt_token').value;
    const qb_host = document.getElementById('qb_host').value;
    const qb_username = document.getElementById('qb_username').value;
    const qb_password = document.getElementById('qb_password').value;
    const qb_savepath = document.getElementById('qb_savepath').value;
    const qb_category = document.getElementById('qb_category').value;
    const qb_tags = document.getElementById('qb_tags').value;
    const data = {
        MyAPIFilms_token,
        assrt_token,
        qb_host,
        qb_username,
        qb_password,
        qb_savepath,
        qb_category,
        qb_tags,
    };

    fetch('/save-config', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => {
        console.log('设置保存成功！');
        alert('设置保存成功！');
    }).catch(error => {
        console.error('错误：', error);
        alert('设置保存失败！');
    });
});

window.addEventListener('DOMContentLoaded', () => {
    fetch('/load-config').then(response => response.json()).then(data => {
        document.getElementById('MyAPIFilms_token').value = data.MyAPIFilms_token || '';
        document.getElementById('assrt_token').value = data.assrt_token || '';
        document.getElementById('qb_host').value = data.qb_host || '';
        document.getElementById('qb_username').value = data.qb_username || '';
        document.getElementById('qb_password').value = data.qb_password || '';
        document.getElementById('qb_savepath').value = data.qb_savepath || '';
        document.getElementById('qb_category').value = data.qb_category || '';
        document.getElementById('qb_tags').value = data.qb_tags || '';
    }).catch(error => {
        console.error('错误：', error);
    });
});